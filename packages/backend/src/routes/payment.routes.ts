import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 付款单路由 - 需要ptp权限
router.get('/', requirePermission('ptp'), ...PaymentController.getPayments);
router.get('/for-payment', requirePermission('ptp'), ...PaymentController.getInvoicesForPayment);
router.get('/:id', requirePermission('ptp'), ...PaymentController.getPaymentById);
router.post('/', requirePermission('ptp'), ...PaymentController.createPayment);
router.put('/:id', requirePermission('ptp'), ...PaymentController.updatePayment);
router.delete('/:id', requirePermission('ptp'), ...PaymentController.deletePayment);
router.post('/:id/confirm', requirePermission('ptp'), ...PaymentController.confirmPayment);
router.post('/:id/cancel', requirePermission('ptp'), ...PaymentController.cancelPayment);

export default router;
