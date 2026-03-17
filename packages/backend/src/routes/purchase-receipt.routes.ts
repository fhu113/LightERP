import { Router } from 'express';
import { PurchaseReceiptController } from '../controllers/purchase-receipt.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 采购收货单路由 - 需要ptp权限
router.get('/', requirePermission('ptp'), ...PurchaseReceiptController.getPurchaseReceipts);
router.get('/:id', requirePermission('ptp'), ...PurchaseReceiptController.getPurchaseReceiptById);
router.post('/', requirePermission('ptp'), ...PurchaseReceiptController.createPurchaseReceipt);
router.put('/:id', requirePermission('ptp'), ...PurchaseReceiptController.updatePurchaseReceipt);
router.delete('/:id', requirePermission('ptp'), ...PurchaseReceiptController.deletePurchaseReceipt);
router.post('/:id/confirm', requirePermission('ptp'), ...PurchaseReceiptController.confirmPurchaseReceipt);
router.post('/:id/cancel', requirePermission('ptp'), ...PurchaseReceiptController.cancelPurchaseReceipt);

export default router;