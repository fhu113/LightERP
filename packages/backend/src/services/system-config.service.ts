import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

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
  PTP_RECEIPT_ESTIMATED_PAYABLE_SUBJECT_ID: 'ptp.receipt.estimated_payable_subject_id', // 收货-应付暂估科目
  PTP_RECEIPT_AUTO_POST: 'ptp.receipt.auto_post', // 收货-自动过账

  PTP_INVOICE_ESTIMATED_PAYABLE_SUBJECT_ID: 'ptp.invoice.estimated_payable_subject_id', // 发票-应付暂估科目
  PTP_INVOICE_TAX_PAYABLE_SUBJECT_ID: 'ptp.invoice.tax_payable_subject_id', // 发票-应付账款-进项税科目
  PTP_INVOICE_PAYABLE_SUBJECT_ID: 'ptp.invoice.payable_subject_id', // 发票-应付账款科目
  PTP_INVOICE_AUTO_POST: 'ptp.invoice.auto_post', // 发票-自动过账

  PTP_PAYMENT_PAYABLE_SUBJECT_ID: 'ptp.payment.payable_subject_id', // 付款-应付账款科目
  PTP_PAYMENT_CASH_SUBJECT_ID: 'ptp.payment.cash_subject_id', // 付款-银行存款科目
  PTP_PAYMENT_AUTO_POST: 'ptp.payment.auto_post', // 付款-自动过账

  // 库存调整凭证科目配置
  INVENTORY_ADJUSTMENT_PAYABLE_SUBJECT_ID: 'inventory.adjustment.payable_subject_id', // 库存调整-应付账款科目
  INVENTORY_ADJUSTMENT_INVENTORY_SUBJECT_ID: 'inventory.adjustment.inventory_subject_id', // 库存调整-库存商品科目
  INVENTORY_ADJUSTMENT_AUTO_POST: 'inventory.adjustment.auto_post', // 库存调整-自动过账

  // 是否启用自动生成凭证
  AUTO_GENERATE_VOUCHER_ENABLED: 'auto_generate_voucher_enabled',

  // OTC 各流程自动过账配置
  OTC_DELIVERY_AUTO_POST: 'otc.delivery.auto_post',
  OTC_INVOICE_AUTO_POST: 'otc.invoice.auto_post',
  OTC_RECEIPT_AUTO_POST: 'otc.receipt.auto_post',
};

// 获取系统配置值
export async function getSystemConfig(key: string, tx?: any): Promise<string | null> {
  const client = tx || prisma;
  const config = await client.systemConfig.findUnique({
    where: { configKey: key },
  });
  return config?.configValue || null;
}

// 设置系统配置值
export async function setSystemConfig(key: string, value: string, description?: string, tx?: any): Promise<void> {
  const client = tx || prisma;
  await client.systemConfig.upsert({
    where: { configKey: key },
    update: { configValue: value },
    create: { configKey: key, configValue: value, description },
  });
}

// 获取科目ID配置
export async function getSubjectIdFromConfig(key: string, tx?: any): Promise<string | null> {
  return getSystemConfig(key, tx);
}

// 检查是否启用自动生成凭证
export async function isAutoGenerateVoucherEnabled(tx?: any): Promise<boolean> {
  const value = await getSystemConfig(CONFIG_KEYS.AUTO_GENERATE_VOUCHER_ENABLED, tx);
  return value === 'true';
}

// 检查特定业务是否自动过账
export async function isAutoPostEnabled(configKey: string, tx?: any): Promise<boolean> {
  const value = await getSystemConfig(configKey, tx);
  return value === 'true';
}

// 验证发货确认配置
// 返回 { valid: boolean, errors: string[] }
export async function validateDeliveryConfirmation(deliveryItems: any[], tx?: any): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // 检查是否启用自动生成凭证
  const isEnabled = await isAutoGenerateVoucherEnabled(tx);
  if (!isEnabled) {
    // 未启用时不需要校验，直接返回
    return { valid: true, errors: [] };
  }

  // 获取配置的科目ID
  const costSubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_DELIVERY_COST_SUBJECT_ID, tx);
  const inventorySubjectId = await getSubjectIdFromConfig(CONFIG_KEYS.OTC_DELIVERY_INVENTORY_SUBJECT_ID, tx);

  // 验证科目配置
  if (!costSubjectId) {
    errors.push('主营业务成本科目未配置（会计引擎 → OTC流程-发货凭证）');
  }
  if (!inventorySubjectId) {
    errors.push('库存商品科目未配置（会计引擎 → OTC流程-发货凭证）');
  }

  // 验证物料成本价
  for (const item of deliveryItems) {
    // 确保物料信息存在
    const material = item.orderItem?.material || item.material;
    if (!material?.costPrice || material.costPrice <= 0) {
      errors.push(`物料 "${material?.name || item.materialId}" 成本价为0或未设置，请先设置成本价`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
