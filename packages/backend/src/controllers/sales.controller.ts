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
        // 从 query 中提取筛选参数并构建 filters 对象
        const { customerId, status, startDate, endDate, ...rest } = req.query as any;
        const filters: Record<string, any> = {};
        if (customerId) filters.customerId = customerId;
        if (status) filters.status = status;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        const result = await salesService.getSalesOrders({ ...rest, filters });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getStatusCounts = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const counts = await salesService.getStatusCounts();
        res.json(counts);
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

  // 获取订单的发货、开票、收款状态
  static getOrderProcessStatus = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await salesService.getOrderProcessStatus(req.params.id);
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