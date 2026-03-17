import api from './api';
import { PaginatedResult } from '../types';

export interface VoucherItem {
  id?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: string;
  summary: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  items: VoucherItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherDto {
  voucherDate: string;
  voucherType: string;
  summary: string;
  items: Omit<VoucherItem, 'id' | 'subjectCode' | 'subjectName'>[];
}

export const voucherApi = {
  // 获取凭证列表
  getVouchers: (params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string, search?: string }): Promise<PaginatedResult<Voucher>> => {
    return api.get('/api/vouchers', { params });
  },

  // 获取凭证详情
  getVoucherById: (id: string): Promise<Voucher> => {
    return api.get(`/api/vouchers/${id}`);
  },

  // 创建凭证
  createVoucher: (data: CreateVoucherDto): Promise<Voucher> => {
    return api.post('/api/vouchers', data);
  },

  // 过账凭证
  postVoucher: (id: string): Promise<Voucher> => {
    return api.post(`/api/vouchers/${id}/post`);
  },

  // 删除凭证
  deleteVoucher: (id: string): Promise<void> => {
    return api.delete(`/api/vouchers/${id}`);
  },

  // 冲销凭证
  reverseVoucher: (id: string): Promise<Voucher> => {
    return api.post(`/api/vouchers/${id}/reverse`);
  },

  // 获取科目余额
  getSubjectBalance: (params?: { periodId?: string }): Promise<any> => {
    return api.get('/api/vouchers/subject-balance', { params });
  },

  // 试算平衡表
  getTrialBalance: (params?: { periodId?: string }): Promise<any> => {
    return api.get('/api/vouchers/trial-balance', { params });
  },
};
