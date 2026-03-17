import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 收款单路由 - 需要otc权限
router.get('/', requirePermission('otc'), ...ReceiptController.getReceipts);
router.get('/status/counts', requirePermission('otc'), ...ReceiptController.getStatusCounts);
router.get('/:id', requirePermission('otc'), ...ReceiptController.getReceiptById);
router.post('/', requirePermission('otc'), ...ReceiptController.createReceipt);
router.put('/:id', requirePermission('otc'), ...ReceiptController.updateReceipt);
router.delete('/:id', requirePermission('otc'), ...ReceiptController.deleteReceipt);
router.post('/:id/confirm', requirePermission('otc'), ...ReceiptController.confirmReceipt);
router.post('/:id/cancel', requirePermission('otc'), ...ReceiptController.cancelReceipt);

export default router;