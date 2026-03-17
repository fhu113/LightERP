import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 销售订单路由 - 需要otc权限
router.get('/orders/status-counts', requirePermission('otc'), ...SalesController.getStatusCounts);
router.get('/orders', requirePermission('otc'), ...SalesController.getSalesOrders);
router.get('/orders/:id', requirePermission('otc'), ...SalesController.getSalesOrderById);
router.get('/orders/:id/status', requirePermission('otc'), ...SalesController.getOrderProcessStatus);
router.post('/orders', requirePermission('otc'), ...SalesController.createSalesOrder);
router.put('/orders/:id', requirePermission('otc'), ...SalesController.updateSalesOrder);
router.delete('/orders/:id', requirePermission('otc'), ...SalesController.deleteSalesOrder);
router.post('/orders/:id/confirm', requirePermission('otc'), ...SalesController.confirmOrder);
router.post('/orders/:id/cancel', requirePermission('otc'), ...SalesController.cancelOrder);

export default router;