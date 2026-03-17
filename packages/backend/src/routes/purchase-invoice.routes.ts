import { Router } from 'express';
import { PurchaseInvoiceController } from '../controllers/purchase-invoice.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 采购发票路由 - 需要ptp权限
router.get('/', requirePermission('ptp'), ...PurchaseInvoiceController.getPurchaseInvoices);
router.get('/for-invoicing', requirePermission('ptp'), ...PurchaseInvoiceController.getReceiptsForInvoicing);
router.get('/:id', requirePermission('ptp'), ...PurchaseInvoiceController.getPurchaseInvoiceById);
router.post('/', requirePermission('ptp'), ...PurchaseInvoiceController.createPurchaseInvoice);
router.put('/:id', requirePermission('ptp'), ...PurchaseInvoiceController.updatePurchaseInvoice);
router.delete('/:id', requirePermission('ptp'), ...PurchaseInvoiceController.deletePurchaseInvoice);
router.post('/:id/confirm', requirePermission('ptp'), ...PurchaseInvoiceController.confirmPurchaseInvoice);
router.post('/:id/cancel', requirePermission('ptp'), ...PurchaseInvoiceController.cancelPurchaseInvoice);

export default router;
