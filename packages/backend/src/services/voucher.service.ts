import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  VoucherResponse,
  VoucherStatus,
  VoucherType,
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../types/voucher';
import { PaginatedResult, QueryParams } from '../types';

// 生成凭证编号: V-YYYYMMDD-0001
async function generateVoucherNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.voucher.count({
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
export async function createVoucher(data: CreateVoucherDto): Promise<VoucherResponse> {
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

  const voucher = await prisma.voucher.create({
    data: {
      voucherNo: await generateVoucherNo(),
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
export async function postVoucher(id: string): Promise<VoucherResponse> {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
  });

  if (!voucher) {
    throw new AppError('凭证不存在', 404);
  }

  if (voucher.status !== 'DRAFT') {
    throw new AppError('只能过账草稿状态的凭证', 400);
  }

  // 验证借贷平衡
  const items = await prisma.voucherItem.findMany({
    where: { voucherId: id },
  });

  const totalDebit = items.reduce((sum, item) => sum + item.debitAmount, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.creditAmount, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('借贷金额不平衡，无法过账', 400);
  }

  const updated = await prisma.voucher.update({
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
async function getSubjectIdByCode(code: string): Promise<string | null> {
  const subject = await prisma.accountingSubject.findUnique({
    where: { code },
  });
  return subject?.id || null;
}

// 销售发票确认时生成凭证
// 借：应收账款（客户） 金额+税额
// 贷：主营业务收入 金额
// 贷：应交税费-销项税额 税额
export async function generateSalesInvoiceVoucher(
  invoiceId: string
): Promise<VoucherResponse | null> {
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!invoice) {
    throw new AppError('销售发票不存在', 404);
  }

  // 获取科目ID
  const receivableSubjectId = await getSubjectIdByCode('1122'); // 应收账款
  const revenueSubjectId = await getSubjectIdByCode('6001'); // 主营业务收入
  const taxSubjectId = await getSubjectIdByCode('2221'); // 应交税费

  if (!receivableSubjectId || !revenueSubjectId || !taxSubjectId) {
    console.warn('部分科目不存在，跳过生成凭证');
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
  });

  return voucher;
}

// 采购发票确认时生成凭证
// 借：库存商品 金额
// 借：应交税费-进项税额 税额
// 贷：应付账款（供应商） 金额+税额
export async function generatePurchaseInvoiceVoucher(
  invoiceId: string
): Promise<VoucherResponse | null> {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    throw new AppError('采购发票不存在', 404);
  }

  // 获取科目ID
  const inventorySubjectId = await getSubjectIdByCode('1405'); // 库存商品
  const taxSubjectId = await getSubjectIdByCode('2221'); // 应交税费
  const payableSubjectId = await getSubjectIdByCode('2202'); // 应付账款

  if (!inventorySubjectId || !taxSubjectId || !payableSubjectId) {
    console.warn('部分科目不存在，跳过生成凭证');
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
        subjectId: inventorySubjectId,
        debitAmount: amount,
        creditAmount: 0,
        description: '借：库存商品',
      },
      {
        subjectId: taxSubjectId,
        debitAmount: taxAmount,
        creditAmount: 0,
        description: '借：应交税费-进项税额',
      },
      {
        subjectId: payableSubjectId,
        debitAmount: 0,
        creditAmount: totalAmount,
        description: `贷：应付账款 ${supplierName}`,
      },
    ],
  });

  return voucher;
}

// 收款确认时生成凭证
// 借：银行存款/库存现金
// 贷：应收账款（客户）
export async function generateReceiptVoucher(
  receiptId: string,
  paymentMethod: string = 'BANK_TRANSFER'
): Promise<VoucherResponse | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      customer: true,
      invoice: true,
    },
  });

  if (!receipt) {
    throw new AppError('收款单不存在', 404);
  }

  // 根据付款方式选择科目
  const cashSubjectId = await getSubjectIdByCode('10010010'); // 库存现金
  const bankSubjectId = await getSubjectIdByCode('1002'); // 银行存款
  const receivableSubjectId = await getSubjectIdByCode('1122'); // 应收账款

  if (!cashSubjectId || !bankSubjectId || !receivableSubjectId) {
    console.warn('部分科目不存在，跳过生成凭证');
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
        subjectId: paymentMethod === 'CASH' ? cashSubjectId : bankSubjectId,
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
  });

  return voucher;
}

// 付款确认时生成凭证
// 借：应付账款（供应商）
// 贷：银行存款/库存现金
export async function generatePaymentVoucher(
  paymentId: string,
  paymentMethod: string = 'BANK_TRANSFER'
): Promise<VoucherResponse | null> {
  const payment = await prisma.payment.findUnique({
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
  const cashSubjectId = await getSubjectIdByCode('10010010'); // 库存现金
  const bankSubjectId = await getSubjectIdByCode('1002'); // 银行存款
  const payableSubjectId = await getSubjectIdByCode('2202'); // 应付账款

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
  });

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
