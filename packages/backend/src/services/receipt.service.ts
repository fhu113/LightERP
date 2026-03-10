import { prisma } from '../lib/prisma';
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptResponse,
  ReceiptStatus,
  PaymentMethod
} from '../types/receipt';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';
import * as voucherService from './voucher.service';

export class ReceiptService {
  // ========== 收款单服务 ==========

  async getReceipts(params: QueryParams): Promise<PaginatedResult<ReceiptResponse>> {
    const { page = 1, limit = 20, sortBy = 'receiptDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { code: { contains: search } } },
        { invoice: { invoiceNo: { contains: search } } }
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: true,
          invoice: true
        }
      }),
      prisma.receipt.count({ where })
    ]);

    return {
      data: receipts.map(receipt => this.mapToReceiptResponse(receipt)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getReceiptById(id: string): Promise<ReceiptResponse> {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true
      }
    });

    if (!receipt) {
      throw new AppError('收款单不存在', 404);
    }

    return this.mapToReceiptResponse(receipt);
  }

  async createReceipt(data: CreateReceiptDto): Promise<ReceiptResponse> {
    // 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      throw new AppError('客户不存在', 404);
    }

    // 如果有发票ID，检查发票是否存在且有效
    let invoice = null;
    if (data.invoiceId) {
      invoice = await prisma.salesInvoice.findUnique({
        where: { id: data.invoiceId }
      });

      if (!invoice) {
        throw new AppError('销售发票不存在', 404);
      }

      // 检查发票是否为该客户的
      if (invoice.customerId !== data.customerId) {
        throw new AppError('发票不属于该客户', 400);
      }

      // 检查发票状态是否允许收款
      if (invoice.status !== 'ISSUED' && invoice.status !== 'PAID') {
        throw new AppError('只能对已开具或部分付款的发票进行收款', 400);
      }

      // 计算发票已收款金额
      const paidAmount = await prisma.receipt.aggregate({
        where: {
          invoiceId: data.invoiceId,
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      });

      const totalPaid = paidAmount._sum.amount || 0;
      const remainingAmount = invoice.amount - totalPaid;

      // 检查收款金额是否超过发票未付金额
      if (data.amount > remainingAmount) {
        throw new AppError(`收款金额超过发票未付金额，剩余金额: ¥${remainingAmount.toFixed(2)}`, 400);
      }
    }

    // 生成收款单号
    const receiptNo = await this.generateReceiptNo();

    // 创建收款单
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        receiptDate: data.receiptDate || new Date(),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'PENDING' as ReceiptStatus
      },
      include: {
        customer: true,
        invoice: true
      }
    });

    return this.mapToReceiptResponse(receipt);
  }

  async updateReceipt(id: string, data: UpdateReceiptDto): Promise<ReceiptResponse> {
    // 检查收款单是否存在
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('收款单不存在', 404);
    }

    // 只能更新待处理状态的收款单
    if (existingReceipt.status !== 'PENDING') {
      throw new AppError('只能修改待处理状态的收款单', 400);
    }

    // 如果有金额变更，需要检查发票未付金额
    if (data.amount !== undefined && existingReceipt.invoiceId) {
      const invoice = await prisma.salesInvoice.findUnique({
        where: { id: existingReceipt.invoiceId }
      });

      if (invoice) {
        // 计算发票其他已收款金额（排除当前收款单）
        const otherPaidAmount = await prisma.receipt.aggregate({
          where: {
            invoiceId: existingReceipt.invoiceId,
            status: 'PAID',
            NOT: { id: existingReceipt.id }
          },
          _sum: {
            amount: true
          }
        });

        const totalOtherPaid = otherPaidAmount._sum.amount || 0;
        const remainingAmount = invoice.amount - totalOtherPaid;

        if (data.amount > remainingAmount) {
          throw new AppError(`收款金额超过发票未付金额，剩余金额: ¥${remainingAmount.toFixed(2)}`, 400);
        }
      }
    }

    const receipt = await prisma.receipt.update({
      where: { id },
      data,
      include: {
        customer: true,
        invoice: true
      }
    });

    return this.mapToReceiptResponse(receipt);
  }

  async deleteReceipt(id: string): Promise<void> {
    // 检查收款单是否存在
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('收款单不存在', 404);
    }

    // 只能删除待处理状态的收款单
    if (existingReceipt.status !== 'PENDING') {
      throw new AppError('只能删除待处理状态的收款单', 400);
    }

    await prisma.receipt.delete({
      where: { id }
    });
  }

  async confirmReceipt(id: string): Promise<ReceiptResponse> {
    // 检查收款单是否存在
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('收款单不存在', 404);
    }

    // 只能确认待处理状态的收款单
    if (existingReceipt.status !== 'PENDING') {
      throw new AppError('只能确认待处理状态的收款单', 400);
    }

    // 开始事务：更新收款单状态，更新客户应收款，更新发票状态
    const receipt = await prisma.$transaction(async (prisma) => {
      // 1. 更新收款单状态
      const updatedReceipt = await prisma.receipt.update({
        where: { id },
        data: { status: 'PAID' },
        include: {
          customer: true,
          invoice: true
        }
      });

      // 2. 更新客户应收款余额
      await prisma.customer.update({
        where: { id: updatedReceipt.customerId },
        data: {
          receivableBalance: {
            decrement: updatedReceipt.amount
          }
        }
      });

      // 3. 如果有发票，检查发票是否已全部收款，更新发票状态
      if (updatedReceipt.invoiceId) {
        const invoice = await prisma.salesInvoice.findUnique({
          where: { id: updatedReceipt.invoiceId },
          include: {
            receipts: {
              where: { status: 'PAID' }
            }
          }
        });

        if (invoice) {
          const totalPaid = invoice.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

          if (totalPaid >= invoice.amount) {
            // 发票已全部收款，更新状态为已付款
            await prisma.salesInvoice.update({
              where: { id: updatedReceipt.invoiceId },
              data: { status: 'PAID' }
            });
          } else if (invoice.status === 'ISSUED' && totalPaid > 0) {
            // 发票已部分收款，保持已开具状态（部分付款）
            // 如果需要部分付款状态，可以添加 'PARTIALLY_PAID' 状态
          }
        }
      }

      return updatedReceipt;
    });

    // 自动生成财务凭证
    try {
      await voucherService.generateReceiptVoucher(id, receipt.paymentMethod);
    } catch (error) {
      console.error('生成凭证失败:', error);
    }

    return this.mapToReceiptResponse(receipt);
  }

  async cancelReceipt(id: string): Promise<ReceiptResponse> {
    // 检查收款单是否存在
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) {
      throw new AppError('收款单不存在', 404);
    }

    // 只能取消待处理状态的收款单
    if (existingReceipt.status !== 'PENDING') {
      throw new AppError('只能取消待处理状态的收款单', 400);
    }

    const receipt = await prisma.receipt.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        invoice: true
      }
    });

    return this.mapToReceiptResponse(receipt);
  }

  // 生成收款单号: RC-YYYYMMDD-0001
  private async generateReceiptNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RC-${dateStr}-`;

    const lastReceipt = await prisma.receipt.findFirst({
      where: {
        receiptNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        receiptNo: 'desc'
      }
    });

    let sequence = 1;
    if (lastReceipt) {
      const lastSeq = parseInt(lastReceipt.receiptNo.slice(-4));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private mapToReceiptResponse(receipt: any): ReceiptResponse {
    return {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      customerId: receipt.customerId,
      customerCode: receipt.customer.code,
      customerName: receipt.customer.name,
      invoiceId: receipt.invoiceId,
      invoiceNo: receipt.invoice?.invoiceNo || null,
      receiptDate: receipt.receiptDate.toISOString(),
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod as PaymentMethod,
      status: receipt.status as ReceiptStatus,
      createdAt: receipt.createdAt.toISOString()
    };
  }
}