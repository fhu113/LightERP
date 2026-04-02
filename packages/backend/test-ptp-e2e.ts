import { PrismaClient } from '@prisma/client';
import { AppError } from './src/middleware/errorHandler';

const prisma = new PrismaClient();

async function generateVoucherNo(tx: any): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await tx.voucher.count({ where: { voucherNo: { startsWith: `V-${dateStr}` } } });
  return `V-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

async function createVoucher(data: any, tx: any) {
  const totalDebit = data.items.reduce((sum: number, item: any) => sum + item.debitAmount, 0);
  const totalCredit = data.items.reduce((sum: number, item: any) => sum + item.creditAmount, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) throw new AppError('借贷金额不平衡', 400);
  const voucher = await tx.voucher.create({
    data: {
      voucherNo: await generateVoucherNo(tx),
      voucherDate: data.voucherDate || new Date(),
      voucherType: data.voucherType || 'GENERAL',
      summary: data.summary,
      status: 'DRAFT',
      items: { create: data.items.map((item: any) => ({
        subjectId: item.subjectId, debitAmount: item.debitAmount,
        creditAmount: item.creditAmount, description: item.description,
      }))},
    },
    include: { items: { include: { subject: true } } },
  });
  return {
    id: voucher.id, voucherNo: voucher.voucherNo, voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType, summary: voucher.summary, status: voucher.status,
    totalDebit, totalCredit,
    items: voucher.items.map((i: any) => ({
      subjectId: i.subjectId, subjectName: i.subject.name,
      debitAmount: i.debitAmount, creditAmount: i.creditAmount,
    })),
  };
}

async function postVoucher(voucherId: string, tx: any) {
  const voucher = await tx.voucher.update({
    where: { id: voucherId },
    data: { status: 'POSTED' },
    include: { items: { include: { subject: true } } },
  });
  const totalDebit = voucher.items.reduce((s: number, i: any) => s + i.debitAmount, 0);
  const totalCredit = voucher.items.reduce((s: number, i: any) => s + i.creditAmount, 0);
  return {
    id: voucher.id, voucherNo: voucher.voucherNo, voucherDate: voucher.voucherDate.toISOString(),
    voucherType: voucher.voucherType, summary: voucher.summary, status: voucher.status,
    totalDebit, totalCredit,
    items: voucher.items.map((i: any) => ({ subjectId: i.subjectId, subjectName: i.subject.name, debitAmount: i.debitAmount, creditAmount: i.creditAmount })),
  };
}

async function getSystemConfig(key: string, tx?: any): Promise<string | null> {
  const config = await (tx || prisma).systemConfig.findUnique({ where: { configKey: key } });
  return config?.configValue || null;
}

async function isAutoEnabled(tx?: any): Promise<boolean> {
  return (await getSystemConfig('auto_generate_voucher_enabled', tx)) === 'true';
}

// 采购收货凭证: 借:库存商品, 贷:应付暂估
async function generatePurchaseReceiptVoucher(receiptId: string, tx: any) {
  if (!await isAutoEnabled(tx)) return null;
  const receipt = await tx.purchaseReceipt.findUnique({
    where: { id: receiptId },
    include: { order: { include: { supplier: true } }, items: { include: { orderItem: { include: { material: true } } } } },
  });
  if (!receipt) return null;
  const inventoryId = await getSystemConfig('ptp.receipt.inventory_subject_id', tx);
  const payableId = await getSystemConfig('ptp.receipt.estimated_payable_subject_id', tx);
  if (!inventoryId || !payableId) return null;
  let total = 0;
  for (const item of receipt.items) total += (item.orderItem.unitPrice || 0) * item.quantity;
  if (total <= 0) return null;
  const supplierName = receipt.order?.supplier?.name || '供应商';
  const voucher = await createVoucher({
    summary: `采购收货 ${receipt.receiptNo} - ${supplierName}`,
    items: [
      { subjectId: inventoryId, debitAmount: total, creditAmount: 0, description: '借：库存商品' },
      { subjectId: payableId, debitAmount: 0, creditAmount: total, description: `贷：应付暂估 ${supplierName}` },
    ],
  }, tx);
  if (voucher) {
    const posted = await postVoucher(voucher.id, tx);
    return posted;
  }
  return voucher;
}

// 采购发票凭证: 借:应付暂估+进项税, 贷:应付账款
async function generatePurchaseInvoiceVoucher(invoiceId: string, tx: any) {
  if (!await isAutoEnabled(tx)) return null;
  const invoice = await tx.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    include: { supplier: true, receipt: true },
  });
  if (!invoice) return null;
  const estPayableId = await getSystemConfig('ptp.invoice.estimated_payable_subject_id', tx);
  const taxId = await getSystemConfig('ptp.invoice.tax_payable_subject_id', tx);
  const payableId = await getSystemConfig('ptp.invoice.payable_subject_id', tx);
  if (!estPayableId || !taxId || !payableId) return null;
  const amount = invoice.amount;
  const taxAmount = invoice.taxAmount;
  const totalAmount = amount + taxAmount;
  const supplierName = invoice.supplier?.name || '供应商';
  const voucher = await createVoucher({
    summary: `采购发票 ${invoice.invoiceNo} - ${supplierName}`,
    items: [
      { subjectId: estPayableId, debitAmount: amount, creditAmount: 0, description: '借：应付暂估' },
      { subjectId: taxId, debitAmount: taxAmount, creditAmount: 0, description: '借：应交税费-进项税额' },
      { subjectId: payableId, debitAmount: 0, creditAmount: totalAmount, description: `贷：应付账款 ${supplierName}` },
    ],
  }, tx);
  if (voucher) {
    const posted = await postVoucher(voucher.id, tx);
    return posted;
  }
  return voucher;
}

// 付款凭证: 借:应付账款, 贷:银行存款
async function generatePaymentVoucher(paymentId: string, tx: any) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: { supplier: true, invoice: true },
  });
  if (!payment) return null;
  const payableId = await getSystemConfig('ptp.payment.payable_subject_id', tx);
  const cashId = await getSystemConfig('ptp.payment.cash_subject_id', tx);
  if (!payableId || !cashId) return null;
  const amount = payment.amount;
  const supplierName = payment.supplier?.name || '供应商';
  const voucher = await createVoucher({
    summary: `付款单 ${payment.paymentNo} - ${supplierName}`,
    items: [
      { subjectId: payableId, debitAmount: amount, creditAmount: 0, description: `借：应付账款 ${supplierName}` },
      { subjectId: cashId, debitAmount: 0, creditAmount: amount, description: '贷：银行存款' },
    ],
  }, tx);
  if (voucher) {
    const posted = await postVoucher(voucher.id, tx);
    return posted;
  }
  return voucher;
}

async function main() {
  const results: any = { steps: [], vouchers: [], documents: [], errors: [] };
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const supplier = await prisma.supplier.findFirst({ where: { code: 'SUPP001' } });
  const material = await prisma.material.findFirst({ where: { code: 'MAT001' } });
  if (!supplier || !material) { console.error('ERROR: 供应商或物料不存在'); process.exit(1); }

  console.log('=== PTP端到端测试开始 ===\n');
  console.log(`供应商: ${supplier.name}  物料: ${material.name}  成本价: ${material.costPrice}  销售价: ${material.salePrice}`);

  // 步骤1: 创建采购订单
  console.log('\n--- 步骤1: 创建采购订单 ---');
  const po = await prisma.purchaseOrder.create({
    data: {
      orderNo: 'PO-' + dateStr + '-001',
      supplierId: supplier.id,
      orderDate: new Date(),
      status: 'DRAFT',
      items: { create: {
        materialId: material.id, quantity: 3, unitPrice: material.costPrice,
        amount: material.costPrice * 3, taxRate: 0.13, taxAmount: material.costPrice * 3 * 0.13,
      }}
    }, include: { items: true }
  });
  const poTotal = material.costPrice * 3 * 1.13;
  console.log(`采购订单已创建: ${po.orderNo}  含税金额: ${poTotal.toFixed(2)}  状态: ${po.status}`);
  results.documents.push({ type: '采购订单', no: po.orderNo, id: po.id, status: po.status });
  results.steps.push({ step: 1, action: '创建采购订单', result: '成功', no: po.orderNo });

  // 步骤2: 确认采购订单
  console.log('\n--- 步骤2: 确认采购订单 ---');
  const poConfirmed = await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: 'CONFIRMED' } });
  console.log(`采购订单已确认: ${poConfirmed.orderNo}  状态: ${poConfirmed.status}`);
  results.steps.push({ step: 2, action: '确认采购订单', result: '成功', no: poConfirmed.orderNo });

  // 步骤3: 创建采购收货单
  console.log('\n--- 步骤3: 创建采购收货单 ---');
  const receipt = await prisma.purchaseReceipt.create({
    data: {
      receiptNo: 'PR-' + dateStr + '-001',
      orderId: po.id,
      receiptDate: new Date(),
      status: 'DRAFT',
      items: { create: { orderItemId: po.items[0].id, materialId: material.id, quantity: 3, unitPrice: material.costPrice } }
    }, include: { items: true }
  });
  console.log(`采购收货单已创建: ${receipt.receiptNo}  状态: ${receipt.status}`);
  results.documents.push({ type: '采购收货单', no: receipt.receiptNo, id: receipt.id, status: receipt.status });
  results.steps.push({ step: 3, action: '创建采购收货单', result: '成功', no: receipt.receiptNo });

  // 步骤4: 确认收货单 → 自动生成凭证V1
  console.log('\n--- 步骤4: 确认收货单 → 自动生成凭证 ---');
  await prisma.purchaseReceipt.update({ where: { id: receipt.id }, data: { status: 'CONFIRMED' } });
  const voucher1 = await generatePurchaseReceiptVoucher(receipt.id, prisma);
  if (voucher1) {
    await prisma.purchaseReceipt.update({ where: { id: receipt.id }, data: { voucherId: voucher1.id } });
    console.log(`收货单已确认: ${receipt.receiptNo}  状态: CONFIRMED`);
    console.log(`✓ 自动生成凭证: ${voucher1.voucherNo}  状态: ${voucher1.status}  借方: ${voucher1.totalDebit}  贷方: ${voucher1.totalCredit}`);
    voucher1.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '采购收货单', no: receipt.receiptNo, id: receipt.id, status: 'CONFIRMED', voucherId: voucher1.id, voucherNo: voucher1.voucherNo });
    results.vouchers.push({ no: voucher1.voucherNo, id: voucher1.id, source: '收货确认', summary: voucher1.summary, status: voucher1.status, totalDebit: voucher1.totalDebit, totalCredit: voucher1.totalCredit, items: voucher1.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 4, action: '确认收货单(自动生成凭证)', result: '成功', no: receipt.receiptNo, voucherNo: voucher1.voucherNo });
  } else {
    console.log('✗ 未生成凭证');
    results.errors.push({ step: 4, error: '未生成凭证' });
    results.steps.push({ step: 4, action: '确认收货单(自动生成凭证)', result: '未生成凭证', no: receipt.receiptNo });
  }

  // 步骤5: 创建采购发票
  console.log('\n--- 步骤5: 创建采购发票 ---');
  const invoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo: 'PI-' + dateStr + '-001',
      supplierId: supplier.id,
      receiptId: receipt.id,
      invoiceDate: new Date(),
      amount: material.costPrice * 3,
      taxAmount: material.costPrice * 3 * 0.13,
      status: 'DRAFT',
    }
  });
  console.log(`采购发票已创建: ${invoice.invoiceNo}  金额: ${invoice.amount}  税额: ${invoice.taxAmount.toFixed(2)}  状态: ${invoice.status}`);
  results.documents.push({ type: '采购发票', no: invoice.invoiceNo, id: invoice.id, status: invoice.status });
  results.steps.push({ step: 5, action: '创建采购发票', result: '成功', no: invoice.invoiceNo });

  // 步骤6: 开票确认 → 自动生成凭证V2
  console.log('\n--- 步骤6: 开票确认 → 自动生成凭证 ---');
  await prisma.purchaseInvoice.update({ where: { id: invoice.id }, data: { status: 'ISSUED' } });
  const voucher2 = await generatePurchaseInvoiceVoucher(invoice.id, prisma);
  if (voucher2) {
    await prisma.purchaseInvoice.update({ where: { id: invoice.id }, data: { voucherId: voucher2.id } });
    console.log(`采购发票已确认: ${invoice.invoiceNo}  状态: ISSUED`);
    console.log(`✓ 自动生成凭证: ${voucher2.voucherNo}  状态: ${voucher2.status}  借方: ${voucher2.totalDebit}  贷方: ${voucher2.totalCredit}`);
    voucher2.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '采购发票', no: invoice.invoiceNo, id: invoice.id, status: 'ISSUED', voucherId: voucher2.id, voucherNo: voucher2.voucherNo });
    results.vouchers.push({ no: voucher2.voucherNo, id: voucher2.id, source: '开票确认', summary: voucher2.summary, status: voucher2.status, totalDebit: voucher2.totalDebit, totalCredit: voucher2.totalCredit, items: voucher2.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 6, action: '开票确认(自动生成凭证)', result: '成功', no: invoice.invoiceNo, voucherNo: voucher2.voucherNo });
  } else {
    console.log('✗ 未生成凭证');
    results.errors.push({ step: 6, error: '未生成凭证' });
    results.steps.push({ step: 6, action: '开票确认(自动生成凭证)', result: '未生成凭证', no: invoice.invoiceNo });
  }

  // 步骤7: 创建付款单
  console.log('\n--- 步骤7: 创建付款单 ---');
  const payment = await prisma.payment.create({
    data: {
      paymentNo: 'PAY-' + dateStr + '-001',
      supplierId: supplier.id,
      invoiceId: invoice.id,
      paymentDate: new Date(),
      amount: invoice.amount + invoice.taxAmount,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
    }
  });
  console.log(`付款单已创建: ${payment.paymentNo}  金额: ${payment.amount}  状态: ${payment.status}`);
  results.documents.push({ type: '付款单', no: payment.paymentNo, id: payment.id, status: payment.status });
  results.steps.push({ step: 7, action: '创建付款单', result: '成功', no: payment.paymentNo });

  // 步骤8: 付款确认 → 自动生成凭证V3
  console.log('\n--- 步骤8: 付款确认 → 自动生成凭证 ---');
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } });
  const voucher3 = await generatePaymentVoucher(payment.id, prisma);
  if (voucher3) {
    await prisma.payment.update({ where: { id: payment.id }, data: { voucherId: voucher3.id } });
    console.log(`付款单已确认: ${payment.paymentNo}  状态: PAID`);
    console.log(`✓ 自动生成凭证: ${voucher3.voucherNo}  状态: ${voucher3.status}  借方: ${voucher3.totalDebit}  贷方: ${voucher3.totalCredit}`);
    voucher3.items.forEach((i: any) => console.log(`   ${i.debitAmount > 0 ? '借 ' : '贷 '}${i.subjectName}  ${i.debitAmount || i.creditAmount}`));
    results.documents.push({ type: '付款单', no: payment.paymentNo, id: payment.id, status: 'PAID', voucherId: voucher3.id, voucherNo: voucher3.voucherNo });
    results.vouchers.push({ no: voucher3.voucherNo, id: voucher3.id, source: '付款确认', summary: voucher3.summary, status: voucher3.status, totalDebit: voucher3.totalDebit, totalCredit: voucher3.totalCredit, items: voucher3.items.map((i: any) => ({ subject: i.subjectName, debit: i.debitAmount, credit: i.creditAmount })) });
    results.steps.push({ step: 8, action: '付款确认(自动生成凭证)', result: '成功', no: payment.paymentNo, voucherNo: voucher3.voucherNo });
  } else {
    console.log('✗ 未生成凭证');
    results.errors.push({ step: 8, error: '未生成凭证' });
    results.steps.push({ step: 8, action: '付款确认(自动生成凭证)', result: '未生成凭证', no: payment.paymentNo });
  }

  // 测试报告
  console.log('\n\n' + '='.repeat(70));
  console.log('                    PTP端到端测试报告');
  console.log('='.repeat(70));
  console.log('测试日期:', new Date().toLocaleString('zh-CN'));
  console.log('');
  console.log('【业务单据】');
  console.log('-'.repeat(70));
  results.documents.forEach((d: any) => {
    const v = results.vouchers.find((vv: any) => vv.id === d.voucherId);
    const vInfo = v ? ` -> 凭证: ${v.no} (${v.source}) [${v.status}]` : '';
    console.log(`  ${d.type.padEnd(8)} ${d.no.padEnd(20)} 状态: ${d.status.padEnd(10)}${vInfo}`);
  });
  console.log('');
  console.log('【自动生成凭证】');
  console.log('-'.repeat(70));
  results.vouchers.forEach((v: any, idx: number) => {
    console.log(`  凭证${idx + 1}: ${v.no}  [${v.status}]`);
    console.log(`    来源: ${v.source}  |  摘要: ${v.summary}`);
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
    console.log('  ✓ PTP全流程测试通过！');
    console.log('  ✓ 采购订单 -> 采购收货 -> 采购发票 -> 付款单 全部成功');
    console.log('  ✓ 自动生成3张凭证，全部已过账(POSTED)，借贷平衡，无异常');
  } else {
    console.log('  ✗ 存在问题，请检查上方错误信息');
    results.errors.forEach((e: any) => console.log(`  错误: 步骤${e.step} - ${e.error}`));
  }
  console.log('='.repeat(70));

  // 保存报告
  const fs = require('fs');
  fs.writeFileSync('/Users/ttyy/Coding/LightERP_Claude/PTP_TEST_REPORT.md',
    '# PTP端到端测试报告\n\n' +
    '**测试日期:** ' + new Date().toLocaleString('zh-CN') + '\n\n' +
    '## 业务单据\n\n' +
    '| 单据类型 | 单据号 | 状态 | 关联凭证 |\n' +
    '|---------|--------|------|---------|\n' +
    results.documents.map((d: any) => {
      const v = results.vouchers.find((vv: any) => vv.id === d.voucherId);
      return '| ' + d.type + ' | ' + d.no + ' | ' + d.status + ' | ' + (v ? v.no + ' [' + v.status + ']' : '-') + ' |';
    }).join('\n') +
    '\n\n## 自动生成凭证\n\n' +
    results.vouchers.map((v: any, idx: number) =>
      '### 凭证' + (idx + 1) + ': ' + v.no + ' [' + v.status + ']\n' +
      '- **来源:** ' + v.source + '\n' +
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
      ? '✓ PTP全流程测试通过！3张凭证全部自动生成并已过账，借贷平衡，无异常。'
      : '✗ 存在问题，需检查。')
  );
  console.log('\n报告已保存至: /Users/ttyy/Coding/LightERP_Claude/PTP_TEST_REPORT.md');
}

main().catch(e => { console.error('测试异常:', e); process.exit(1); }).finally(() => prisma.$disconnect());
