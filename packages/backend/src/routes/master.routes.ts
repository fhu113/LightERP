import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 会计科目路由 - 需要finance权限
router.get('/subjects', requirePermission('finance'), ...MasterController.getSubjects);
router.get('/subjects/tree', requirePermission('finance'), ...MasterController.getSubjectTree);
router.get('/subjects/:id', requirePermission('finance'), ...MasterController.getSubjectById);
router.post('/subjects', requirePermission('finance'), ...MasterController.createSubject);
router.put('/subjects/:id', requirePermission('finance'), ...MasterController.updateSubject);
router.delete('/subjects/:id', requirePermission('finance'), ...MasterController.deleteSubject);

// 客户路由 - 需要otc权限
router.get('/customers', requirePermission('otc'), ...MasterController.getCustomers);
router.get('/customers/:id', requirePermission('otc'), ...MasterController.getCustomerById);
router.post('/customers', requirePermission('otc'), ...MasterController.createCustomer);
router.put('/customers/:id', requirePermission('otc'), ...MasterController.updateCustomer);
router.delete('/customers/:id', requirePermission('otc'), ...MasterController.deleteCustomer);

// 供应商路由 - 需要ptp权限
router.get('/suppliers', requirePermission('ptp'), ...MasterController.getSuppliers);
router.get('/suppliers/:id', requirePermission('ptp'), ...MasterController.getSupplierById);
router.post('/suppliers', requirePermission('ptp'), ...MasterController.createSupplier);
router.put('/suppliers/:id', requirePermission('ptp'), ...MasterController.updateSupplier);
router.delete('/suppliers/:id', requirePermission('ptp'), ...MasterController.deleteSupplier);

// 物料路由 - 需要warehouse权限
router.get('/materials', requirePermission('warehouse'), ...MasterController.getMaterials);
router.get('/materials/:id', requirePermission('warehouse'), ...MasterController.getMaterialById);
router.post('/materials', requirePermission('warehouse'), ...MasterController.createMaterial);
router.put('/materials/:id', requirePermission('warehouse'), ...MasterController.updateMaterial);
router.delete('/materials/:id', requirePermission('warehouse'), ...MasterController.deleteMaterial);

export default router;