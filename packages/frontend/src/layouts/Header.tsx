import React from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Typography, message, Tag } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const roleText: Record<string, string> = {
  ADMIN: '管理员',
  KEY_USER: '关键用户',
  USER: '普通用户',
};

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: '#1f1f1f', text: '#fff', border: '#1f1f1f' },
  KEY_USER: { bg: '#434343', text: '#fff', border: '#434343' },
  USER: { bg: '#595959', text: '#fff', border: '#595959' },
};

const Header: React.FC<HeaderProps> = ({ collapsed, onCollapse }) => {
  const { user, loginTime, logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      message.success('已退出登录');
      navigate('/login');
    } else if (key === 'profile') {
      message.info('个人中心功能开发中');
    } else if (key === 'settings') {
      navigate('/system/config');
    }
  };

  const formatLoginTime = () => {
    if (!loginTime) return '未知';
    const now = new Date();
    const login = new Date(loginTime);
    const diff = Math.floor((now.getTime() - login.getTime()) / 1000);

    if (diff < 60) return '刚刚登录';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return login.toLocaleDateString('zh-CN');
  };

  const getRoleStyle = () => {
    const role = user?.role || 'USER';
    const colors = roleColors[role];
    return {
      background: colors.bg,
      color: colors.text,
      borderColor: colors.border,
    };
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 16px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onCollapse}
          style={{ fontSize: '16px' }}
        />
        <div style={{ marginLeft: 8 }}>
          <Text strong style={{ fontSize: 16 }}>
            LightERP
          </Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            轻量级ERP系统
          </Text>
        </div>
      </Space>

      <Space size="large">
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <div
            style={{
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 6,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.3s',
            }}
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                background: user?.role === 'ADMIN' ? '#1f1f1f' : user?.role === 'KEY_USER' ? '#434343' : '#595959',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <Text strong style={{ fontSize: 13 }}>{user?.name || '用户'}</Text>
              <Tag
                style={{
                  ...getRoleStyle(),
                  margin: 0,
                  marginTop: 2,
                  fontSize: 11,
                  padding: '0 6px',
                  height: 18,
                  lineHeight: '16px',
                }}
              >
                {roleText[user?.role || 'USER']}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>{formatLoginTime()}</Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;