import api from './api';
import {
  PurchaseReceiptResponse,
  CreatePurchaseReceiptDto,
  UpdatePurchaseReceiptDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const purchaseReceiptApi = {
  // ========== 采购收货单 API ==========

  getPurchaseReceipts: (params?: QueryParams): Promise<PaginatedResult<PurchaseReceiptResponse>> => {
    return api.get('/purchase-receipts', { params });
  },

  getPurchaseReceiptById: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.get(`/purchase-receipts/${id}`);
  },

  createPurchaseReceipt: (data: CreatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> => {
    return api.post('/purchase-receipts', data);
  },

  updatePurchaseReceipt: (id: string, data: UpdatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> => {
    return api.put(`/purchase-receipts/${id}`, data);
  },

  deletePurchaseReceipt: (id: string): Promise<void> => {
    return api.delete(`/api/purchase-receipts/${id}`);
  },

  confirmPurchaseReceipt: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.post(`/purchase-receipts/${id}/confirm`);
  },

  cancelPurchaseReceipt: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.post(`/purchase-receipts/${id}/cancel`);
  },
};