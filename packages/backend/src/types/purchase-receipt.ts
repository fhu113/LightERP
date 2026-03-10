// 采购收货单状态
export type PurchaseReceiptStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 采购收货明细项
export interface PurchaseReceiptItemDto {
  orderItemId: string;
  quantity: number;
}

// 创建采购收货单DTO
export interface CreatePurchaseReceiptDto {
  orderId: string;
  receiptDate?: Date;
  warehouseId?: string;
  items: PurchaseReceiptItemDto[];
}

// 更新采购收货单DTO
export interface UpdatePurchaseReceiptDto {
  receiptDate?: Date;
  warehouseId?: string;
  status?: PurchaseReceiptStatus;
}

// 采购收货明细响应
export interface PurchaseReceiptItemResponse {
  id: string;
  orderItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
}

// 采购收货单响应
export interface PurchaseReceiptResponse {
  id: string;
  receiptNo: string;
  orderId: string;
  orderNo: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  receiptDate: string;
  warehouseId: string | null;
  status: PurchaseReceiptStatus;
  items: PurchaseReceiptItemResponse[];
  createdAt: string;
  updatedAt: string;
}