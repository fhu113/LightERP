import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();

// 报表路由
router.get('/sales', ...ReportController.getSalesReport);
router.get('/purchase', ...ReportController.getPurchaseReport);
router.get('/inventory', ...ReportController.getInventoryReport);
router.get('/receivable', ...ReportController.getReceivableReport);
router.get('/payable', ...ReportController.getPayableReport);

export default router;
