// 会计科目相关类型
export interface CreateSubjectDto {
  code: string;
  name: string;
  type: string;
}

export interface UpdateSubjectDto {
  name?: string;
  type?: string;
}

export interface SubjectResponse {
  id: string;
  code: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// 客户相关类型
export interface CreateCustomerDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateCustomerDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface CustomerResponse {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number;
  receivableBalance: number;
  createdAt: string;
  updatedAt: string;
}

// 供应商相关类型
export interface CreateSupplierDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface SupplierResponse {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  payableBalance: number;
  createdAt: string;
  updatedAt: string;
}

// 物料相关类型
export interface CreateMaterialDto {
  code: string;
  name: string;
  specification?: string;
  unit: string;
  costPrice?: number;
  salePrice?: number;
}

export interface UpdateMaterialDto {
  name?: string;
  specification?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
}

export interface MaterialResponse {
  id: string;
  code: string;
  name: string;
  specification: string | null;
  unit: string;
  currentStock: number;
  costPrice: number;
  salePrice: number;
  createdAt: string;
  updatedAt: string;
}