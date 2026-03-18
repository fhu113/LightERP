import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import Header from './Header';
import SiderMenu from './SiderMenu';
import { Outlet } from 'react-router-dom';

const { Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, colorBgLayout, borderRadiusLG, colorBgElevated },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh', background: colorBgLayout }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        style={{
          background: colorBgContainer,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <SiderMenu />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s', background: colorBgLayout }}>
        <Header collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />

        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>

        <Layout.Footer style={{
          textAlign: 'center',
          padding: '12px 24px',
          background: colorBgLayout,
        }}>
          LightERP ©{new Date().getFullYear()} - 轻量级ERP系统
        </Layout.Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;