import { prisma } from '../lib/prisma';
import {
  PurchaseInvoiceResponse,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  PurchaseInvoiceStatus,
} from '../types/purchase-invoice';
import * as voucherService from './voucher.service';

// 生成发票编号: PINV-YYYYMMDD-0001
async function generateInvoiceNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.purchaseInvoice.count({
    where: {
      invoiceNo: {
        startsWith: `PINV-${dateStr}`,
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `PINV-${dateStr}-${seq}`;
}

// 获取采购发票列表
export async function getPurchaseInvoices(params: {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: PurchaseInvoiceStatus;
  search?: string;
}): Promise<{ data: PurchaseInvoiceResponse[]; pagination: any }> {
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
      { invoiceNo: { contains: search } },
      { supplier: { name: { contains: search } } },
      { supplier: { code: { contains: search } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        receipt: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  const data = invoices.map((invoice): PurchaseInvoiceResponse => {
    const items = invoice.receipt?.items.map((item): any => ({
      id: item.id,
      receiptItemId: item.id,
      materialId: item.materialId,
      materialCode: item.material.code,
      materialName: item.material.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      amount: item.quantity * (item.unitPrice || 0),
    })) || [];

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      supplierId: invoice.supplierId,
      supplierCode: invoice.supplier.code,
      supplierName: invoice.supplier.name,
      receiptId: invoice.receiptId,
      receiptNo: invoice.receipt?.receiptNo || null,
      invoiceDate: invoice.invoiceDate.toISOString(),
      amount: invoice.amount,
      taxAmount: invoice.taxAmount,
      status: invoice.status as PurchaseInvoiceStatus,
      items,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
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

// 获取采购发票详情
export async function getPurchaseInvoiceById(id: string): Promise<PurchaseInvoiceResponse | null> {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      supplier: true,
      receipt: {
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) return null;

  const items = invoice.receipt?.items.map((item): any => ({
    id: item.id,
    receiptItemId: item.id,
    materialId: item.materialId,
    materialCode: item.material.code,
    materialName: item.material.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice || 0,
    amount: item.quantity * (item.unitPrice || 0),
  })) || [];

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    supplierId: invoice.supplierId,
    supplierCode: invoice.supplier.code,
    supplierName: invoice.supplier.name,
    receiptId: invoice.receiptId,
    receiptNo: invoice.receipt?.receiptNo || null,
    invoiceDate: invoice.invoiceDate.toISOString(),
    amount: invoice.amount,
    taxAmount: invoice.taxAmount,
    status: invoice.status as PurchaseInvoiceStatus,
    items,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

// 创建采购发票
export async function createPurchaseInvoice(data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoiceResponse> {
  const { supplierId, receiptId, invoiceDate, items } = data;

  // 计算金额
  const amount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = amount * 0.13; // 13%增值税

  const invoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo: await generateInvoiceNo(),
      supplierId,
      receiptId,
      invoiceDate: invoiceDate || new Date(),
      amount,
      taxAmount,
      status: 'DRAFT',
    },
    include: {
      supplier: true,
      receipt: {
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      },
    },
  });

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    supplierId: invoice.supplierId,
    supplierCode: invoice.supplier.code,
    supplierName: invoice.supplier.name,
    receiptId: invoice.receiptId,
    receiptNo: invoice.receipt?.receiptNo || null,
    invoiceDate: invoice.invoiceDate.toISOString(),
    amount: invoice.amount,
    taxAmount: invoice.taxAmount,
    status: invoice.status as PurchaseInvoiceStatus,
    items: [],
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

// 更新采购发票
export async function updatePurchaseInvoice(
  id: string,
  data: UpdatePurchaseInvoiceDto
): Promise<PurchaseInvoiceResponse> {
  const invoice = await prisma.purchaseInvoice.update({
    where: { id },
    data: {
      invoiceDate: data.invoiceDate,
      status: data.status,
    },
    include: {
      supplier: true,
      receipt: true,
    },
  });

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    supplierId: invoice.supplierId,
    supplierCode: invoice.supplier.code,
    supplierName: invoice.supplier.name,
    receiptId: invoice.receiptId,
    receiptNo: invoice.receipt?.receiptNo || null,
    invoiceDate: invoice.invoiceDate.toISOString(),
    amount: invoice.amount,
    taxAmount: invoice.taxAmount,
    status: invoice.status as PurchaseInvoiceStatus,
    items: [],
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

// 删除采购发票（只能删除草稿状态）
export async function deletePurchaseInvoice(id: string): Promise<void> {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new Error('采购发票不存在');
  }

  if (invoice.status !== 'DRAFT') {
    throw new Error('只能删除草稿状态的采购发票');
  }

  await prisma.purchaseInvoice.delete({
    where: { id },
  });
}

// 确认采购发票（开票）
export async function confirmPurchaseInvoice(id: string): Promise<PurchaseInvoiceResponse> {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    throw new Error('采购发票不存在');
  }

  if (invoice.status !== 'DRAFT') {
    throw new Error('只能确认草稿状态的采购发票');
  }

  const updated = await prisma.purchaseInvoice.update({
    where: { id },
    data: {
      status: 'ISSUED',
    },
    include: {
      supplier: true,
      receipt: true,
    },
  });

  // 自动生成财务凭证
  try {
    await voucherService.generatePurchaseInvoiceVoucher(id);
  } catch (error) {
    console.error('生成凭证失败:', error);
  }

  return {
    id: updated.id,
    invoiceNo: updated.invoiceNo,
    supplierId: updated.supplierId,
    supplierCode: updated.supplier.code,
    supplierName: updated.supplier.name,
    receiptId: updated.receiptId,
    receiptNo: updated.receipt?.receiptNo || null,
    invoiceDate: updated.invoiceDate.toISOString(),
    amount: updated.amount,
    taxAmount: updated.taxAmount,
    status: updated.status as PurchaseInvoiceStatus,
    items: [],
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// 取消采购发票
export async function cancelPurchaseInvoice(id: string): Promise<PurchaseInvoiceResponse> {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    throw new Error('采购发票不存在');
  }

  if (invoice.status === 'PAID') {
    throw new Error('已付款的发票不能取消');
  }

  const updated = await prisma.purchaseInvoice.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
    include: {
      supplier: true,
      receipt: true,
    },
  });

  return {
    id: updated.id,
    invoiceNo: updated.invoiceNo,
    supplierId: updated.supplierId,
    supplierCode: updated.supplier.code,
    supplierName: updated.supplier.name,
    receiptId: updated.receiptId,
    receiptNo: updated.receipt?.receiptNo || null,
    invoiceDate: updated.invoiceDate.toISOString(),
    amount: updated.amount,
    taxAmount: updated.taxAmount,
    status: updated.status as PurchaseInvoiceStatus,
    items: [],
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// 获取可开票的收货单列表（用于创建采购发票时选择）
export async function getReceiptsForInvoicing(): Promise<any[]> {
  const receipts = await prisma.purchaseReceipt.findMany({
    where: {
      status: 'CONFIRMED',
    },
    include: {
      order: {
        include: {
          supplier: true,
        },
      },
      items: {
        include: {
          material: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return receipts.map(receipt => ({
    id: receipt.id,
    receiptNo: receipt.receiptNo,
    supplierId: receipt.order?.supplierId || '',
    supplierCode: receipt.order?.supplier?.code || '',
    supplierName: receipt.order?.supplier?.name || '',
    orderNo: receipt.order?.orderNo,
    receiptDate: receipt.receiptDate.toISOString(),
    amount: receipt.items.reduce((sum: number, item: any) => sum + item.quantity * (item.unitPrice || 0), 0),
    items: receipt.items.map((item: any) => ({
      id: item.id,
      materialId: item.materialId,
      materialCode: item.material.code,
      materialName: item.material.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      amount: item.quantity * (item.unitPrice || 0),
    })),
  }));
}
