import React, { useEffect } from 'react';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import { setAppMessageApi } from './services/app-message';
import './index.css';

const AppMessageRegistrar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    setAppMessageApi(message);
  }, [message]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <AppMessageRegistrar>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </AppMessageRegistrar>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
