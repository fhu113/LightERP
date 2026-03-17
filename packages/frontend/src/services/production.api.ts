import api from './api';

export const productionApi = {
  // ========== 生产订单 ==========
  getOrders: (params?: any) => api.get('/api/production/orders', { params }),
  getOrderById: (id: string) => api.get(`/api/production/orders/${id}`),
  createOrder: (data: any) => api.post('/api/production/orders', data),
  updateOrder: (id: string, data: any) => api.put(`/api/production/orders/${id}`, data),
  deleteOrder: (id: string) => api.delete(`/api/production/orders/${id}`),

  // ========== 生产收货 ==========
  getReceipts: (params?: any) => api.get('/api/production/receipts', { params }),
  getReceiptById: (id: string) => api.get(`/api/production/receipts/${id}`),
  createReceipt: (data: any) => api.post('/api/production/receipts', data),
  confirmReceipt: (id: string) => api.post(`/api/production/receipts/${id}/confirm`),
  deleteReceipt: (id: string) => api.delete(`/api/production/receipts/${id}`),

  // ========== BOM管理 ==========
  getBOMs: (params?: any) => api.get('/api/production/boms', { params }),
  getBOMById: (id: string) => api.get(`/api/production/boms/${id}`),
  createBOM: (data: any) => api.post('/api/production/boms', data),
  updateBOM: (id: string, data: any) => api.put(`/api/production/boms/${id}`, data),
  deleteBOM: (id: string) => api.delete(`/api/production/boms/${id}`),
};
