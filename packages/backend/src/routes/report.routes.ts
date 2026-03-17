import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 报表路由 - 需要reports权限
router.get('/sales', requirePermission('reports'), ...ReportController.getSalesReport);
router.get('/purchase', requirePermission('reports'), ...ReportController.getPurchaseReport);
router.get('/inventory', requirePermission('reports'), ...ReportController.getInventoryReport);
router.get('/receivable', requirePermission('reports'), ...ReportController.getReceivableReport);
router.get('/payable', requirePermission('reports'), ...ReportController.getPayableReport);
router.get('/documents', requirePermission('reports'), (req, res, next) => {
    const handler = ReportController.searchDocuments[0];
    return handler(req, res, next);
});

export default router;
