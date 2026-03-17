import api from './api';

// 配置类型
export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  description?: string;
}

export const systemConfigApi = {
  // 获取所有配置
  getAll: (): Promise<SystemConfig[]> => {
    return api.get('/api/system-config');
  },

  // 获取单个配置
  get: (key: string): Promise<SystemConfig> => {
    return api.get(`/api/system-config/${key}`);
  },

  // 设置配置
  set: (configKey: string, configValue: string, description?: string): Promise<SystemConfig> => {
    return api.post('/api/system-config', { configKey, configValue, description });
  },

  // 删除配置
  remove: (key: string): Promise<void> => {
    return api.delete(`/api/system-config/${key}`);
  },
};

// 配置 key 常量
export const CONFIG_KEYS = {
  // OTC 流程凭证科目配置
  OTC_DELIVERY_COST_SUBJECT_ID: 'otc.delivery.cost_subject_id',
  OTC_DELIVERY_INVENTORY_SUBJECT_ID: 'otc.delivery.inventory_subject_id',
  OTC_DELIVERY_AUTO_POST: 'otc.delivery.auto_post',
  OTC_INVOICE_RECEIVABLE_SUBJECT_ID: 'otc.invoice.receivable_subject_id',
  OTC_INVOICE_REVENUE_SUBJECT_ID: 'otc.invoice.revenue_subject_id',
  OTC_INVOICE_TAX_SUBJECT_ID: 'otc.invoice.tax_subject_id',
  OTC_INVOICE_AUTO_POST: 'otc.invoice.auto_post',
  OTC_RECEIPT_RECEIVABLE_SUBJECT_ID: 'otc.receipt.receivable_subject_id',
  OTC_RECEIPT_CASH_SUBJECT_ID: 'otc.receipt.cash_subject_id',
  OTC_RECEIPT_AUTO_POST: 'otc.receipt.auto_post',

  // PTP 流程凭证科目配置
  PTP_RECEIPT_INVENTORY_SUBJECT_ID: 'ptp.receipt.inventory_subject_id',
  PTP_RECEIPT_ESTIMATED_PAYABLE_SUBJECT_ID: 'ptp.receipt.estimated_payable_subject_id',
  PTP_RECEIPT_AUTO_POST: 'ptp.receipt.auto_post',

  PTP_INVOICE_ESTIMATED_PAYABLE_SUBJECT_ID: 'ptp.invoice.estimated_payable_subject_id',
  PTP_INVOICE_TAX_PAYABLE_SUBJECT_ID: 'ptp.invoice.tax_payable_subject_id',
  PTP_INVOICE_PAYABLE_SUBJECT_ID: 'ptp.invoice.payable_subject_id',
  PTP_INVOICE_AUTO_POST: 'ptp.invoice.auto_post',

  PTP_PAYMENT_PAYABLE_SUBJECT_ID: 'ptp.payment.payable_subject_id',
  PTP_PAYMENT_CASH_SUBJECT_ID: 'ptp.payment.cash_subject_id',
  PTP_PAYMENT_AUTO_POST: 'ptp.payment.auto_post',

  // 库存调整凭证科目配置
  INVENTORY_ADJUSTMENT_PAYABLE_SUBJECT_ID: 'inventory.adjustment.payable_subject_id',
  INVENTORY_ADJUSTMENT_INVENTORY_SUBJECT_ID: 'inventory.adjustment.inventory_subject_id',
  INVENTORY_ADJUSTMENT_AUTO_POST: 'inventory.adjustment.auto_post',

  // 自动生成凭证开关
  AUTO_GENERATE_VOUCHER_ENABLED: 'auto_generate_voucher_enabled',
};

// 配置分组
export const CONFIG_GROUPS = [
  {
    title: '全局设置',
    items: [
      { key: CONFIG_KEYS.AUTO_GENERATE_VOUCHER_ENABLED, label: '启用自动生成凭证', type: 'boolean' },
    ],
  },
  // ========== OTC 流程 ==========
  {
    title: 'OTC - 发货凭证',
    description: '借：主营业务成本，贷：库存商品',
    items: [
      { key: CONFIG_KEYS.OTC_DELIVERY_COST_SUBJECT_ID, label: '主营业务成本科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_DELIVERY_INVENTORY_SUBJECT_ID, label: '库存商品科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_DELIVERY_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  {
    title: 'OTC - 销售发票凭证',
    description: '借：应收账款，贷：主营业务收入 + 销项税',
    items: [
      { key: CONFIG_KEYS.OTC_INVOICE_RECEIVABLE_SUBJECT_ID, label: '应收账款科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_INVOICE_REVENUE_SUBJECT_ID, label: '主营业务收入科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_INVOICE_TAX_SUBJECT_ID, label: '销项税科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_INVOICE_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  {
    title: 'OTC - 收款凭证',
    description: '借：银行存款，贷：应收账款',
    items: [
      { key: CONFIG_KEYS.OTC_RECEIPT_RECEIVABLE_SUBJECT_ID, label: '应收账款科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_RECEIPT_CASH_SUBJECT_ID, label: '银行存款科目', type: 'subject' },
      { key: CONFIG_KEYS.OTC_RECEIPT_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  // ========== PTP 流程 ==========
  {
    title: 'PTP - 采购收货凭证',
    description: '借：库存商品，贷：应付暂估',
    items: [
      { key: CONFIG_KEYS.PTP_RECEIPT_INVENTORY_SUBJECT_ID, label: '库存商品科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_RECEIPT_ESTIMATED_PAYABLE_SUBJECT_ID, label: '应付暂估科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_RECEIPT_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  {
    title: 'PTP - 采购发票凭证',
    description: '借：应付暂估 + 进项税，贷：应付账款',
    items: [
      { key: CONFIG_KEYS.PTP_INVOICE_ESTIMATED_PAYABLE_SUBJECT_ID, label: '应付暂估科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_INVOICE_TAX_PAYABLE_SUBJECT_ID, label: '应付账款-进项税科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_INVOICE_PAYABLE_SUBJECT_ID, label: '应付账款科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_INVOICE_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  {
    title: 'PTP - 付款凭证',
    description: '借：应付账款，贷：银行存款',
    items: [
      { key: CONFIG_KEYS.PTP_PAYMENT_PAYABLE_SUBJECT_ID, label: '应付账款科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_PAYMENT_CASH_SUBJECT_ID, label: '银行存款科目', type: 'subject' },
      { key: CONFIG_KEYS.PTP_PAYMENT_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
  // ========== 库存管理 ==========
  {
    title: '库存调整凭证',
    description: '借：库存商品，贷：应付账款',
    items: [
      { key: CONFIG_KEYS.INVENTORY_ADJUSTMENT_INVENTORY_SUBJECT_ID, label: '库存商品科目', type: 'subject' },
      { key: CONFIG_KEYS.INVENTORY_ADJUSTMENT_PAYABLE_SUBJECT_ID, label: '应付账款科目', type: 'subject' },
      { key: CONFIG_KEYS.INVENTORY_ADJUSTMENT_AUTO_POST, label: '自动过账', type: 'boolean' },
    ],
  },
];
