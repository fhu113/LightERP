import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';

const router = Router();

// 发货单路由
router.get('/', ...DeliveryController.getDeliveries);
router.get('/:id', ...DeliveryController.getDeliveryById);
router.post('/', ...DeliveryController.createDelivery);
router.put('/:id', ...DeliveryController.updateDelivery);
router.delete('/:id', ...DeliveryController.deleteDelivery);
router.post('/:id/confirm', ...DeliveryController.confirmDelivery);
router.post('/:id/cancel', ...DeliveryController.cancelDelivery);

export default router;