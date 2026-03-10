import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';

const router = Router();

// 收款单路由
router.get('/', ...ReceiptController.getReceipts);
router.get('/:id', ...ReceiptController.getReceiptById);
router.post('/', ...ReceiptController.createReceipt);
router.put('/:id', ...ReceiptController.updateReceipt);
router.delete('/:id', ...ReceiptController.deleteReceipt);
router.post('/:id/confirm', ...ReceiptController.confirmReceipt);
router.post('/:id/cancel', ...ReceiptController.cancelReceipt);

export default router;