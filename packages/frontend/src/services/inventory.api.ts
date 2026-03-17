import api from './api';

export interface InventoryItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  specification: string | null;
  unit: string;
  currentStock: number;
  costPrice: number;
  salePrice: number;
  inventoryValue: number;
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  amount: number;
  referenceType: string;
  referenceId: string;
  transactionDate: string;
}

export interface InventoryAdjustment {
  id: string;
  adjustmentNo: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  adjustmentType: string;
  quantity: number;
  unitCost: number;
  amount: number;
  reason: string;
  description: string | null;
  voucherId: string | null;
  voucherNo: string | null;
  status: string;
  createdAt: string;
}

export interface InventoryAdjustmentDto {
  materialId: string;
  adjustmentType: 'INCREASE' | 'DECREASE';
  quantity: number;
  unitCost: number;
  reason: '盘点' | '无PO收货' | '其他';
  description?: string;
}

export const inventoryApi = {
  // 获取库存列表
  getInventoryList: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/api/inventory', { params });
  },

  // 获取库存流水
  getInventoryTransactions: (params?: {
    page?: number;
    limit?: number;
    materialId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.get('/api/inventory/transactions', { params });
  },

  // 获取库存调整列表
  getInventoryAdjustments: (params?: {
    page?: number;
    limit?: number;
    materialId?: string;
    adjustmentType?: string;
  }) => {
    return api.get('/api/inventory/adjustments', { params });
  },

  // 创建库存调整
  createInventoryAdjustment: (data: InventoryAdjustmentDto) => {
    return api.post('/api/inventory/adjustments', data);
  },
};
