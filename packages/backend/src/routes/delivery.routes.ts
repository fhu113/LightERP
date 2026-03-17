import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 发货单路由 - 需要otc权限
router.get('/status/counts', requirePermission('otc'), ...DeliveryController.getStatusCounts);
router.get('/', requirePermission('otc'), ...DeliveryController.getDeliveries);
router.get('/:id', requirePermission('otc'), ...DeliveryController.getDeliveryById);
router.post('/', requirePermission('otc'), ...DeliveryController.createDelivery);
router.put('/:id', requirePermission('otc'), ...DeliveryController.updateDelivery);
router.delete('/:id', requirePermission('otc'), ...DeliveryController.deleteDelivery);
router.post('/:id/confirm', requirePermission('otc'), ...DeliveryController.confirmDelivery);
router.post('/:id/cancel', requirePermission('otc'), ...DeliveryController.cancelDelivery);
router.post('/:id/reverse', requirePermission('otc'), ...DeliveryController.reverseDelivery);

export default router;