import { prisma } from '../lib/prisma';

// 系统配置 key 定义
export const CONFIG_KEYS = {
  // OTC 流程凭证科目配置
  OTC_DELIVERY_COST_SUBJECT_ID: 'otc.delivery.cost_subject_id', // 发货-主营业务成本科目
  OTC_DELIVERY_INVENTORY_SUBJECT_ID: 'otc.delivery.inventory_subject_id', // 发货-库存商品科目
  OTC_INVOICE_RECEIVABLE_SUBJECT_ID: 'otc.invoice.receivable_subject_id', // 发票-应收账款科目
  OTC_INVOICE_REVENUE_SUBJECT_ID: 'otc.invoice.revenue_subject_id', // 发票-主营业务收入科目
  OTC_INVOICE_TAX_SUBJECT_ID: 'otc.invoice.tax_subject_id', // 发票-销项税科目
  OTC_RECEIPT_RECEIVABLE_SUBJECT_ID: 'otc.receipt.receivable_subject_id', // 收款-应收账款科目
  OTC_RECEIPT_CASH_SUBJECT_ID: 'otc.receipt.cash_subject_id', // 收款-银行存款科目

  // PTP 流程凭证科目配置
  PTP_RECEIPT_INVENTORY_SUBJECT_ID: 'ptp.receipt.inventory_subject_id', // 收货-库存商品科目
  PTP_RECEIPT_TAX_SUBJECT_ID: 'ptp.receipt.tax_subject_id', // 收货-进项税科目
  PTP_RECEIPT_PAYABLE_SUBJECT_ID: 'ptp.receipt.payable_subject_id', // 收货-应付账款科目
  PTP_PAYMENT_PAYABLE_SUBJECT_ID: 'ptp.payment.payable_subject_id', // 付款-应付账款科目
  PTP_PAYMENT_CASH_SUBJECT_ID: 'ptp.payment.cash_subject_id', // 付款-银行存款科目

  // 是否启用自动生成凭证
  AUTO_GENERATE_VOUCHER_ENABLED: 'auto_generate_voucher_enabled',
};

// 获取系统配置值
export async function getSystemConfig(key: string): Promise<string | null> {
  const config = await prisma.systemConfig.findUnique({
    where: { configKey: key },
  });
  return config?.configValue || null;
}

// 设置系统配置值
export async function setSystemConfig(key: string, value: string, description?: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { configKey: key },
    update: { configValue: value },
    create: { configKey: key, configValue: value, description },
  });
}

// 获取科目ID配置
export async function getSubjectIdFromConfig(key: string): Promise<string | null> {
  return getSystemConfig(key);
}

// 检查是否启用自动生成凭证
export async function isAutoGenerateVoucherEnabled(): Promise<boolean> {
  const value = await getSystemConfig(CONFIG_KEYS.AUTO_GENERATE_VOUCHER_ENABLED);
  return value === 'true';
}
