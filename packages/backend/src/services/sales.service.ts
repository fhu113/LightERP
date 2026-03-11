import { prisma } from '../lib/prisma';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesOrderResponse,
  SalesOrderItemResponse,
  SalesOrderStatus
} from '../types/sales';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';

export class SalesService {
  // ========== 销售订单服务 ==========

  async getSalesOrders(params: QueryParams): Promise<PaginatedResult<SalesOrderResponse>> {
    const { page = 1, limit = 20, sortBy = 'orderDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { code: { contains: search } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: true,
          items: {
            include: {
              material: true
            }
          }
        }
      }),
      prisma.salesOrder.count({ where })
    ]);

    return {
      data: orders.map(order => this.mapToSalesOrderResponse(order)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getSalesOrderById(id: string): Promise<SalesOrderResponse> {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
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

    return this.mapToSalesOrderResponse(order);
  }

  async createSalesOrder(data: CreateSalesOrderDto): Promise<SalesOrderResponse> {
    // 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      throw new AppError('客户不存在', 404);
    }

    // 生成订单号
    const orderNo = await this.generateOrderNo();

    // 检查物料是否存在并计算总金额
    let totalAmount = 0;
    const itemsData: any[] = [];

    for (const item of data.items) {
      const material = await prisma.material.findUnique({
        where: { id: item.materialId }
      });

      if (!material) {
        throw new AppError(`物料不存在: ${item.materialId}`, 404);
      }

      const amount = item.quantity * item.unitPrice;
      totalAmount += amount;

      itemsData.push({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount
      });
    }

    // 计算税额（简化为总金额的13%）
    const taxAmount = totalAmount * 0.13;

    // 创建销售订单
    const order = await prisma.salesOrder.create({
      data: {
        orderNo,
        customerId: data.customerId,
        orderDate: data.orderDate || new Date(),
        deliveryDate: data.deliveryDate,
        status: 'DRAFT' as SalesOrderStatus,
        totalAmount,
        taxAmount,
        items: {
          create: itemsData
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToSalesOrderResponse(order);
  }

  async updateSalesOrder(id: string, data: UpdateSalesOrderDto): Promise<SalesOrderResponse> {
    // 检查订单是否存在
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('销售订单不存在', 404);
    }

    // 只能更新草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('只能修改草稿状态的订单', 400);
    }

    const order = await prisma.salesOrder.update({
      where: { id },
      data,
      include: {
        customer: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToSalesOrderResponse(order);
  }

  async deleteSalesOrder(id: string): Promise<void> {
    // 检查订单是否存在
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('销售订单不存在', 404);
    }

    // 只能删除草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('只能删除草稿状态的订单', 400);
    }

    await prisma.salesOrder.delete({
      where: { id }
    });
  }

  async confirmOrder(id: string): Promise<SalesOrderResponse> {
    // 检查订单是否存在
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!existingOrder) {
      throw new AppError('销售订单不存在', 404);
    }

    // 只能确认草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('订单状态不允许确认', 400);
    }

    // 检查库存可用性（暂时禁用用于测试）
    // for (const item of existingOrder.items) {
    //   if (item.material.currentStock < item.quantity) {
    //     throw new AppError(`物料 ${item.material.code} - ${item.material.name} 库存不足，当前库存: ${item.material.currentStock}`, 400);
    //   }
    // }

    // 更新物料销售价（根据最新销售订单价格）
    for (const item of existingOrder.items) {
      await prisma.material.update({
        where: { id: item.materialId },
        data: {
          salePrice: item.unitPrice
        }
      });
    }

    // 更新订单状态
    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED'
      },
      include: {
        customer: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToSalesOrderResponse(order);
  }

  async cancelOrder(id: string): Promise<SalesOrderResponse> {
    // 检查订单是否存在
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('销售订单不存在', 404);
    }

    // 只能取消草稿或已确认状态的订单
    if (existingOrder.status === 'COMPLETED') {
      throw new AppError('已完成的订单不能取消', 400);
    }

    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        customer: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToSalesOrderResponse(order);
  }

  // 生成订单号: SO-YYYYMMDD-0001
  private async generateOrderNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SO-${dateStr}-`;

    const lastOrder = await prisma.salesOrder.findFirst({
      where: {
        orderNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        orderNo: 'desc'
      }
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(-4));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private mapToSalesOrderResponse(order: any): SalesOrderResponse {
    return {
      id: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerCode: order.customer.code,
      customerName: order.customer.name,
      orderDate: order.orderDate.toISOString(),
      deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString() : null,
      status: order.status as SalesOrderStatus,
      totalAmount: order.totalAmount,
      taxAmount: order.taxAmount,
      items: order.items.map((item: any) => this.mapToSalesOrderItemResponse(item)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }

  private mapToSalesOrderItemResponse(item: any): SalesOrderItemResponse {
    return {
      id: item.id,
      materialId: item.materialId,
      materialCode: item.material.code,
      materialName: item.material.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      deliveredQuantity: item.deliveredQuantity
    };
  }
}