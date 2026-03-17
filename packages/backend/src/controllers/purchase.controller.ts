import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../services/purchase.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  queryParamsSchema
} from '../utils/validation';

const purchaseService = new PurchaseService();

export class PurchaseController {
  // ========== 采购订单控制器 ==========

  static getPurchaseOrders = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.getPurchaseOrders(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getPurchaseOrderById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.getPurchaseOrderById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createPurchaseOrder = [
    validateBody(createPurchaseOrderSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.createPurchaseOrder(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updatePurchaseOrder = [
    validateBody(updatePurchaseOrderSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.updatePurchaseOrder(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deletePurchaseOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await purchaseService.deletePurchaseOrder(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static confirmPurchaseOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.confirmPurchaseOrder(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelPurchaseOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseService.cancelPurchaseOrder(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getStatusCounts = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const counts = await purchaseService.getStatusCounts();
        res.json(counts);
      } catch (error) {
        next(error);
      }
    }
  ];
}