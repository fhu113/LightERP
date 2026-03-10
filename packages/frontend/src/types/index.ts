// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 查询参数
export interface QueryParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// 会计科目类型
export interface Subject {
  id: string;
  code: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectTree extends Subject {
  children?: Subject[];
}

// 客户类型
export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number;
  receivableBalance: number;
  createdAt: string;
  updatedAt: string;
}

// 供应商类型
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  payableBalance: number;
  createdAt: string;
  updatedAt: string;
}

// 物料类型
export interface Material {
  id: string;
  code: string;
  name: string;
  specification: string | null;
  unit: string;
  currentStock: number;
  costPrice: number;
  salePrice: number;
  createdAt: string;
  updatedAt: string;
}

// 表单数据类型
export interface CreateSubjectDto {
  code: string;
  name: string;
  type: string;
}

export interface UpdateSubjectDto {
  name?: string;
  type?: string;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateCustomerDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface CreateSupplierDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateMaterialDto {
  code: string;
  name: string;
  specification?: string;
  unit: string;
  costPrice?: number;
  salePrice?: number;
}

export interface UpdateMaterialDto {
  name?: string;
  specification?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
}

// 销售订单类型
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface SalesOrderItemDto {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

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

export interface CreateSalesOrderDto {
  customerId: string;
  orderDate?: Date;
  deliveryDate?: Date;
  items: SalesOrderItemDto[];
}

export interface UpdateSalesOrderDto {
  deliveryDate?: Date;
  status?: SalesOrderStatus;
}

// 发货单类型
export type DeliveryStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryItemDto {
  orderItemId: string;
  quantity: number;
}

export interface DeliveryItemResponse {
  id: string;
  orderItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
}

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
  items: DeliveryItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryDto {
  orderId: string;
  deliveryDate?: Date;
  warehouseId?: string;
  shippingInfo?: string;
  items: DeliveryItemDto[];
}

export interface UpdateDeliveryDto {
  deliveryDate?: Date;
  warehouseId?: string;
  shippingInfo?: string;
  status?: DeliveryStatus;
}

// 销售发票类型
export type SalesInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface SalesInvoiceReceiptResponse {
  id: string;
  receiptNo: string;
  receiptDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface SalesInvoiceResponse {
  id: string;
  invoiceNo: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  status: SalesInvoiceStatus;
  receipts: SalesInvoiceReceiptResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesInvoiceDto {
  orderId: string;
  invoiceDate?: Date;
}

export interface UpdateSalesInvoiceDto {
  invoiceDate?: Date;
  status?: SalesInvoiceStatus;
}

// 收款单类型
export type ReceiptStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD';

export interface ReceiptResponse {
  id: string;
  receiptNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  invoiceId: string | null;
  invoiceNo: string | null;
  receiptDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: ReceiptStatus;
  createdAt: string;
}

export interface CreateReceiptDto {
  customerId: string;
  invoiceId?: string;
  receiptDate?: Date;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface UpdateReceiptDto {
  receiptDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: ReceiptStatus;
}

// 采购订单类型
export type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrderItemDto {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

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

export interface CreatePurchaseOrderDto {
  supplierId: string;
  orderDate?: Date;
  expectedDate?: Date;
  items: PurchaseOrderItemDto[];
}

export interface UpdatePurchaseOrderDto {
  expectedDate?: Date;
  status?: PurchaseOrderStatus;
}

// 采购收货单类型
export type PurchaseReceiptStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseReceiptItemDto {
  orderItemId: string;
  quantity: number;
}

export interface PurchaseReceiptItemResponse {
  id: string;
  orderItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
}

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

export interface CreatePurchaseReceiptDto {
  orderId: string;
  receiptDate?: Date;
  warehouseId?: string;
  items: PurchaseReceiptItemDto[];
}

export interface UpdatePurchaseReceiptDto {
  receiptDate?: Date;
  warehouseId?: string;
  status?: PurchaseReceiptStatus;
}

// 采购发票类型
export type PurchaseInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface PurchaseInvoiceItemDto {
  receiptItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseInvoiceItemResponse {
  id: string;
  receiptItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PurchaseInvoiceResponse {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  receiptId: string | null;
  receiptNo: string | null;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  status: PurchaseInvoiceStatus;
  items: PurchaseInvoiceItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseInvoiceDto {
  supplierId: string;
  receiptId?: string;
  invoiceDate?: Date;
  items: PurchaseInvoiceItemDto[];
}

export interface UpdatePurchaseInvoiceDto {
  invoiceDate?: Date;
  status?: PurchaseInvoiceStatus;
}

// 付款单类型
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface PaymentResponse {
  id: string;
  paymentNo: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  invoiceId: string | null;
  invoiceNo: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  supplierId: string;
  invoiceId?: string;
  paymentDate?: Date;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface UpdatePaymentDto {
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
}