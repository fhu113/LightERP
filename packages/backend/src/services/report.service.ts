import { prisma } from '../lib/prisma';

// 销售统计报表
export async function getSalesReport(params: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}) {
  const { startDate, endDate, customerId } = params;

  const where: any = {};

  // 过滤日期范围
  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) {
      where.orderDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.orderDate.lte = new Date(endDate);
    }
  }

  if (customerId) {
    where.customerId = customerId;
  }

  // 获取销售订单统计
  const orders = await prisma.salesOrder.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  // 按客户分组统计
  const byCustomer: Record<string, any> = {};
  // 按物料分组统计
  const byMaterial: Record<string, any> = {};
  // 按月分组统计
  const byMonth: Record<string, any> = {};

  let totalAmount = 0;
  let totalTaxAmount = 0;
  let orderCount = 0;

  for (const order of orders) {
    if (order.status === 'CANCELLED') continue;

    totalAmount += order.totalAmount;
    totalTaxAmount += order.taxAmount;
    orderCount++;

    // 按客户统计
    const customerKey = order.customerId;
    if (!byCustomer[customerKey]) {
      byCustomer[customerKey] = {
        customerId: order.customerId,
        customerCode: order.customer.code,
        customerName: order.customer.name,
        orderCount: 0,
        amount: 0,
        taxAmount: 0,
      };
    }
    byCustomer[customerKey].orderCount++;
    byCustomer[customerKey].amount += order.totalAmount;
    byCustomer[customerKey].taxAmount += order.taxAmount;

    // 按物料统计
    for (const item of order.items) {
      const materialKey = item.materialId;
      if (!byMaterial[materialKey]) {
        byMaterial[materialKey] = {
          materialId: item.materialId,
          materialCode: item.material.code,
          materialName: item.material.name,
          quantity: 0,
          amount: 0,
        };
      }
      byMaterial[materialKey].quantity += item.quantity;
      byMaterial[materialKey].amount += item.amount;
    }

    // 按月统计
    const monthKey = order.orderDate.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        month: monthKey,
        orderCount: 0,
        amount: 0,
        taxAmount: 0,
      };
    }
    byMonth[monthKey].orderCount++;
    byMonth[monthKey].amount += order.totalAmount;
    byMonth[monthKey].taxAmount += order.taxAmount;
  }

  return {
    summary: {
      orderCount,
      totalAmount,
      totalTaxAmount,
      totalWithTax: totalAmount + totalTaxAmount,
    },
    byCustomer: Object.values(byCustomer),
    byMaterial: Object.values(byMaterial),
    byMonth: Object.values(byMonth),
  };
}

// 采购统计报表
export async function getPurchaseReport(params: {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
}) {
  const { startDate, endDate, supplierId } = params;

  const where: any = {};

  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) {
      where.orderDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.orderDate.lte = new Date(endDate);
    }
  }

  if (supplierId) {
    where.supplierId = supplierId;
  }

  // 获取采购订单统计
  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  // 按供应商分组统计
  const bySupplier: Record<string, any> = {};
  // 按物料分组统计
  const byMaterial: Record<string, any> = {};
  // 按月分组统计
  const byMonth: Record<string, any> = {};

  let totalAmount = 0;
  let orderCount = 0;

  for (const order of orders) {
    if (order.status === 'CANCELLED') continue;

    totalAmount += order.totalAmount;
    orderCount++;

    // 按供应商统计
    const supplierKey = order.supplierId;
    if (!bySupplier[supplierKey]) {
      bySupplier[supplierKey] = {
        supplierId: order.supplierId,
        supplierCode: order.supplier.code,
        supplierName: order.supplier.name,
        orderCount: 0,
        amount: 0,
      };
    }
    bySupplier[supplierKey].orderCount++;
    bySupplier[supplierKey].amount += order.totalAmount;

    // 按物料统计
    for (const item of order.items) {
      const materialKey = item.materialId;
      if (!byMaterial[materialKey]) {
        byMaterial[materialKey] = {
          materialId: item.materialId,
          materialCode: item.material.code,
          materialName: item.material.name,
          quantity: 0,
          amount: 0,
        };
      }
      byMaterial[materialKey].quantity += item.quantity;
      byMaterial[materialKey].amount += item.amount;
    }

    // 按月统计
    const monthKey = order.orderDate.toISOString().slice(0, 7);
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        month: monthKey,
        orderCount: 0,
        amount: 0,
      };
    }
    byMonth[monthKey].orderCount++;
    byMonth[monthKey].amount += order.totalAmount;
  }

  return {
    summary: {
      orderCount,
      totalAmount,
    },
    bySupplier: Object.values(bySupplier),
    byMaterial: Object.values(byMaterial),
    byMonth: Object.values(byMonth),
  };
}

