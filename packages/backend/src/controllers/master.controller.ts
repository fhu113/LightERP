import { Request, Response, NextFunction } from 'express';
import { MasterService } from '../services/master.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSubjectSchema, updateSubjectSchema,
  createCustomerSchema, updateCustomerSchema,
  createSupplierSchema, updateSupplierSchema,
  createMaterialSchema, updateMaterialSchema,
  queryParamsSchema
} from '../utils/validation';

const masterService = new MasterService();

export class MasterController {
  // ========== 会计科目控制器 ==========

  static getSubjects = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getSubjects(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getSubjectTree = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getSubjectTree();
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getSubjectById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getSubjectById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createSubject = [
    validateBody(createSubjectSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.createSubject(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateSubject = [
    validateBody(updateSubjectSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.updateSubject(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteSubject = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await masterService.deleteSubject(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  // ========== 客户控制器 ==========

  static getCustomers = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getCustomers(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getCustomerById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getCustomerById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createCustomer = [
    validateBody(createCustomerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.createCustomer(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateCustomer = [
    validateBody(updateCustomerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.updateCustomer(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteCustomer = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await masterService.deleteCustomer(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  // ========== 供应商控制器 ==========

  static getSuppliers = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getSuppliers(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getSupplierById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getSupplierById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createSupplier = [
    validateBody(createSupplierSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.createSupplier(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateSupplier = [
    validateBody(updateSupplierSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.updateSupplier(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteSupplier = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await masterService.deleteSupplier(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  // ========== 物料控制器 ==========

  static getMaterials = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getMaterials(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getMaterialById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.getMaterialById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createMaterial = [
    validateBody(createMaterialSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.createMaterial(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateMaterial = [
    validateBody(updateMaterialSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await masterService.updateMaterial(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteMaterial = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await masterService.deleteMaterial(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];
}