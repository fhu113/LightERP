import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

type TransactionClient = Prisma.TransactionClient | PrismaClient;
import { AppError } from '../middleware/errorHandler';
import {
  VoucherResponse,
  VoucherStatus,
  VoucherType,
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../types/voucher';
import { PaginatedResult, QueryParams } from '../types';
import { getSubjectIdFromConfig, isAutoGenerateVoucherEnabled, isAutoPostEnabled, CONFIG_KEYS } from './system-config.service';

// 生成凭证编号: V-YYYYMMDD-0001
async function generateVoucherNo(tx: TransactionClient = prisma): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await tx.voucher.count({
    where: {
      voucherNo: {
        startsWith: `V-${dateStr}`,
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `V-${dateStr}-${seq}`;
}

// 获取凭证列表
export async function getVouchers(params: QueryParams): Promise<PaginatedResult<VoucherResponse>> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const { search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { voucherNo: { contains: search } },
      { summary: { contains: search } },
    ];
  }

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            subject: true,
          },
        },
      },
    }),
    prisma.voucher.count({ where }),
  ]);

  const data = vouchers.map((voucher): VoucherResponse => {
    const totalDebit = voucher.items.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredit = voucher.items.reduce((sum, item) => sum + item.creditAmount, 0);
    return {
      id: voucher.id,
      voucherNo: voucher.voucherNo,
      voucherDate: voucher.voucherDate.toISOString(),
      voucherType: voucher.voucherType as VoucherType,
      summary: voucher.summary,
      status: voucher.status as VoucherStatus,
      totalDebit,
      totalCredit,
      items: voucher.items.map((item): any => ({
        id: item.id,
        subjectId: item.subjectId,
        subjectCode: item.subject.code,
        subjectName: item.subject.name,
        debitAmount: item.debitAmount,
        creditAmount: item.creditAmount,
        description: item.description,
      })),
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 获取凭证详情
export async function getVoucherById(id: string): Promise<VoucherResponse | null> {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!voucher) return null;

  const totalDebit = voucher.items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = voucher.items.reduce((sum, item) => sum + item.creditAmount, 0);

  return {
    id: voucher.id,
    voucherNo: voucher.voucherNo,
    voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType as VoucherType,
    summary: voucher.summary,
    status: voucher.status as VoucherStatus,
    totalDebit,
    totalCredit,
    items: voucher.items.map((item): any => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectCode: item.subject.code,
      subjectName: item.subject.name,
      debitAmount: item.debitAmount,
      creditAmount: item.creditAmount,
      description: item.description,
    })),
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}

// 创建凭证
export async function createVoucher(data: CreateVoucherDto, tx: TransactionClient = prisma): Promise<VoucherResponse> {
  // 验证借贷平衡
  const totalDebit = data.items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = data.items.reduce((sum, item) => sum + item.creditAmount, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('借贷金额不平衡', 400);
  }

  // 处理日期格式（支持字符串或Date）
  let voucherDate: Date;
  if (typeof data.voucherDate === 'string') {
    voucherDate = new Date(data.voucherDate);
  } else {
    voucherDate = data.voucherDate || new Date();
  }

  const voucher = await tx.voucher.create({
    data: {
      voucherNo: await generateVoucherNo(tx),
      voucherDate,
      voucherType: data.voucherType || 'GENERAL',
      summary: data.summary,
      items: {
        create: data.items.map((item) => ({
          subjectId: item.subjectId,
          debitAmount: item.debitAmount,
          creditAmount: item.creditAmount,
          description: item.description,
        })),
      },
    },
    include: {
      items: {
        include: {
          subject: true,
        },
      },
    },
  });

  return {
    id: voucher.id,
    voucherNo: voucher.voucherNo,
    voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType as VoucherType,
    summary: voucher.summary,
    status: voucher.status as VoucherStatus,
    totalDebit,
    totalCredit,
    items: voucher.items.map((item): any => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectCode: item.subject.code,
      subjectName: item.subject.name,
      debitAmount: item.debitAmount,
      creditAmount: item.creditAmount,
      description: item.description,
    })),
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}

