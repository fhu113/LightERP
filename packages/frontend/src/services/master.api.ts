import api from './api';
import {
  Subject,
  SubjectTree,
  Customer,
  Supplier,
  Material,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  PaginatedResult,
  QueryParams,
} from '../types';

export const masterApi = {
  // ========== 会计科目 API ==========

  getSubjects: (params?: QueryParams): Promise<PaginatedResult<Subject>> => {
    return api.get('/master/subjects', { params });
  },

  getSubjectTree: (): Promise<SubjectTree[]> => {
    return api.get('/master/subjects/tree');
  },

  getSubjectById: (id: string): Promise<Subject> => {
    return api.get(`/master/subjects/${id}`);
  },

  createSubject: (data: CreateSubjectDto): Promise<Subject> => {
    return api.post('/master/subjects', data);
  },

  updateSubject: (id: string, data: UpdateSubjectDto): Promise<Subject> => {
    return api.put(`/master/subjects/${id}`, data);
  },

  deleteSubject: (id: string): Promise<void> => {
    return api.delete(`/master/subjects/${id}`);
  },

  // ========== 客户 API ==========

  getCustomers: (params?: QueryParams): Promise<PaginatedResult<Customer>> => {
    return api.get('/master/customers', { params });
  },

  getCustomerById: (id: string): Promise<Customer> => {
    return api.get(`/master/customers/${id}`);
  },

  createCustomer: (data: CreateCustomerDto): Promise<Customer> => {
    return api.post('/master/customers', data);
  },

  updateCustomer: (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    return api.put(`/master/customers/${id}`, data);
  },

  deleteCustomer: (id: string): Promise<void> => {
    return api.delete(`/master/customers/${id}`);
  },

  // ========== 供应商 API ==========

  getSuppliers: (params?: QueryParams): Promise<PaginatedResult<Supplier>> => {
    return api.get('/master/suppliers', { params });
  },

  getSupplierById: (id: string): Promise<Supplier> => {
    return api.get(`/master/suppliers/${id}`);
  },

  createSupplier: (data: CreateSupplierDto): Promise<Supplier> => {
    return api.post('/master/suppliers', data);
  },

  updateSupplier: (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    return api.put(`/master/suppliers/${id}`, data);
  },

  deleteSupplier: (id: string): Promise<void> => {
    return api.delete(`/master/suppliers/${id}`);
  },

  // ========== 物料 API ==========

  getMaterials: (params?: QueryParams): Promise<PaginatedResult<Material>> => {
    return api.get('/master/materials', { params });
  },

  getMaterialById: (id: string): Promise<Material> => {
    return api.get(`/master/materials/${id}`);
  },

  createMaterial: (data: CreateMaterialDto): Promise<Material> => {
    return api.post('/master/materials', data);
  },

  updateMaterial: (id: string, data: UpdateMaterialDto): Promise<Material> => {
    return api.put(`/master/materials/${id}`, data);
  },

  deleteMaterial: (id: string): Promise<void> => {
    return api.delete(`/master/materials/${id}`);
  },
};