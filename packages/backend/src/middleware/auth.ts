import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    permissions: string[];
  };
}

// 认证中间件 - 验证用户是否登录
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未授权访问', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    next(error);
  }
};

// 权限中间件 - 验证用户角色
// ADMIN: 可以访问所有功能
// KEY_USER: 除了用户管理外可以访问所有功能
// USER: 需要检查具体权限
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('未授权访问', 401);
      }

      const { role } = req.user;

      // ADMIN 可以访问一切
      if (role === 'ADMIN') {
        return next();
      }

      // KEY_USER 可以访问标记为 KEY_USER 的路由，但不能访问用户管理
      if (role === 'KEY_USER') {
        // 如果允许列表中包含 KEY_USER，则允许访问
        if (allowedRoles.includes('KEY_USER')) {
          return next();
        }
        // 否则拒绝访问
        throw new AppError('没有权限执行此操作', 403);
      }

      // 检查角色权限
      if (!allowedRoles.includes(role)) {
        throw new AppError('没有权限执行此操作', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 模块权限中间件 - 验证用户是否有特定模块的权限
// 模块: finance, otc, ptp, warehouse, reports
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('未授权访问', 401);
      }

      const { role, permissions } = req.user;

      // ADMIN 可以访问一切
      if (role === 'ADMIN') {
        return next();
      }

      // KEY_USER 可以访问所有业务模块
      if (role === 'KEY_USER') {
        return next();
      }

      // USER 需要检查具体权限
      const hasPermission = requiredPermissions.some(p => permissions.includes(p));

      if (!hasPermission) {
        throw new AppError('没有权限访问此模块', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
