import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// 自定义错误类
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404错误处理
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`找不到资源: ${req.originalUrl}`, 404);
  next(error);
};

// 全局错误处理
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const response: ApiResponse = {
    success: false,
    error: err.message,
  };

  // 如果是自定义错误
  if (err instanceof AppError) {
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma错误处理
  if (err.name === 'PrismaClientKnownRequestError') {
    response.error = `Prisma错误 (${(err as any).code}): ${err.message}`;
    res.status(400).json(response);
    return;
  }

  if (err.name === 'PrismaClientValidationError') {
    response.error = '数据验证错误';
    res.status(400).json(response);
    return;
  }

  // Joi验证错误
  if (err.name === 'ValidationError') {
    response.error = err.message;
    res.status(400).json(response);
    return;
  }

  // 默认错误
  console.error('未处理的错误:', err);
  response.error = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
  res.status(500).json(response);
};