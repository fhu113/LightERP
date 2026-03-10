# LightERP - 轻量级ERP系统

一个基于Node.js + React + PostgreSQL/SQLite的轻量级企业资源计划系统，包含主数据管理、OTC流程、PTP流程和财务管理。

## 功能特点

- **主数据管理**: 会计科目、客户、供应商、物料
- **OTC流程** (Order to Cash): 销售订单、发货、开票、收款
- **PTP流程** (Procure to Pay): 采购订单、收货、发票校验、付款
- **财务管理**: 凭证录入、科目余额、试算平衡
- **库存管理**: 库存跟踪、库存交易、成本核算

## 技术栈

- **后端**: Node.js, Express, TypeScript, Prisma ORM
- **前端**: React 18, TypeScript, Ant Design, Vite
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **开发工具**: ESLint, Prettier, Husky

## 项目结构

```
light-erp/
├── packages/
│   ├── backend/          # 后端服务
│   │   ├── prisma/       # 数据库模型和迁移
│   │   ├── src/          # 源代码
│   │   │   ├── config/   # 配置管理
│   │   │   ├── controllers/ # 控制器
│   │   │   ├── middleware/ # 中间件
│   │   │   ├── routes/   # 路由定义
│   │   │   ├── services/ # 业务逻辑
│   │   │   └── types/    # 类型定义
│   │   └── scripts/      # 脚本文件
│   └── frontend/         # 前端应用
│       ├── src/
│       │   ├── components/ # 可复用组件
│       │   ├── pages/     # 页面组件
│       │   ├── layouts/   # 布局组件
│       │   ├── services/  # API服务
│       │   └── types/     # 类型定义
├── docker-compose.yml    # Docker配置
└── package.json          # Monorepo根配置
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- (可选) Docker & Docker Compose (用于PostgreSQL)

### 安装和运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd light-erp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   # 编辑.env文件（默认使用SQLite开发数据库）
   ```

4. **初始化数据库**
   ```bash
   cd packages/backend
   npx prisma migrate dev
   npx tsx scripts/seed.ts
   ```

5. **启动开发服务器**
   ```bash
   # 在后端目录启动
   npm run dev:backend

   # 在新终端中，在前端目录启动
   npm run dev:frontend

   # 或者在根目录同时启动前后端
   npm run dev
   ```

6. **访问应用**
   - 前端: http://localhost:5173
   - 后端API: http://localhost:3000
   - API文档: http://localhost:3000/api/health

### 使用Docker运行PostgreSQL (可选)

```bash
# 启动PostgreSQL和pgAdmin
docker-compose up -d

# 修改backend/.env中的DATABASE_URL为PostgreSQL连接
# DATABASE_URL="postgresql://postgres:password@localhost:5432/light_erp?schema=public"
```

## API接口

### 主数据管理

#### 会计科目
- `GET    /api/master/subjects` - 获取科目列表
- `GET    /api/master/subjects/tree` - 获取科目树
- `GET    /api/master/subjects/:id` - 获取科目详情
- `POST   /api/master/subjects` - 创建科目
- `PUT    /api/master/subjects/:id` - 更新科目
- `DELETE /api/master/subjects/:id` - 删除科目

#### 客户管理
- `GET    /api/master/customers` - 获取客户列表
- `GET    /api/master/customers/:id` - 获取客户详情
- `POST   /api/master/customers` - 创建客户
- `PUT    /api/master/customers/:id` - 更新客户
- `DELETE /api/master/customers/:id` - 删除客户

#### 供应商管理
- `GET    /api/master/suppliers` - 获取供应商列表
- `GET    /api/master/suppliers/:id` - 获取供应商详情
- `POST   /api/master/suppliers` - 创建供应商
- `PUT    /api/master/suppliers/:id` - 更新供应商
- `DELETE /api/master/suppliers/:id` - 删除供应商

#### 物料管理
- `GET    /api/master/materials` - 获取物料列表
- `GET    /api/master/materials/:id` - 获取物料详情
- `POST   /api/master/materials` - 创建物料
- `PUT    /api/master/materials/:id` - 更新物料
- `DELETE /api/master/materials/:id` - 删除物料

### 销售流程 (OTC)

#### 销售订单
- `GET    /api/sales/orders` - 获取销售订单列表
- `GET    /api/sales/orders/:id` - 获取订单详情
- `POST   /api/sales/orders` - 创建销售订单
- `PUT    /api/sales/orders/:id` - 更新订单
- `DELETE /api/sales/orders/:id` - 删除订单
- `POST   /api/sales/orders/:id/confirm` - 确认订单
- `POST   /api/sales/orders/:id/cancel` - 取消订单

