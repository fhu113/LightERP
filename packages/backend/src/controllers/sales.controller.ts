import { Request, Response, NextFunction } from 'express';
import { SalesService } from '../services/sales.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSalesOrderSchema,
  updateSalesOrderSchema,
  queryParamsSchema
} from '../utils/validation';

const salesService = new SalesService();

export class SalesController {
  // ========== 销售订单控制器 ==========

  static getSalesOrders = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.getSalesOrders(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getSalesOrderById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.getSalesOrderById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createSalesOrder = [
    validateBody(createSalesOrderSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.createSalesOrder(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateSalesOrder = [
    validateBody(updateSalesOrderSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.updateSalesOrder(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteSalesOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await salesService.deleteSalesOrder(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static confirmOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.confirmOrder(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelOrder = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.cancelOrder(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];
}