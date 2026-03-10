import { Router } from 'express';
import { PurchaseInvoiceController } from '../controllers/purchase-invoice.controller';

const router = Router();

// 采购发票路由
router.get('/', ...PurchaseInvoiceController.getPurchaseInvoices);
router.get('/for-invoicing', ...PurchaseInvoiceController.getReceiptsForInvoicing);
router.get('/:id', ...PurchaseInvoiceController.getPurchaseInvoiceById);
router.post('/', ...PurchaseInvoiceController.createPurchaseInvoice);
router.put('/:id', ...PurchaseInvoiceController.updatePurchaseInvoice);
router.delete('/:id', ...PurchaseInvoiceController.deletePurchaseInvoice);
router.post('/:id/confirm', ...PurchaseInvoiceController.confirmPurchaseInvoice);
router.post('/:id/cancel', ...PurchaseInvoiceController.cancelPurchaseInvoice);

export default router;
