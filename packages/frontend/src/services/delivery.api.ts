import api from './api';
import {
  DeliveryResponse,
  CreateDeliveryDto,
  UpdateDeliveryDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const deliveryApi = {
  // ========== 发货单 API ==========

  getDeliveries: (params?: QueryParams): Promise<PaginatedResult<DeliveryResponse>> => {
    return api.get('/deliveries', { params });
  },

  getDeliveryById: (id: string): Promise<DeliveryResponse> => {
    return api.get(`/deliveries/${id}`);
  },

  createDelivery: (data: CreateDeliveryDto): Promise<DeliveryResponse> => {
    return api.post('/deliveries', data);
  },

  updateDelivery: (id: string, data: UpdateDeliveryDto): Promise<DeliveryResponse> => {
    return api.put(`/deliveries/${id}`, data);
  },

  deleteDelivery: (id: string): Promise<void> => {
    return api.delete(`/api/deliveries/${id}`);
  },

  confirmDelivery: (id: string): Promise<DeliveryResponse> => {
    return api.post(`/api/deliveries/${id}/confirm`);
  },

  cancelDelivery: (id: string): Promise<DeliveryResponse> => {
    return api.post(`/api/deliveries/${id}/cancel`);
  },
};