import React, { useMemo, useState } from 'react';
import { Menu, Tooltip, theme } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DatabaseOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  InboxOutlined,
  BarChartOutlined,
  SettingOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { useToken } = theme;

// 模块说明配置
const moduleDescriptions: Record<string, string> = {
  '/': '查看业务概览和关键指标',
  'master-data': '管理会计科目、客户、供应商、物料等主数据',
  '/master/subjects': '维护会计科目体系',
  '/master/customers': '管理客户信息',
  '/master/suppliers': '管理供应商信息',
  '/master/materials': '管理物料基本信息',
  '/master/maintenance': '批量导入/导出主数据',
  'sales': '销售订单到现金的完整流程管理',
  '/sales/orders': '创建和管理销售订单',
  '/sales/deliveries': '销售发货管理',
  '/sales/invoices': '销售发票开具',
  '/sales/receipts': '销售收款管理',
  'purchase': '采购到付款的完整流程管理',
  '/purchase/orders': '创建和管理采购订单',
  '/purchase/receipts': '采购收货管理',
  '/purchase/invoices': '采购发票校验',
  '/purchase/payments': '采购付款管理',
  'production': '生产订单和BOM管理',
  '/production/orders': '创建和管理生产订单',
  '/production/receipts': '生产成品收货入库',
  '/production/boms': '物料清单Bill of Materials管理',
  'finance': '财务凭证录入和科目余额管理',
  '/finance/vouchers': '录入和审核财务凭证',
  '/finance/voucher-list': '查询和管理已录入凭证',
  '/finance/balance': '查看会计科目余额',
  'inventory': '库存查询和调整管理',
  '/inventory/query': '查询当前库存',
  '/inventory/transactions': '查看库存变动流水',
  '/inventory/adjustments': '库存盘点和调整',
  'reports': '业务数据统计分析报表',
  '/reports/sales': '销售数据统计报表',
  '/reports/purchase': '采购数据统计报表',
  '/reports/inventory': '库存数据统计报表',
  '/reports/documents': '综合单据查询',
  'system': '系统参数和用户管理',
  '/system/users': '用户账号和权限管理',
  '/system/cleanup': '清理业务单据数据',
  '/system/backup': '数据库备份与恢复',
  '/system/config': '会计引擎科目配置',
  '/system/tax-codes': '配置进项税和销项税的税码及税率',
};

const SiderMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { token } = useToken();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const menuItems = useMemo(() => {
    const items: any[] = [
      {
        key: '/',
        icon: <DatabaseOutlined />,
        label: '仪表盘',
      },
    ];

    // 主数据管理
    if (hasPermission('finance') || hasPermission('otc') || hasPermission('ptp') || hasPermission('warehouse')) {
      const masterChildren: any[] = [];
      if (hasPermission('finance')) {
        masterChildren.push({ key: '/master/subjects', label: '会计科目' });
      }
      if (hasPermission('otc')) {
        masterChildren.push({ key: '/master/customers', label: '客户管理' });
      }
      if (hasPermission('ptp')) {
        masterChildren.push({ key: '/master/suppliers', label: '供应商管理' });
      }
      if (hasPermission('warehouse')) {
        masterChildren.push({ key: '/master/materials', label: '物料管理' });
      }
      masterChildren.push({ key: '/master/maintenance', label: '主数据维护' });
      if (masterChildren.length > 0) {
        items.push({
          key: 'master-data',
          icon: <DatabaseOutlined />,
          label: '主数据',
          children: masterChildren,
        });
      }
    }

    // 销售管理
    if (hasPermission('otc')) {
      items.push({
        key: 'sales',
        icon: <ShopOutlined />,
        label: '销售管理 (OTC)',
        children: [
          { key: '/sales/orders', label: '销售订单' },
          { key: '/sales/deliveries', label: '发货管理' },
          { key: '/sales/invoices', label: '销售开票' },
          { key: '/sales/receipts', label: '收款管理' },
        ],
      });
    }

    // 采购管理
    if (hasPermission('ptp')) {
      items.push({
        key: 'purchase',
        icon: <ShoppingOutlined />,
        label: '采购管理 (PTP)',
        children: [
          { key: '/purchase/orders', label: '采购订单' },
          { key: '/purchase/receipts', label: '收货管理' },
          { key: '/purchase/invoices', label: '采购发票' },
          { key: '/purchase/payments', label: '付款管理' },
        ],
      });
    }

    // 生产管理
    if (hasPermission('production')) {
      items.push({
        key: 'production',
        icon: <BuildOutlined />,
        label: '生产管理',
        children: [
          { key: '/production/orders', label: '生产订单' },
          { key: '/production/receipts', label: '生产收货' },
          { key: '/production/boms', label: 'BOM管理' },
        ],
      });
    }

    // 财务管理
    if (hasPermission('finance')) {
      items.push({
        key: 'finance',
        icon: <DollarOutlined />,
        label: '财务管理',
        children: [
          { key: '/finance/vouchers', label: '凭证录入' },
          { key: '/finance/voucher-list', label: '凭证查询' },
          { key: '/finance/balance', label: '科目余额' },
        ],
      });
    }

    // 库存管理
    if (hasPermission('warehouse')) {
      items.push({
        key: 'inventory',
        icon: <InboxOutlined />,
        label: '库存管理',
        children: [
          { key: '/inventory/query', label: '库存查询' },
          { key: '/inventory/transactions', label: '库存流水' },
          { key: '/inventory/adjustments', label: '库存调整' },
        ],
      });
    }

    // 报表中心
    if (hasPermission('reports')) {
      items.push({
        key: 'reports',
        icon: <BarChartOutlined />,
        label: '报表中心',
        children: [
          { key: '/reports/sales', label: '销售报表' },
          { key: '/reports/purchase', label: '采购报表' },
          { key: '/reports/inventory', label: '库存报表' },
          { key: '/reports/documents', label: '综合单据查询' },
        ],
      });
    }

    // 系统设置
    const systemChildren: any[] = [];
    if (user?.role === 'ADMIN') {
      systemChildren.push({ key: '/system/users', label: '用户管理' });
      systemChildren.push({ key: '/system/cleanup', label: '数据库清理' });
      systemChildren.push({ key: '/system/backup', label: '数据库备份' });
    }
    if (user?.role === 'ADMIN' || user?.role === 'KEY_USER') {
      systemChildren.push({ key: '/system/config', label: '会计引擎' });
      systemChildren.push({ key: '/system/tax-codes', label: '税码配置' });
    }
    if (systemChildren.length > 0) {
      items.push({
        key: 'system',
        icon: <SettingOutlined />,
        label: '系统设置',
        children: systemChildren,
      });
    }

    return items;
  }, [user, hasPermission]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 获取当前路径选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    const selectedKeys: string[] = [];

    const findSelected = (items: any[], parentKey?: string) => {
      for (const item of items) {
        if (item.key === path) {
          selectedKeys.push(item.key);
          if (parentKey) selectedKeys.push(parentKey);
          return true;
        }
        if (item.children) {
          if (findSelected(item.children, item.key)) {
            if (parentKey) selectedKeys.push(parentKey);
            return true;
          }
        }
      }
      return false;
    };

    findSelected(menuItems);
    return selectedKeys;
  };

  // 获取当前展开的子菜单（默认不展开）
  const getDefaultOpenKeys = () => {
    const path = location.pathname;
    const openKeys: string[] = [];

    const findOpen = (items: any[]) => {
      for (const item of items) {
        if (item.children) {
          for (const child of item.children) {
            if (child.key === path) {
              openKeys.push(item.key);
              return true;
            }
          }
        }
      }
      return false;
    };

    findOpen(menuItems);
    return openKeys;
  };

  // 自定义菜单项渲染，添加悬停提示
  const renderMenuItem = (item: any) => {
    const description = moduleDescriptions[item.key] || '';
    return (
      <Tooltip title={description} placement="right" mouseEnterDelay={0.3}>
        <span>{item.label}</span>
      </Tooltip>
    );
  };

  // 递归处理菜单项，添加title
  const processItems = (items: any[]): any[] => {
    return items.map(item => {
      const description = moduleDescriptions[item.key];
      const newItem: any = {
        ...item,
        label: description ? (
          <Tooltip title={description} placement="right" mouseEnterDelay={0.3}>
            <span>{item.label}</span>
          </Tooltip>
        ) : item.label,
      };
      if (item.children) {
        newItem.children = processItems(item.children);
      }
      return newItem;
    });
  };

  const processedItems = useMemo(() => processItems(menuItems), [menuItems]);

  return (
    <div style={{ padding: '16px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 24px 16px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: token.colorPrimary }}>ERP之光</div>
        <div style={{ fontSize: 12, color: token.colorTextQuaternary }}>星星之火，可以燎原</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getDefaultOpenKeys()}
          items={processedItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
          subMenuCloseDelay={0.3}
          subMenuOpenDelay={0.1}
        />
      </div>
    </div>
  );
};

export default SiderMenu;
