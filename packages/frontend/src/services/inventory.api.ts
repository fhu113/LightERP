import api from './api';

export interface InventoryTransaction {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  referenceType: string;
  transactionDate: string;
}

export const inventoryApi = {
  // 获取库存列表
  getInventory: (params?: { warehouseId?: string; categoryId?: string }) => {
    return api.get('/master/materials', { params });
  },

  // 获取库存流水
  getTransactions: (params?: { materialId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    return api.get('/inventory/transactions', { params });
  },

  // 创建库存调整单
  createAdjustment: (data: {
    materialId: string;
    warehouseId: string;
    quantity: number;
    adjustmentType: string;
    reason: string;
  }) => {
    return api.post('/inventory/adjustments', data);
  },
};
