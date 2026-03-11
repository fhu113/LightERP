import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('开始清理数据库...');

  try {
    // 按外键依赖顺序删除业务数据

    // 1. 删除凭证分录
    console.log('删除凭证分录...');
    await prisma.voucherItem.deleteMany();
    console.log('凭证分录已删除');

    // 2. 删除凭证
    console.log('删除凭证...');
    await prisma.voucher.deleteMany();
    console.log('凭证已删除');

    // 3. 删除收款单（依赖销售发票）
    console.log('删除收款单...');
    await prisma.receipt.deleteMany();
    console.log('收款单已删除');

    // 4. 删除付款单（依赖采购发票）
    console.log('删除付款单...');
    await prisma.payment.deleteMany();
    console.log('付款单已删除');

    // 5. 删除销售发票（依赖销售订单、客户）
    console.log('删除销售发票...');
    await prisma.salesInvoice.deleteMany();
    console.log('销售发票已删除');

    // 6. 删除采购发票（依赖供应商、采购收货单）
    console.log('删除采购发票...');
    await prisma.purchaseInvoice.deleteMany();
    console.log('采购发票已删除');

    // 7. 删除发货明细（依赖销售订单明细、物料）
    console.log('删除发货明细...');
    await prisma.deliveryItem.deleteMany();
    console.log('发货明细已删除');

    // 8. 删除发货单（依赖销售订单）
    console.log('删除发货单...');
    await prisma.delivery.deleteMany();
    console.log('发货单已删除');

    // 9. 删除采购收货明细（依赖采购订单明细、物料）
    console.log('删除采购收货明细...');
    await prisma.purchaseReceiptItem.deleteMany();
    console.log('采购收货明细已删除');

    // 10. 删除采购收货单（依赖采购订单）
    console.log('删除采购收货单...');
    await prisma.purchaseReceipt.deleteMany();
    console.log('采购收货单已删除');

    // 11. 删除销售订单明细（依赖物料）
    console.log('删除销售订单明细...');
    await prisma.salesOrderItem.deleteMany();
    console.log('销售订单明细已删除');

    // 12. 删除销售订单（依赖客户）
    console.log('删除销售订单...');
    await prisma.salesOrder.deleteMany();
    console.log('销售订单已删除');

    // 13. 删除采购订单明细（依赖物料）
    console.log('删除采购订单明细...');
    await prisma.purchaseOrderItem.deleteMany();
    console.log('采购订单明细已删除');

    // 14. 删除采购订单（依赖供应商）
    console.log('删除采购订单...');
    await prisma.purchaseOrder.deleteMany();
    console.log('采购订单已删除');

    // 15. 删除库存交易（依赖物料）
    console.log('删除库存交易...');
    await prisma.inventoryTransaction.deleteMany();
    console.log('库存交易已删除');

    // 16. 删除客户
    console.log('删除客户...');
    await prisma.customer.deleteMany();
    console.log('客户已删除');

    // 17. 删除供应商
    console.log('删除供应商...');
    await prisma.supplier.deleteMany();
    console.log('供应商已删除');

    // 18. 删除物料
    console.log('删除物料...');
    await prisma.material.deleteMany();
    console.log('物料已删除');

    // 19. 删除用户
    console.log('删除用户...');
    await prisma.user.deleteMany();
    console.log('用户已删除');

    // 20. 删除系统配置（可选）
    console.log('删除系统配置...');
    await prisma.systemConfig.deleteMany();
    console.log('系统配置已删除');

    console.log('✅ 数据库清理完成！所有业务数据已删除。');
    console.log('✅ 会计科目已保留。');

  } catch (error) {
    console.error('❌ 清理数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
