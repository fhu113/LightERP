import api from './api';

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
  getVouchers: (params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) => {
    return api.get<{ data: Voucher[]; pagination: any }>('/vouchers', { params });
  },

  // 获取凭证详情
  getVoucherById: (id: string) => {
    return api.get<Voucher>(`/vouchers/${id}`);
  },

  // 创建凭证
  createVoucher: (data: CreateVoucherDto) => {
    return api.post<Voucher>('/vouchers', data);
  },

  // 过账凭证
  postVoucher: (id: string) => {
    return api.post<Voucher>(`/vouchers/${id}/post`);
  },

  // 删除凭证
  deleteVoucher: (id: string) => {
    return api.delete(`/vouchers/${id}`);
  },

  // 获取科目余额
  getSubjectBalance: (params?: { periodId?: string }) => {
    return api.get('/vouchers/subject-balance', { params });
  },

  // 试算平衡表
  getTrialBalance: (params?: { periodId?: string }) => {
    return api.get('/vouchers/trial-balance', { params });
  },
};
