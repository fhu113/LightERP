# LightERP - 轻量级ERP系统

## 项目概述

一个基于Node.js + React + TypeScript的轻量级企业资源计划系统，包含主数据管理、OTC销售流程、PTP采购流程和财务管理。

## 技术栈

- **后端**: Node.js, Express, TypeScript, Prisma ORM
- **前端**: React 18, TypeScript, Ant Design, Vite
- **数据库**: SQLite (开发) / PostgreSQL (生产)

## 项目结构

```
~/Coding/LightERP_Claude/
├── packages/
│   ├── backend/           # 后端服务 (端口3000)
│   │   ├── prisma/        # 数据库模型
│   │   └── src/
│   │       ├── config/   # 配置
│   │       ├── controllers/ # 控制器
│   │       ├── services/  # 业务逻辑
│   │       ├── routes/    # 路由
│   │       └── types/    # 类型定义
│   └── frontend/          # 前端应用 (端口5173)
│       └── src/
│           ├── pages/    # 页面组件
│           ├── services/ # API服务
│           └── types/    # 类型
├── DATABASE.md           # 数据库设计文档
├── DEVELOPMENT.md        # 开发指南
└── MANUAL.md            # 用户手册
```

## 启动命令

```bash
# 1. 根目录安装依赖
npm install

# 2. 后端：生成Prisma客户端并启动
cd packages/backend
npx prisma generate
npm run dev

# 3. 前端：新终端启动
cd packages/frontend
npm run dev
```

## 已完成功能

### 主数据管理
- 会计科目 (AccountingSubject)
- 客户 (Customer)
- 供应商 (Supplier)
- 物料 (Material)

### OTC销售流程
- 销售订单 (SalesOrder)
- 发货单 (Delivery)
- 销售发票 (SalesInvoice)
- 收款 (Receipt)

### PTP采购流程
- 采购订单 (PurchaseOrder)
- 采购收货 (PurchaseReceipt)
- 采购发票 (PurchaseInvoice)
- 付款 (Payment)

### 财务管理
- 凭证 (Voucher)
- 科目余额

### 库存管理
- 库存 (Inventory)
- 库存交易 (InventoryTransaction)

## 待完成功能

1. **财务凭证自动生成** - 销售/采购发票确认时自动生成凭证
2. **报表功能** - 销售统计、采购统计、库存报表
3. **用户认证** - 登录/登出、角色权限
4. **系统配置** - 税率、单据编号规则

## 开发规范

- 后端：Service -> Controller -> Route 架构
- 前端：函数组件 + Hooks
- API：RESTful风格，统一响应格式
- 数据库：通过Prisma ORM操作，执行 `npx prisma db push` 同步模型

## 常用命令

```bash
# 数据库
cd packages/backend
npx prisma studio          # 查看数据库
npx prisma db push         # 同步模型到数据库

# 后端
npm run dev                # 开发模式
npm run build              # 构建

# 前端
npm run dev                # 开发模式
npm run build              # 构建
```
