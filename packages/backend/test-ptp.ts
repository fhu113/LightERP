import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 辅助函数: 生成真实格式的单号 (与系统服务一致)
// 根据当天已有的单据数量+1作为流水号
async function generateNo(prefix: string): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  let count = 0;
  // 根据前缀选择不同的表和字段进行查询
  if (prefix === 'SO') {
    count = await prisma.salesOrder.count({
      where: { orderNo: { startsWith: `SO-${dateStr}` } }
    });
  } else if (prefix === 'DN') {
    count = await prisma.delivery.count({
      where: { deliveryNo: { startsWith: `DN-${dateStr}` } }
    });
  } else if (prefix === 'INV') {
    count = await prisma.salesInvoice.count({
      where: { invoiceNo: { startsWith: `INV-${dateStr}` } }
    });
  } else if (prefix === 'RC') {
    count = await prisma.receipt.count({
      where: { receiptNo: { startsWith: `RC-${dateStr}` } }
    });
  } else if (prefix === 'PO') {
    count = await prisma.purchaseOrder.count({
      where: { orderNo: { startsWith: `PO-${dateStr}` } }
    });
  } else if (prefix === 'PR') {
    count = await prisma.purchaseReceipt.count({
      where: { receiptNo: { startsWith: `PR-${dateStr}` } }
    });
  } else if (prefix === 'PI') {
    count = await prisma.purchaseInvoice.count({
      where: { invoiceNo: { startsWith: `PI-${dateStr}` } }
    });
  } else if (prefix === 'PAY') {
    count = await prisma.payment.count({
      where: { paymentNo: { startsWith: `PAY-${dateStr}` } }
    });
  }

  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

async function main() {
  console.log('=== PTP完整流程测试 ===\n');

  // 准备测试数据
  console.log('【准备测试数据】');

  // 获取供应商
  const supplier = await prisma.supplier.findFirst();
  console.log('供应商:', supplier?.name);

  // 获取物料
  const materials = await prisma.material.findMany({ take: 2 });
  console.log('物料1:', materials[0]?.name);
  console.log('物料2:', materials[1]?.name);

  // ========== 步骤1: 创建采购订单 ==========
  console.log('\n--- 步骤1: 创建采购订单 ---');

  const orderNo = await generateNo('PO');
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNo,
      supplierId: supplier!.id,
      orderDate: new Date(),
      totalAmount: 11300,
      status: 'PENDING',
      items: {
        create: [
          {
            materialId: materials[0].id,
            quantity: 20,
            unitPrice: 500,
            amount: 10000,
          },
          {
            materialId: materials[1].id,
            quantity: 5,
            unitPrice: 260,
            amount: 1300,
          }
        ]
      }
    },
    include: {
      items: { include: { material: true } }
    }
  });

  console.log('✓ 采购订单创建成功');
  console.log('  订单号:', purchaseOrder.orderNo);
  console.log('  金额:', purchaseOrder.totalAmount);
  console.log('  状态:', purchaseOrder.status);
  console.log('  明细:');
  purchaseOrder.items.forEach(item => {
    console.log('    -', item.material.name, 'x', item.quantity, '=', item.amount);
  });

  // ========== 步骤2: 创建采购收货单 ==========
  console.log('\n--- 步骤2: 创建采购收货单 ---');

  const receiptNo = await generateNo('PR');
  const purchaseReceipt = await prisma.purchaseReceipt.create({
    data: {
      receiptNo,
      orderId: purchaseOrder.id,
      receiptDate: new Date(),
      status: 'PENDING',
      items: {
        create: purchaseOrder.items.map(item => ({
          orderItemId: item.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      }
    },
    include: {
      items: { include: { material: true } }
    }
  });

  console.log('✓ 采购收货单创建成功');
  console.log('  收货单号:', purchaseReceipt.receiptNo);
  console.log('  状态:', purchaseReceipt.status);
  console.log('  明细:');
  purchaseReceipt.items.forEach(item => {
    console.log('    -', item.material.name, 'x', item.quantity);
  });

  // ========== 步骤3: 确认收货单(增加库存) ==========
  console.log('\n--- 步骤3: 确认收货单(增加库存) ---');

  // 增加库存
  for (const item of purchaseReceipt.items) {
    await prisma.material.update({
      where: { id: item.materialId },
      data: { currentStock: { increment: item.quantity } }
    });

    // 创建库存交易记录
    await prisma.inventoryTransaction.create({
      data: {
        materialId: item.materialId,
        transactionType: 'IN',
        quantity: item.quantity,
        unitCost: item.unitPrice,
        referenceType: 'PURCHASE_RECEIPT',
        referenceId: purchaseReceipt.id,
        transactionDate: new Date(),
      }
    });
  }

  // 更新收货单状态
  await prisma.purchaseReceipt.update({
    where: { id: purchaseReceipt.id },
    data: { status: 'COMPLETED' }
  });

  console.log('✓ 采购收货单确认成功');
  console.log('  状态已更新为: COMPLETED');

  // 检查库存
  const mat1 = await prisma.material.findUnique({ where: { id: materials[0].id } });
  const mat2 = await prisma.material.findUnique({ where: { id: materials[1].id } });
  const mat1Stock = mat1?.currentStock ?? 0;
  const mat2Stock = mat2?.currentStock ?? 0;
  console.log('  库存变化:');
  console.log('    -', materials[0].name, ':', mat1Stock - 20, '->', mat1Stock);
  console.log('    -', materials[1].name, ':', mat2Stock - 5, '->', mat2Stock);

  // 更新采购订单状态
  await prisma.purchaseOrder.update({
    where: { id: purchaseOrder.id },
    data: { status: 'RECEIVED' }
  });

  // ========== 步骤4: 创建采购发票 ==========
  console.log('\n--- 步骤4: 创建采购发票 ---');

  const invoiceNo = await generateNo('PI');
  const purchaseInvoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo,
      supplierId: supplier!.id,
      receiptId: purchaseReceipt.id,
      invoiceDate: new Date(),
      amount: 11300,
      taxAmount: 1300,
      status: 'ISSUED',
    }
  });

  console.log('✓ 采购发票创建成功');
  console.log('  发票号:', purchaseInvoice.invoiceNo);
  console.log('  金额:', purchaseInvoice.amount);
  console.log('  税额:', purchaseInvoice.taxAmount);
  console.log('  状态:', purchaseInvoice.status);

  // ========== 步骤5: 创建付款单 ==========
  console.log('\n--- 步骤5: 创建付款单 ---');

  const paymentNo = await generateNo('PAY');
  const payment = await prisma.payment.create({
    data: {
      paymentNo,
      supplierId: supplier!.id,
      invoiceId: purchaseInvoice.id,
      paymentDate: new Date(),
      amount: 11300,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
    }
  });

  console.log('✓ 付款单创建成功');
  console.log('  付款单号:', payment.paymentNo);
  console.log('  金额:', payment.amount);
  console.log('  状态:', payment.status);

  // 更新采购发票状态
  await prisma.purchaseInvoice.update({
    where: { id: purchaseInvoice.id },
    data: { status: 'PAID' }
  });

  console.log('\n=== PTP流程测试完成 ===\n');
  console.log('采购订单号:', orderNo);
  console.log('采购收货单号:', receiptNo);
  console.log('采购发票号:', invoiceNo);
  console.log('付款单号:', paymentNo);

  await prisma.$disconnect();
}

main().catch(console.error);
