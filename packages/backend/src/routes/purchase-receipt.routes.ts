import { Router } from 'express';
import { PurchaseReceiptController } from '../controllers/purchase-receipt.controller';

const router = Router();

// 采购收货单路由
router.get('/', ...PurchaseReceiptController.getPurchaseReceipts);
router.get('/:id', ...PurchaseReceiptController.getPurchaseReceiptById);
router.post('/', ...PurchaseReceiptController.createPurchaseReceipt);
router.put('/:id', ...PurchaseReceiptController.updatePurchaseReceipt);
router.delete('/:id', ...PurchaseReceiptController.deletePurchaseReceipt);
router.post('/:id/confirm', ...PurchaseReceiptController.confirmPurchaseReceipt);
router.post('/:id/cancel', ...PurchaseReceiptController.cancelPurchaseReceipt);

export default router;