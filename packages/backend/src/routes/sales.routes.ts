import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';

const router = Router();

// 销售订单路由
router.get('/orders', ...SalesController.getSalesOrders);
router.get('/orders/:id', ...SalesController.getSalesOrderById);
router.get('/orders/:id/status', ...SalesController.getOrderProcessStatus);
router.post('/orders', ...SalesController.createSalesOrder);
router.put('/orders/:id', ...SalesController.updateSalesOrder);
router.delete('/orders/:id', ...SalesController.deleteSalesOrder);
router.post('/orders/:id/confirm', ...SalesController.confirmOrder);
router.post('/orders/:id/cancel', ...SalesController.cancelOrder);

export default router;