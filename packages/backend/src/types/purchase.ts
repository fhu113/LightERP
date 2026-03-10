// 采购订单状态
export type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 采购订单项
export interface PurchaseOrderItemDto {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

// 创建采购订单DTO
export interface CreatePurchaseOrderDto {
  supplierId: string;
  orderDate?: Date;
  expectedDate?: Date;
  items: PurchaseOrderItemDto[];
}

// 更新采购订单DTO
export interface UpdatePurchaseOrderDto {
  expectedDate?: Date;
  status?: PurchaseOrderStatus;
}

// 采购订单项响应
export interface PurchaseOrderItemResponse {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  receivedQuantity: number;
}

// 采购订单响应
export interface PurchaseOrderResponse {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: PurchaseOrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}