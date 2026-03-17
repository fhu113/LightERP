import { prisma } from '../lib/prisma';

interface CleanupResult {
  salesOrders: number;
  salesOrderItems: number;
  deliveries: number;
  deliveryItems: number;
  salesInvoices: number;
  salesInvoiceItems: number;
  receipts: number;
  receiptItems: number;
  purchaseOrders: number;
  purchaseOrderItems: number;
  purchaseReceipts: number;
  purchaseReceiptItems: number;
  purchaseInvoices: number;
  purchaseInvoiceItems: number;
  payments: number;
  paymentItems: number;
  vouchers: number;
  voucherItems: number;
  inventoryTransactions: number;
}

// 删除所有OTC相关单据（销售订单及关联单据）
export async function cleanupOTCDocuments(): Promise<CleanupResult> {
  const result: CleanupResult = {
    salesOrders: 0,
    salesOrderItems: 0,
    deliveries: 0,
    deliveryItems: 0,
    salesInvoices: 0,
    salesInvoiceItems: 0,
    receipts: 0,
    receiptItems: 0,
    purchaseOrders: 0,
    purchaseOrderItems: 0,
    purchaseReceipts: 0,
    purchaseReceiptItems: 0,
    purchaseInvoices: 0,
    purchaseInvoiceItems: 0,
    payments: 0,
    paymentItems: 0,
    vouchers: 0,
    voucherItems: 0,
    inventoryTransactions: 0,
  };

  try {
    // 1. 获取所有销售订单ID
    const salesOrders = await prisma.salesOrder.findMany({
      select: { id: true },
    });
    const salesOrderIds = salesOrders.map(o => o.id);

    // 2. 获取所有发货单ID
    const deliveries = await prisma.delivery.findMany({
      where: { orderId: { in: salesOrderIds } },
      select: { id: true, voucherId: true },
    });
    const deliveryIds = deliveries.map(d => d.id);
    const deliveryVoucherIds = deliveries.map(d => d.voucherId).filter(Boolean) as string[];

    // 3. 获取所有销售发票ID
    const salesInvoices = await prisma.salesInvoice.findMany({
      where: { orderId: { in: salesOrderIds } },
      select: { id: true, voucherId: true },
    });
    const invoiceIds = salesInvoices.map(i => i.id);
    const invoiceVoucherIds = salesInvoices.map(i => i.voucherId).filter(Boolean) as string[];

    // 4. 获取所有收款单ID
    const receipts = await prisma.receipt.findMany({
      where: { invoiceId: { in: invoiceIds } },
      select: { id: true, voucherId: true },
    });
    const receiptIds = receipts.map(r => r.id);
    const receiptVoucherIds = receipts.map(r => r.voucherId).filter(Boolean) as string[];

    // 收集所有需要删除的凭证ID
    const allVoucherIds = [...deliveryVoucherIds, ...invoiceVoucherIds, ...receiptVoucherIds];

    // 5. 删除凭证分录
    if (allVoucherIds.length > 0) {
      const voucherItems = await prisma.voucherItem.findMany({
        where: { voucherId: { in: allVoucherIds } },
      });
      result.voucherItems = voucherItems.length;
      await prisma.voucherItem.deleteMany({
        where: { voucherId: { in: allVoucherIds } },
      });

      // 删除凭证
      result.vouchers = allVoucherIds.length;
      await prisma.voucher.deleteMany({
        where: { id: { in: allVoucherIds } },
      });
    }

    // 6. 删除发货明细
    if (deliveryIds.length > 0) {
      const deliveryItems = await prisma.deliveryItem.findMany({
        where: { deliveryId: { in: deliveryIds } },
      });
      result.deliveryItems = deliveryItems.length;
      await prisma.deliveryItem.deleteMany({
        where: { deliveryId: { in: deliveryIds } },
      });
    }

    // 7. 删除发货单
    result.deliveries = deliveryIds.length;
    await prisma.delivery.deleteMany({
      where: { id: { in: deliveryIds } },
    });

    // 8. 删除销售发票（无明细表）
    if (invoiceIds.length > 0) {
      result.salesInvoiceItems = 0;
    }

    // 9. 删除销售发票
    result.salesInvoices = invoiceIds.length;
    await prisma.salesInvoice.deleteMany({
      where: { id: { in: invoiceIds } },
    });

    // 10. 删除收款单明细（如果有）
    // 11. 删除收款单
    result.receipts = receiptIds.length;
    await prisma.receipt.deleteMany({
      where: { id: { in: receiptIds } },
    });

    // 12. 删除销售订单明细
    if (salesOrderIds.length > 0) {
      const orderItems = await prisma.salesOrderItem.findMany({
        where: { orderId: { in: salesOrderIds } },
      });
      result.salesOrderItems = orderItems.length;
      await prisma.salesOrderItem.deleteMany({
        where: { orderId: { in: salesOrderIds } },
      });
    }

    // 13. 删除销售订单
    result.salesOrders = salesOrderIds.length;
    await prisma.salesOrder.deleteMany({
      where: { id: { in: salesOrderIds } },
    });

    return result;
  } catch (error) {
    console.error('清理OTC数据失败:', error);
    throw error;
  }
}

