import { prisma } from '../lib/prisma';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponse,
  PurchaseOrderStatus
} from '../types/purchase';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';

export class PurchaseService {
  // ========== 采购订单服务 ==========

  async getPurchaseOrders(params: QueryParams): Promise<PaginatedResult<PurchaseOrderResponse>> {
    const { page = 1, limit = 20, sortBy = 'orderDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { supplier: { name: { contains: search } } },
        { supplier: { code: { contains: search } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: true,
          items: {
            include: {
              material: true
            }
          }
        }
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    return {
      data: orders.map(order => this.mapToPurchaseOrderResponse(order)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderResponse> {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
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

    return this.mapToPurchaseOrderResponse(order);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrderResponse> {
    // 检查供应商是否存在
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId }
    });

    if (!supplier) {
      throw new AppError('供应商不存在', 404);
    }

    // 生成采购订单号
    const orderNo = await this.generatePurchaseOrderNo();

    // 计算订单总额
    let totalAmount = 0;
    const items = await Promise.all(
      data.items.map(async item => {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId }
        });

        if (!material) {
          throw new AppError(`物料不存在: ${item.materialId}`, 404);
        }

        const amount = item.quantity * item.unitPrice;
        totalAmount += amount;

        return {
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount
        };
      })
    );

    if (items.length === 0) {
      throw new AppError('采购订单必须包含至少一个物料', 400);
    }

    // 创建采购订单
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: data.supplierId,
        orderDate: data.orderDate || new Date(),
        expectedDate: data.expectedDate,
        totalAmount,
        items: {
          create: items
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToPurchaseOrderResponse(order);
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponse> {
    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingOrder) {
      throw new AppError('采购订单不存在', 404);
    }

    // 只能修改草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('只能修改草稿状态的采购订单', 400);
    }

    // 更新采购订单
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        expectedDate: data.expectedDate,
        status: data.status
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToPurchaseOrderResponse(order);
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('采购订单不存在', 404);
    }

    // 只能删除草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('只能删除草稿状态的采购订单', 400);
    }

    // 删除采购订单（级联删除明细）
    await prisma.purchaseOrder.delete({
      where: { id }
    });
  }

  async confirmPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('采购订单不存在', 404);
    }

    // 只能确认草稿状态的订单
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError('只能确认草稿状态的采购订单', 400);
    }

    // 确认采购订单
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED'
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToPurchaseOrderResponse(order);
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new AppError('采购订单不存在', 404);
    }

    // 只能取消草稿或已确认状态的订单
    if (existingOrder.status !== 'DRAFT' && existingOrder.status !== 'CONFIRMED') {
      throw new AppError('只能取消草稿或已确认状态的采购订单', 400);
    }

    // 取消采购订单
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    return this.mapToPurchaseOrderResponse(order);
  }

  // ========== 私有方法 ==========

  private async generatePurchaseOrderNo(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 查找当天的最大订单号
    const latestOrder = await prisma.purchaseOrder.findFirst({
      where: {
        orderNo: {
          startsWith: `PO-${dateStr}-`
        }
      },
      orderBy: {
        orderNo: 'desc'
      }
    });

    let sequence = 1;
    if (latestOrder && latestOrder.orderNo) {
      const lastSeq = parseInt(latestOrder.orderNo.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    return `PO-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }

  private mapToPurchaseOrderResponse(order: any): PurchaseOrderResponse {
    return {
      id: order.id,
      orderNo: order.orderNo,
      supplierId: order.supplierId,
      supplierCode: order.supplier.code,
      supplierName: order.supplier.name,
      orderDate: order.orderDate.toISOString(),
      expectedDate: order.expectedDate ? order.expectedDate.toISOString() : null,
      status: order.status as PurchaseOrderStatus,
      totalAmount: order.totalAmount,
      items: order.items.map((item: any) => ({
        id: item.id,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        receivedQuantity: item.receivedQuantity
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }
}