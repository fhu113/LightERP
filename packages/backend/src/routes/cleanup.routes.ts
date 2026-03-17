import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { cleanupOTCDocuments, cleanupPTPDocuments, cleanupInventoryAdjustments, cleanupAllBusinessDocuments, initializeInventory } from '../services/cleanup.service';

const router = Router();

// 清理OTC销售单据 - 仅管理员可执行
router.post('/otc', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await cleanupOTCDocuments();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('清理OTC数据失败:', error);
    res.status(500).json({ success: false, error: '清理OTC数据失败' });
  }
});

// 清理PTP采购单据 - 仅管理员可执行
router.post('/ptp', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await cleanupPTPDocuments();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('清理PTP数据失败:', error);
    res.status(500).json({ success: false, error: '清理PTP数据失败' });
  }
});

// 清理库存调整单据 - 仅管理员可执行
router.post('/inventory', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await cleanupInventoryAdjustments();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('清理库存调整数据失败:', error);
    res.status(500).json({ success: false, error: '清理库存调整数据失败' });
  }
});

// 清理所有业务单据 - 仅管理员可执行
router.post('/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await cleanupAllBusinessDocuments();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('清理所有业务数据失败:', error);
    res.status(500).json({ success: false, error: '清理所有业务数据失败' });
  }
});

// 库存初始化 - 仅管理员可执行
router.post('/inventory-init', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await initializeInventory();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('库存初始化失败:', error);
    res.status(500).json({ success: false, error: '库存初始化失败' });
  }
});

export default router;
