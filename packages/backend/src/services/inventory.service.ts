import { prisma } from '../lib/prisma';
import {
  InventoryItem,
  InventoryTransactionResponse,
  InventoryAdjustmentDto,
  InventoryAdjustmentResponse
} from '../types/inventory';
import * as voucherService from './voucher.service';

// 获取库存列表（物料及库存信息）
export async function getInventoryList(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: InventoryItem[]; pagination: any }> {
  const { page = 1, limit = 20, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
      { specification: { contains: search } },
    ];
  }

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      skip,
      take: limit,
      orderBy: { code: 'asc' },
    }),
    prisma.material.count({ where }),
  ]);

  const data = materials.map((material): InventoryItem => ({
    id: material.id,
    materialId: material.id,
    materialCode: material.code,
    materialName: material.name,
    specification: material.specification,
    unit: material.unit,
    currentStock: material.currentStock,
    costPrice: material.costPrice,
    salePrice: material.salePrice,
    inventoryValue: material.currentStock * material.costPrice,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 获取库存流水
export async function getInventoryTransactions(params: {
  page?: number;
  limit?: number;
  materialId?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: InventoryTransactionResponse[]; pagination: any }> {
  const { page = 1, limit = 20, materialId, transactionType, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (materialId) {
    where.materialId = materialId;
  }

  if (transactionType) {
    where.transactionType = transactionType;
  }

  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) {
      (where.transactionDate as any).gte = new Date(startDate);
    }
    if (endDate) {
      (where.transactionDate as any).lte = new Date(endDate);
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { transactionDate: 'desc' },
      include: {
        material: true,
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  const data = transactions.map((tx): InventoryTransactionResponse => ({
    id: tx.id,
    materialId: tx.materialId,
    materialCode: tx.material.code,
    materialName: tx.material.name,
    transactionType: tx.transactionType,
    quantity: tx.quantity,
    unitCost: tx.unitCost,
    amount: tx.quantity * tx.unitCost,
    referenceType: tx.referenceType,
    referenceId: tx.referenceId,
    transactionDate: tx.transactionDate.toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 生成库存调整单号
async function generateAdjustmentNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.inventoryTransaction.count({
    where: {
      transactionType: 'ADJUSTMENT',
      transactionDate: {
        gte: new Date(today.toDateString()),
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `ADJ-${dateStr}-${seq}`;
}

// 创建库存调整
export async function createInventoryAdjustment(
  data: InventoryAdjustmentDto
): Promise<InventoryAdjustmentResponse> {
  const { materialId, adjustmentType, quantity, unitCost, reason, description } = data;

  // 检查物料是否存在
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    throw new Error('物料不存在');
  }

  if (quantity <= 0) {
    throw new Error('调整数量必须大于0');
  }

  const adjustmentNo = await generateAdjustmentNo();
  const amount = quantity * unitCost;

  // 创建库存调整记录（作为库存交易）
  const adjustment = await prisma.inventoryTransaction.create({
    data: {
      materialId,
      transactionType: adjustmentType === 'INCREASE' ? 'STOCK_IN' : 'STOCK_OUT',
      quantity: adjustmentType === 'INCREASE' ? quantity : -quantity,
      unitCost,
      referenceType: 'ADJUSTMENT',
      referenceId: adjustmentNo,
      transactionDate: new Date(),
    },
    include: {
      material: true,
    },
  });

  // 更新库存数量
  await prisma.material.update({
    where: { id: materialId },
    data: {
      currentStock: {
        increment: adjustmentType === 'INCREASE' ? quantity : -quantity,
      },
    },
  });

  // 生成凭证
  let voucherId: string | null = null;
  let voucherNo: string | null = null;

  try {
    const voucher = await voucherService.generateInventoryAdjustmentVoucher(
      materialId,
      adjustmentType,
      quantity,
      unitCost,
      adjustmentNo
    );
    voucherId = voucher?.id || null;
    voucherNo = voucher?.voucherNo || null;

    // 更新库存交易记录的凭证ID
    if (voucherId) {
      await prisma.inventoryTransaction.update({
        where: { id: adjustment.id },
        data: { voucherId },
      });
    }
  } catch (error) {
    console.error('生成库存调整凭证失败:', error);
  }

  return {
    id: adjustment.id,
    adjustmentNo,
    materialId: material.id,
    materialCode: material.code,
    materialName: material.name,
    adjustmentType,
    quantity,
    unitCost,
    amount,
    reason,
    description: description || null,
    voucherId,
    voucherNo,
    status: 'COMPLETED',
    createdAt: adjustment.transactionDate.toISOString(),
  };
}

// 获取库存调整列表
export async function getInventoryAdjustments(params: {
  page?: number;
  limit?: number;
  materialId?: string;
  adjustmentType?: string;
}): Promise<{ data: InventoryAdjustmentResponse[]; pagination: any }> {
  const { page = 1, limit = 20, materialId, adjustmentType } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    referenceType: 'ADJUSTMENT',
  };

  if (materialId) {
    where.materialId = materialId;
  }

  if (adjustmentType) {
    where.transactionType = adjustmentType === 'INCREASE' ? 'STOCK_IN' : 'STOCK_OUT';
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { transactionDate: 'desc' },
      include: {
        material: true,
        voucher: true,
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  const data = transactions.map((tx): InventoryAdjustmentResponse => ({
    id: tx.id,
    adjustmentNo: tx.referenceId,
    materialId: tx.materialId,
    materialCode: tx.material.code,
    materialName: tx.material.name,
    adjustmentType: tx.transactionType === 'STOCK_IN' ? 'INCREASE' : 'DECREASE',
    quantity: Math.abs(tx.quantity),
    unitCost: tx.unitCost,
    amount: Math.abs(tx.quantity) * tx.unitCost,
    reason: '盘点', // 简化处理，实际应存储原因
    description: null,
    voucherId: tx.voucherId,
    voucherNo: tx.voucher?.voucherNo || null,
    status: 'COMPLETED',
    createdAt: tx.transactionDate.toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
