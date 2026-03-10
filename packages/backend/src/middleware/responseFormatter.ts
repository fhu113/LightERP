import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// 响应格式化中间件
export const responseFormatter = (_req: Request, res: Response, next: NextFunction) => {
  // 保存原始的res.json方法
  const originalJson = res.json;

  // 重写res.json方法
  res.json = function (data: any) {
    // 如果已经是格式化后的响应，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    // 格式化响应
    const formattedResponse: ApiResponse = {
      success: res.statusCode >= 200 && res.statusCode < 300,
      data,
    };

    // 如果是错误状态码，添加错误信息
    if (res.statusCode >= 400) {
      formattedResponse.success = false;
      if (data && typeof data === 'object' && data.message) {
        formattedResponse.error = data.message;
      } else if (typeof data === 'string') {
        formattedResponse.error = data;
      }
      delete formattedResponse.data;
    }

    return originalJson.call(this, formattedResponse);
  };

  next();
};