// 库存报表
export async function getInventoryReport() {
  // 获取所有物料及其库存
  const materials = await prisma.material.findMany({
    orderBy: { code: 'asc' },
  });

  // 获取库存交易记录
  const transactions = await prisma.inventoryTransaction.findMany({
    orderBy: { transactionDate: 'desc' },
    take: 100, // 最近100条
    include: {
      material: true,
    },
  });

  // 按物料分组统计
  const byMaterial = materials.map((material) => ({
    materialId: material.id,
    materialCode: material.code,
    materialName: material.name,
    specification: material.specification,
    unit: material.unit,
    currentStock: material.currentStock,
    costPrice: material.costPrice,
    salePrice: material.salePrice,
    inventoryValue: material.currentStock * material.costPrice,
  }));

  // 计算总库存价值
  const totalInventoryValue = byMaterial.reduce(
    (sum, item) => sum + item.inventoryValue,
    0
  );

  // 按交易类型分组
  const byTransactionType: Record<string, number> = {};
  for (const tx of transactions) {
    if (!byTransactionType[tx.transactionType]) {
      byTransactionType[tx.transactionType] = 0;
    }
    byTransactionType[tx.transactionType]++;
  }

  return {
    summary: {
      materialCount: materials.length,
      totalInventoryValue,
      totalStock: materials.reduce((sum, m) => sum + m.currentStock, 0),
    },
    byMaterial,
    recentTransactions: transactions.map((tx) => ({
      id: tx.id,
      materialCode: tx.material.code,
      materialName: tx.material.name,
      transactionType: tx.transactionType,
      quantity: tx.quantity,
      unitCost: tx.unitCost,
      referenceType: tx.referenceType,
      transactionDate: tx.transactionDate.toISOString(),
    })),
    byTransactionType,
  };
}

// 应收账款报表
export async function getReceivableReport() {
  const customers = await prisma.customer.findMany({
    include: {
      salesInvoices: {
        where: {
          status: { in: ['ISSUED', 'PAID'] },
        },
      },
    },
  });

  const data = customers
    .filter((c) => c.receivableBalance > 0)
    .map((customer) => ({
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      receivableBalance: customer.receivableBalance,
      creditLimit: customer.creditLimit,
      creditUsed: (customer.receivableBalance / (customer.creditLimit || 1)) * 100,
      invoiceCount: customer.salesInvoices.length,
    }));

  const totalReceivable = data.reduce((sum, d) => sum + d.receivableBalance, 0);

  return {
    summary: {
      totalReceivable,
      customerCount: data.length,
    },
    data: data.sort((a, b) => b.receivableBalance - a.receivableBalance),
  };
}

// 应付账款报表
export async function getPayableReport() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseInvoices: {
        where: {
          status: { in: ['ISSUED', 'PAID'] },
        },
      },
    },
  });

  const data = suppliers
    .filter((s) => s.payableBalance > 0)
    .map((supplier) => ({
      supplierId: supplier.id,
      supplierCode: supplier.code,
      supplierName: supplier.name,
      payableBalance: supplier.payableBalance,
      invoiceCount: supplier.purchaseInvoices.length,
    }));

  const totalPayable = data.reduce((sum, d) => sum + d.payableBalance, 0);

  return {
    summary: {
      totalPayable,
      supplierCount: data.length,
    },
    data: data.sort((a, b) => b.payableBalance - a.payableBalance),
  };
}
