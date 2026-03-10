import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export class AuthController {
  // 用户列表
  static getUsers = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, search } = req.query;
        const result = await authService.getUsers({
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          search: search as string,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取当前用户信息
  static getCurrentUser = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        const userInfo = await authService.getUserById(user.userId);
        res.json(userInfo);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 获取用户详情
  static getUserById = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const user = await authService.getUserById(id);
        if (!user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 创建用户
  static createUser = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await authService.createUser(req.body);
        res.status(201).json(user);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 更新用户
  static updateUser = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const user = await authService.updateUser(id, req.body);
        res.json(user);
      } catch (error) {
        next(error);
      }
    },
  ];

  // 删除用户
  static deleteUser = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        await authService.deleteUser(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];

  // 登录
  static login = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.login(req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  ];
}
