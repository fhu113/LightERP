import React from 'react';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DatabaseOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  InboxOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const SiderMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <DatabaseOutlined />,
      label: '仪表盘',
    },
    {
      key: 'master-data',
      icon: <DatabaseOutlined />,
      label: '主数据管理',
      children: [
        {
          key: '/master/subjects',
          label: '会计科目',
        },
        {
          key: '/master/customers',
          label: '客户管理',
        },
        {
          key: '/master/suppliers',
          label: '供应商管理',
        },
        {
          key: '/master/materials',
          label: '物料管理',
        },
      ],
    },
    {
      key: 'sales',
      icon: <ShopOutlined />,
      label: '销售管理 (OTC)',
      children: [
        {
          key: '/sales/orders',
          label: '销售订单',
        },
        {
          key: '/sales/deliveries',
          label: '发货管理',
        },
        {
          key: '/sales/invoices',
          label: '销售开票',
        },
        {
          key: '/sales/receipts',
          label: '收款管理',
        },
      ],
    },
    {
      key: 'purchase',
      icon: <ShoppingOutlined />,
      label: '采购管理 (PTP)',
      children: [
        {
          key: '/purchase/orders',
          label: '采购订单',
        },
        {
          key: '/purchase/receipts',
          label: '收货管理',
        },
        {
          key: '/purchase/invoices',
          label: '采购发票',
        },
        {
          key: '/purchase/payments',
          label: '付款管理',
        },
      ],
    },
    {
      key: 'finance',
      icon: <DollarOutlined />,
      label: '财务管理',
      children: [
        {
          key: '/finance/vouchers',
          label: '凭证录入',
        },
        {
          key: '/finance/voucher-list',
          label: '凭证查询',
        },
        {
          key: '/finance/balance',
          label: '科目余额',
        },
      ],
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: '库存管理',
      children: [
        {
          key: '/inventory/stock',
          label: '库存查询',
        },
        {
          key: '/inventory/transactions',
          label: '库存流水',
        },
        {
          key: '/inventory/adjustments',
          label: '库存调整',
        },
      ],
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
      children: [
        {
          key: '/reports/sales',
          label: '销售报表',
        },
        {
          key: '/reports/purchase',
          label: '采购报表',
        },
        {
          key: '/reports/inventory',
          label: '库存报表',
        },
      ],
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        {
          key: '/system/users',
          label: '用户管理',
        },
        {
          key: '/system/config',
          label: '会计引擎',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 根据当前路径计算选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    const selectedKeys: string[] = [];

    // 查找匹配的菜单项
    const findSelected = (items: any[], parentKey?: string) => {
      for (const item of items) {
        if (item.key === path) {
          selectedKeys.push(item.key);
          if (parentKey) {
            selectedKeys.push(parentKey);
          }
          return true;
        }
        if (item.children) {
          if (findSelected(item.children, item.key)) {
            if (parentKey) {
              selectedKeys.push(parentKey);
            }
            return true;
          }
        }
      }
      return false;
    };

    findSelected(menuItems);
    return selectedKeys;
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ padding: '0 24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>ERP</div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>企业资源计划</div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={['master-data']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default SiderMenu;