import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/delivery.service';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createDeliverySchema,
  updateDeliverySchema,
  queryParamsSchema
} from '../utils/validation';

const deliveryService = new DeliveryService();

export class DeliveryController {
  // ========== 发货单控制器 ==========

  static getDeliveries = [
    validateQuery(queryParamsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { customerId, status, startDate, endDate, ...rest } = req.query as any;
        const filters: Record<string, any> = {};
        if (customerId) filters.customerId = customerId;
        if (status) filters.status = status;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        const result = await deliveryService.getDeliveries({ ...rest, filters });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getStatusCounts = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const counts = await deliveryService.getStatusCounts();
        res.json(counts);
      } catch (error) {
        next(error);
      }
    }
  ];

  static getDeliveryById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.getDeliveryById(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static createDelivery = [
    validateBody(createDeliverySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.createDelivery(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static updateDelivery = [
    validateBody(updateDeliverySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.updateDelivery(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static deleteDelivery = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await deliveryService.deleteDelivery(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  ];

  static confirmDelivery = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.confirmDelivery(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static cancelDelivery = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.cancelDelivery(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];

  static reverseDelivery = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await deliveryService.reverseDelivery(req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  ];
}