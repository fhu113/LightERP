import { Request, Response, NextFunction } from 'express';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSalesInvoiceSchema,
  updateSalesInvoiceSchema,
  queryParamsSchema
} from '../utils/validation';

const salesInvoiceService = new SalesInvoiceService();

export class SalesInvoiceController {
  // ========== 销售发票控制器 ==========

  static getSalesInvoices = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.getSalesInvoices(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getSalesInvoiceById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.getSalesInvoiceById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createSalesInvoice = [
    validateBody(createSalesInvoiceSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.createSalesInvoice(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateSalesInvoice = [
    validateBody(updateSalesInvoiceSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.updateSalesInvoice(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteSalesInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await salesInvoiceService.deleteSalesInvoice(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static issueInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.issueInvoice(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesInvoiceService.cancelInvoice(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];
}