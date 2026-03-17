// 收款单状态
export type ReceiptStatus = 'PENDING' | 'PAID' | 'CANCELLED';

// 支付方式
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD';

// 创建收款单DTO
export interface CreateReceiptDto {
  customerId: string;
  invoiceId?: string;
  receiptDate?: Date;
  amount: number;
  paymentMethod: PaymentMethod;
}

// 更新收款单DTO
export interface UpdateReceiptDto {
  receiptDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: ReceiptStatus;
  voucherId?: string;
}

// 收款单响应
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
  voucherId: string | null;
  voucherNo: string | null;
  createdAt: string;
}