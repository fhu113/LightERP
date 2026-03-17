// 付款单类型定义

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD';

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
  voucherId: string | null;
  voucherNo: string | null;
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
