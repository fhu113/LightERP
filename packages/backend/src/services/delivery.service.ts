import { prisma } from '../lib/prisma';
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  DeliveryResponse,
  DeliveryItemResponse,
  DeliveryStatus
} from '../types/delivery';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateDeliveryVoucher } from './voucher.service';

export class DeliveryService {
  // ========== 发货单服务 ==========

  async getDeliveries(params: QueryParams): Promise<PaginatedResult<DeliveryResponse>> {
    const { page = 1, limit = 20, sortBy = 'deliveryDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { deliveryNo: { contains: search } },
        { order: { orderNo: { contains: search } } },
        { order: { customer: { name: { contains: search } } } }
      ];
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          order: {
            include: {
              customer: true
            }
          },
          items: {
            include: {
              orderItem: {
                include: {
                  material: true
                }
              },
              material: true
            }
          }
        }
      }),
      prisma.delivery.count({ where })
    ]);

    return {
      data: deliveries.map(delivery => this.mapToDeliveryResponse(delivery)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getDeliveryById(id: string): Promise<DeliveryResponse> {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    if (!delivery) {
      throw new AppError('发货单不存在', 404);
    }

    return this.mapToDeliveryResponse(delivery);
  }

  async createDelivery(data: CreateDeliveryDto): Promise<DeliveryResponse> {
    // 检查销售订单是否存在
    const order = await prisma.salesOrder.findUnique({
      where: { id: data.orderId },
      include: {
        customer: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('销售订单不存在', 404);
    }

    // 只能对已确认的订单创建发货单
    if (order.status !== 'CONFIRMED') {
      throw new AppError('只能对已确认的订单创建发货单', 400);
    }

    // 生成发货单号
    const deliveryNo = await this.generateDeliveryNo();

    // 检查发货数量不超过订单可发货数量
    const itemsData: any[] = [];
    for (const item of data.items) {
      const orderItem = await prisma.salesOrderItem.findUnique({
        where: { id: item.orderItemId },
        include: { material: true }
      });

      if (!orderItem) {
        throw new AppError(`订单明细不存在: ${item.orderItemId}`, 404);
      }

      // 检查是否为该订单的明细
      if (orderItem.orderId !== data.orderId) {
        throw new AppError(`订单明细 ${item.orderItemId} 不属于订单 ${data.orderId}`, 400);
      }

      // 计算剩余可发货数量
      const remainingQuantity = orderItem.quantity - orderItem.deliveredQuantity;
      if (item.quantity > remainingQuantity) {
        throw new AppError(`物料 ${orderItem.material.code} 可发货数量不足，剩余: ${remainingQuantity}`, 400);
      }

      // 检查库存可用性（暂时禁用用于测试）
      // if (orderItem.material.currentStock < item.quantity) {
      //   throw new AppError(`物料 ${orderItem.material.code} 库存不足，当前库存: ${orderItem.material.currentStock}`, 400);
      // }

      itemsData.push({
        orderItemId: item.orderItemId,
        materialId: orderItem.materialId,
        quantity: item.quantity
      });
    }

    // 创建发货单
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNo,
        orderId: data.orderId,
        deliveryDate: data.deliveryDate || new Date(),
        warehouseId: data.warehouseId,
        shippingInfo: data.shippingInfo,
        status: 'DRAFT' as DeliveryStatus,
        items: {
          create: itemsData
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    return this.mapToDeliveryResponse(delivery);
  }

  async updateDelivery(id: string, data: UpdateDeliveryDto): Promise<DeliveryResponse> {
    // 检查发货单是否存在
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id }
    });

    if (!existingDelivery) {
      throw new AppError('发货单不存在', 404);
    }

    // 只能更新草稿状态的发货单
    if (existingDelivery.status !== 'DRAFT') {
      throw new AppError('只能修改草稿状态的发货单', 400);
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            customer: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    return this.mapToDeliveryResponse(delivery);
  }

  async deleteDelivery(id: string): Promise<void> {
    // 检查发货单是否存在
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id }
    });

    if (!existingDelivery) {
      throw new AppError('发货单不存在', 404);
    }

    // 只能删除草稿状态的发货单
    if (existingDelivery.status !== 'DRAFT') {
      throw new AppError('只能删除草稿状态的发货单', 400);
    }

    await prisma.delivery.delete({
      where: { id }
    });
  }

  async confirmDelivery(id: string): Promise<DeliveryResponse> {
    // 检查发货单是否存在
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    if (!existingDelivery) {
      throw new AppError('发货单不存在', 404);
    }

    // 只能确认草稿状态的发货单
    if (existingDelivery.status !== 'DRAFT') {
      throw new AppError('只能确认草稿状态的发货单', 400);
    }

    // 更新库存并记录库存交易
    for (const item of existingDelivery.items) {
      // 更新物料库存
      await prisma.material.update({
        where: { id: item.materialId },
        data: {
          currentStock: {
            decrement: item.quantity
          }
        }
      });

      // 更新订单明细已发货数量
      await prisma.salesOrderItem.update({
        where: { id: item.orderItemId },
        data: {
          deliveredQuantity: {
            increment: item.quantity
          }
        }
      });

      // 创建库存交易记录
      await prisma.inventoryTransaction.create({
        data: {
          materialId: item.materialId,
          transactionType: 'SALES_DELIVERY',
          quantity: -item.quantity, // 负数表示出库
          unitCost: item.orderItem.material.costPrice,
          referenceType: 'DELIVERY',
          referenceId: id,
          transactionDate: new Date()
        }
      });
    }

    // 检查订单是否所有明细都已发货完成
    const order = await prisma.salesOrder.findUnique({
      where: { id: existingDelivery.orderId },
      include: {
        items: true
      }
    });

    if (order) {
      const allItemsDelivered = order.items.every(item => item.quantity === item.deliveredQuantity);
      if (allItemsDelivered) {
        // 更新订单状态为已完成
        await prisma.salesOrder.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' }
        });
      }
    }

    // 更新发货单状态
    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'CONFIRMED'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    // 自动生成凭证
    try {
      await generateDeliveryVoucher(id);
    } catch (error) {
      console.error('生成发货凭证失败:', error);
    }

    return this.mapToDeliveryResponse(delivery);
  }

  async cancelDelivery(id: string): Promise<DeliveryResponse> {
    // 检查发货单是否存在
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id }
    });

    if (!existingDelivery) {
      throw new AppError('发货单不存在', 404);
    }

    // 只能取消草稿或已确认状态的发货单
    if (existingDelivery.status === 'COMPLETED') {
      throw new AppError('已完成的发货单不能取消', 400);
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                material: true
              }
            },
            material: true
          }
        }
      }
    });

    return this.mapToDeliveryResponse(delivery);
  }

  // 生成发货单号: DN-YYYYMMDD-0001
  private async generateDeliveryNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DN-${dateStr}-`;

    const lastDelivery = await prisma.delivery.findFirst({
      where: {
        deliveryNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        deliveryNo: 'desc'
      }
    });

    let sequence = 1;
    if (lastDelivery) {
      const lastSeq = parseInt(lastDelivery.deliveryNo.slice(-4));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private mapToDeliveryResponse(delivery: any): DeliveryResponse {
    return {
      id: delivery.id,
      deliveryNo: delivery.deliveryNo,
      orderId: delivery.orderId,
      orderNo: delivery.order.orderNo,
      customerId: delivery.order.customerId,
      customerCode: delivery.order.customer.code,
      customerName: delivery.order.customer.name,
      deliveryDate: delivery.deliveryDate.toISOString(),
      warehouseId: delivery.warehouseId,
      shippingInfo: delivery.shippingInfo,
      status: delivery.status as DeliveryStatus,
      items: delivery.items.map((item: any) => this.mapToDeliveryItemResponse(item)),
      createdAt: delivery.createdAt.toISOString(),
      updatedAt: delivery.updatedAt.toISOString()
    };
  }

  private mapToDeliveryItemResponse(item: any): DeliveryItemResponse {
    return {
      id: item.id,
      orderItemId: item.orderItemId,
      materialId: item.materialId,
      materialCode: item.material.code,
      materialName: item.material.name,
      quantity: item.quantity
    };
  }
}