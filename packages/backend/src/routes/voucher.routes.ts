import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 凭证路由 - 需要finance权限
router.get('/', requirePermission('finance'), ...VoucherController.getVouchers);
router.get('/subject-balance', requirePermission('finance'), ...VoucherController.getSubjectBalance);
router.get('/:id', requirePermission('finance'), ...VoucherController.getVoucherById);
router.post('/', requirePermission('finance'), ...VoucherController.createVoucher);
router.put('/:id', requirePermission('finance'), ...VoucherController.updateVoucher);
router.delete('/:id', requirePermission('finance'), ...VoucherController.deleteVoucher);
router.post('/:id/post', requirePermission('finance'), ...VoucherController.postVoucher);
router.post('/:id/reverse', requirePermission('finance'), ...VoucherController.reverseVoucher);

export default router;
