// 发货单状态
export type DeliveryStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 发货明细项
export interface DeliveryItemDto {
  orderItemId: string;
  quantity: number;
}

// 创建发货单DTO
export interface CreateDeliveryDto {
  orderId: string;
  deliveryDate?: Date;
  warehouseId?: string;
  shippingInfo?: string;
  items: DeliveryItemDto[];
}

// 更新发货单DTO
export interface UpdateDeliveryDto {
  deliveryDate?: Date;
  warehouseId?: string;
  shippingInfo?: string;
  status?: DeliveryStatus;
}

// 发货明细响应
export interface DeliveryItemResponse {
  id: string;
  orderItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
}

// 发货单响应
export interface DeliveryResponse {
  id: string;
  deliveryNo: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  deliveryDate: string;
  warehouseId: string | null;
  shippingInfo: string | null;
  status: DeliveryStatus;
  voucherId: string | null;
  voucherNo: string | null;
  items: DeliveryItemResponse[];
  createdAt: string;
  updatedAt: string;
}