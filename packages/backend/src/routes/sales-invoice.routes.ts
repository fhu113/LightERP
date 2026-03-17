import { Router } from 'express';
import { SalesInvoiceController } from '../controllers/sales-invoice.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 销售发票路由 - 需要otc权限
router.get('/status/counts', requirePermission('otc'), ...SalesInvoiceController.getStatusCounts);
router.get('/', requirePermission('otc'), ...SalesInvoiceController.getSalesInvoices);
router.get('/:id', requirePermission('otc'), ...SalesInvoiceController.getSalesInvoiceById);
router.post('/', requirePermission('otc'), ...SalesInvoiceController.createSalesInvoice);
router.put('/:id', requirePermission('otc'), ...SalesInvoiceController.updateSalesInvoice);
router.delete('/:id', requirePermission('otc'), ...SalesInvoiceController.deleteSalesInvoice);
router.post('/:id/issue', requirePermission('otc'), ...SalesInvoiceController.issueInvoice);
router.post('/:id/cancel', requirePermission('otc'), ...SalesInvoiceController.cancelInvoice);

export default router;