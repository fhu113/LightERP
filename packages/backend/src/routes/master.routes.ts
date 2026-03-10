import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';

const router = Router();

// 会计科目路由
router.get('/subjects', ...MasterController.getSubjects);
router.get('/subjects/tree', ...MasterController.getSubjectTree);
router.get('/subjects/:id', ...MasterController.getSubjectById);
router.post('/subjects', ...MasterController.createSubject);
router.put('/subjects/:id', ...MasterController.updateSubject);
router.delete('/subjects/:id', ...MasterController.deleteSubject);

// 客户路由
router.get('/customers', ...MasterController.getCustomers);
router.get('/customers/:id', ...MasterController.getCustomerById);
router.post('/customers', ...MasterController.createCustomer);
router.put('/customers/:id', ...MasterController.updateCustomer);
router.delete('/customers/:id', ...MasterController.deleteCustomer);

// 供应商路由
router.get('/suppliers', ...MasterController.getSuppliers);
router.get('/suppliers/:id', ...MasterController.getSupplierById);
router.post('/suppliers', ...MasterController.createSupplier);
router.put('/suppliers/:id', ...MasterController.updateSupplier);
router.delete('/suppliers/:id', ...MasterController.deleteSupplier);

// 物料路由
router.get('/materials', ...MasterController.getMaterials);
router.get('/materials/:id', ...MasterController.getMaterialById);
router.post('/materials', ...MasterController.createMaterial);
router.put('/materials/:id', ...MasterController.updateMaterial);
router.delete('/materials/:id', ...MasterController.deleteMaterial);

export default router;