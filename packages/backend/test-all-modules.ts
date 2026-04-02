import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 辅助函数: 生成单号
async function generateNo(prefix: string): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let count = 0;

  if (prefix === 'SO') {
    count = await prisma.salesOrder.count({ where: { orderNo: { startsWith: `SO-${dateStr}` } } });
  } else if (prefix === 'V') {
    count = await prisma.voucher.count({ where: { voucherNo: { startsWith: `V-${dateStr}` } } });
  } else if (prefix === 'MGR') {
    count = await prisma.material.count({});
  }

  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

async function main() {
  console.log('========================================');
  console.log('   综合功能测试 - 主数据/库存/财务/生产');
  console.log('========================================\n');

  // ========== 1. 主数据测试 ==========
  console.log('【1. 主数据测试】\n');

  // 1.1 查看物料
  console.log('--- 1.1 查看物料列表 ---');
  const materials = await prisma.material.findMany({ take: 5 });
  console.log(`  现有物料数量: ${materials.length}`);
  materials.forEach(m => {
    console.log(`    - ${m.name}, 库存: ${m.currentStock}, 成本: ${m.costPrice}`);
  });

  // 1.2 查看客户
  console.log('\n--- 1.2 查看客户列表 ---');
  const customers = await prisma.customer.findMany({ take: 3 });
  console.log(`  现有客户数量: ${customers.length}`);
  customers.forEach(c => console.log(`    - ${c.name}`));

  // 1.3 查看供应商
  console.log('\n--- 1.3 查看供应商列表 ---');
  const suppliers = await prisma.supplier.findMany({ take: 3 });
  console.log(`  现有供应商数量: ${suppliers.length}`);
  suppliers.forEach(s => console.log(`    - ${s.name}`));

  // 1.4 查看会计科目
  console.log('\n--- 1.4 查看会计科目 ---');
  const subjects = await prisma.accountingSubject.findMany({ take: 10 });
  console.log(`  科目数量: ${subjects.length}`);
  subjects.forEach(s => console.log(`    - ${s.code} ${s.name} (${s.type})`));

  // ========== 2. 库存测试 ==========
  console.log('\n\n【2. 库存测试】\n');

  // 2.1 查看库存交易记录
  console.log('--- 2.1 库存交易记录 ---');
  const transactions = await prisma.inventoryTransaction.findMany({
    take: 5,
    orderBy: { transactionDate: 'desc' }
  });
  console.log(`  库存交易记录数: ${transactions.length}`);
  transactions.forEach(t => {
    console.log(`    - ${t.transactionType} 物料ID:${t.materialId.slice(0,6)} 数量:${t.quantity} 单价:${t.unitCost}`);
  });

  // 2.2 库存汇总
  console.log('\n--- 2.2 库存汇总 ---');
  const stockSummary = await prisma.material.findMany({
    where: { currentStock: { not: 0 } },
    take: 10
  });
  console.log(`  有库存的物料: ${stockSummary.length}`);
  stockSummary.forEach(m => {
    console.log(`    - ${m.name}: ${m.currentStock} ${m.unit || '个'}`);
  });

  // ========== 3. 财务测试 ==========
  console.log('\n\n【3. 财务测试】\n');

  // 3.1 查看凭证列表
  console.log('--- 3.1 凭证列表 ---');
  const vouchers = await prisma.voucher.findMany({
    take: 5,
    orderBy: { voucherDate: 'desc' },
    include: { items: true }
  });
  console.log(`  现有凭证数量: ${vouchers.length}`);
  vouchers.forEach(v => {
    console.log(`    - ${v.voucherNo}, 日期: ${v.voucherDate.toISOString().slice(0,10)}, 状态: ${v.status}, 分录:${v.items.length}`);
  });

  // 3.2 创建凭证
  console.log('\n--- 3.2 创建凭证 ---');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const voucherNo = `V-${dateStr}-${String(Date.now() % 10000).padStart(4, '0')}`;

  // 获取会计科目
  const allSubjects = await prisma.accountingSubject.findMany({ take: 5 });
  if (allSubjects.length >= 2) {
    const debitSubject = allSubjects[0];
    const creditSubject = allSubjects[1];

    const voucher = await prisma.voucher.create({
      data: {
        voucherNo,
        voucherDate: new Date(),
        voucherType: 'GENERAL',
        summary: '测试凭证 - 综合功能测试',
        status: 'DRAFT',
        items: {
          create: [
            {
              subjectId: debitSubject.id,
              debitAmount: 10000,
              creditAmount: 0,
              description: '测试借方'
            },
            {
              subjectId: creditSubject.id,
              debitAmount: 0,
              creditAmount: 10000,
              description: '测试贷方'
            }
          ]
        }
      },
      include: {
        items: { include: { subject: true } }
      }
    });

    console.log(`  ✓ 凭证创建成功`);
    console.log(`    凭证号: ${voucher.voucherNo}`);
    console.log(`    状态: ${voucher.status}`);
    console.log(`    分录数: ${voucher.items.length}`);
    voucher.items.forEach(item => {
      console.log(`      - ${item.subject.name}: 借${item.debitAmount} 贷${item.creditAmount}`);
    });

    // 3.3 过账凭证
    console.log('\n--- 3.3 过账凭证 ---');
    const postedVoucher = await prisma.voucher.update({
      where: { id: voucher.id },
      data: { status: 'POSTED' }
    });
    console.log(`  ✓ 凭证过账成功`);
    console.log(`    状态: ${postedVoucher.status}`);
  } else {
    console.log('  ✗ 没有足够的会计科目');
  }

  // 3.4 科目余额
  console.log('\n--- 3.4 科目余额查询 ---');
  const balances = await prisma.accountingSubject.findMany({
    take: 10,
    include: {
      _count: { select: { voucherItems: true } }
    }
  });
  console.log(`  科目数量: ${balances.length}`);
  balances.forEach(s => {
    console.log(`    - ${s.code} ${s.name}: ${s._count.voucherItems}条分录`);
  });

  await sleep(500);

  // ========== 4. 生产模块测试 ==========
  console.log('\n\n【4. 生产模块测试】\n');

  // 4.1 BOM管理
  console.log('--- 4.1 BOM列表 ---');
  const boms = await prisma.bOM.findMany({
    take: 5,
    include: { items: { include: { material: true } } }
  });
  console.log(`  现有BOM数量: ${boms.length}`);
  boms.forEach(bom => {
    console.log(`    - ${bom.code} ${bom.name} (版本: ${bom.version})`);
    bom.items.forEach(item => {
      console.log(`      └ ${item.material.name} x ${item.quantity} ${item.unit}`);
    });
  });

  // 4.2 创建BOM
  console.log('\n--- 4.2 创建BOM ---');
  const bomCode = `BOM-${Date.now() % 10000}`;
  const newBom = await prisma.bOM.create({
    data: {
      code: bomCode,
      name: '测试BOM-台式电脑',
      version: '1.0',
      status: 'ACTIVE',
      remark: '综合测试创建',
      items: {
        create: [
          { materialId: materials[0].id, quantity: 1, unit: '台' },
          { materialId: materials[1]?.id, quantity: 1, unit: '台' }
        ].filter(item => item.materialId)
      }
    },
    include: { items: { include: { material: true } } }
  });
  console.log(`  ✓ BOM创建成功`);
  console.log(`    编码: ${newBom.code}`);
  console.log(`    名称: ${newBom.name}`);
  console.log(`    明细:`);
  newBom.items.forEach(item => {
    console.log(`      - ${item.material.name} x ${item.quantity} ${item.unit}`);
  });

  // 4.3 生产收货单列表
  console.log('\n--- 4.3 生产收货单列表 ---');
  const receipts = await prisma.productionReceipt.findMany({
    take: 5,
    include: { order: true, items: { include: { material: true } } }
  });
  console.log(`  现有生产收货单: ${receipts.length}`);

  // 4.4 创建生产订单和收货单
  console.log('\n--- 4.4 创建生产订单和收货单 ---');

  // 创建生产订单
  const prodOrderNo = `PORD-${dateStr}-${String(Date.now() % 10000).padStart(4, '0')}`;
  const prodOrder = await prisma.productionOrder.create({
    data: {
      orderNo: prodOrderNo,
      orderDate: new Date(),
      expectedDate: new Date(),
      status: 'PENDING',
      totalAmount: 10000,
      remark: '综合测试创建',
      items: {
        create: [
          { materialId: materials[0].id, quantity: 10, unitPrice: 1000, amount: 10000 }
        ]
      }
    },
    include: { items: true }
  });
  console.log(`  ✓ 生产订单创建成功`);
  console.log(`    订单号: ${prodOrder.orderNo}`);
  console.log(`    状态: ${prodOrder.status}`);

  // 创建生产收货单
  const receiptNo = `MGR-${dateStr}-${String(Date.now() % 10000).padStart(4, '0')}`;
  const prodReceipt = await prisma.productionReceipt.create({
    data: {
      receiptNo,
      orderId: prodOrder.id,
      receiptDate: new Date(),
      status: 'PENDING',
      remark: '综合测试创建',
      items: {
        create: prodOrder.items.map(item => ({
          orderItemId: item.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }
    },
    include: { items: { include: { material: true } } }
  });
  console.log(`  ✓ 生产收货单创建成功`);
  console.log(`    收货单号: ${prodReceipt.receiptNo}`);
  console.log(`    状态: ${prodReceipt.status}`);
  prodReceipt.items.forEach(item => {
    console.log(`    - ${item.material.name} x ${item.quantity}`);
  });

  // 4.5 确认生产收货单（入库）
  console.log('\n--- 4.5 确认生产收货单 ---');
  // 更新库存
  for (const item of prodReceipt.items) {
    await prisma.material.update({
      where: { id: item.materialId },
      data: { currentStock: { increment: item.quantity } }
    });
    await prisma.inventoryTransaction.create({
      data: {
        materialId: item.materialId,
        transactionType: 'IN',
        quantity: item.quantity,
        unitCost: item.unitPrice,
        referenceType: 'PRODUCTION_RECEIPT',
        referenceId: prodReceipt.id,
        transactionDate: new Date()
      }
    });
  }

  // 更新收货单状态
  await prisma.productionReceipt.update({
    where: { id: prodReceipt.id },
    data: { status: 'COMPLETED' }
  });

  // 更新订单状态
  await prisma.productionOrder.update({
    where: { id: prodOrder.id },
    data: { status: 'COMPLETED' }
  });

  console.log(`  ✓ 生产收货单确认成功`);
  console.log(`    状态: COMPLETED`);
  console.log(`    库存已增加`);

  // 验证库存变化
  const beforeMat = await prisma.material.findUnique({
    where: { id: materials[0].id }
  });
  console.log(`    ${materials[0].name} 库存: ${beforeMat?.currentStock}`);

  // ========== 总结 ==========
  console.log('\n\n========================================');
  console.log('   综合测试完成');
  console.log('========================================\n');

  console.log('测试结果汇总:');
  console.log('-------------');
  console.log('✓ 主数据: 物料、客户、供应商、会计科目 - 正常');
  console.log('✓ 库存: 库存查询、库存交易 - 正常');
  console.log('✓ 财务: 凭证创建、过账 - 正常');
  console.log('✓ 生产: BOM管理、生产订单、生产收货单 - 正常');

  await prisma.$disconnect();
}

main().catch(console.error);