// 更新凭证
export async function updateVoucher(
  id: string,
  data: UpdateVoucherDto
): Promise<VoucherResponse> {
  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      voucherDate: data.voucherDate,
      voucherType: data.voucherType,
      summary: data.summary,
      status: data.status,
    },
    include: {
      items: {
        include: {
          subject: true,
        },
      },
    },
  });

  const totalDebit = voucher.items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = voucher.items.reduce((sum, item) => sum + item.creditAmount, 0);

  return {
    id: voucher.id,
    voucherNo: voucher.voucherNo,
    voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType as VoucherType,
    summary: voucher.summary,
    status: voucher.status as VoucherStatus,
    totalDebit,
    totalCredit,
    items: voucher.items.map((item): any => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectCode: item.subject.code,
      subjectName: item.subject.name,
      debitAmount: item.debitAmount,
      creditAmount: item.creditAmount,
      description: item.description,
    })),
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}

// 删除凭证（只能删除草稿状态）
export async function deleteVoucher(id: string): Promise<void> {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
  });

  if (!voucher) {
    throw new AppError('凭证不存在', 404);
  }

  if (voucher.status !== 'DRAFT') {
    throw new AppError('只能删除草稿状态的凭证', 400);
  }

  await prisma.voucher.delete({
    where: { id },
  });
}

