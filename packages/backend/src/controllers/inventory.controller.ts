import { Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';

export const inventoryController = {
  // 获取库存列表
  getInventoryList: async (req: Request, res: Response) => {
    const result = await inventoryService.getInventoryList({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
    });
    res.json({ success: true, data: result });
  },

  // 获取库存流水
  getInventoryTransactions: async (req: Request, res: Response) => {
    const result = await inventoryService.getInventoryTransactions({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      materialId: req.query.materialId as string,
      transactionType: req.query.transactionType as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, data: result });
  },

  // 创建库存调整
  createInventoryAdjustment: async (req: Request, res: Response) => {
    const result = await inventoryService.createInventoryAdjustment(req.body);
    res.json({ success: true, data: result });
  },

  // 获取库存调整列表
  getInventoryAdjustments: async (req: Request, res: Response) => {
    const result = await inventoryService.getInventoryAdjustments({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      materialId: req.query.materialId as string,
      adjustmentType: req.query.adjustmentType as string,
    });
    res.json({ success: true, data: result });
  },
};