#### 发货管理
- `GET    /api/deliveries` - 获取发货单列表
- `GET    /api/deliveries/:id` - 获取发货单详情
- `POST   /api/deliveries` - 创建发货单
- `POST   /api/deliveries/:id/confirm` - 确认发货

#### 销售发票
- `GET    /api/sales-invoices` - 获取销售发票列表
- `POST   /api/sales-invoices` - 创建销售发票
- `POST   /api/sales-invoices/:id/confirm` - 确认开票

#### 收款管理
- `GET    /api/receipts` - 获取收款单列表
- `POST   /api/receipts` - 创建收款单
- `POST   /api/receipts/:id/confirm` - 确认收款
- `POST   /api/receipts/:id/cancel` - 取消收款

### 采购流程 (PTP)

#### 采购订单
- `GET    /api/purchase/orders` - 获取采购订单列表
- `GET    /api/purchase/orders/:id` - 获取订单详情
- `POST   /api/purchase/orders` - 创建采购订单
- `PUT    /api/purchase/orders/:id` - 更新订单
- `DELETE /api/purchase/orders/:id` - 删除订单
- `POST   /api/purchase/orders/:id/confirm` - 确认订单
- `POST   /api/purchase/orders/:id/cancel` - 取消订单

#### 采购收货
- `GET    /api/purchase-receipts` - 获取收货单列表
- `GET    /api/purchase-receipts/:id` - 获取收货单详情
- `POST   /api/purchase-receipts` - 创建收货单
- `POST   /api/purchase-receipts/:id/confirm` - 确认收货
- `POST   /api/purchase-receipts/:id/cancel` - 取消收货

#### 采购发票
- `GET    /api/purchase-invoices` - 获取采购发票列表
- `GET    /api/purchase-invoices/for-invoicing` - 获取可开票的收货单
- `POST   /api/purchase-invoices` - 创建采购发票
- `POST   /api/purchase-invoices/:id/confirm` - 确认开票
- `POST   /api/purchase-invoices/:id/cancel` - 取消发票

#### 付款管理
- `GET    /api/payments` - 获取付款单列表
- `GET    /api/payments/for-payment` - 获取可付款的发票
- `POST   /api/payments` - 创建付款单
- `POST   /api/payments/:id/confirm` - 确认付款
- `POST   /api/payments/:id/cancel` - 取消付款

#### 凭证管理
- `GET    /api/vouchers` - 获取凭证列表
- `GET    /api/vouchers/:id` - 获取凭证详情
- `POST   /api/vouchers` - 创建凭证
- `POST   /api/vouchers/:id/post` - 过账凭证
- `DELETE /api/vouchers/:id` - 删除凭证

#### 报表
- `GET    /api/reports/sales` - 销售统计报表
- `GET    /api/reports/purchase` - 采购统计报表
- `GET    /api/reports/inventory` - 库存报表
- `GET    /api/reports/receivable` - 应收账款报表
- `GET    /api/reports/payable` - 应付账款报表

### 用户认证
- `POST   /api/auth/register` - 注册用户
- `POST   /api/auth/login` - 用户登录
- `GET    /api/auth/users` - 用户列表（需认证）
- `GET    /api/auth/users/me` - 当前用户信息（需认证）
- `POST   /api/auth/users` - 创建用户（需认证）
- `PUT    /api/auth/users/:id` - 更新用户（需认证）
- `DELETE /api/auth/users/:id` - 删除用户（需认证）

## 开发计划

### 第一阶段: 基础架构 ✅
- [x] 项目结构和Monorepo配置
- [x] 数据库设计和迁移
- [x] 后端基础框架
- [x] 主数据管理API

### 第二阶段: 前端界面 ✅
- [x] 前端基础布局
- [x] 主数据管理页面
- [x] API服务集成

### 第三阶段: OTC流程 ✅
- [x] 销售订单管理
- [x] 发货管理
- [x] 销售发票管理
- [x] 收款管理

### 第四阶段: PTP流程 ✅
- [x] 采购订单管理
- [x] 收货管理
- [x] 采购发票管理
- [x] 付款管理

### 第五阶段: 扩展功能 ✅
- [x] 凭证自动生成 (销售/采购业务自动生成财务凭证)
- [x] 报表功能 (销售报表、采购报表、库存报表)
- [x] 用户认证和权限管理
- [ ] 系统配置

## 配置说明

### 数据库
- 开发环境默认使用SQLite (dev.db)
- 生产环境建议使用PostgreSQL
- 通过`DATABASE_URL`环境变量配置

### 服务器配置
- 端口: 3000 (可通过PORT环境变量修改)
- API前缀: /api
- CORS: 允许http://localhost:5173

## 许可证

MIT