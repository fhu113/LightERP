// 采购发票类型定义

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
  voucherId: string | null;
  voucherNo: string | null;
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
