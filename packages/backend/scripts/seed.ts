import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 1. 创建基础会计科目
  console.log('创建会计科目...');

  const subjects = [
    // 资产类 (1开头)
    { code: '1001', name: '库存现金', type: 'ASSET' },
    { code: '1002', name: '银行存款', type: 'ASSET' },
    { code: '1122', name: '应收账款', type: 'ASSET' },
    { code: '1405', name: '库存商品', type: 'ASSET' },

    // 负债类 (2开头)
    { code: '2202', name: '应付账款', type: 'LIABILITY' },
    { code: '2221', name: '应交税费', type: 'LIABILITY' },

    // 所有者权益类 (3开头)
    { code: '3001', name: '实收资本', type: 'EQUITY' },
    { code: '3103', name: '本年利润', type: 'EQUITY' },

    // 成本类 (4开头)
    { code: '5001', name: '主营业务成本', type: 'COST' },

    // 损益类 (5、6开头)
    { code: '6001', name: '主营业务收入', type: 'REVENUE' },
    { code: '6602', name: '管理费用', type: 'EXPENSE' },
    { code: '6603', name: '财务费用', type: 'EXPENSE' },
  ];

  for (const subject of subjects) {
    await prisma.accountingSubject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject,
    });
  }

  // 2. 创建示例客户
  console.log('创建示例客户...');

  await prisma.customer.upsert({
    where: { code: 'CUST001' },
    update: {
      name: '示例客户有限公司',
      contactPerson: '张经理',
      phone: '13800138000',
      email: 'contact@example.com',
      address: '北京市朝阳区',
      creditLimit: 100000,
    },
    create: {
      code: 'CUST001',
      name: '示例客户有限公司',
      contactPerson: '张经理',
      phone: '13800138000',
      email: 'contact@example.com',
      address: '北京市朝阳区',
      creditLimit: 100000,
    },
  });

  // 3. 创建示例供应商
  console.log('创建示例供应商...');

  await prisma.supplier.upsert({
    where: { code: 'SUPP001' },
    update: {
      name: '示例供应商有限公司',
      contactPerson: '李经理',
      phone: '13900139000',
      email: 'supplier@example.com',
      address: '上海市浦东新区',
    },
    create: {
      code: 'SUPP001',
      name: '示例供应商有限公司',
      contactPerson: '李经理',
      phone: '13900139000',
      email: 'supplier@example.com',
      address: '上海市浦东新区',
    },
  });

  // 4. 创建示例物料
  console.log('创建示例物料...');

  const materials = [
    {
      code: 'MAT001',
      name: '笔记本电脑',
      specification: '15寸 i7 16GB 512GB',
      unit: '台',
      costPrice: 5000,
      salePrice: 6500,
      minStock: 10,
      maxStock: 100,
    },
    {
      code: 'MAT002',
      name: '办公桌',
      specification: 'L1600×W800×H750mm',
      unit: '张',
      costPrice: 800,
      salePrice: 1200,
      minStock: 5,
      maxStock: 50,
    },
    {
      code: 'MAT003',
      name: '办公椅',
      specification: '人体工学椅',
      unit: '把',
      costPrice: 400,
      salePrice: 600,
      minStock: 10,
      maxStock: 100,
    },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { code: material.code },
      update: material,
      create: material,
    });
  }

  // 5. 创建系统配置
  console.log('创建系统配置...');

  const systemConfigs = [
    { configKey: 'COMPANY_NAME', configValue: 'LightERP演示公司', description: '公司名称' },
    { configKey: 'DEFAULT_TAX_RATE', configValue: '0.13', description: '默认增值税率' },
    { configKey: 'CURRENCY', configValue: 'CNY', description: '默认币种' },
    { configKey: 'DATE_FORMAT', configValue: 'YYYY-MM-DD', description: '日期格式' },
    { configKey: 'AUTO_GENERATE_VOUCHER', configValue: 'true', description: '是否自动生成凭证' },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { configKey: config.configKey },
      update: config,
      create: config,
    });
  }

  console.log('种子数据初始化完成！');
}

main()
  .catch((error) => {
    console.error('种子数据初始化失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });