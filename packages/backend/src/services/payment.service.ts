import { prisma } from '../lib/prisma';
import {
  PaymentResponse,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentStatus,
} from '../types/payment';
import * as voucherService from './voucher.service';

// 生成付款单编号: PAY-YYYYMMDD-0001
async function generatePaymentNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.payment.count({
    where: {
      paymentNo: {
        startsWith: `PAY-${dateStr}`,
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `PAY-${dateStr}-${seq}`;
}

// 获取付款单列表
export async function getPayments(params: {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: PaymentStatus;
  search?: string;
}): Promise<{ data: PaymentResponse[]; pagination: any }> {
  const { page = 1, limit = 10, supplierId, status, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (supplierId) {
    where.supplierId = supplierId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { paymentNo: { contains: search } },
      { supplier: { name: { contains: search } } },
      { supplier: { code: { contains: search } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        invoice: true,
        voucher: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  const data = payments.map((payment): PaymentResponse => ({
    id: payment.id,
    paymentNo: payment.paymentNo,
    supplierId: payment.supplierId,
    supplierCode: payment.supplier.code,
    supplierName: payment.supplier.name,
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice?.invoiceNo || null,
    paymentDate: payment.paymentDate.toISOString(),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod as any,
    status: payment.status as PaymentStatus,
    voucherId: payment.voucherId,
    voucherNo: payment.voucher?.voucherNo || null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  }));

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

// 获取付款单详情
export async function getPaymentById(id: string): Promise<PaymentResponse | null> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      supplier: true,
      invoice: true,
      voucher: true,
    },
  });

  if (!payment) return null;

  return {
    id: payment.id,
    paymentNo: payment.paymentNo,
    supplierId: payment.supplierId,
    supplierCode: payment.supplier.code,
    supplierName: payment.supplier.name,
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice?.invoiceNo || null,
    paymentDate: payment.paymentDate.toISOString(),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod as any,
    status: payment.status as PaymentStatus,
    voucherId: payment.voucherId,
    voucherNo: payment.voucher?.voucherNo || null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

// 创建付款单
export async function createPayment(data: CreatePaymentDto): Promise<PaymentResponse> {
  const { supplierId, invoiceId, paymentDate, amount, paymentMethod } = data;

  const payment = await prisma.$transaction(async (tx) => {
    // 如果没有传入发票ID，自动查找该供应商的未付发票（状态为ISSUED）
    let resolvedInvoiceId = invoiceId;
    if (!invoiceId) {
      const unpaidInvoice = await tx.purchaseInvoice.findFirst({
        where: {
          supplierId,
          status: 'ISSUED', // 只查找已开票未付款的发票
        },
        orderBy: { invoiceDate: 'asc' },
      });
      if (unpaidInvoice) {
        resolvedInvoiceId = unpaidInvoice.id;
      }
    }

    // 如果有关联发票，检查发票金额
    if (resolvedInvoiceId) {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: resolvedInvoiceId },
      });

      if (!invoice) {
        throw new Error('采购发票不存在');
      }

      // 计算已付款金额
      const paidAmount = await tx.payment.aggregate({
        where: {
          invoiceId: resolvedInvoiceId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      });

      const remainingAmount = invoice.amount - (paidAmount._sum.amount || 0);

      if (amount > remainingAmount) {
        throw new Error(`付款金额不能超过发票剩余金额 ${remainingAmount.toFixed(2)}`);
      }
    }

    const paymentNo = await generatePaymentNo();

    return tx.payment.create({
      data: {
        paymentNo,
        supplierId,
        invoiceId: resolvedInvoiceId,
        paymentDate: paymentDate || new Date(),
        amount,
        paymentMethod,
        status: 'PENDING',
      },
      include: {
        supplier: true,
        invoice: true,
        voucher: true,
      },
    });
  });

  return {
    id: payment.id,
    paymentNo: payment.paymentNo,
    supplierId: payment.supplierId,
    supplierCode: payment.supplier.code,
    supplierName: payment.supplier.name,
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice?.invoiceNo || null,
    paymentDate: payment.paymentDate.toISOString(),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod as any,
    status: payment.status as PaymentStatus,
    voucherId: payment.voucherId,
    voucherNo: payment.voucher?.voucherNo || null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

// 更新付款单
export async function updatePayment(
  id: string,
  data: UpdatePaymentDto
): Promise<PaymentResponse> {
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: data.status,
    },
    include: {
      supplier: true,
      invoice: true,
      voucher: true,
    },
  });

  return {
    id: payment.id,
    paymentNo: payment.paymentNo,
    supplierId: payment.supplierId,
    supplierCode: payment.supplier.code,
    supplierName: payment.supplier.name,
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice?.invoiceNo || null,
    paymentDate: payment.paymentDate.toISOString(),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod as any,
    status: payment.status as PaymentStatus,
    voucherId: payment.voucherId,
    voucherNo: payment.voucher?.voucherNo || null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

// 删除付款单（只能删除待付款状态）
export async function deletePayment(id: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new Error('付款单不存在');
  }

  if (payment.status !== 'PENDING') {
    throw new Error('只能删除待付款状态的付款单');
  }

  await prisma.payment.delete({
    where: { id },
  });
}

// 确认付款
export async function confirmPayment(id: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      supplier: true,
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error('付款单不存在');
  }

  if (payment.status !== 'PENDING') {
    throw new Error('只能确认待付款状态的付款单');
  }

  // 使用事务更新供应商应付款和发票状态
  await prisma.$transaction(async (tx) => {
    // 更新付款单状态
    await tx.payment.update({
      where: { id },
      data: { status: 'PAID' },
    });

    // 更新供应商应付款
    await tx.supplier.update({
      where: { id: payment.supplierId },
      data: {
        payableBalance: {
          decrement: payment.amount,
        },
      },
    });

    // 如果有关联发票，检查是否已全部付款
    if (payment.invoiceId) {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (invoice) {
        const paidAmount = await tx.payment.aggregate({
          where: {
            invoiceId: payment.invoiceId,
            status: 'PAID',
          },
          _sum: {
            amount: true,
          },
        });

        // 当已付金额 >= 发票不含税金额时，更新为 PAID 状态
        // 进项税额通过税务系统认证抵扣，不需要通过付款处理
        if (paidAmount._sum.amount && paidAmount._sum.amount >= invoice.amount) {
          // 发票已全部付款（不含税金额）
          await tx.purchaseInvoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'PAID' },
          });
        }
      }
    }
  });

  const updated = await prisma.payment.findUnique({
    where: { id },
    include: {
      supplier: true,
      invoice: true,
    },
  });

  // 自动生成财务凭证
  let voucherId: string | null = null;
  try {
    const voucher = await voucherService.generatePaymentVoucher(id, updated!.paymentMethod);
    voucherId = voucher?.id || null;
    // 关联凭证到付款单
    if (voucherId) {
      await prisma.payment.update({
        where: { id },
        data: { voucherId }
      });
    }
  } catch (error) {
    console.error('生成凭证失败:', error);
  }

  // 重新查询以获取凭证信息
  const finalPayment = await prisma.payment.findUnique({
    where: { id },
    include: {
      supplier: true,
      invoice: true,
      voucher: true
    }
  });

  return {
    id: finalPayment!.id,
    paymentNo: finalPayment!.paymentNo,
    supplierId: finalPayment!.supplierId,
    supplierCode: finalPayment!.supplier.code,
    supplierName: finalPayment!.supplier.name,
    invoiceId: finalPayment!.invoiceId,
    invoiceNo: finalPayment!.invoice?.invoiceNo || null,
    paymentDate: finalPayment!.paymentDate.toISOString(),
    amount: finalPayment!.amount,
    paymentMethod: finalPayment!.paymentMethod as any,
    status: finalPayment!.status as PaymentStatus,
    voucherId: finalPayment!.voucherId,
    voucherNo: finalPayment!.voucher?.voucherNo || null,
    createdAt: finalPayment!.createdAt.toISOString(),
    updatedAt: finalPayment!.updatedAt.toISOString(),
  };
}

// 取消付款
export async function cancelPayment(id: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new Error('付款单不存在');
  }

  if (payment.status !== 'PENDING') {
    throw new Error('只能取消待付款状态的付款单');
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      supplier: true,
      invoice: true,
      voucher: true,
    },
  });

  return {
    id: updated.id,
    paymentNo: updated.paymentNo,
    supplierId: updated.supplierId,
    supplierCode: updated.supplier.code,
    supplierName: updated.supplier.name,
    invoiceId: updated.invoiceId,
    invoiceNo: updated.invoice?.invoiceNo || null,
    paymentDate: updated.paymentDate.toISOString(),
    amount: updated.amount,
    paymentMethod: updated.paymentMethod as any,
    status: updated.status as PaymentStatus,
    voucherId: updated.voucherId,
    voucherNo: updated.voucher?.voucherNo || null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// 获取可付款的发票列表
export async function getInvoicesForPayment(): Promise<any[]> {
  const invoices = await prisma.purchaseInvoice.findMany({
    where: {
      status: 'ISSUED',
    },
    include: {
      supplier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = await Promise.all(
    invoices.map(async (invoice) => {
      const paidAmount = await prisma.payment.aggregate({
        where: {
          invoiceId: invoice.id,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      });

      const paid = paidAmount._sum.amount || 0;
      const remaining = invoice.amount - paid;

      return {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        supplierId: invoice.supplierId,
        supplierCode: invoice.supplier.code,
        supplierName: invoice.supplier.name,
        invoiceDate: invoice.invoiceDate.toISOString(),
        amount: invoice.amount,
        taxAmount: invoice.taxAmount,
        paidAmount: paid,
        remainingAmount: remaining,
      };
    })
  );

  return result.filter((item) => item.remainingAmount > 0);
}