// 过账凭证
export async function postVoucher(id: string, tx: TransactionClient = prisma): Promise<VoucherResponse> {
  const voucher = await tx.voucher.findUnique({
    where: { id },
  });

  if (!voucher) {
    throw new AppError('凭证不存在', 404);
  }

  if (voucher.status !== 'DRAFT') {
    throw new AppError('只能过账草稿状态的凭证', 400);
  }

  // 验证借贷平衡
  const items = await tx.voucherItem.findMany({
    where: { voucherId: id },
  });

  const totalDebit = items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.creditAmount, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('借贷金额不平衡，无法过账', 400);
  }

  const updated = await tx.voucher.update({
    where: { id },
    data: { status: 'POSTED' },
    include: {
      items: {
        include: {
          subject: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    voucherNo: updated.voucherNo,
    voucherDate: updated.voucherDate.toISOString(),
    voucherType: updated.voucherType as VoucherType,
    summary: updated.summary,
    status: updated.status as VoucherStatus,
    totalDebit,
    totalCredit,
    items: updated.items.map((item): any => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectCode: item.subject.code,
      subjectName: item.subject.name,
      debitAmount: item.debitAmount,
      creditAmount: item.creditAmount,
      description: item.description,
    })),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ============================================
// 凭证自动生成服务
// ============================================

// 获取常用科目ID的辅助函数
async function getSubjectIdByCode(code: string, tx: TransactionClient = prisma): Promise<string | null> {
  const subject = await tx.accountingSubject.findUnique({
    where: { code },
  });
  return subject?.id || null;
}

// 发货确认时生成凭证
// 借：主营业务成本（配置）
// 贷：库存商品（配置）
export async function generateDeliveryVoucher(
  deliveryId: string,
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    console.log('自动生成凭证未启用');
    return null;
  }

  const delivery = await tx.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: {
        include: {
          items: {
            include: {
              material: true
            }
          }
        }
      }
    },
  });

  if (!delivery) {
    throw new AppError('发货单不存在', 404);
  }

  // 获取配置科目ID
  const costSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_DELIVERY_COST_SUBJECT_ID, tx);
  const inventorySubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_DELIVERY_INVENTORY_SUBJECT_ID, tx);

  if (!costSubjectId || !inventorySubjectId) {
    console.warn('发货凭证科目未配置，跳过生成凭证');
    return null;
  }

  // 计算总成本（使用移动加权平均成本）
  let totalCost = 0;
  for (const item of delivery.order.items) {
    const material = item.material;
    const costPrice = material.costPrice || 0;
    totalCost += costPrice * item.quantity;
  }

  if (totalCost <= 0) {
    console.warn('成本为0，跳过生成凭证');
    return null;
  }

  const summary = `发货单 ${delivery.deliveryNo} - 成本结转`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: costSubjectId,
        debitAmount: totalCost,
        creditAmount: 0,
        description: '借：主营业务成本',
      },
      {
        subjectId: inventorySubjectId,
        debitAmount: 0,
        creditAmount: totalCost,
        description: '贷：库存商品',
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPost = await isAutoPostEnabled(CONFIG_KEYS.OTC_DELIVERY_AUTO_POST, tx);
  if (isAutoPost && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 销售发票确认时生成凭证
// 借：应收账款（客户） 金额+税额
// 贷：主营业务收入 金额
// 贷：应交税费-销项税额 税额
export async function generateSalesInvoiceVoucher(
  invoiceId: string,
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    console.log('自动生成凭证未启用');
    return null;
  }

  const invoice = await tx.salesInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!invoice) {
    throw new AppError('销售发票不存在', 404);
  }

  // 获取配置科目ID
  const receivableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_INVOICE_RECEIVABLE_SUBJECT_ID, tx);
  const revenueSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_INVOICE_REVENUE_SUBJECT_ID, tx);
  const taxSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_INVOICE_TAX_SUBJECT_ID, tx);

  if (!receivableSubjectId || !revenueSubjectId || !taxSubjectId) {
    console.warn('销售发票凭证科目未完整配置，跳过生成凭证');
    return null;
  }

  const amount = invoice.amount; // 不含税金额
  const taxAmount = invoice.taxAmount; // 税额
  const totalAmount = amount + taxAmount; // 含税金额
  const customerName = invoice.customer?.name || '客户';

  const summary = `销售发票 ${invoice.invoiceNo} - ${customerName}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: receivableSubjectId,
        debitAmount: totalAmount,
        creditAmount: 0,
        description: `借：应收账款 ${customerName}`,
      },
      {
        subjectId: revenueSubjectId,
        debitAmount: 0,
        creditAmount: amount,
        description: '贷：主营业务收入',
      },
      {
        subjectId: taxSubjectId,
        debitAmount: 0,
        creditAmount: taxAmount,
        description: '贷：应交税费-销项税额',
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPostInvoice = await isAutoPostEnabled(CONFIG_KEYS.OTC_INVOICE_AUTO_POST, tx);
  if (isAutoPostInvoice && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 采购发票确认时生成凭证
// 借：库存商品 金额
// 借：应交税费-进项税额 税额
// 贷：应付账款（供应商） 金额+税额
export async function generatePurchaseInvoiceVoucher(
  invoiceId: string,
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  const invoice = await tx.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    throw new AppError('采购发票不存在', 404);
  }

  // 获取配置科目ID
  const estimatedPayableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.PTP_INVOICE_ESTIMATED_PAYABLE_SUBJECT_ID, tx);
  const taxPayableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.PTP_INVOICE_TAX_PAYABLE_SUBJECT_ID, tx);
  const payableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.PTP_INVOICE_PAYABLE_SUBJECT_ID, tx);

  if (!estimatedPayableSubjectId || !taxPayableSubjectId || !payableSubjectId) {
    console.warn('采购发票凭证科目未配置，跳过生成凭证');
    return null;
  }

  const amount = invoice.amount; // 不含税金额
  const taxAmount = invoice.taxAmount; // 税额
  const totalAmount = amount + taxAmount; // 含税金额
  const supplierName = invoice.supplier?.name || '供应商';

  const summary = `采购发票 ${invoice.invoiceNo} - ${supplierName}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: estimatedPayableSubjectId,
        debitAmount: amount,
        creditAmount: 0,
        description: '借：应付暂估',
      },
      {
        subjectId: taxPayableSubjectId,
        debitAmount: taxAmount,
        creditAmount: 0,
        description: '借：应付账款-进项税',
      },
      {
        subjectId: payableSubjectId,
        debitAmount: 0,
        creditAmount: totalAmount,
        description: `贷：应付账款 ${supplierName}`,
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPostPurchaseInvoice = await isAutoPostEnabled(CONFIG_KEYS.PTP_INVOICE_AUTO_POST, tx);
  if (isAutoPostPurchaseInvoice && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 收款确认时生成凭证
// 借：银行存款/库存现金
// 贷：应收账款（客户）
export async function generateReceiptVoucher(
  receiptId: string,
  paymentMethod: string = 'BANK_TRANSFER',
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    console.log('自动生成凭证未启用');
    return null;
  }

  const receipt = await tx.receipt.findUnique({
    where: { id: receiptId },
    include: {
      customer: true,
      invoice: true,
    },
  });

  if (!receipt) {
    throw new AppError('收款单不存在', 404);
  }

  const receivableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_RECEIPT_RECEIVABLE_SUBJECT_ID, tx);
  const cashSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_RECEIPT_CASH_SUBJECT_ID, tx);

  if (!receivableSubjectId || !cashSubjectId) {
    console.warn('收款单凭证科目未完整配置，跳过生成凭证');
    return null;
  }

  const amount = receipt.amount;
  const customerName = receipt.customer?.name || '客户';
  const paymentMethodText = paymentMethod === 'CASH' ? '库存现金' : '银行存款';

  const summary = `收款单 ${receipt.receiptNo} - ${customerName}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: cashSubjectId,
        debitAmount: amount,
        creditAmount: 0,
        description: `借：${paymentMethodText}`,
      },
      {
        subjectId: receivableSubjectId,
        debitAmount: 0,
        creditAmount: amount,
        description: `贷：应收账款 ${customerName}`,
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPostReceipt = await isAutoPostEnabled(CONFIG_KEYS.OTC_RECEIPT_AUTO_POST, tx);
  if (isAutoPostReceipt && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 付款确认时生成凭证
// 借：应付账款（供应商）
// 贷：银行存款/库存现金
export async function generatePaymentVoucher(
  paymentId: string,
  paymentMethod: string = 'BANK_TRANSFER',
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: {
      supplier: true,
      invoice: true,
    },
  });

  if (!payment) {
    throw new AppError('付款单不存在', 404);
  }

  // 根据付款方式选择科目
  const cashSubjectId = await getSubjectIdByCode('10010010', tx); // 库存现金
  const bankSubjectId = await getSubjectIdByCode('1002', tx); // 银行存款
  const payableSubjectId = await getSubjectIdByCode('2202', tx); // 应付账款

  if (!cashSubjectId || !bankSubjectId || !payableSubjectId) {
    console.warn('部分科目不存在，跳过生成凭证');
    return null;
  }

  const amount = payment.amount;
  const supplierName = payment.supplier?.name || '供应商';
  const paymentMethodText = paymentMethod === 'CASH' ? '库存现金' : '银行存款';

  const summary = `付款单 ${payment.paymentNo} - ${supplierName}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: payableSubjectId,
        debitAmount: amount,
        creditAmount: 0,
        description: `借：应付账款 ${supplierName}`,
      },
      {
        subjectId: paymentMethod === 'CASH' ? cashSubjectId : bankSubjectId,
        debitAmount: 0,
        creditAmount: amount,
        description: `贷：${paymentMethodText}`,
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPostPayment = await isAutoPostEnabled(CONFIG_KEYS.PTP_PAYMENT_AUTO_POST, tx);
  if (isAutoPostPayment && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 采购收货确认时生成凭证
// 借：库存商品 金额
// 贷：应付暂估 金额
export async function generatePurchaseReceiptVoucher(
  receiptId: string,
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    console.log('自动生成凭证未启用');
    return null;
  }

  const receipt = await tx.purchaseReceipt.findUnique({
    where: { id: receiptId },
    include: {
      order: {
        include: {
          supplier: true
        }
      },
      items: {
        include: {
          orderItem: {
            include: {
              material: true
            }
          }
        }
      }
    }
  });

  if (!receipt) {
    throw new AppError('采购收货单不存在', 404);
  }

  // 获取配置科目ID
  const inventorySubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.PTP_RECEIPT_INVENTORY_SUBJECT_ID, tx);
  const estimatedPayableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.PTP_RECEIPT_ESTIMATED_PAYABLE_SUBJECT_ID, tx);

  if (!inventorySubjectId || !estimatedPayableSubjectId) {
    console.warn('采购收货凭证科目未配置，跳过生成凭证');
    return null;
  }

  // 计算总金额（不含税）
  let totalAmount = 0;
  for (const item of receipt.items) {
    totalAmount += (item.orderItem.unitPrice || 0) * item.quantity;
  }

  if (totalAmount <= 0) {
    console.warn('金额为0，跳过生成凭证');
    return null;
  }

  const supplierName = receipt.order?.supplier?.name || '供应商';
  const summary = `采购收货 ${receipt.receiptNo} - ${supplierName}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: inventorySubjectId,
        debitAmount: totalAmount,
        creditAmount: 0,
        description: '借：库存商品',
      },
      {
        subjectId: estimatedPayableSubjectId,
        debitAmount: 0,
        creditAmount: totalAmount,
        description: `贷：应付暂估 ${supplierName}`,
      },
    ],
  }, tx);

  // 检查是否需要自动过账
  const isAutoPost = await isAutoPostEnabled(CONFIG_KEYS.PTP_RECEIPT_AUTO_POST, tx);
  if (isAutoPost && voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 库存调整生成凭证
// 调增：借：库存商品，贷：应付账款
// 调减：借：应付账款，贷：库存商品（暂按同样逻辑）
export async function generateInventoryAdjustmentVoucher(
  materialId: string,
  adjustmentType: 'INCREASE' | 'DECREASE',
  quantity: number,
  unitCost: number,
  referenceNo: string,
  tx: TransactionClient = prisma
): Promise<VoucherResponse | null> {
  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    console.log('自动生成凭证未启用');
    return null;
  }

  const material = await tx.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    throw new Error('物料不存在');
  }

  // 获取配置科目ID
  const inventorySubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.INVENTORY_ADJUSTMENT_INVENTORY_SUBJECT_ID, tx);
  const payableSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.INVENTORY_ADJUSTMENT_PAYABLE_SUBJECT_ID, tx);

  if (!inventorySubjectId || !payableSubjectId) {
    console.warn('库存调整凭证科目未配置，跳过生成凭证');
    return null;
  }

  const amount = quantity * unitCost;
  const adjustmentTypeText = adjustmentType === 'INCREASE' ? '调增' : '调减';
  const summary = `库存调整 ${referenceNo} - ${material.name} - ${adjustmentTypeText}`;

  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary,
    items: [
      {
        subjectId: inventorySubjectId,
        debitAmount: adjustmentType === 'INCREASE' ? amount : 0,
        creditAmount: adjustmentType === 'DECREASE' ? amount : 0,
        description: adjustmentType === 'INCREASE' ? '借：库存商品' : '贷：库存商品',
      },
      {
        subjectId: payableSubjectId,
        debitAmount: adjustmentType === 'DECREASE' ? amount : 0,
        creditAmount: adjustmentType === 'INCREASE' ? amount : 0,
        description: adjustmentType === 'INCREASE' ? '贷：应付账款' : '借：应付账款',
      },
    ],
  }, tx);

  // 库存调整默认自动过账
  if (voucher) {
    await postVoucher(voucher.id, tx);
  }

  return voucher;
}

// 获取科目余额
export async function getSubjectBalance(_params?: { periodId?: string }): Promise<any[]> {
  const subjects = await prisma.accountingSubject.findMany({
    orderBy: { code: 'asc' },
  });

  // 获取所有已过账的凭证分录
  const voucherItems = await prisma.voucherItem.findMany({
    where: {
      voucher: {
        status: 'POSTED',
      },
    },
    include: {
      voucher: {
        select: {
          voucherDate: true,
        },
      },
    },
  });

  // 按科目分组汇总
  const balanceMap = new Map<string, any>();

  for (const subject of subjects) {
    balanceMap.set(subject.id, {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      balanceDirection: subject.balanceDirection,
      initialDebit: 0,
      initialCredit: 0,
      currentDebit: 0,
      currentCredit: 0,
      endingDebit: 0,
      endingCredit: 0,
    });
  }

  for (const item of voucherItems) {
    const balance = balanceMap.get(item.subjectId);
    if (balance) {
      balance.currentDebit += item.debitAmount;
      balance.currentCredit += item.creditAmount;
    }
  }

  // 计算期末余额
  for (const [_, balance] of balanceMap) {
    if (balance.balanceDirection === 'DEBIT') {
      balance.endingDebit = balance.initialDebit + balance.currentDebit - balance.currentCredit;
      balance.endingCredit = 0;
      if (balance.endingDebit < 0) {
        balance.endingCredit = -balance.endingDebit;
        balance.endingDebit = 0;
      }
    } else {
      balance.endingCredit = balance.initialCredit + balance.currentCredit - balance.currentDebit;
      balance.endingDebit = 0;
      if (balance.endingCredit < 0) {
        balance.endingDebit = -balance.endingCredit;
        balance.endingCredit = 0;
      }
    }
  }

  return Array.from(balanceMap.values());
}

// 冲销凭证 - 红字冲销法
export async function reverseVoucher(originalVoucherId: string): Promise<VoucherResponse | null> {
  const originalVoucher = await prisma.voucher.findUnique({
    where: { id: originalVoucherId },
    include: {
      items: {
        include: {
          subject: true
        }
      }
    }
  });

  if (!originalVoucher) {
    throw new AppError('原凭证不存在', 404);
  }

  // 已过账的凭证才能冲销
  if (originalVoucher.status !== 'POSTED') {
    throw new AppError('只有已过账的凭证才能冲销', 400);
  }

  // 检查是否已被冲销过
  if (originalVoucher.summary?.includes('(冲销)')) {
    throw new AppError('该凭证已被冲销', 400);
  }

  // 创建冲销凭证（红字凭证）- 借贷方向相反
  const reverseItems = originalVoucher.items.map(item => ({
    subjectId: item.subjectId,
    debitAmount: item.creditAmount, // 借贷反向
    creditAmount: item.debitAmount,
    description: `冲销: ${item.description || ''}`
  }));

  const reverseVoucher = await createVoucher({
    voucherType: 'REVERSAL',
    summary: `${originalVoucher.summary} (冲销)`,
    voucherDate: new Date(),
    items: reverseItems
  });

  // 过账冲销凭证
  await postVoucher(reverseVoucher.id);

  // 返回更新后的凭证（包含POSTED状态）
  return await getVoucherById(reverseVoucher.id);
}
