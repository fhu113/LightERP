import api from './api';
import {
  PaymentResponse,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const paymentApi = {
  // ========== 付款单 API ==========

  getPayments: (params?: QueryParams): Promise<PaginatedResult<PaymentResponse>> => {
    return api.get('/payments', { params });
  },

  getPaymentById: (id: string): Promise<PaymentResponse> => {
    return api.get(`/payments/${id}`);
  },

  createPayment: (data: CreatePaymentDto): Promise<PaymentResponse> => {
    return api.post('/payments', data);
  },

  updatePayment: (id: string, data: UpdatePaymentDto): Promise<PaymentResponse> => {
    return api.put(`/payments/${id}`, data);
  },

  deletePayment: (id: string): Promise<void> => {
    return api.delete(`/api/payments/${id}`);
  },

  confirmPayment: (id: string): Promise<PaymentResponse> => {
    return api.post(`/payments/${id}/confirm`);
  },

  cancelPayment: (id: string): Promise<PaymentResponse> => {
    return api.post(`/payments/${id}/cancel`);
  },

  getInvoicesForPayment: (): Promise<any[]> => {
    return api.get('/payments/for-payment');
  },
};
