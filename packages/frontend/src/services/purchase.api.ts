import api from './api';
import {
  PurchaseOrderResponse,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const purchaseApi = {
  // ========== 采购订单 API ==========

  getPurchaseOrders: (params?: QueryParams): Promise<PaginatedResult<PurchaseOrderResponse>> => {
    return api.get( '/api/purchase/orders', { params });
  },

  getStatusCounts: (): Promise<Record<string, number>> => {
    return api.get('/api/purchase/orders/status-counts');
  },

  getPurchaseOrderById: (id: string): Promise<PurchaseOrderResponse> => {
    return api.get(`/api/purchase/orders/${id}`);
  },

  createPurchaseOrder: (data: CreatePurchaseOrderDto): Promise<PurchaseOrderResponse> => {
    return api.post( '/api/purchase/orders', data);
  },

  updatePurchaseOrder: (id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponse> => {
    return api.put(`/api/purchase/orders/${id}`, data);
  },

  deletePurchaseOrder: (id: string): Promise<void> => {
    return api.delete(`/api/purchase/orders/${id}`);
  },

  confirmPurchaseOrder: (id: string): Promise<PurchaseOrderResponse> => {
    return api.post(`/api/purchase/orders/${id}/confirm`);
  },

  cancelPurchaseOrder: (id: string): Promise<PurchaseOrderResponse> => {
    return api.post(`/api/purchase/orders/${id}/cancel`);
  },
};