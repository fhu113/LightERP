# LightERP 数据库设计文档

## 概述

本文档详细说明LightERP系统的数据库设计，采用Prisma ORM进行数据建模。

## 数据模型

### 主数据模型

#### 1. 会计科目 (AccountingSubject)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键，CUID |
| code | String | 科目编码，唯一 |
| name | String | 科目名称 |
| type | String | 科目类型：ASSET, LIABILITY, EQUITY, COST, REVENUE, EXPENSE |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**特点**：采用SAP ERP风格的扁平化结构，无父子层级关系。

#### 2. 客户 (Customer)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| code | String | 客户编码，唯一 |
| name | String | 客户名称 |
| contactPerson | String? | 联系人 |
| phone | String? | 电话 |
| email | String? | 邮箱 |
| address | String? | 地址 |
| creditLimit | Float | 信用额度，默认0 |
| receivableBalance | Float | 应收账款余额，默认0 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 3. 供应商 (Supplier)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| code | String | 供应商编码，唯一 |
| name | String | 供应商名称 |
| contactPerson | String? | 联系人 |
| phone | String? | 电话 |
| email | String? | 邮箱 |
| address | String? | 地址 |
| payableBalance | Float | 应付账款余额，默认0 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 4. 物料 (Material)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| code | String | 物料编码，唯一 |
| name | String | 物料名称 |
| specification | String? | 规格型号 |
| unit | String | 单位 |
| currentStock | Float | 当前库存，默认0 |
| costPrice | Float | 成本价，默认0 |
| salePrice | Float | 销售价，默认0 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 销售流程模型 (OTC)

