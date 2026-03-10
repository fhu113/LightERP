import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { PaymentStatus } from '../types/payment';

export class PaymentController {
  // 获取付款单列表
  static getPayments = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { page, limit, supplierId, status, search } = req.query;
        const result = await paymentService.getPayments({
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          supplierId: supplierId as string,
          status: status as PaymentStatus,
          search: search as string,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取付款单详情
  static getPaymentById = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { id } = req.params;
        const payment = await paymentService.getPaymentById(id);
        if (!payment) {
          return res.status(404).json({ error: '付款单不存在' });
        }
        res.json(payment);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 创建付款单
  static createPayment = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const payment = await paymentService.createPayment(req.body);
        res.status(201).json(payment);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 更新付款单
  static updatePayment = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { id } = req.params;
        const payment = await paymentService.updatePayment(id, req.body);
        res.json(payment);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 删除付款单
  static deletePayment = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { id } = req.params;
        await paymentService.deletePayment(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];

  // 确认付款
  static confirmPayment = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { id } = req.params;
        const payment = await paymentService.confirmPayment(id);
        res.json(payment);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 取消付款
  static cancelPayment = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { id } = req.params;
        const payment = await paymentService.cancelPayment(id);
        res.json(payment);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取可付款的发票
  static getInvoicesForPayment = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const invoices = await paymentService.getInvoicesForPayment();
        res.json(invoices);
      } catch (error) {
        next(error);
      }
    },
  ];
}
