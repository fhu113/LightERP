import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { DocumentService } from '../services/document.service';

const documentService = new DocumentService();

export class ReportController {
  // 销售统计报表
  static getSalesReport = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { startDate, endDate, customerId } = req.query;
        const report = await reportService.getSalesReport({
          startDate: startDate as string,
          endDate: endDate as string,
          customerId: customerId as string,
        });
        res.json(report);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 采购统计报表
  static getPurchaseReport = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { startDate, endDate, supplierId } = req.query;
        const report = await reportService.getPurchaseReport({
          startDate: startDate as string,
          endDate: endDate as string,
          supplierId: supplierId as string,
        });
        res.json(report);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 库存报表
  static getInventoryReport = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const report = await reportService.getInventoryReport();
        res.json(report);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 应收账款报表
  static getReceivableReport = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const report = await reportService.getReceivableReport();
        res.json(report);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 应付账款报表
  static getPayableReport = [
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const report = await reportService.getPayableReport();
        res.json(report);
      } catch (error) {
        next(error);
      }
    },
  ];
  // 综合单据查询
  static searchDocuments = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentType, keyword, startDate, endDate, limit } = req.query;
        const results = await documentService.searchDocuments({
          documentType: documentType as any,
          keyword: keyword as string,
          startDate: startDate as string,
          endDate: endDate as string,
          limit: limit ? Number(limit) : undefined,
        });
        res.json(results);
      } catch (error) {
        next(error);
      }
    },
  ];
}
