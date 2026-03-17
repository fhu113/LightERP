// 库存管理类型定义

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
  inventoryValue: number; // currentStock * costPrice
}

export interface InventoryTransactionResponse {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  amount: number; // quantity * unitCost
  referenceType: string;
  referenceId: string;
  transactionDate: string;
}

export interface InventoryAdjustmentDto {
  materialId: string;
  adjustmentType: 'INCREASE' | 'DECREASE';
  quantity: number;
  unitCost: number;
  reason: '盘点' | '无PO收货' | '其他';
  description?: string;
}

export interface InventoryAdjustmentResponse {
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