// 删除所有PTP相关单据（采购订单及关联单据）
export async function cleanupPTPDocuments(): Promise<CleanupResult> {
  const result: CleanupResult = {
    salesOrders: 0,
    salesOrderItems: 0,
    deliveries: 0,
    deliveryItems: 0,
    salesInvoices: 0,
    salesInvoiceItems: 0,
    receipts: 0,
    receiptItems: 0,
    purchaseOrders: 0,
    purchaseOrderItems: 0,
    purchaseReceipts: 0,
    purchaseReceiptItems: 0,
    purchaseInvoices: 0,
    purchaseInvoiceItems: 0,
    payments: 0,
    paymentItems: 0,
    vouchers: 0,
    voucherItems: 0,
    inventoryTransactions: 0,
  };

  try {
    // 1. 获取所有采购订单ID
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      select: { id: true },
    });
    const purchaseOrderIds = purchaseOrders.map(o => o.id);

    // 2. 获取所有采购收货单ID
    const receipts = await prisma.purchaseReceipt.findMany({
      where: { orderId: { in: purchaseOrderIds } },
      select: { id: true, voucherId: true },
    });
    const receiptIds = receipts.map(r => r.id);
    const receiptVoucherIds = receipts.map(r => r.voucherId).filter(Boolean) as string[];

    // 3. 获取所有采购发票ID
    const invoices = await prisma.purchaseInvoice.findMany({
      where: { receiptId: { in: receiptIds } },
      select: { id: true, voucherId: true },
    });
    const invoiceIds = invoices.map(i => i.id);
    const invoiceVoucherIds = invoices.map(i => i.voucherId).filter(Boolean) as string[];

    // 4. 获取所有付款单ID
    const payments = await prisma.payment.findMany({
      where: { invoiceId: { in: invoiceIds } },
      select: { id: true, voucherId: true },
    });
    const paymentIds = payments.map(p => p.id);
    const paymentVoucherIds = payments.map(p => p.voucherId).filter(Boolean) as string[];

    // 收集所有需要删除的凭证ID
    const allVoucherIds = [...receiptVoucherIds, ...invoiceVoucherIds, ...paymentVoucherIds];

    // 5. 删除凭证分录
    if (allVoucherIds.length > 0) {
      const voucherItems = await prisma.voucherItem.findMany({
        where: { voucherId: { in: allVoucherIds } },
      });
      result.voucherItems = voucherItems.length;
      await prisma.voucherItem.deleteMany({
        where: { voucherId: { in: allVoucherIds } },
      });

      // 删除凭证
      result.vouchers = allVoucherIds.length;
      await prisma.voucher.deleteMany({
        where: { id: { in: allVoucherIds } },
      });
    }

    // 6. 删除采购收货明细
    if (receiptIds.length > 0) {
      const receiptItems = await prisma.purchaseReceiptItem.findMany({
        where: { receiptId: { in: receiptIds } },
      });
      result.purchaseReceiptItems = receiptItems.length;
      await prisma.purchaseReceiptItem.deleteMany({
        where: { receiptId: { in: receiptIds } },
      });
    }

    // 7. 删除采购收货单
    result.purchaseReceipts = receiptIds.length;
    await prisma.purchaseReceipt.deleteMany({
      where: { id: { in: receiptIds } },
    });

    // 8. 删除采购发票（无明细表）
    if (invoiceIds.length > 0) {
      result.purchaseInvoiceItems = 0;
    }

    // 9. 删除采购发票
    result.purchaseInvoices = invoiceIds.length;
    await prisma.purchaseInvoice.deleteMany({
      where: { id: { in: invoiceIds } },
    });

    // 10. 删除付款单
    result.payments = paymentIds.length;
    await prisma.payment.deleteMany({
      where: { id: { in: paymentIds } },
    });

    // 11. 删除采购订单明细
    if (purchaseOrderIds.length > 0) {
      const orderItems = await prisma.purchaseOrderItem.findMany({
        where: { orderId: { in: purchaseOrderIds } },
      });
      result.purchaseOrderItems = orderItems.length;
      await prisma.purchaseOrderItem.deleteMany({
        where: { orderId: { in: purchaseOrderIds } },
      });
    }

    // 12. 删除采购订单
    result.purchaseOrders = purchaseOrderIds.length;
    await prisma.purchaseOrder.deleteMany({
      where: { id: { in: purchaseOrderIds } },
    });

    return result;
  } catch (error) {
    console.error('清理PTP数据失败:', error);
    throw error;
  }
}

