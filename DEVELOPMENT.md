# LightERP 开发指南

## 项目启动

### 开发环境启动

```bash
# 1. 根目录安装依赖
npm install

# 2. 进入后端目录
cd packages/backend

# 3. 生成Prisma客户端
npx prisma generate

# 4. 初始化/同步数据库
npx prisma db push

# 5. 启动后端服务
npm run dev

# 6. 新终端，启动前端
cd packages/frontend
npm run dev
```

### 端口说明

| 服务 | 端口 |
|------|------|
| 后端API | 3000 |
| 前端开发 | 5173 (或5174) |

## 代码结构

### 后端架构

```
packages/backend/src/
├── config/          # 配置文件
├── controllers/     # 控制器（处理请求响应）
├── services/        # 业务逻辑层
├── routes/         # 路由定义
├── types/          # 类型定义
├── middleware/     # 中间件
├── lib/            # 工具库（Prisma客户端）
└── utils/          # 辅助工具（验证规则）
```

### 前端架构

```
packages/frontend/src/
├── pages/          # 页面组件
├── services/       # API调用服务
├── types/          # 类型定义
├── layouts/        # 布局组件
└── routes/         # 路由配置
```

## 添加新功能

### 1. 后端添加API

以添加"采购退货"为例：

#### Step 1: 定义类型

创建或更新 `types/purchase-return.ts`：

```typescript
export type PurchaseReturnStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface PurchaseReturnResponse {
  id: string;
  returnNo: string;
  // ... 其他字段
}
```

#### Step 2: 添加数据库模型

更新 `prisma/schema.prisma`：

```prisma
model PurchaseReturn {
  id        String   @id @default(cuid())
  returnNo  String   @unique
  // ... 其他字段
}
```

执行：
```bash
npx prisma generate
npx prisma db push
```

#### Step 3: 创建Service

创建 `services/purchase-return.service.ts`：

```typescript
export class PurchaseReturnService {
  async getPurchaseReturns(params) {
    // 查询逻辑
  }

  async createPurchaseReturn(data) {
    // 创建逻辑
  }
}
```

#### Step 4: 创建Controller

创建 `controllers/purchase-return.controller.ts`：

```typescript
export class PurchaseReturnController {
  static getPurchaseReturns = [
    async (req, res, next) => {
      // 处理请求
    }
  ];
}
```

#### Step 5: 创建Router

创建 `routes/purchase-return.routes.ts`：

```typescript
import { PurchaseReturnController } from '../controllers/purchase-return.controller';

const router = Router();

router.get('/', ...PurchaseReturnController.getPurchaseReturns);

export default router;
```

#### Step 6: 注册路由

在 `server.ts` 中添加：

```typescript
import purchaseReturnRoutes from './routes/purchase-return.routes';

// 注册路由
app.use(`${config.app.apiPrefix}/purchase-returns`, purchaseReturnRoutes);
```

### 2. 前端添加页面

#### Step 1: 定义类型

在 `types/index.ts` 中添加类型定义

#### Step 2: 创建API服务

在 `services/` 下创建 `purchase-return.api.ts`

#### Step 3: 创建页面组件

在 `pages/purchase/` 下创建 `PurchaseReturnList.tsx`

#### Step 4: 配置路由

在 `routes/index.tsx` 中添加路由

#### Step 5: 添加菜单项

在 `layouts/SiderMenu.tsx` 中添加菜单

## 数据库迁移

### 创建迁移

```bash
cd packages/backend
npx prisma migrate dev --name init
```

### 重置数据库

```bash
npx prisma migrate reset
```

### 查看数据库

```bash
npx prisma studio
```

## 常见问题

### 1. TypeScript编译错误

- 检查 `tsconfig.json` 配置
- 运行 `npx prisma generate` 更新类型

### 2. 前端API请求失败

- 检查后端服务是否运行
- 检查CORS配置
- 检查API路径是否正确

### 3. 数据库连接失败

- 检查 `.env` 文件中的 `DATABASE_URL`
- 确保SQLite文件存在或PostgreSQL服务运行

### 4. 前端构建失败

- 检查依赖是否完整安装
- 尝试删除 `node_modules` 和 `package-lock.json` 后重新安装

## 代码规范

### TypeScript

- 使用 `interface` 定义数据结构
- 避免使用 `any`，尽量指定具体类型
- 函数参数和返回值要有类型注解

### React

- 使用函数组件和Hooks
- 组件文件以 `.tsx` 结尾
- 类型文件以 `.ts` 结尾

### API设计

- RESTful风格
- 使用统一响应格式
- 错误信息要清晰

## 待完成功能清单

1. **财务凭证自动生成**
   - 销售发票确认时自动生成凭证
   - 采购发票确认时自动生成凭证
   - 收款/付款时自动生成凭证

2. **报表功能**
   - 销售统计报表
   - 采购统计报表
   - 库存报表

3. **用户认证**
   - 登录/登出
   - 角色权限管理

4. **系统配置**
   - 税率配置
   - 单据编号规则配置
