import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// 应用配置
export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/light_erp',
  },

  // 应用配置
  app: {
    name: process.env.APP_NAME || 'LightERP',
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  // 安全配置
  security: {
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

// 验证必需的环境变量
export const validateConfig = () => {
  const requiredEnvVars = ['DATABASE_URL'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`缺少必需的环境变量: ${envVar}`);
    }
  }
};