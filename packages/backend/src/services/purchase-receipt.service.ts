import { prisma } from '../lib/prisma';
import {
  CreatePurchaseReceiptDto,
  UpdatePurchaseReceiptDto,
  PurchaseReceiptResponse,
  PurchaseReceiptStatus
} from '../types/purchase-receipt';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';

export class PurchaseReceiptService {
  // ========== 采购收货单服务 ==========

  async getPurchaseReceipts(params: QueryParams): Promise<PaginatedResult<PurchaseReceiptResponse>> {
    const { page = 1, limit = 20, sortBy = 'receiptDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { order: { orderNo: { contains: search } } },
        { order: { supplier: { name: { contains: search } } } }
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.purchaseReceipt.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          order: {
            include: {
              supplier: true
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
      prisma.purchaseReceipt.count({ where })
    ]);

    return {
      data: receipts.map(receipt => this.mapToPurchaseReceiptResponse(receipt)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getPurchaseReceiptById(id: string): Promise<PurchaseReceiptResponse> {
    const receipt = await prisma.purchaseReceipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            supplier: true
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

    if (!receipt) {
      throw new AppError('采购收货单不存在', 404);
    }

    return this.mapToPurchaseReceiptResponse(receipt);
  }

  async createPurchaseReceipt(data: CreatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> {
    // 检查采购订单是否存在
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: data.orderId },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('采购订单不存在', 404);
    }

    // 只能对已确认的订单创建收货单
    if (order.status !== 'CONFIRMED') {
      throw new AppError('只能对已确认的采购订单创建收货单', 400);
    }

    // 生成收货单号
    const receiptNo = await this.generateReceiptNo();

    // 验证收货明细
    const receiptItems = await Promise.all(
      data.items.map(async item => {
        const orderItem = await prisma.purchaseOrderItem.findUnique({
          where: { id: item.orderItemId },
          include: {
            material: true
          }
        });

        if (!orderItem) {
          throw new AppError(`采购订单明细不存在: ${item.orderItemId}`, 404);
        }

        // 检查是否属于该订单
        if (orderItem.orderId !== data.orderId) {
          throw new AppError(`采购订单明细不属于该订单: ${item.orderItemId}`, 400);
        }

        // 检查收货数量是否超过可收货数量
        const maxReceivable = orderItem.quantity - orderItem.receivedQuantity;
        if (item.quantity > maxReceivable) {
          throw new AppError(`收货数量超过可收货数量: 最大 ${maxReceivable}`, 400);
        }

        if (item.quantity <= 0) {
          throw new AppError('收货数量必须大于0', 400);
        }

        return {
          orderItemId: item.orderItemId,
          materialId: orderItem.materialId,
          quantity: item.quantity,
          unitPrice: orderItem.unitPrice
        };
      })
    );

    if (receiptItems.length === 0) {
      throw new AppError('采购收货单必须包含至少一个物料', 400);
    }

    // 创建采购收货单
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        receiptNo,
        orderId: data.orderId,
        receiptDate: data.receiptDate || new Date(),
        warehouseId: data.warehouseId,
        items: {
          create: receiptItems
        }
      },
      include: {
        order: {
          include: {
            supplier: true
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

    return this.mapToPurchaseReceiptResponse(receipt);
  }

  async updatePurchaseReceipt(id: string, data: UpdatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> {
    // 检查采购收货单是否存在
    const existingReceipt = await prisma.purchaseReceipt.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingReceipt) {
      throw new AppError('采购收货单不存在', 404);
    }

    // 只能修改草稿状态的收货单
    if (existingReceipt.status !== 'DRAFT') {
      throw new AppError('只能修改草稿状态的采购收货单', 400);
    }

    // 更新采购收货单
    const receipt = await prisma.purchaseReceipt.update({
      where: { id },
      data: {
        receiptDate: data.receiptDate,
        warehouseId: data.warehouseId,
        status: data.status
      },
      include: {
        order: {
          include: {
            supplier: true
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

    return this.mapToPurchaseReceiptResponse(receipt);
  }

  async deletePurchaseReceipt(id: string): Promise<void> {
    // 检查采购收货单是否存在
    const existingReceipt = await prisma.purchaseReceipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('采购收货单不存在', 404);
    }

    // 只能删除草稿状态的收货单
    if (existingReceipt.status !== 'DRAFT') {
      throw new AppError('只能删除草稿状态的采购收货单', 400);
    }

    // 删除采购收货单（级联删除明细）
    await prisma.purchaseReceipt.delete({
      where: { id }
    });
  }

  async confirmPurchaseReceipt(id: string): Promise<PurchaseReceiptResponse> {
    // 使用事务确保数据一致性
    const receipt = await prisma.$transaction(async (tx) => {
      // 检查采购收货单是否存在
      const existingReceipt = await tx.purchaseReceipt.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  material: true
                }
              }
            }
          }
        }
      });

      if (!existingReceipt) {
        throw new AppError('采购收货单不存在', 404);
      }

      // 只能确认草稿状态的收货单
      if (existingReceipt.status !== 'DRAFT') {
        throw new AppError('只能确认草稿状态的采购收货单', 400);
      }

      // 更新收货单状态
      const updatedReceipt = await tx.purchaseReceipt.update({
        where: { id },
        data: {
          status: 'CONFIRMED'
        },
        include: {
          order: {
            include: {
              supplier: true
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

      // 更新采购订单项的已收货数量
      for (const item of existingReceipt.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.orderItemId },
          data: {
            receivedQuantity: {
              increment: item.quantity
            }
          }
        });

        // 更新库存（增加库存）
        await tx.material.update({
          where: { id: item.orderItem.materialId },
          data: {
            currentStock: {
              increment: item.quantity
            }
          }
        });

        // 创建库存交易记录
        await tx.inventoryTransaction.create({
          data: {
            materialId: item.orderItem.materialId,
            transactionType: 'PURCHASE_RECEIPT',
            quantity: item.quantity,
            unitCost: item.orderItem.unitPrice,
            referenceType: 'PURCHASE_ORDER',
            referenceId: existingReceipt.orderId,
            transactionDate: new Date()
          }
        });
      }

      // 检查订单是否全部收货完成
      const order = await tx.purchaseOrder.findUnique({
        where: { id: existingReceipt.orderId },
        include: {
          items: true
        }
      });

      if (order) {
        const allItemsReceived = order.items.every(item =>
          Math.abs(item.receivedQuantity - item.quantity) < 0.01
        );

        if (allItemsReceived) {
          await tx.purchaseOrder.update({
            where: { id: existingReceipt.orderId },
            data: {
              status: 'COMPLETED'
            }
          });
        }
      }

      return updatedReceipt;
    });

    return this.mapToPurchaseReceiptResponse(receipt);
  }

  async cancelPurchaseReceipt(id: string): Promise<PurchaseReceiptResponse> {
    // 检查采购收货单是否存在
    const existingReceipt = await prisma.purchaseReceipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('采购收货单不存在', 404);
    }

    // 只能取消草稿状态的收货单
    if (existingReceipt.status !== 'DRAFT') {
      throw new AppError('只能取消草稿状态的采购收货单', 400);
    }

    // 取消采购收货单
    const receipt = await prisma.purchaseReceipt.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        order: {
          include: {
            supplier: true
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

    return this.mapToPurchaseReceiptResponse(receipt);
  }

  // ========== 私有方法 ==========

  private async generateReceiptNo(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 查找当天的最大收货单号
    const latestReceipt = await prisma.purchaseReceipt.findFirst({
      where: {
        receiptNo: {
          startsWith: `PR-${dateStr}-`
        }
      },
      orderBy: {
        receiptNo: 'desc'
      }
    });

    let sequence = 1;
    if (latestReceipt && latestReceipt.receiptNo) {
      const lastSeq = parseInt(latestReceipt.receiptNo.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    return `PR-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }

  private mapToPurchaseReceiptResponse(receipt: any): PurchaseReceiptResponse {
    return {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      orderId: receipt.orderId,
      orderNo: receipt.order.orderNo,
      supplierId: receipt.order.supplierId,
      supplierCode: receipt.order.supplier.code,
      supplierName: receipt.order.supplier.name,
      receiptDate: receipt.receiptDate.toISOString(),
      warehouseId: receipt.warehouseId,
      status: receipt.status as PurchaseReceiptStatus,
      items: receipt.items.map((item: any) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        quantity: item.quantity
      })),
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString()
    };
  }
}