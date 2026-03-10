import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

// 付款单路由
router.get('/', ...PaymentController.getPayments);
router.get('/for-payment', ...PaymentController.getInvoicesForPayment);
router.get('/:id', ...PaymentController.getPaymentById);
router.post('/', ...PaymentController.createPayment);
router.put('/:id', ...PaymentController.updatePayment);
router.delete('/:id', ...PaymentController.deletePayment);
router.post('/:id/confirm', ...PaymentController.confirmPayment);
router.post('/:id/cancel', ...PaymentController.cancelPayment);

export default router;
