import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';

const router = Router();

// 采购订单路由
router.get('/orders', ...PurchaseController.getPurchaseOrders);
router.get('/orders/:id', ...PurchaseController.getPurchaseOrderById);
router.post('/orders', ...PurchaseController.createPurchaseOrder);
router.put('/orders/:id', ...PurchaseController.updatePurchaseOrder);
router.delete('/orders/:id', ...PurchaseController.deletePurchaseOrder);
router.post('/orders/:id/confirm', ...PurchaseController.confirmPurchaseOrder);
router.post('/orders/:id/cancel', ...PurchaseController.cancelPurchaseOrder);

export default router;