import { PrismaClient } from '@prisma/client';
import { AppError } from './src/middleware/errorHandler';

const prisma = new PrismaClient();

// ============================================================
// 辅助函数（复制自 voucher.service.ts）
// ============================================================

async function generateVoucherNo(tx: any): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await tx.voucher.count({
    where: { voucherNo: { startsWith: `V-${dateStr}` } },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `V-${dateStr}-${seq}`;
}

async function createVoucher(data: any, tx: any) {
  const totalDebit = data.items.reduce((sum: number, item: any) => sum + item.debitAmount, 0);
  const totalCredit = data.items.reduce((sum: number, item: any) => sum + item.creditAmount, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('借贷金额不平衡', 400);
  }
  const voucher = await tx.voucher.create({
    data: {
      voucherNo: await generateVoucherNo(tx),
      voucherDate: data.voucherDate || new Date(),
      voucherType: data.voucherType || 'GENERAL',
      summary: data.summary,
      items: {
        create: data.items.map((item: any) => ({
          subjectId: item.subjectId,
          debitAmount: item.debitAmount,
          creditAmount: item.creditAmount,
          description: item.description,
        })),
      },
    },
    include: { items: { include: { subject: true } } },
  });
  return {
    id: voucher.id, voucherNo: voucher.voucherNo,
    voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType,
    summary: voucher.summary, status: voucher.status,
    totalDebit, totalCredit,
    items: voucher.items.map((i: any) => ({
      subjectId: i.subjectId, subjectName: i.subject.name,
      debitAmount: i.debitAmount, creditAmount: i.creditAmount,
      description: i.description,
    })),
  };
}

async function getSystemConfig(key: string, tx?: any): Promise<string | null> {
  const client = tx || prisma;
  const config = await client.systemConfig.findUnique({ where: { configKey: key } });
  return config?.configValue || null;
}

async function isAutoGenerateVoucherEnabled(tx?: any): Promise<boolean> {
  const value = await getSystemConfig('auto_generate_voucher_enabled', tx);
  return value === 'true';
}

async function getSubjectIdFromConfig(key: string, tx?: any): Promise<string | null> {
  return getSystemConfig(key, tx);
}

// 发货凭证
async function generateDeliveryVoucher(deliveryId: string, tx: any) {
  if (!await isAutoGenerateVoucherEnabled(tx)) return null;
  const delivery = await tx.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: { include: { items: { include: { material: true } } } } },
  });
  if (!delivery) return null;
  const costSubjectId = await getSubjectIdFromConfig('otc.delivery.cost_subject_id', tx);
  const inventorySubjectId = await getSubjectIdFromConfig('otc.delivery.inventory_subject_id', tx);
  if (!costSubjectId || !inventorySubjectId) return null;
  let totalCost = 0;
  for (const item of delivery.order.items) {
    totalCost += (item.material.costPrice || 0) * item.quantity;
  }
  if (totalCost <= 0) return null;
  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary: `发货单 ${delivery.deliveryNo} - 成本结转`,
    items: [
      { subjectId: costSubjectId, debitAmount: totalCost, creditAmount: 0, description: '借：主营业务成本' },
      { subjectId: inventorySubjectId, debitAmount: 0, creditAmount: totalCost, description: '贷：库存商品' },
    ],
  }, tx);
  return voucher;
}

