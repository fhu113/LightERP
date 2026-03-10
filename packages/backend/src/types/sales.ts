// 销售订单状态
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 销售订单项
export interface SalesOrderItemDto {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

// 创建销售订单DTO
export interface CreateSalesOrderDto {
  customerId: string;
  orderDate?: Date;
  deliveryDate?: Date;
  items: SalesOrderItemDto[];
}

// 更新销售订单DTO
export interface UpdateSalesOrderDto {
  deliveryDate?: Date;
  status?: SalesOrderStatus;
}

// 销售订单项响应
export interface SalesOrderItemResponse {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  deliveredQuantity: number;
}

// 销售订单响应
export interface SalesOrderResponse {
  id: string;
  orderNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string | null;
  status: SalesOrderStatus;
  totalAmount: number;
  taxAmount: number;
  items: SalesOrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}