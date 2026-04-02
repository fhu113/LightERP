import api from './api';

export interface TaxCode {
  id: string;
  code: string;
  name: string;
  taxType: 'INPUT' | 'OUTPUT';
  rate: number;
  description?: string;
  isActive: boolean;
}

export const taxCodeApi = {
  // 获取所有税码
  getAll: async (taxType?: string): Promise<TaxCode[]> => {
    const params = taxType ? `?taxType=${taxType}` : '';
    return api.get(`/api/tax-codes${params}`);
  },

  // 获取单个税码
  getById: async (id: string): Promise<TaxCode> => {
    return api.get(`/api/tax-codes/${id}`);
  },

  // 创建税码
  create: async (data: Omit<TaxCode, 'id'>): Promise<TaxCode> => {
    return api.post('/api/tax-codes', data);
  },

  // 更新税码
  update: async (id: string, data: Partial<TaxCode>): Promise<TaxCode> => {
    return api.put(`/api/tax-codes/${id}`, data);
  },

  // 删除税码
  delete: async (id: string): Promise<void> => {
    return api.delete(`/api/tax-codes/${id}`);
  },
};
