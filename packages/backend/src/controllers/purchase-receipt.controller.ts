import { Request, Response, NextFunction } from 'express';
import { PurchaseReceiptService } from '../services/purchase-receipt.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createPurchaseReceiptSchema,
  updatePurchaseReceiptSchema,
  queryParamsSchema
} from '../utils/validation';

const purchaseReceiptService = new PurchaseReceiptService();

export class PurchaseReceiptController {
  // ========== 采购收货单控制器 ==========

  static getPurchaseReceipts = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.getPurchaseReceipts(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getPurchaseReceiptById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.getPurchaseReceiptById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createPurchaseReceipt = [
    validateBody(createPurchaseReceiptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.createPurchaseReceipt(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updatePurchaseReceipt = [
    validateBody(updatePurchaseReceiptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.updatePurchaseReceipt(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deletePurchaseReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await purchaseReceiptService.deletePurchaseReceipt(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static confirmPurchaseReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.confirmPurchaseReceipt(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelPurchaseReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await purchaseReceiptService.cancelPurchaseReceipt(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];
}