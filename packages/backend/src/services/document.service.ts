import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export type DocumentType = 
  | 'SALES_ORDER' 
  | 'PURCHASE_ORDER' 
  | 'DELIVERY' 
  | 'PURCHASE_RECEIPT' 
  | 'SALES_INVOICE' 
  | 'PURCHASE_INVOICE' 
  | 'RECEIPT' 
  | 'PAYMENT' 
  | 'VOUCHER';

export interface DocumentQueryResult {
  id: string;
  documentNo: string;
  type: DocumentType;
  date: string;
  amount: number;
  status: string;
  partnerName: string;
  relationId?: string;
}

export interface SearchDocumentsParams {
  documentType?: DocumentType;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class DocumentService {
  async searchDocuments(params: SearchDocumentsParams): Promise<DocumentQueryResult[]> {
    const { documentType, keyword, startDate, endDate, limit = 50 } = params;

    const results: DocumentQueryResult[] = [];

    // Define common where clause for dates
    const dateRange: any = {};
    if (startDate) dateRange.gte = new Date(startDate);
    if (endDate) dateRange.lte = new Date(endDate);

    const hasDateRange = Object.keys(dateRange).length > 0;

    // Helper to add to results
    const addToResults = (items: any[], type: DocumentType, mapper: (item: any) => DocumentQueryResult) => {
      results.push(...items.map(mapper));
    };

    // 1. Sales Orders
    if (!documentType || documentType === 'SALES_ORDER') {
      const where: any = {};
      if (hasDateRange) where.orderDate = dateRange;
      if (keyword) {
        where.OR = [
          { orderNo: { contains: keyword } },
          { customer: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.salesOrder.findMany({
        where,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: { customer: true }
      });
      addToResults(items, 'SALES_ORDER', (item) => ({
        id: item.id,
        documentNo: item.orderNo,
        type: 'SALES_ORDER',
        date: item.orderDate.toISOString(),
        amount: item.totalAmount,
        status: item.status,
        partnerName: item.customer.name
      }));
    }

    // 2. Purchase Orders
    if (!documentType || documentType === 'PURCHASE_ORDER') {
      const where: any = {};
      if (hasDateRange) where.orderDate = dateRange;
      if (keyword) {
        where.OR = [
          { orderNo: { contains: keyword } },
          { supplier: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.purchaseOrder.findMany({
        where,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: { supplier: true }
      });
      addToResults(items, 'PURCHASE_ORDER', (item) => ({
        id: item.id,
        documentNo: item.orderNo,
        type: 'PURCHASE_ORDER',
        date: item.orderDate.toISOString(),
        amount: item.totalAmount,
        status: item.status,
        partnerName: item.supplier.name
      }));
    }

    // 3. Deliveries (Sales Delivery)
    if (!documentType || documentType === 'DELIVERY') {
      const where: any = {};
      if (hasDateRange) where.deliveryDate = dateRange;
      if (keyword) {
        where.OR = [
          { deliveryNo: { contains: keyword } },
          { order: { customer: { name: { contains: keyword } } } }
        ];
      }
      const items = await prisma.delivery.findMany({
        where,
        take: limit,
        orderBy: { deliveryDate: 'desc' },
        include: { order: { include: { customer: true } } }
      });
      addToResults(items, 'DELIVERY', (item) => ({
        id: item.id,
        documentNo: item.deliveryNo,
        type: 'DELIVERY',
        date: item.deliveryDate.toISOString(),
        amount: 0, // Delivery doesn't have total amount directly, could calculate from items if needed
        status: item.status,
        partnerName: item.order.customer.name,
        relationId: item.orderId
      }));
    }

    // 4. Purchase Receipts
    if (!documentType || documentType === 'PURCHASE_RECEIPT') {
      const where: any = {};
      if (hasDateRange) where.receiptDate = dateRange;
      if (keyword) {
        where.OR = [
          { receiptNo: { contains: keyword } },
          { order: { supplier: { name: { contains: keyword } } } }
        ];
      }
      const items = await prisma.purchaseReceipt.findMany({
        where,
        take: limit,
        orderBy: { receiptDate: 'desc' },
        include: { order: { include: { supplier: true } } }
      });
      addToResults(items, 'PURCHASE_RECEIPT', (item) => ({
        id: item.id,
        documentNo: item.receiptNo,
        type: 'PURCHASE_RECEIPT',
        date: item.receiptDate.toISOString(),
        amount: 0,
        status: item.status,
        partnerName: item.order.supplier.name,
        relationId: item.orderId
      }));
    }

    // 5. Sales Invoices
    if (!documentType || documentType === 'SALES_INVOICE') {
      const where: any = {};
      if (hasDateRange) where.invoiceDate = dateRange;
      if (keyword) {
        where.OR = [
          { invoiceNo: { contains: keyword } },
          { customer: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.salesInvoice.findMany({
        where,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        include: { customer: true }
      });
      addToResults(items, 'SALES_INVOICE', (item) => ({
        id: item.id,
        documentNo: item.invoiceNo,
        type: 'SALES_INVOICE',
        date: item.invoiceDate.toISOString(),
        amount: item.amount,
        status: item.status,
        partnerName: item.customer.name,
        relationId: item.orderId
      }));
    }

    // 6. Purchase Invoices
    if (!documentType || documentType === 'PURCHASE_INVOICE') {
      const where: any = {};
      if (hasDateRange) where.invoiceDate = dateRange;
      if (keyword) {
        where.OR = [
          { invoiceNo: { contains: keyword } },
          { supplier: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.purchaseInvoice.findMany({
        where,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        include: { supplier: true }
      });
      addToResults(items, 'PURCHASE_INVOICE', (item) => ({
        id: item.id,
        documentNo: item.invoiceNo,
        type: 'PURCHASE_INVOICE',
        date: item.invoiceDate.toISOString(),
        amount: item.amount,
        status: item.status,
        partnerName: item.supplier.name,
        relationId: item.receiptId || undefined
      }));
    }

    // 7. Receipts (Customer Payments)
    if (!documentType || documentType === 'RECEIPT') {
      const where: any = {};
      if (hasDateRange) where.receiptDate = dateRange;
      if (keyword) {
        where.OR = [
          { receiptNo: { contains: keyword } },
          { customer: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.receipt.findMany({
        where,
        take: limit,
        orderBy: { receiptDate: 'desc' },
        include: { customer: true }
      });
      addToResults(items, 'RECEIPT', (item) => ({
        id: item.id,
        documentNo: item.receiptNo,
        type: 'RECEIPT',
        date: item.receiptDate.toISOString(),
        amount: item.amount,
        status: item.status,
        partnerName: item.customer.name,
        relationId: item.invoiceId || undefined
      }));
    }

    // 8. Payments (Supplier Payments)
    if (!documentType || documentType === 'PAYMENT') {
      const where: any = {};
      if (hasDateRange) where.paymentDate = dateRange;
      if (keyword) {
        where.OR = [
          { paymentNo: { contains: keyword } },
          { supplier: { name: { contains: keyword } } }
        ];
      }
      const items = await prisma.payment.findMany({
        where,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: { supplier: true }
      });
      addToResults(items, 'PAYMENT', (item) => ({
        id: item.id,
        documentNo: item.paymentNo,
        type: 'PAYMENT',
        date: item.paymentDate.toISOString(),
        amount: item.amount,
        status: item.status,
        partnerName: item.supplier.name,
        relationId: item.invoiceId || undefined
      }));
    }

    // 9. Vouchers
    if (!documentType || documentType === 'VOUCHER') {
      const where: any = {};
      if (hasDateRange) where.voucherDate = dateRange;
      if (keyword) {
        where.OR = [
          { voucherNo: { contains: keyword } },
          { summary: { contains: keyword } }
        ];
      }
      const items = await prisma.voucher.findMany({
        where,
        take: limit,
        orderBy: { voucherDate: 'desc' }
      });
      addToResults(items, 'VOUCHER', (item) => ({
        id: item.id,
        documentNo: item.voucherNo,
        type: 'VOUCHER',
        date: item.voucherDate.toISOString(),
        amount: 0, // Vouchers have debit/credit balance, not a single amount typically
        status: item.status,
        partnerName: item.summary
      }));
    }

    // Sort all results by date descending
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }
}
