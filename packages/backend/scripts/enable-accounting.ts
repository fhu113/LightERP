import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const isEnabled = await prisma.systemConfig.findUnique({ where: { configKey: 'auto_generate_voucher_enabled' } });
  if (!isEnabled) {
    await prisma.systemConfig.create({
      data: { configKey: 'auto_generate_voucher_enabled', configValue: 'true' }
    });
  } else {
    await prisma.systemConfig.update({
      where: { configKey: 'auto_generate_voucher_enabled' },
      data: { configValue: 'true' }
    });
  }
  const receivable = await prisma.accountingSubject.findFirst({ where: { code: '1122' } });
  const revenue = await prisma.accountingSubject.findFirst({ where: { code: '6001' } });
  const tax = await prisma.accountingSubject.findFirst({ where: { code: '20020010' } });
  
  if (!receivable || !revenue || !tax) {
    console.error('Subjects not found!', {receivable, revenue, tax});
    return;
  }
  
  const configs = [
    { key: 'otc.invoice.receivable_subject_id', val: receivable.id },
    { key: 'otc.invoice.revenue_subject_id', val: revenue.id },
    { key: 'otc.invoice.tax_subject_id', val: tax.id },
    { key: 'otc.invoice.auto_post', val: 'true' }
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: c.key },
      update: { configValue: c.val },
      create: { configKey: c.key, configValue: c.val }
    });
  }
  const invoice = await prisma.salesInvoice.findFirst({
    where: { invoiceNo: 'INV-20260315-0001' }
  });
  if (invoice) {
    await prisma.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'DRAFT',
          voucher: invoice.voucherId ? { disconnect: true } : undefined
        }
    });
    console.log('Invoice reset to DRAFT.');
  }
  console.log('Accounting engine enabled and configured successfully.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
