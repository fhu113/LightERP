import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 采购订单路由 - 需要ptp权限
router.get('/orders', requirePermission('ptp'), ...PurchaseController.getPurchaseOrders);
router.get('/orders/status-counts', requirePermission('ptp'), ...PurchaseController.getStatusCounts);
router.get('/orders/:id', requirePermission('ptp'), ...PurchaseController.getPurchaseOrderById);
router.post('/orders', requirePermission('ptp'), ...PurchaseController.createPurchaseOrder);
router.put('/orders/:id', requirePermission('ptp'), ...PurchaseController.updatePurchaseOrder);
router.delete('/orders/:id', requirePermission('ptp'), ...PurchaseController.deletePurchaseOrder);
router.post('/orders/:id/confirm', requirePermission('ptp'), ...PurchaseController.confirmPurchaseOrder);
router.post('/orders/:id/cancel', requirePermission('ptp'), ...PurchaseController.cancelPurchaseOrder);

export default router;