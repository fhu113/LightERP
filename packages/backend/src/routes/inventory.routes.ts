import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 库存查询 - 需要warehouse权限
router.get('/', requirePermission('warehouse'), inventoryController.getInventoryList);

// 库存流水 - 需要warehouse权限
router.get('/transactions', requirePermission('warehouse'), inventoryController.getInventoryTransactions);

// 库存调整 - 需要warehouse权限
router.get('/adjustments', requirePermission('warehouse'), inventoryController.getInventoryAdjustments);
router.post('/adjustments', requirePermission('warehouse'), inventoryController.createInventoryAdjustment);

export default router;
