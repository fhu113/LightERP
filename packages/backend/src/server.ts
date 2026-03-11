import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { responseFormatter } from './middleware/responseFormatter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';
import masterRoutes from './routes/master.routes';
import salesRoutes from './routes/sales.routes';
import deliveryRoutes from './routes/delivery.routes';
import salesInvoiceRoutes from './routes/sales-invoice.routes';
import receiptRoutes from './routes/receipt.routes';
import purchaseRoutes from './routes/purchase.routes';
import purchaseReceiptRoutes from './routes/purchase-receipt.routes';
import purchaseInvoiceRoutes from './routes/purchase-invoice.routes';
import paymentRoutes from './routes/payment.routes';
import voucherRoutes from './routes/voucher.routes';
import reportRoutes from './routes/report.routes';
import authRoutes from './routes/auth.routes';

// 验证配置
validateConfig();

// 创建Express应用
const app = express();

// 中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined')); // 日志
app.use(responseFormatter); // 响应格式化

// 健康检查路由
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: config.app.name,
    environment: config.nodeEnv,
  });
});

// API路由
app.use(`${config.app.apiPrefix}/health`, (_req, res) => {
  res.json({ message: 'API服务运行正常' });
});

// 主数据管理路由
app.use(`${config.app.apiPrefix}/master`, masterRoutes);

// 销售管理路由
app.use(`${config.app.apiPrefix}/sales`, salesRoutes);

// 发货管理路由
app.use(`${config.app.apiPrefix}/deliveries`, deliveryRoutes);

// 销售发票管理路由
app.use(`${config.app.apiPrefix}/sales-invoices`, salesInvoiceRoutes);

// 收款管理路由
app.use(`${config.app.apiPrefix}/receipts`, receiptRoutes);

// 采购管理路由
app.use(`${config.app.apiPrefix}/purchase`, purchaseRoutes);

// 采购收货路由
app.use(`${config.app.apiPrefix}/purchase-receipts`, purchaseReceiptRoutes);

// 采购发票路由
app.use(`${config.app.apiPrefix}/purchase-invoices`, purchaseInvoiceRoutes);

// 付款管理路由
app.use(`${config.app.apiPrefix}/payments`, paymentRoutes);

// 凭证管理路由
app.use(`${config.app.apiPrefix}/vouchers`, voucherRoutes);

// 报表管理路由
app.use(`${config.app.apiPrefix}/reports`, reportRoutes);

// 认证路由
app.use(`${config.app.apiPrefix}/auth`, authRoutes);

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('数据库连接成功');

    const server = app.listen(config.port, () => {
      console.log(`
        🚀 ${config.app.name} 服务器已启动
        📍 环境: ${config.nodeEnv}
        🔗 地址: http://localhost:${config.port}
        📊 健康检查: http://localhost:${config.port}/health
        📁 API前缀: ${config.app.apiPrefix}
      `);
    });

    // 优雅关闭
    const shutdown = async () => {
      console.log('正在关闭服务器...');

      server.close(async () => {
        await prisma.$disconnect();
        console.log('服务器已关闭');
        process.exit(0);
      });

      // 如果10秒后仍未关闭，强制退出
      setTimeout(() => {
        console.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动应用
if (require.main === module) {
  startServer();
}

// Vercel Serverless 导出
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel 环境下的特殊处理
  if (process.env.VERCEL === '1') {
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('数据库连接失败:', error);
      return res.status(500).json({ error: '数据库连接失败' });
    }
  }

  // 使用 Express app 处理请求
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}

export { app };