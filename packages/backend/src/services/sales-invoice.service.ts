import { prisma } from '../lib/prisma';
import {
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
  SalesInvoiceResponse,
  SalesInvoiceStatus
} from '../types/sales-invoice';
import { PaginatedResult, QueryParams } from '../types';
import { AppError } from '../middleware/errorHandler';
import * as voucherService from './voucher.service';

export class SalesInvoiceService {
  // ========== 销售发票服务 ==========

  async getSalesInvoices(params: QueryParams): Promise<PaginatedResult<SalesInvoiceResponse>> {
    const { page = 1, limit = 20, sortBy = 'invoiceDate', sortOrder = 'desc', search } = params;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { order: { orderNo: { contains: search } } },
        { customer: { name: { contains: search } } },
        { customer: { code: { contains: search } } }
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          order: {
            include: {
              customer: true
            }
          },
          receipts: true
        }
      }),
      prisma.salesInvoice.count({ where })
    ]);

    return {
      data: invoices.map(invoice => this.mapToSalesInvoiceResponse(invoice)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getSalesInvoiceById(id: string): Promise<SalesInvoiceResponse> {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        receipts: true
      }
    });

    if (!invoice) {
      throw new AppError('销售发票不存在', 404);
    }

    return this.mapToSalesInvoiceResponse(invoice);
  }

  async createSalesInvoice(data: CreateSalesInvoiceDto): Promise<SalesInvoiceResponse> {
    // 检查销售订单是否存在
    const order = await prisma.salesOrder.findUnique({
      where: { id: data.orderId },
      include: {
        customer: true
      }
    });

    if (!order) {
      throw new AppError('销售订单不存在', 404);
    }

    // 检查是否已存在发票（不能重复开票）
    const existingInvoice = await prisma.salesInvoice.findFirst({
      where: { orderId: data.orderId }
    });

    if (existingInvoice) {
      throw new AppError('该订单已存在发票', 400);
    }

    // 订单确认后即可开票（CONFIRMED、COMPLETED状态可以开票）
    if (order.status !== 'CONFIRMED' && order.status !== 'COMPLETED') {
      throw new AppError('只能对已确认的订单创建发票', 400);
    }

    // 生成发票号
    const invoiceNo = await this.generateInvoiceNo();

    // 计算发票金额（使用订单总金额和税额）
    const amount = order.totalAmount;
    const taxAmount = order.taxAmount;

    // 创建销售发票
    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNo,
        orderId: data.orderId,
        customerId: order.customerId,
        invoiceDate: data.invoiceDate || new Date(),
        amount,
        taxAmount,
        status: 'DRAFT' as SalesInvoiceStatus
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        receipts: true
      }
    });

    return this.mapToSalesInvoiceResponse(invoice);
  }

  async updateSalesInvoice(id: string, data: UpdateSalesInvoiceDto): Promise<SalesInvoiceResponse> {
    // 检查发票是否存在
    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      throw new AppError('销售发票不存在', 404);
    }

    // 只能更新草稿状态的发票
    if (existingInvoice.status !== 'DRAFT') {
      throw new AppError('只能修改草稿状态的发票', 400);
    }

    const invoice = await prisma.salesInvoice.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            customer: true
          }
        },
        receipts: true
      }
    });

    return this.mapToSalesInvoiceResponse(invoice);
  }

  async deleteSalesInvoice(id: string): Promise<void> {
    // 检查发票是否存在
    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      throw new AppError('销售发票不存在', 404);
    }

    // 只能删除草稿状态的发票
    if (existingInvoice.status !== 'DRAFT') {
      throw new AppError('只能删除草稿状态的发票', 400);
    }

    await prisma.salesInvoice.delete({
      where: { id }
    });
  }

  async issueInvoice(id: string): Promise<SalesInvoiceResponse> {
    // 检查发票是否存在
    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      throw new AppError('销售发票不存在', 404);
    }

    // 只能开具草稿状态的发票
    if (existingInvoice.status !== 'DRAFT') {
      throw new AppError('只能开具草稿状态的发票', 400);
    }

    const invoice = await prisma.salesInvoice.update({
      where: { id },
      data: {
        status: 'ISSUED'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        receipts: true
      }
    });

    // 自动生成财务凭证
    try {
      await voucherService.generateSalesInvoiceVoucher(id);
    } catch (error) {
      console.error('生成凭证失败:', error);
    }

    return this.mapToSalesInvoiceResponse(invoice);
  }

  async cancelInvoice(id: string): Promise<SalesInvoiceResponse> {
    // 检查发票是否存在
    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      throw new AppError('销售发票不存在', 404);
    }

    // 只能取消草稿或已开具状态的发票
    if (existingInvoice.status === 'PAID') {
      throw new AppError('已付款的发票不能取消', 400);
    }

    const invoice = await prisma.salesInvoice.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        receipts: true
      }
    });

    return this.mapToSalesInvoiceResponse(invoice);
  }

  // 生成发票号: INV-YYYYMMDD-0001
  private async generateInvoiceNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INV-${dateStr}-`;

    const lastInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoiceNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoiceNo: 'desc'
      }
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNo.slice(-4));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private mapToSalesInvoiceResponse(invoice: any): SalesInvoiceResponse {
    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      orderId: invoice.orderId,
      orderNo: invoice.order.orderNo,
      customerId: invoice.customerId,
      customerCode: invoice.order.customer.code,
      customerName: invoice.order.customer.name,
      invoiceDate: invoice.invoiceDate.toISOString(),
      amount: invoice.amount,
      taxAmount: invoice.taxAmount,
      status: invoice.status as SalesInvoiceStatus,
      receipts: invoice.receipts.map((receipt: any) => ({
        id: receipt.id,
        receiptNo: receipt.receiptNo,
        receiptDate: receipt.receiptDate.toISOString(),
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        status: receipt.status
      })),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString()
    };
  }
}