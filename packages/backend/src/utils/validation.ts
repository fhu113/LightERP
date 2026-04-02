import Joi from 'joi';

// 会计科目验证
export const createSubjectSchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{4,10}$/).required().messages({
    'string.pattern.base': '科目编码应为4-10位数字',
  }),
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('ASSET', 'LIABILITY', 'EQUITY', 'COST', 'REVENUE', 'EXPENSE').required(),
});

export const updateSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  type: Joi.string().valid('ASSET', 'LIABILITY', 'EQUITY', 'COST', 'REVENUE', 'EXPENSE'),
}).min(1);

// 客户验证
export const createCustomerSchema = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9]{3,20}$/).required(),
  name: Joi.string().min(2).max(100).required(),
  contactPerson: Joi.string().max(50).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/).optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().max(200).optional(),
  creditLimit: Joi.number().min(0).default(0),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  contactPerson: Joi.string().max(50),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/),
  email: Joi.string().email(),
  address: Joi.string().max(200),
  creditLimit: Joi.number().min(0),
}).min(1);

// 供应商验证
export const createSupplierSchema = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9]{3,20}$/).required(),
  name: Joi.string().min(2).max(100).required(),
  contactPerson: Joi.string().max(50).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/).optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().max(200).optional(),
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  contactPerson: Joi.string().max(50),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/),
  email: Joi.string().email(),
  address: Joi.string().max(200),
}).min(1);

// 物料验证
export const createMaterialSchema = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9]{3,20}$/).required(),
  name: Joi.string().min(2).max(100).required(),
  specification: Joi.string().max(200).optional(),
  unit: Joi.string().max(20).required(),
  costPrice: Joi.number().min(0).default(0),
  salePrice: Joi.number().min(0).default(0),
});

export const updateMaterialSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  specification: Joi.string().max(200),
  unit: Joi.string().max(20),
  costPrice: Joi.number().min(0),
  salePrice: Joi.number().min(0),
}).min(1);

// 销售订单验证
export const createSalesOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  orderDate: Joi.date().optional(),
  deliveryDate: Joi.date().optional(),
  items: Joi.array().items(
    Joi.object({
      materialId: Joi.string().required(),
      quantity: Joi.number().min(0.01).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).min(1).required(),
});

export const updateSalesOrderSchema = Joi.object({
  deliveryDate: Joi.date().optional(),
  status: Joi.string().valid('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
}).min(1);

// 通用查询参数验证
export const queryParamsSchema = Joi.object({
  page: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
        const num = Number(value);
        if (isNaN(num)) return helpers.error('any.invalid');
        return num;
      })
    )
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(100),
      Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
        const num = Number(value);
        if (isNaN(num)) return helpers.error('any.invalid');
        return num;
      })
    )
    .default(20),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().allow(''),
});

// 发货单验证
export const createDeliverySchema = Joi.object({
  orderId: Joi.string().required(),
  deliveryDate: Joi.date().optional(),
  warehouseId: Joi.string().optional(),
  shippingInfo: Joi.string().optional(),
  items: Joi.array().items(
    Joi.object({
      orderItemId: Joi.string().required(),
      quantity: Joi.number().min(0.01).required(),
    })
  ).min(1).required(),
});

export const updateDeliverySchema = Joi.object({
  deliveryDate: Joi.date().optional(),
  warehouseId: Joi.string().optional(),
  shippingInfo: Joi.string().optional(),
  status: Joi.string().valid('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
}).min(1);

// 销售发票验证
export const createSalesInvoiceSchema = Joi.object({
  orderId: Joi.string().required(),
  invoiceDate: Joi.date().optional(),
});

export const updateSalesInvoiceSchema = Joi.object({
  invoiceDate: Joi.date().optional(),
  status: Joi.string().valid('DRAFT', 'ISSUED', 'PAID', 'CANCELLED').optional(),
}).min(1);

// 收款单验证
export const createReceiptSchema = Joi.object({
  customerId: Joi.string().required(),
  invoiceId: Joi.string().optional(),
  receiptDate: Joi.date().optional(),
  amount: Joi.number().min(0.01).required(),
  paymentMethod: Joi.string().valid('CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD').required(),
});

export const updateReceiptSchema = Joi.object({
  receiptDate: Joi.date().optional(),
  amount: Joi.number().min(0.01),
  paymentMethod: Joi.string().valid('CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD'),
  status: Joi.string().valid('PENDING', 'PAID', 'CANCELLED'),
}).min(1);

// 采购订单验证
export const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().required(),
  orderDate: Joi.date().optional(),
  expectedDate: Joi.date().optional(),
  items: Joi.array().items(
    Joi.object({
      materialId: Joi.string().required(),
      quantity: Joi.number().min(0.01).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).min(1).required(),
});

export const updatePurchaseOrderSchema = Joi.object({
  expectedDate: Joi.date().optional(),
  status: Joi.string().valid('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
}).min(1);

// 采购收货单验证
export const createPurchaseReceiptSchema = Joi.object({
  orderId: Joi.string().required(),
  receiptDate: Joi.date().optional(),
  warehouseId: Joi.string().optional(),
  items: Joi.array().items(
    Joi.object({
      orderItemId: Joi.string().required(),
      quantity: Joi.number().min(0.01).required(),
    })
  ).min(1).required(),
});

export const updatePurchaseReceiptSchema = Joi.object({
  receiptDate: Joi.date().optional(),
  warehouseId: Joi.string().optional(),
  status: Joi.string().valid('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
}).min(1);