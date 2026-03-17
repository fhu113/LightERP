import axios from './api';

export const cleanupApi = {
  // 清理OTC销售单据
  cleanupOTC: () => axios.post('/api/cleanup/otc'),

  // 清理PTP采购单据
  cleanupPTP: () => axios.post('/api/cleanup/ptp'),

  // 清理库存调整单据
  cleanupInventory: () => axios.post('/api/cleanup/inventory'),

  // 清理所有业务单据
  cleanupAll: () => axios.post('/api/cleanup/all'),

  // 库存初始化
  initInventory: () => axios.post('/api/cleanup/inventory-init'),
};
