import api from './api';
import {
  SalesOrderResponse,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesInvoiceResponse,
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
  ReceiptResponse,
  CreateReceiptDto,
  UpdateReceiptDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const salesApi = {
  // ========== 销售订单 API ==========

  getSalesOrders: (params?: QueryParams): Promise<PaginatedResult<SalesOrderResponse>> => {
    return api.get( '/api/sales/orders', { params });
  },

  getSalesOrderById: (id: string): Promise<SalesOrderResponse> => {
    return api.get(`/sales/orders/${id}`);
  },

  createSalesOrder: (data: CreateSalesOrderDto): Promise<SalesOrderResponse> => {
    return api.post( '/api/sales/orders', data);
  },

  updateSalesOrder: (id: string, data: UpdateSalesOrderDto): Promise<SalesOrderResponse> => {
    return api.put(`/sales/orders/${id}`, data);
  },

  deleteSalesOrder: (id: string): Promise<void> => {
    return api.delete(`/api/sales/orders/${id}`);
  },

  confirmOrder: (id: string): Promise<SalesOrderResponse> => {
    return api.post(`/sales/orders/${id}/confirm`);
  },

  cancelOrder: (id: string): Promise<SalesOrderResponse> => {
    return api.post(`/sales/orders/${id}/cancel`);
  },

  // ========== 销售发票 API ==========

  getSalesInvoices: (params?: QueryParams): Promise<PaginatedResult<SalesInvoiceResponse>> => {
    return api.get('/sales-invoices', { params });
  },

  getSalesInvoiceById: (id: string): Promise<SalesInvoiceResponse> => {
    return api.get(`/sales-invoices/${id}`);
  },

  createSalesInvoice: (data: CreateSalesInvoiceDto): Promise<SalesInvoiceResponse> => {
    return api.post('/sales-invoices', data);
  },

  updateSalesInvoice: (id: string, data: UpdateSalesInvoiceDto): Promise<SalesInvoiceResponse> => {
    return api.put(`/sales-invoices/${id}`, data);
  },

  deleteSalesInvoice: (id: string): Promise<void> => {
    return api.delete(`/api/sales-invoices/${id}`);
  },

  issueInvoice: (id: string): Promise<SalesInvoiceResponse> => {
    return api.post(`/sales-invoices/${id}/issue`);
  },

  cancelInvoice: (id: string): Promise<SalesInvoiceResponse> => {
    return api.post(`/sales-invoices/${id}/cancel`);
  },

  // ========== 收款单 API ==========

  getReceipts: (params?: QueryParams): Promise<PaginatedResult<ReceiptResponse>> => {
    return api.get('/receipts', { params });
  },

  getReceiptById: (id: string): Promise<ReceiptResponse> => {
    return api.get(`/receipts/${id}`);
  },

  createReceipt: (data: CreateReceiptDto): Promise<ReceiptResponse> => {
    return api.post('/receipts', data);
  },

  updateReceipt: (id: string, data: UpdateReceiptDto): Promise<ReceiptResponse> => {
    return api.put(`/receipts/${id}`, data);
  },

  deleteReceipt: (id: string): Promise<void> => {
    return api.delete(`/api/receipts/${id}`);
  },

  confirmReceipt: (id: string): Promise<ReceiptResponse> => {
    return api.post(`/receipts/${id}/confirm`);
  },

  cancelReceipt: (id: string): Promise<ReceiptResponse> => {
    return api.post(`/receipts/${id}/cancel`);
  },
};