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
    return api.get('/api/purchase-receipts', { params });
  },

  getPurchaseReceiptById: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.get(`/api/purchase-receipts/${id}`);
  },

  createPurchaseReceipt: (data: CreatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> => {
    return api.post('/api/purchase-receipts', data);
  },

  updatePurchaseReceipt: (id: string, data: UpdatePurchaseReceiptDto): Promise<PurchaseReceiptResponse> => {
    return api.put(`/api/purchase-receipts/${id}`, data);
  },

  deletePurchaseReceipt: (id: string): Promise<void> => {
    return api.delete(`/api/purchase-receipts/${id}`);
  },

  confirmPurchaseReceipt: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.post(`/api/purchase-receipts/${id}/confirm`);
  },

  cancelPurchaseReceipt: (id: string): Promise<PurchaseReceiptResponse> => {
    return api.post(`/api/purchase-receipts/${id}/cancel`);
  },
};
