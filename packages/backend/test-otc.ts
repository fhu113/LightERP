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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== OTC完整流程测试 ===\n');

  // 准备测试数据
  console.log('【准备测试数据】');

  // 获取客户
  const customer = await prisma.customer.findFirst();
  console.log('客户:', customer?.name);

  // 获取物料
  const materials = await prisma.material.findMany({ take: 2 });
  console.log('物料1:', materials[0]?.name);
  console.log('物料2:', materials[1]?.name);

  // ========== 步骤1: 创建销售订单 ==========
  console.log('\n--- 步骤1: 创建销售订单 ---');

  const orderNo = await generateNo('SO');
  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderNo,
      customerId: customer!.id,
      orderDate: new Date(),
      totalAmount: 11300,
      taxAmount: 1300,
      status: 'PENDING',
      items: {
        create: [
          {
            materialId: materials[0].id,
            quantity: 10,
            unitPrice: 1000,
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

  console.log('✓ 销售订单创建成功');
  console.log('  订单号:', salesOrder.orderNo);
  console.log('  金额:', salesOrder.totalAmount);
  console.log('  状态:', salesOrder.status);
  console.log('  明细:');
  salesOrder.items.forEach(item => {
    console.log('    -', item.material.name, 'x', item.quantity, '=', item.amount);
  });

  await sleep(500);

  // ========== 步骤2: 创建发货单 ==========
  console.log('\n--- 步骤2: 创建发货单 ---');

  const deliveryNo = await generateNo('DN');
  const delivery = await prisma.delivery.create({
    data: {
      deliveryNo,
      orderId: salesOrder.id,
      deliveryDate: new Date(),
      status: 'PENDING',
      items: {
        create: salesOrder.items.map(item => ({
          orderItemId: item.id,
          materialId: item.materialId,
          quantity: item.quantity,
        }))
      }
    },
    include: {
      items: { include: { material: true } }
    }
  });

  console.log('✓ 发货单创建成功');
  console.log('  发货单号:', delivery.deliveryNo);
  console.log('  状态:', delivery.status);
  console.log('  明细:');
  delivery.items.forEach(item => {
    console.log('    -', item.material.name, 'x', item.quantity);
  });

  await sleep(500);

  // ========== 步骤3: 确认发货单(更新库存) ==========
  console.log('\n--- 步骤3: 确认发货单(扣减库存) ---');

  // 扣减库存
  for (const item of delivery.items) {
    await prisma.material.update({
      where: { id: item.materialId },
      data: { currentStock: { decrement: item.quantity } }
    });

    // 获取物料单价
    const orderItem = salesOrder.items.find((i: any) => i.materialId === item.materialId);
    const unitCost = orderItem ? orderItem.unitPrice : 0;

    // 创建库存交易记录
    await prisma.inventoryTransaction.create({
      data: {
        materialId: item.materialId,
        transactionType: 'OUT',
        quantity: item.quantity,
        unitCost,
        referenceType: 'DELIVERY',
        referenceId: delivery.id,
        transactionDate: new Date(),
      }
    });
  }

  // 更新发货单状态
  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { status: 'COMPLETED' }
  });

  console.log('✓ 发货单确认成功');
  console.log('  状态已更新为: COMPLETED');

  // 检查库存
  const mat1 = await prisma.material.findUnique({ where: { id: materials[0].id } });
  const mat2 = await prisma.material.findUnique({ where: { id: materials[1].id } });
  console.log('  库存变化:');
  console.log('    -', materials[0].name, ': 0 ->', mat1?.currentStock);
  console.log('    -', materials[1].name, ': 0 ->', mat2?.currentStock);

  await sleep(500);

  // ========== 步骤4: 创建销售发票 ==========
  console.log('\n--- 步骤4: 创建销售发票 ---');

  const invoiceNo = await generateNo('INV');
  const salesInvoice = await prisma.salesInvoice.create({
    data: {
      invoiceNo,
      orderId: salesOrder.id,
      customerId: customer!.id,
      invoiceDate: new Date(),
      amount: 11300,
      taxAmount: 1300,
      status: 'ISSUED',
    }
  });

  console.log('✓ 销售发票创建成功');
  console.log('  发票号:', salesInvoice.invoiceNo);
  console.log('  金额:', salesInvoice.amount);
  console.log('  税额:', salesInvoice.taxAmount);
  console.log('  状态:', salesInvoice.status);

  await sleep(500);

  // ========== 步骤5: 创建收款单 ==========
  console.log('\n--- 步骤5: 创建收款单 ---');

  const receiptNo = await generateNo('RC');
  const receipt = await prisma.receipt.create({
    data: {
      receiptNo,
      customerId: customer!.id,
      invoiceId: salesInvoice.id,
      receiptDate: new Date(),
      amount: 11300,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
    }
  });

  console.log('✓ 收款单创建成功');
  console.log('  收款单号:', receipt.receiptNo);
  console.log('  金额:', receipt.amount);
  console.log('  状态:', receipt.status);

  // 更新销售发票状态
  await prisma.salesInvoice.update({
    where: { id: salesInvoice.id },
    data: { status: 'PAID' }
  });

  // 更新销售订单状态
  await prisma.salesOrder.update({
    where: { id: salesOrder.id },
    data: { status: 'COMPLETED' }
  });

  console.log('\n=== OTC流程测试完成 ===\n');
  console.log('订单号:', orderNo);
  console.log('发货单号:', deliveryNo);
  console.log('发票号:', invoiceNo);
  console.log('收款单号:', receiptNo);

  await prisma.$disconnect();
}

main().catch(console.error);