#### 5. 销售订单 (SalesOrder)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| orderNo | String | 订单编号，格式：SO-YYYYMMDD-0001 |
| customerId | String | 客户外键 |
| orderDate | DateTime | 订单日期 |
| deliveryDate | DateTime? | 交货日期 |
| status | String | 状态：DRAFT, CONFIRMED, COMPLETED, CANCELLED |
| totalAmount | Float | 订单金额 |
| taxAmount | Float | 税额 |
| createdBy | String? | 创建人 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 6. 销售订单明细 (SalesOrderItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| orderId | String | 订单外键 |
| materialId | String | 物料外键 |
| quantity | Float | 数量 |
| unitPrice | Float | 单价 |
| amount | Float | 金额 |
| deliveredQuantity | Float | 已发货数量 |

#### 7. 发货单 (Delivery)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| deliveryNo | String | 发货单号，格式：DO-YYYYMMDD-0001 |
| orderId | String | 订单外键 |
| deliveryDate | DateTime | 发货日期 |
| warehouseId | String? | 仓库ID |
| shippingInfo | String? | 物流信息 |
| status | String | 状态：DRAFT, CONFIRMED, COMPLETED, CANCELLED |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 8. 发货明细 (DeliveryItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| deliveryId | String | 发货单外键 |
| orderItemId | String | 订单明细外键 |
| materialId | String | 物料外键 |
| quantity | Float | 数量 |

#### 9. 销售发票 (SalesInvoice)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| invoiceNo | String | 发票编号，格式：SINV-YYYYMMDD-0001 |
| orderId | String | 订单外键 |
| customerId | String | 客户外键 |
| invoiceDate | DateTime | 开票日期 |
| amount | Float | 金额 |
| taxAmount | Float | 税额 |
| status | String | 状态：DRAFT, ISSUED, PAID, CANCELLED |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 10. 收款单 (Receipt)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| receiptNo | String | 收款单号，格式：REC-YYYYMMDD-0001 |
| customerId | String | 客户外键 |
| invoiceId | String? | 发票外键（可选） |
| receiptDate | DateTime | 收款日期 |
| amount | Float | 收款金额 |
| paymentMethod | String | 收款方式：CASH, BANK_TRANSFER, CHECK, CREDIT_CARD |
| status | String | 状态：PENDING, PAID, CANCELLED |
| createdAt | DateTime | 创建时间 |

### 采购流程模型 (PTP)

#### 11. 采购订单 (PurchaseOrder)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| orderNo | String | 订单编号，格式：PO-YYYYMMDD-0001 |
| supplierId | String | 供应商外键 |
| orderDate | DateTime | 订单日期 |
| expectedDate | DateTime? | 预计到货日期 |
| status | String | 状态：DRAFT, CONFIRMED, COMPLETED, CANCELLED |
| totalAmount | Float | 订单金额 |
| createdBy | String? | 创建人 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 12. 采购订单明细 (PurchaseOrderItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| orderId | String | 订单外键 |
| materialId | String | 物料外键 |
| quantity | Float | 数量 |
| unitPrice | Float | 单价 |
| amount | Float | 金额 |
| receivedQuantity | Float | 已收货数量 |

#### 13. 采购收货单 (PurchaseReceipt)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| receiptNo | String | 收货单号，格式：PR-YYYYMMDD-0001 |
| orderId | String | 订单外键 |
| receiptDate | DateTime | 收货日期 |
| warehouseId | String? | 仓库ID |
| status | String | 状态：DRAFT, CONFIRMED, COMPLETED, CANCELLED |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 14. 采购收货明细 (PurchaseReceiptItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| receiptId | String | 收货单外键 |
| orderItemId | String | 订单明细外键 |
| materialId | String | 物料外键 |
| quantity | Float | 数量 |
| unitPrice | Float | 单价 |

#### 15. 采购发票 (PurchaseInvoice)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| invoiceNo | String | 发票编号，格式：PINV-YYYYMMDD-0001 |
| supplierId | String | 供应商外键 |
| receiptId | String? | 收货单外键 |
| invoiceDate | DateTime | 开票日期 |
| amount | Float | 金额 |
| taxAmount | Float | 税额 |
| status | String | 状态：DRAFT, ISSUED, PAID, CANCELLED |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 16. 付款单 (Payment)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| paymentNo | String | 付款单号，格式：PAY-YYYYMMDD-0001 |
| supplierId | String | 供应商外键 |
| invoiceId | String? | 发票外键（可选） |
| paymentDate | DateTime | 付款日期 |
| amount | Float | 付款金额 |
| paymentMethod | String | 付款方式：CASH, BANK_TRANSFER, CHECK, CREDIT_CARD |
| status | String | 状态：PENDING, PAID, CANCELLED |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 财务模型

#### 17. 财务凭证 (Voucher)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| voucherNo | String | 凭证编号，格式：V-YYYYMMDD-0001 |
| voucherDate | DateTime | 凭证日期 |
| voucherType | String | 凭证类型：GENERAL, ADJUSTMENT, REVERSAL |
| summary | String | 摘要 |
| status | String | 状态：DRAFT, POSTED, REVERSED |
| createdBy | String? | 创建人 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 18. 凭证分录 (VoucherItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| voucherId | String | 凭证外键 |
| subjectId | String | 科目外键 |
| debitAmount | Float | 借方金额 |
| creditAmount | Float | 贷方金额 |
| description | String? | 描述 |

### 库存模型

#### 19. 库存交易 (InventoryTransaction)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| materialId | String | 物料外键 |
| transactionType | String | 交易类型：PURCHASE_RECEIPT, SALES_DELIVERY, STOCK_ADJUSTMENT |
| quantity | Float | 数量 |
| unitCost | Float | 单位成本 |
| referenceType | String | 参考类型 |
| referenceId | String | 参考ID |
| transactionDate | DateTime | 交易日期 |

### 系统模型

#### 20. 系统配置 (SystemConfig)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| configKey | String | 配置键，唯一 |
| configValue | String | 配置值 |
| description | String? | 描述 |

## 业务逻辑

### 库存管理

- 采用移动加权平均法计算库存成本
- 采购收货确认时：更新物料当前库存和成本价
- 销售发货确认时：扣减物料当前库存

### 应收账款管理

- 销售发票确认时：增加客户应收账款
- 收款单确认时：减少客户应收账款

### 应付账款管理

- 采购发票确认时：增加供应商应付账款
- 付款单确认时：减少供应商应付账款

### 单据编号规则

| 单据类型 | 格式 | 示例 |
|----------|------|------|
| 销售订单 | SO-YYYYMMDD-0001 | SO-20260309-0001 |
| 发货单 | DO-YYYYMMDD-0001 | DO-20260309-0001 |
| 销售发票 | SINV-YYYYMMDD-0001 | SINV-20260309-0001 |
| 收款单 | REC-YYYYMMDD-0001 | REC-20260309-0001 |
| 采购订单 | PO-YYYYMMDD-0001 | PO-20260309-0001 |
| 采购收货单 | PR-YYYYMMDD-0001 | PR-20260309-0001 |
| 采购发票 | PINV-YYYYMMDD-0001 | PINV-20260309-0001 |
| 付款单 | PAY-YYYYMMDD-0001 | PAY-20260309-0001 |
| 凭证 | V-YYYYMMDD-0001 | V-20260309-0001 |

## 数据库配置

### SQLite (开发环境)

```
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (生产环境)

```
DATABASE_URL="postgresql://user:password@localhost:5432/light_erp?schema=public"
```
