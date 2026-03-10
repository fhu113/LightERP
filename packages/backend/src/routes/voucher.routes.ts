import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';

const router = Router();

// 凭证路由
router.get('/', ...VoucherController.getVouchers);
router.get('/subject-balance', ...VoucherController.getSubjectBalance);
router.get('/:id', ...VoucherController.getVoucherById);
router.post('/', ...VoucherController.createVoucher);
router.put('/:id', ...VoucherController.updateVoucher);
router.delete('/:id', ...VoucherController.deleteVoucher);
router.post('/:id/post', ...VoucherController.postVoucher);

export default router;
