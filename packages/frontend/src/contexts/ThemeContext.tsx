import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antTheme, theme } from 'antd';
import { ENTERPRISE_THEMES, ThemeConfig, getThemeConfig } from '../config/theme';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeKey: string;
  setThemeKey: (key: string) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'lighterp_theme_key';

// 本地存储处理
const getStoredTheme = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'classic';
  } catch {
    return 'classic';
  }
};

const setStoredTheme = (key: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // 忽略存储错误
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeKey, setThemeKeyState] = useState<string>(() => getStoredTheme());

  const setThemeKey = (key: string) => {
    setThemeKeyState(key);
    setStoredTheme(key);
  };

  const currentTheme = useMemo(() => getThemeConfig(themeKey), [themeKey]);

  const isDarkMode = themeKey === 'dark';

  // 构建 Ant Design 主题配置
  const antDesignTheme = useMemo(() => {
    const { token, components } = currentTheme.antTheme;
    return {
      token: {
        ...token,
        // 确保颜色值正确传递
        colorPrimary: token.colorPrimary,
        colorSuccess: token.colorSuccess,
        colorWarning: token.colorWarning,
        colorError: token.colorError,
        colorInfo: token.colorInfo,
      },
      algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      components,
    };
  }, [currentTheme, isDarkMode]);

  // 应用 CSS 变量
  useEffect(() => {
    const root = document.documentElement;

    // 设置 Ant Design 变量
    root.style.setProperty('--ant-primary-color', currentTheme.antTheme.token.colorPrimary);
    root.style.setProperty('--ant-color-bg-layout', currentTheme.antTheme.token.colorBgLayout);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeKey, setThemeKey, isDarkMode }}>
      <ConfigProvider theme={antDesignTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// Hook 获取主题
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ENTERPRISE_THEMES };
