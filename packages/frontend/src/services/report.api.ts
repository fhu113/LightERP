import api from './api';

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export interface PurchaseReportParams {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
}

export const reportApi = {
  // 销售报表
  getSalesReport: (params?: SalesReportParams) => {
    return api.get('/reports/sales', { params });
  },

  // 采购报表
  getPurchaseReport: (params?: PurchaseReportParams) => {
    return api.get('/reports/purchase', { params });
  },

  // 库存报表
  getInventoryReport: () => {
    return api.get('/reports/inventory');
  },

  // 应收账款报表
  getReceivableReport: () => {
    return api.get('/reports/receivable');
  },

  // 应付账款报表
  getPayableReport: () => {
    return api.get('/reports/payable');
  },
};