// 删除库存调整单
export async function cleanupInventoryAdjustments(): Promise<CleanupResult> {
  const result: CleanupResult = {
    salesOrders: 0,
    salesOrderItems: 0,
    deliveries: 0,
    deliveryItems: 0,
    salesInvoices: 0,
    salesInvoiceItems: 0,
    receipts: 0,
    receiptItems: 0,
    purchaseOrders: 0,
    purchaseOrderItems: 0,
    purchaseReceipts: 0,
    purchaseReceiptItems: 0,
    purchaseInvoices: 0,
    purchaseInvoiceItems: 0,
    payments: 0,
    paymentItems: 0,
    vouchers: 0,
    voucherItems: 0,
    inventoryTransactions: 0,
  };

  try {
    // 1. 获取所有库存调整记录（referenceType = ADJUSTMENT）
    const adjustments = await prisma.inventoryTransaction.findMany({
      where: { referenceType: 'ADJUSTMENT' },
      select: { id: true, voucherId: true },
    });
    const adjustmentIds = adjustments.map(a => a.id);
    const adjustmentVoucherIds = adjustments.map(a => a.voucherId).filter(Boolean) as string[];

    // 2. 删除凭证分录
    if (adjustmentVoucherIds.length > 0) {
      const voucherItems = await prisma.voucherItem.findMany({
        where: { voucherId: { in: adjustmentVoucherIds } },
      });
      result.voucherItems = voucherItems.length;
      await prisma.voucherItem.deleteMany({
        where: { voucherId: { in: adjustmentVoucherIds } },
      });

      // 删除凭证
      result.vouchers = adjustmentVoucherIds.length;
      await prisma.voucher.deleteMany({
        where: { id: { in: adjustmentVoucherIds } },
      });
    }

    // 3. 删除库存调整记录
    result.inventoryTransactions = adjustmentIds.length;
    await prisma.inventoryTransaction.deleteMany({
      where: { id: { in: adjustmentIds } },
    });

    return result;
  } catch (error) {
    console.error('清理库存调整数据失败:', error);
    throw error;
  }
}

// 删除所有业务单据（OTC + PTP + 库存调整）
export async function cleanupAllBusinessDocuments(): Promise<{
  otc: CleanupResult;
  ptp: CleanupResult;
  inventory: CleanupResult;
  total: {
    salesOrders: number;
    deliveries: number;
    salesInvoices: number;
    receipts: number;
    purchaseOrders: number;
    purchaseReceipts: number;
    purchaseInvoices: number;
    payments: number;
    vouchers: number;
    inventoryTransactions: number;
  };
}> {
  const otc = await cleanupOTCDocuments();
  const ptp = await cleanupPTPDocuments();
  const inventory = await cleanupInventoryAdjustments();

  return {
    otc,
    ptp,
    inventory,
    total: {
      salesOrders: otc.salesOrders,
      deliveries: otc.deliveries,
      salesInvoices: otc.salesInvoices,
      receipts: otc.receipts,
      purchaseOrders: ptp.purchaseOrders,
      purchaseReceipts: ptp.purchaseReceipts,
      purchaseInvoices: ptp.purchaseInvoices,
      payments: ptp.payments,
      vouchers: otc.vouchers + ptp.vouchers + inventory.vouchers,
      inventoryTransactions: inventory.inventoryTransactions,
    },
  };
}

// 库存初始化 - 清理所有库存记录和库存数量
export async function initializeInventory(): Promise<{
  inventoryTransactions: number;
  voucherItems: number;
  vouchers: number;
  materials: number;
}> {
  const result = {
    inventoryTransactions: 0,
    voucherItems: 0,
    vouchers: 0,
    materials: 0,
  };

  try {
    // 1. 获取所有库存交易记录
    const transactions = await prisma.inventoryTransaction.findMany({
      select: { id: true, voucherId: true },
    });
    const transactionIds = transactions.map(t => t.id);
    const voucherIds = transactions.map(t => t.voucherId).filter(Boolean) as string[];

    // 2. 删除关联的凭证分录
    if (voucherIds.length > 0) {
      const voucherItems = await prisma.voucherItem.findMany({
        where: { voucherId: { in: voucherIds } },
      });
      result.voucherItems = voucherItems.length;
      await prisma.voucherItem.deleteMany({
        where: { voucherId: { in: voucherIds } },
      });

      // 删除凭证
      result.vouchers = voucherIds.length;
      await prisma.voucher.deleteMany({
        where: { id: { in: voucherIds } },
      });
    }

    // 3. 删除所有库存交易记录
    result.inventoryTransactions = transactionIds.length;
    await prisma.inventoryTransaction.deleteMany({
      where: { id: { in: transactionIds } },
    });

    // 4. 重置所有物料的库存数量为0
    const materials = await prisma.material.findMany({
      select: { id: true },
    });
    result.materials = materials.length;

    if (materials.length > 0) {
      await prisma.material.updateMany({
        where: { id: { in: materials.map(m => m.id) } },
        data: { currentStock: 0 },
      });
    }

    return result;
  } catch (error) {
    console.error('库存初始化失败:', error);
    throw error;
  }
}
