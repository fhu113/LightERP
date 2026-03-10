import { Request, Response, NextFunction } from 'express';
import * as voucherService from '../services/voucher.service';

export class VoucherController {
  // 获取凭证列表
  static getVouchers = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await voucherService.getVouchers(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取凭证详情
  static getVoucherById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const voucher = await voucherService.getVoucherById(id);
        if (!voucher) {
          return res.status(404).json({ error: '凭证不存在' });
        }
        res.json(voucher);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 创建凭证
  static createVoucher = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucher = await voucherService.createVoucher(req.body);
        res.status(201).json(voucher);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 更新凭证
  static updateVoucher = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const voucher = await voucherService.updateVoucher(id, req.body);
        res.json(voucher);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 删除凭证
  static deleteVoucher = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        await voucherService.deleteVoucher(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];

  // 过账凭证
  static postVoucher = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const voucher = await voucherService.postVoucher(id);
        res.json(voucher);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取科目余额
  static getSubjectBalance = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const balances = await voucherService.getSubjectBalance(req.query);
        res.json(balances);
      } catch (error) {
        next(error);
      }
    },
  ];
}
