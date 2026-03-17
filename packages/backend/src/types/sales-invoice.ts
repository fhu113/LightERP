// 销售发票状态
export type SalesInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

// 创建销售发票DTO
export interface CreateSalesInvoiceDto {
  orderId: string;
  invoiceDate?: Date;
}

// 更新销售发票DTO
export interface UpdateSalesInvoiceDto {
  invoiceDate?: Date;
  status?: SalesInvoiceStatus;
  voucherId?: string;
}

// 销售发票响应
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
  voucherId?: string | null;
  voucherNo?: string | null;
  receipts: Array<{
    id: string;
    receiptNo: string;
    receiptDate: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}