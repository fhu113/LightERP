import { Request, Response, NextFunction } from 'express';
import * as purchaseInvoiceService from '../services/purchase-invoice.service';
import { PurchaseInvoiceStatus } from '../types/purchase-invoice';

export class PurchaseInvoiceController {
  // 获取采购发票列表
  static getPurchaseInvoices = [
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const { page, limit, supplierId, status, search } = req.query;
        const result = await purchaseInvoiceService.getPurchaseInvoices({
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          supplierId: supplierId as string,
          status: status as PurchaseInvoiceStatus,
          search: search as string,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取采购发票详情
  static getPurchaseInvoiceById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await purchaseInvoiceService.getPurchaseInvoiceById(id);
        if (!invoice) {
          return res.status(404).json({ error: '采购发票不存在' });
        }
        res.json(invoice);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 创建采购发票
  static createPurchaseInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const invoice = await purchaseInvoiceService.createPurchaseInvoice(req.body);
        res.status(201).json(invoice);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 更新采购发票
  static updatePurchaseInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await purchaseInvoiceService.updatePurchaseInvoice(id, req.body);
        res.json(invoice);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 删除采购发票
  static deletePurchaseInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        await purchaseInvoiceService.deletePurchaseInvoice(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];

  // 确认采购发票
  static confirmPurchaseInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await purchaseInvoiceService.confirmPurchaseInvoice(id);
        res.json(invoice);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 取消采购发票
  static cancelPurchaseInvoice = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const invoice = await purchaseInvoiceService.cancelPurchaseInvoice(id);
        res.json(invoice);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取可开票的收货单
  static getReceiptsForInvoicing = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const receipts = await purchaseInvoiceService.getReceiptsForInvoicing();
        res.json(receipts);
      } catch (error) {
        next(error);
      }
    },
  ];
}
