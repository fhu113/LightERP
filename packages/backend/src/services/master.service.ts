import { prisma } from '../lib/prisma';
import {
  CreateSubjectDto, UpdateSubjectDto, SubjectResponse,
  CreateCustomerDto, UpdateCustomerDto, CustomerResponse,
  CreateSupplierDto, UpdateSupplierDto, SupplierResponse,
  CreateMaterialDto, UpdateMaterialDto, MaterialResponse
} from '../types/master';
import { PaginationParams, PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';

export class MasterService {
  // ========== 会计科目服务 ==========

  async getSubjects(params: PaginationParams): Promise<PaginatedResult<SubjectResponse>> {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [subjects, total] = await Promise.all([
      prisma.accountingSubject.findMany({
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.accountingSubject.count()
    ]);

    return {
      data: subjects.map(subject => this.mapToSubjectResponse(subject)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getSubjectTree() {
    const subjects = await prisma.accountingSubject.findMany({
      orderBy: { code: 'asc' },
    });

    // 返回平面列表（不再有父子关系）
    return subjects.map(subject => this.mapToSubjectResponse(subject));
  }

  async getSubjectById(id: string): Promise<SubjectResponse> {
    const subject = await prisma.accountingSubject.findUnique({
      where: { id }
    });

    if (!subject) {
      throw new AppError('会计科目不存在', 404);
    }

    return this.mapToSubjectResponse(subject);
  }

  async createSubject(data: CreateSubjectDto): Promise<SubjectResponse> {
    // 检查编码是否已存在
    const existingSubject = await prisma.accountingSubject.findUnique({
      where: { code: data.code }
    });

    if (existingSubject) {
      throw new AppError('科目编码已存在', 400);
    }

    const subject = await prisma.accountingSubject.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type
      }
    });

    return this.mapToSubjectResponse(subject);
  }

  async updateSubject(id: string, data: UpdateSubjectDto): Promise<SubjectResponse> {
    // 检查科目是否存在
    const existingSubject = await prisma.accountingSubject.findUnique({
      where: { id }
    });

    if (!existingSubject) {
      throw new AppError('会计科目不存在', 404);
    }

    const subject = await prisma.accountingSubject.update({
      where: { id },
      data
    });

    return this.mapToSubjectResponse(subject);
  }

  async deleteSubject(id: string): Promise<void> {
    // 检查科目是否存在
    const existingSubject = await prisma.accountingSubject.findUnique({
      where: { id }
    });

    if (!existingSubject) {
      throw new AppError('会计科目不存在', 404);
    }

    // 检查是否被凭证使用
    const usedInVouchers = await prisma.voucherItem.findFirst({
      where: { subjectId: id }
    });

    if (usedInVouchers) {
      throw new AppError('该科目已被凭证使用，不能删除', 400);
    }

    await prisma.accountingSubject.delete({
      where: { id }
    });
  }

  private mapToSubjectResponse(subject: any): SubjectResponse {
    return {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      type: subject.type,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString()
    };
  }

  // ========== 客户服务 ==========

  async getCustomers(params: QueryParams): Promise<PaginatedResult<CustomerResponse>> {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.customer.count({ where })
    ]);

    return {
      data: customers.map(customer => this.mapToCustomerResponse(customer)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getCustomerById(id: string): Promise<CustomerResponse> {
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new AppError('客户不存在', 404);
    }

    return this.mapToCustomerResponse(customer);
  }

  async createCustomer(data: CreateCustomerDto): Promise<CustomerResponse> {
    // 检查编码是否已存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { code: data.code }
    });

    if (existingCustomer) {
      throw new AppError('客户编码已存在', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        creditLimit: data.creditLimit || 0
      }
    });

    return this.mapToCustomerResponse(customer);
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<CustomerResponse> {
    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      throw new AppError('客户不存在', 404);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data
    });

    return this.mapToCustomerResponse(customer);
  }

  async deleteCustomer(id: string): Promise<void> {
    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { salesOrders: true, receipts: true }
    });

    if (!existingCustomer) {
      throw new AppError('客户不存在', 404);
    }

    // 检查是否有相关业务数据
    if (existingCustomer.salesOrders.length > 0) {
      throw new AppError('该客户已有销售订单，不能删除', 400);
    }

    await prisma.customer.delete({
      where: { id }
    });
  }

  private mapToCustomerResponse(customer: any): CustomerResponse {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      creditLimit: customer.creditLimit,
      receivableBalance: customer.receivableBalance,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
  }

  // ========== 供应商服务 ==========

  async getSuppliers(params: QueryParams): Promise<PaginatedResult<SupplierResponse>> {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.supplier.count({ where })
    ]);

    return {
      data: suppliers.map(supplier => this.mapToSupplierResponse(supplier)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getSupplierById(id: string): Promise<SupplierResponse> {
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new AppError('供应商不存在', 404);
    }

    return this.mapToSupplierResponse(supplier);
  }

  async createSupplier(data: CreateSupplierDto): Promise<SupplierResponse> {
    // 检查编码是否已存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code: data.code }
    });

    if (existingSupplier) {
      throw new AppError('供应商编码已存在', 400);
    }

    const supplier = await prisma.supplier.create({
      data: {
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address
      }
    });

    return this.mapToSupplierResponse(supplier);
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<SupplierResponse> {
    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      throw new AppError('供应商不存在', 404);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data
    });

    return this.mapToSupplierResponse(supplier);
  }

  async deleteSupplier(id: string): Promise<void> {
    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: { purchaseOrders: true, payments: true, purchaseInvoices: true }
    });

    if (!existingSupplier) {
      throw new AppError('供应商不存在', 404);
    }

    // 检查是否有相关业务数据
    if (existingSupplier.purchaseOrders.length > 0) {
      throw new AppError('该供应商已有采购订单，不能删除', 400);
    }

    await prisma.supplier.delete({
      where: { id }
    });
  }

  private mapToSupplierResponse(supplier: any): SupplierResponse {
    return {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      payableBalance: supplier.payableBalance,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString()
    };
  }

  // ========== 物料服务 ==========

  async getMaterials(params: QueryParams): Promise<PaginatedResult<MaterialResponse>> {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { specification: { contains: search } }
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.material.count({ where })
    ]);

    return {
      data: materials.map(material => this.mapToMaterialResponse(material)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getMaterialById(id: string): Promise<MaterialResponse> {
    const material = await prisma.material.findUnique({
      where: { id }
    });

    if (!material) {
      throw new AppError('物料不存在', 404);
    }

    return this.mapToMaterialResponse(material);
  }

  async createMaterial(data: CreateMaterialDto): Promise<MaterialResponse> {
    // 检查编码是否已存在
    const existingMaterial = await prisma.material.findUnique({
      where: { code: data.code }
    });

    if (existingMaterial) {
      throw new AppError('物料编码已存在', 400);
    }

    const material = await prisma.material.create({
      data: {
        code: data.code,
        name: data.name,
        specification: data.specification,
        unit: data.unit,
        costPrice: data.costPrice || 0,
        salePrice: data.salePrice || 0
      }
    });

    return this.mapToMaterialResponse(material);
  }

  async updateMaterial(id: string, data: UpdateMaterialDto): Promise<MaterialResponse> {
    // 检查物料是否存在
    const existingMaterial = await prisma.material.findUnique({
      where: { id }
    });

    if (!existingMaterial) {
      throw new AppError('物料不存在', 404);
    }

    const material = await prisma.material.update({
      where: { id },
      data
    });

    return this.mapToMaterialResponse(material);
  }

  async deleteMaterial(id: string): Promise<void> {
    // 检查物料是否存在
    const existingMaterial = await prisma.material.findUnique({
      where: { id },
      include: {
        salesOrderItems: true,
        purchaseOrderItems: true,
        inventoryTransactions: true
      }
    });

    if (!existingMaterial) {
      throw new AppError('物料不存在', 404);
    }

    // 检查是否有相关业务数据
    if (existingMaterial.salesOrderItems.length > 0 ||
        existingMaterial.purchaseOrderItems.length > 0) {
      throw new AppError('该物料已有业务数据，不能删除', 400);
    }

    await prisma.material.delete({
      where: { id }
    });
  }

  private mapToMaterialResponse(material: any): MaterialResponse {
    return {
      id: material.id,
      code: material.code,
      name: material.name,
      specification: material.specification,
      unit: material.unit,
      currentStock: material.currentStock,
      costPrice: material.costPrice,
      salePrice: material.salePrice,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString()
    };
  }
}