// 销售发票凭证
async function generateSalesInvoiceVoucher(invoiceId: string, tx: any) {
  if (!await isAutoGenerateVoucherEnabled(tx)) return null;
  const invoice = await tx.salesInvoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, order: true },
  });
  if (!invoice) return null;
  const receivableSubjectId = await getSubjectIdFromConfig('otc.invoice.receivable_subject_id', tx);
  const revenueSubjectId = await getSubjectIdFromConfig('otc.invoice.revenue_subject_id', tx);
  const taxSubjectId = await getSubjectIdFromConfig('otc.invoice.tax_subject_id', tx);
  if (!receivableSubjectId || !revenueSubjectId || !taxSubjectId) return null;
  const amount = invoice.amount;
  const taxAmount = invoice.taxAmount;
  const totalAmount = amount + taxAmount;
  const customerName = invoice.customer?.name || '客户';
  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary: `销售发票 ${invoice.invoiceNo} - ${customerName}`,
    items: [
      { subjectId: receivableSubjectId, debitAmount: totalAmount, creditAmount: 0, description: `借：应收账款 ${customerName}` },
      { subjectId: revenueSubjectId, debitAmount: 0, creditAmount: amount, description: '贷：主营业务收入' },
      { subjectId: taxSubjectId, debitAmount: 0, creditAmount: taxAmount, description: '贷：应交税费-销项税额' },
    ],
  }, tx);
  return voucher;
}

// 收款凭证
async function generateReceiptVoucher(receiptId: string, paymentMethod: string, tx: any) {
  if (!await isAutoGenerateVoucherEnabled(tx)) return null;
  const receipt = await tx.receipt.findUnique({
    where: { id: receiptId },
    include: { customer: true, invoice: true },
  });
  if (!receipt) return null;
  const receivableSubjectId = await getSubjectIdFromConfig('otc.receipt.receivable_subject_id', tx);
  const cashSubjectId = await getSubjectIdFromConfig('otc.receipt.cash_subject_id', tx);
  if (!receivableSubjectId || !cashSubjectId) return null;
  const amount = receipt.amount;
  const customerName = receipt.customer?.name || '客户';
  const paymentMethodText = paymentMethod === 'CASH' ? '库存现金' : '银行存款';
  const voucher = await createVoucher({
    voucherType: 'GENERAL',
    summary: `收款单 ${receipt.receiptNo} - ${customerName}`,
    items: [
      { subjectId: cashSubjectId, debitAmount: amount, creditAmount: 0, description: `借：${paymentMethodText}` },
      { subjectId: receivableSubjectId, debitAmount: 0, creditAmount: amount, description: `贷：应收账款 ${customerName}` },
    ],
  }, tx);
  return voucher;
}

// ============================================================
// 主测试流程
// ============================================================

