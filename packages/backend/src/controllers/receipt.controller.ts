import { Request, Response, NextFunction } from 'express';
import { ReceiptService } from '../services/receipt.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createReceiptSchema,
  updateReceiptSchema,
  queryParamsSchema
} from '../utils/validation';

const receiptService = new ReceiptService();

export class ReceiptController {
  // ========== 收款单控制器 ==========

  static getReceipts = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.getReceipts(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getStatusCounts = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.getStatusCounts();
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getReceiptById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.getReceiptById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createReceipt = [
    validateBody(createReceiptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.createReceipt(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateReceipt = [
    validateBody(updateReceiptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.updateReceipt(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await receiptService.deleteReceipt(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static confirmReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.confirmReceipt(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelReceipt = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await receiptService.cancelReceipt(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];
}