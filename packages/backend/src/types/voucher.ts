// 凭证类型定义

export type VoucherStatus = 'DRAFT' | 'POSTED' | 'REVERSED';
export type VoucherType = 'GENERAL' | 'ADJUSTMENT' | 'REVERSAL';

export interface VoucherItemDto {
  subjectId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface VoucherResponse {
  id: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: VoucherType;
  summary: string;
  status: VoucherStatus;
  totalDebit: number;
  totalCredit: number;
  items: VoucherItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface VoucherItemResponse {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  debitAmount: number;
  creditAmount: number;
  description: string | null;
}

export interface CreateVoucherDto {
  voucherDate?: Date;
  voucherType?: VoucherType;
  summary: string;
  items: VoucherItemDto[];
}

export interface UpdateVoucherDto {
  voucherDate?: Date;
  voucherType?: VoucherType;
  summary?: string;
  status?: VoucherStatus;
}

// 业务类型定义
export type BusinessType =
  | 'SALES_INVOICE'    // 销售开票
  | 'PURCHASE_INVOICE' // 采购发票
  | 'RECEIPT'          // 收款
  | 'PAYMENT';         // 付款