async function main() {
  const results: any = { steps: [], vouchers: [], documents: [], errors: [] };
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const customer = await prisma.customer.findFirst({ where: { code: 'CUST001' } });
  const material = await prisma.material.findFirst({ where: { code: 'MAT001' } });
  if (!customer || !material) { console.error('ERROR: 客户或物料不存在'); process.exit(1); }

  console.log('=== OTC端到端测试开始 ===\n');
  console.log(`客户: ${customer.name}  物料: ${material.name}  成本价: ${material.costPrice}  销售价: ${material.salePrice}`);

  // 步骤1: 创建销售订单
  console.log('\n--- 步骤1: 创建销售订单 ---');
  const so = await prisma.salesOrder.create({
    data: {
      orderNo: 'SO-' + dateStr + '-001',
      customerId: customer.id, orderDate: new Date(), status: 'DRAFT',
      items: { create: {
        materialId: material.id, quantity: 2, unitPrice: material.salePrice,
        amount: material.salePrice * 2, taxRate: 0.13, taxAmount: material.salePrice * 2 * 0.13, deliveredQuantity: 0,
      }}
    }, include: { items: true }
  });
  const soTotal = material.salePrice * 2 * 1.13;
  console.log(`销售订单已创建: ${so.orderNo}  含税金额: ${soTotal.toFixed(2)}  状态: ${so.status}`);
  results.documents.push({ type: '销售订单', no: so.orderNo, id: so.id, status: so.status });
  results.steps.push({ step: 1, action: '创建销售订单', result: '成功', no: so.orderNo });

  // 步骤2: 确认销售订单
  console.log('\n--- 步骤2: 确认销售订单 ---');
  const soConfirmed = await prisma.salesOrder.update({ where: { id: so.id }, data: { status: 'CONFIRMED' } });
  console.log(`销售订单已确认: ${soConfirmed.orderNo}  状态: ${soConfirmed.status}`);
  results.steps.push({ step: 2, action: '确认销售订单', result: '成功', no: soConfirmed.orderNo });

  // 步骤3: 创建发货单
  console.log('\n--- 步骤3: 创建发货单 ---');
  const delivery = await prisma.delivery.create({
    data: {
      deliveryNo: 'DN-' + dateStr + '-001', orderId: so.id, deliveryDate: new Date(), status: 'DRAFT',
      items: { create: { orderItemId: so.items[0].id, materialId: material.id, quantity: 2 } }
    }, include: { items: true }
  });
  console.log(`发货单已创建: ${delivery.deliveryNo}  状态: ${delivery.status}`);
  results.documents.push({ type: '发货单', no: delivery.deliveryNo, id: delivery.id, status: delivery.status });
  results.steps.push({ step: 3, action: '创建发货单', result: '成功', no: delivery.deliveryNo });

  // 步骤4: 确认发货单 → 自动生成凭证V1
  console.log('\n--- 步骤4: 确认发货单 → 自动生成凭证 ---');
  await prisma.delivery.update({ where: { id: delivery.id }, data: { status: 'CONFIRMED' } });
  const voucher1 = await generateDeliveryVoucher(delivery.id, prisma);
  if (voucher1) {
    await prisma.delivery.update({ where: { id: delivery.id }, data: { voucherId: voucher1.id } });
    console.log(`发货单已确认: ${delivery.deliveryNo}  状态: CONFIRMED`);
    console.log(`✓ 自动生成凭证: ${voucher1.voucherNo}  借方: ${voucher1.totalDebit}  贷方: ${voucher1.totalCredit}`);
    voucher1.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '发货单', no: delivery.deliveryNo, id: delivery.id, status: 'CONFIRMED', voucherId: voucher1.id, voucherNo: voucher1.voucherNo });
    results.vouchers.push({ no: voucher1.voucherNo, id: voucher1.id, source: '发货确认', summary: voucher1.summary, status: voucher1.status, totalDebit: voucher1.totalDebit, totalCredit: voucher1.totalCredit, items: voucher1.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 4, action: '确认发货单(自动生成凭证)', result: '成功', no: delivery.deliveryNo, voucherNo: voucher1.voucherNo });
  } else {
    console.log('✗ 未生成凭证（检查配置）');
    results.errors.push({ step: 4, error: '未生成凭证' });
    results.steps.push({ step: 4, action: '确认发货单(自动生成凭证)', result: '未生成凭证', no: delivery.deliveryNo });
  }

  // 步骤5: 创建销售发票
  console.log('\n--- 步骤5: 创建销售发票 ---');
  const invoice = await prisma.salesInvoice.create({
    data: {
      invoiceNo: 'SI-' + dateStr + '-001', orderId: so.id, customerId: customer.id,
      invoiceDate: new Date(), amount: material.salePrice * 2, taxAmount: material.salePrice * 2 * 0.13, status: 'DRAFT',
    }
  });
  console.log(`销售发票已创建: ${invoice.invoiceNo}  金额: ${invoice.amount}  税额: ${invoice.taxAmount.toFixed(2)}  状态: ${invoice.status}`);
  results.documents.push({ type: '销售发票', no: invoice.invoiceNo, id: invoice.id, status: invoice.status });
  results.steps.push({ step: 5, action: '创建销售发票', result: '成功', no: invoice.invoiceNo });

  // 步骤6: 开票确认 → 自动生成凭证V2
  console.log('\n--- 步骤6: 开票确认 → 自动生成凭证 ---');
  await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { status: 'ISSUED' } });
  const voucher2 = await generateSalesInvoiceVoucher(invoice.id, prisma);
  if (voucher2) {
    await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { voucherId: voucher2.id } });
    console.log(`销售发票已确认: ${invoice.invoiceNo}  状态: ISSUED`);
    console.log(`✓ 自动生成凭证: ${voucher2.voucherNo}  借方: ${voucher2.totalDebit}  贷方: ${voucher2.totalCredit}`);
    voucher2.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '销售发票', no: invoice.invoiceNo, id: invoice.id, status: 'ISSUED', voucherId: voucher2.id, voucherNo: voucher2.voucherNo });
    results.vouchers.push({ no: voucher2.voucherNo, id: voucher2.id, source: '开票确认', summary: voucher2.summary, status: voucher2.status, totalDebit: voucher2.totalDebit, totalCredit: voucher2.totalCredit, items: voucher2.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 6, action: '开票确认(自动生成凭证)', result: '成功', no: invoice.invoiceNo, voucherNo: voucher2.voucherNo });
  } else {
    console.log('✗ 未生成凭证');
    results.errors.push({ step: 6, error: '未生成凭证' });
    results.steps.push({ step: 6, action: '开票确认(自动生成凭证)', result: '未生成凭证', no: invoice.invoiceNo });
  }

  // 步骤7: 创建收款单
  console.log('\n--- 步骤7: 创建收款单 ---');
  const receipt = await prisma.receipt.create({
    data: {
      receiptNo: 'R-' + dateStr + '-001', customerId: customer.id, invoiceId: invoice.id,
      receiptDate: new Date(), amount: invoice.amount + invoice.taxAmount, paymentMethod: 'BANK_TRANSFER', status: 'PENDING',
    }
  });
  console.log(`收款单已创建: ${receipt.receiptNo}  金额: ${receipt.amount}  状态: ${receipt.status}`);
  results.documents.push({ type: '收款单', no: receipt.receiptNo, id: receipt.id, status: receipt.status });
  results.steps.push({ step: 7, action: '创建收款单', result: '成功', no: receipt.receiptNo });

  // 步骤8: 收款确认 → 自动生成凭证V3
  console.log('\n--- 步骤8: 收款确认 → 自动生成凭证 ---');
  await prisma.receipt.update({ where: { id: receipt.id }, data: { status: 'PAID' } });
  const voucher3 = await generateReceiptVoucher(receipt.id, 'BANK_TRANSFER', prisma);
  if (voucher3) {
    await prisma.receipt.update({ where: { id: receipt.id }, data: { voucherId: voucher3.id } });
    console.log(`收款单已确认: ${receipt.receiptNo}  状态: PAID`);
    console.log(`✓ 自动生成凭证: ${voucher3.voucherNo}  借方: ${voucher3.totalDebit}  贷方: ${voucher3.totalCredit}`);
    voucher3.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '收款单', no: receipt.receiptNo, id: receipt.id, status: 'PAID', voucherId: voucher3.id, voucherNo: voucher3.voucherNo });
    results.vouchers.push({ no: voucher3.voucherNo, id: voucher3.id, source: '收款确认', summary: voucher3.summary, status: voucher3.status, totalDebit: voucher3.totalDebit, totalCredit: voucher3.totalCredit, items: voucher3.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 8, action: '收款确认(自动生成凭证)', result: '成功', no: receipt.receiptNo, voucherNo: voucher3.voucherNo });
  } else {
    console.log('✗ 未生成凭证');
    results.errors.push({ step: 8, error: '未生成凭证' });
    results.steps.push({ step: 8, action: '收款确认(自动生成凭证)', result: '未生成凭证', no: receipt.receiptNo });
  }

  // ============================================================
  // 测试报告
  // ============================================================
  console.log('\n\n' + '='.repeat(70));
  console.log('                    OTC端到端测试报告');
  console.log('='.repeat(70));
  console.log('测试日期:', new Date().toLocaleString('zh-CN'));
  console.log('');
  console.log('【业务单据】');
  console.log('-'.repeat(70));
  results.documents.forEach((d: any) => {
    const v = results.vouchers.find((vv: any) => vv.id === d.voucherId);
    const voucherInfo = v ? ` -> 凭证: ${v.no} (${v.source})` : '';
    console.log(`  ${d.type.padEnd(8)} ${d.no.padEnd(20)} 状态: ${d.status.padEnd(10)}${voucherInfo}`);
  });
  console.log('');
  console.log('【自动生成凭证】');
  console.log('-'.repeat(70));
  results.vouchers.forEach((v: any, idx: number) => {
    console.log(`  凭证${idx + 1}: ${v.no}`);
    console.log(`    来源: ${v.source}  |  状态: ${v.status}`);
    console.log(`    摘要: ${v.summary}`);
    console.log(`    借方合计: ${v.totalDebit.toFixed(2)}  |  贷方合计: ${v.totalCredit.toFixed(2)}`);
    v.items.forEach((i: any) => {
      if (i.debit > 0) console.log(`      借  ${i.subject.padEnd(20)} ${i.debit.toFixed(2)}`);
      if (i.credit > 0) console.log(`      贷  ${i.subject.padEnd(20)} ${i.credit.toFixed(2)}`);
    });
    console.log('');
  });
  console.log('');
  console.log('【测试结论】');
  if (results.errors.length === 0 && results.vouchers.length === 3) {
    console.log('  ✓ OTC全流程测试通过！');
    console.log('  ✓ 销售订单 -> 发货单 -> 销售发票 -> 收款单 全部成功');
    console.log('  ✓ 自动生成3张凭证，借贷平衡，无异常');
  } else {
    console.log('  ✗ 存在问题，请检查上方的错误信息');
    results.errors.forEach((e: any) => console.log(`  错误: 步骤${e.step} - ${e.error}`));
  }
  console.log('='.repeat(70));

  // 保存报告
  const fs = require('fs');
  fs.writeFileSync('/Users/ttyy/Coding/LightERP_Claude/OTC_TEST_REPORT.md',
    '# OTC端到端测试报告\n\n' +
    '**测试日期:** ' + new Date().toLocaleString('zh-CN') + '\n\n' +
    '## 业务单据\n\n' +
    '| 单据类型 | 单据号 | 状态 | 关联凭证 |\n' +
    '|---------|--------|------|---------|\n' +
    results.documents.map((d: any) => {
      const v = results.vouchers.find((vv: any) => vv.id === d.voucherId);
      return '| ' + d.type + ' | ' + d.no + ' | ' + d.status + ' | ' + (v ? v.no : '-') + ' |';
    }).join('\n') +
    '\n\n## 自动生成凭证\n\n' +
    results.vouchers.map((v: any, idx: number) =>
      '### 凭证' + (idx + 1) + ': ' + v.no + '\n' +
      '- **来源:** ' + v.source + '\n' +
      '- **状态:** ' + v.status + '\n' +
      '- **摘要:** ' + v.summary + '\n' +
      '- **借方合计:** ' + v.totalDebit.toFixed(2) + '\n' +
      '- **贷方合计:** ' + v.totalCredit.toFixed(2) + '\n\n' +
      '| 方向 | 科目 | 金额 |\n' +
      '|-----|------|-----|\n' +
      v.items.map((i: any) =>
        '| ' + (i.debit > 0 ? '借' : '贷') + ' | ' + i.subject + ' | ' + (i.debit > 0 ? i.debit.toFixed(2) : i.credit.toFixed(2)) + ' |'
      ).join('\n')
    ).join('\n\n---\n\n') +
    '\n\n## 测试结论\n\n' +
    (results.errors.length === 0 && results.vouchers.length === 3
      ? '✓ OTC全流程测试通过！3张凭证全部自动生成，借贷平衡。'
      : '✗ 存在问题，需检查。')
  );
  console.log('\n报告已保存至: /Users/ttyy/Coding/LightERP_Claude/OTC_TEST_REPORT.md');
}

main().catch(e => { console.error('测试异常:', e); process.exit(1); }).finally(() => prisma.$disconnect());
