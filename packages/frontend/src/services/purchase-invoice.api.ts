import api from './api';
import {
  PurchaseInvoiceResponse,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const purchaseInvoiceApi = {
  // ========== 采购发票 API ==========

  getPurchaseInvoices: (params?: QueryParams): Promise<PaginatedResult<PurchaseInvoiceResponse>> => {
    return api.get('/api/purchase-invoices', { params });
  },

  getPurchaseInvoiceById: (id: string): Promise<PurchaseInvoiceResponse> => {
    return api.get(`/api/purchase-invoices/${id}`);
  },

  createPurchaseInvoice: (data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoiceResponse> => {
    return api.post('/api/purchase-invoices', data);
  },

  updatePurchaseInvoice: (id: string, data: UpdatePurchaseInvoiceDto): Promise<PurchaseInvoiceResponse> => {
    return api.put(`/api/purchase-invoices/${id}`, data);
  },

  deletePurchaseInvoice: (id: string): Promise<void> => {
    return api.delete(`/api/purchase-invoices/${id}`);
  },

  confirmPurchaseInvoice: (id: string): Promise<PurchaseInvoiceResponse> => {
    return api.post(`/api/purchase-invoices/${id}/confirm`);
  },

  cancelPurchaseInvoice: (id: string): Promise<PurchaseInvoiceResponse> => {
    return api.post(`/api/purchase-invoices/${id}/cancel`);
  },

  getReceiptsForInvoicing: (): Promise<any[]> => {
    return api.get('/api/purchase-invoices/for-invoicing');
  },
};
