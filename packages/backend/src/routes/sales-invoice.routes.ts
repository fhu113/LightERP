import { Router } from 'express';
import { SalesInvoiceController } from '../controllers/sales-invoice.controller';

const router = Router();

// 销售发票路由
router.get('/', ...SalesInvoiceController.getSalesInvoices);
router.get('/:id', ...SalesInvoiceController.getSalesInvoiceById);
router.post('/', ...SalesInvoiceController.createSalesInvoice);
router.put('/:id', ...SalesInvoiceController.updateSalesInvoice);
router.delete('/:id', ...SalesInvoiceController.deleteSalesInvoice);
router.post('/:id/issue', ...SalesInvoiceController.issueInvoice);
router.post('/:id/cancel', ...SalesInvoiceController.cancelInvoice);

export default router;