/**
 * LightERP 企业主题配置
 * 专为商务企业应用设计的主题系统 - 视觉差异化设计
 */

export interface ThemeConfig {
  name: string;
  key: string;
  description: string;
  // 主题预览
  preview: {
    primary: string;
    background: string;
    gradient?: string;
  };
  antTheme: {
    token: {
      // 主色调
      colorPrimary: string;
      colorPrimaryHover: string;
      colorPrimaryActive: string;
      colorPrimaryBg: string;
      colorPrimaryBgHover: string;

      // 成功/警告/错误/信息色
      colorSuccess: string;
      colorWarning: string;
      colorError: string;
      colorInfo: string;

      // 文字颜色
      colorText: string;
      colorTextSecondary: string;
      colorTextTertiary: string;
      colorTextQuaternary: string;

      // 边框和背景 - 关键差异化
      colorBorder: string;
      colorBorderSecondary: string;
      colorBgContainer: string;
      colorBgElevated: string;
      colorBgLayout: string;
      colorBgSpotlight: string;

      // 圆角 - 差异化设计
      borderRadius: number;
      borderRadiusLG: number;
      borderRadiusSM: number;

      // 阴影 - 差异化设计
      boxShadow: string;
      boxShadowSecondary: string;

      // 线条
      lineWidth: number;
      lineType: string;
    };
    components: {
      Layout?: {
        headerBg: string;
        siderBg: string;
        bodyBg: string;
      };
      Menu?: {
        darkItemBg: string;
        darkItemSelectedBg: string;
        darkItemHoverBg: string;
      };
      Card?: {
        colorBgContainer: string;
      };
      Table?: {
        colorBgContainer: string;
        headerBg: string;
      };
    };
  };
}

// 企业主题定义 - 视觉差异化设计
export const ENTERPRISE_THEMES: ThemeConfig[] = [
  {
    name: '经典蓝',
    key: 'classic',
    description: '经典蓝色主题，简洁专业，适合各类企业',
    preview: {
      primary: '#1677ff',
      background: '#f5f5f5',
    },
    antTheme: {
      token: {
        colorPrimary: '#1677ff',
        colorPrimaryHover: '#4096ff',
        colorPrimaryActive: '#0958d9',
        colorPrimaryBg: '#e6f4ff',
        colorPrimaryBgHover: '#bae0ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1677ff',
        colorText: 'rgba(0, 0, 0, 0.88)',
        colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
        colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
        colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
        colorBorder: '#d9d9d9',
        colorBorderSecondary: '#f0f0f0',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f5f5f5',
        colorBgSpotlight: '#fafafa',
        borderRadius: 6,
        borderRadiusLG: 8,
        borderRadiusSM: 4,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.08)',
        boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.1)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#f5f5f5',
        },
        Menu: {
          darkItemBg: '#001529',
          darkItemSelectedBg: '#1677ff',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#fafafa',
        },
      },
    },
  },
  {
    name: '薄荷清凉',
    key: 'mint',
    description: '清新薄荷绿，夏日清凉，舒适护眼',
    preview: {
      primary: '#10b981',
      background: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#10b981',
        colorPrimaryHover: '#34d399',
        colorPrimaryActive: '#059669',
        colorPrimaryBg: '#d1fae5',
        colorPrimaryBgHover: '#a7f3d0',
        colorSuccess: '#10b981',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#10b981',
        colorText: 'rgba(17, 24, 39, 0.88)',
        colorTextSecondary: 'rgba(17, 24, 39, 0.65)',
        colorTextTertiary: 'rgba(17, 24, 39, 0.45)',
        colorTextQuaternary: 'rgba(17, 24, 39, 0.25)',
        colorBorder: '#d1d5db',
        colorBorderSecondary: '#e5e7eb',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f0fdf4',
        colorBgSpotlight: '#ecfdf5',
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)',
        boxShadowSecondary: '0 8px 24px rgba(16, 185, 129, 0.2)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#f0fdf4',
        },
        Menu: {
          darkItemBg: '#064e3b',
          darkItemSelectedBg: '#10b981',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#f0fdf4',
        },
      },
    },
  },
  {
    name: '暮光紫',
    key: 'twilight',
    description: '优雅紫色氛围，神秘浪漫，创意行业首选',
    preview: {
      primary: '#8b5cf6',
      background: '#f5f3ff',
      gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#8b5cf6',
        colorPrimaryHover: '#a78bfa',
        colorPrimaryActive: '#7c3aed',
        colorPrimaryBg: '#ede9fe',
        colorPrimaryBgHover: '#ddd6fe',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ec4899',
        colorInfo: '#8b5cf6',
        colorText: 'rgba(17, 24, 39, 0.88)',
        colorTextSecondary: 'rgba(17, 24, 39, 0.65)',
        colorTextTertiary: 'rgba(17, 24, 39, 0.45)',
        colorTextQuaternary: 'rgba(17, 24, 39, 0.25)',
        colorBorder: '#c4b5fd',
        colorBorderSecondary: '#ddd6fe',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#faf5ff',
        colorBgSpotlight: '#f5f3ff',
        borderRadius: 10,
        borderRadiusLG: 14,
        borderRadiusSM: 6,
        boxShadow: '0 1px 3px rgba(139, 92, 246, 0.1), 0 4px 16px rgba(139, 92, 246, 0.15)',
        boxShadowSecondary: '0 8px 28px rgba(139, 92, 246, 0.25)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#faf5ff',
        },
        Menu: {
          darkItemBg: '#4c1d95',
          darkItemSelectedBg: '#8b5cf6',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#faf5ff',
        },
      },
    },
  },
  {
    name: '暖阳橙',
    key: 'sunset',
    description: '温暖橙色主题，活力四射，适合消费类企业',
    preview: {
      primary: '#f97316',
      background: '#fff7ed',
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#f97316',
        colorPrimaryHover: '#fb923c',
        colorPrimaryActive: '#ea580c',
        colorPrimaryBg: '#ffedd5',
        colorPrimaryBgHover: '#fed7aa',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#f97316',
        colorText: 'rgba(17, 24, 39, 0.88)',
        colorTextSecondary: 'rgba(17, 24, 39, 0.65)',
        colorTextTertiary: 'rgba(17, 24, 39, 0.45)',
        colorTextQuaternary: 'rgba(17, 24, 39, 0.25)',
        colorBorder: '#fdba74',
        colorBorderSecondary: '#fed7aa',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#fff7ed',
        colorBgSpotlight: '#fff1eb',
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 4,
        boxShadow: '0 1px 3px rgba(249, 115, 22, 0.1), 0 4px 14px rgba(249, 115, 22, 0.15)',
        boxShadowSecondary: '0 6px 24px rgba(249, 115, 22, 0.2)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#fff7ed',
        },
        Menu: {
          darkItemBg: '#7c2d12',
          darkItemSelectedBg: '#f97316',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#fff7ed',
        },
      },
    },
  },
  {
    name: '深邃蓝',
    key: 'ocean',
    description: '深海蓝色调，专业稳重，适合金融科技',
    preview: {
      primary: '#0ea5e9',
      background: '#f0f9ff',
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#0ea5e9',
        colorPrimaryHover: '#38bdf8',
        colorPrimaryActive: '#0284c7',
        colorPrimaryBg: '#e0f2fe',
        colorPrimaryBgHover: '#bae6fd',
        colorSuccess: '#14b8a6',
        colorWarning: '#f59e0b',
        colorError: '#f43f5e',
        colorInfo: '#0ea5e9',
        colorText: 'rgba(15, 23, 42, 0.9)',
        colorTextSecondary: 'rgba(15, 23, 42, 0.7)',
        colorTextTertiary: 'rgba(15, 23, 42, 0.5)',
        colorTextQuaternary: 'rgba(15, 23, 42, 0.3)',
        colorBorder: '#7dd3fc',
        colorBorderSecondary: '#bae6fd',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f0f9ff',
        colorBgSpotlight: '#f0f9ff',
        borderRadius: 6,
        borderRadiusLG: 10,
        borderRadiusSM: 4,
        boxShadow: '0 1px 3px rgba(14, 165, 233, 0.12), 0 4px 14px rgba(14, 165, 233, 0.18)',
        boxShadowSecondary: '0 8px 28px rgba(14, 165, 233, 0.22)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#f0f9ff',
        },
        Menu: {
          darkItemBg: '#0c4a6e',
          darkItemSelectedBg: '#0ea5e9',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#f0f9ff',
        },
      },
    },
  },
  {
    name: '玫瑰粉',
    key: 'rose',
    description: '温柔玫瑰粉，优雅甜美，适合时尚美业',
    preview: {
      primary: '#ec4899',
      background: '#fdf2f8',
      gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#ec4899',
        colorPrimaryHover: '#f472b6',
        colorPrimaryActive: '#db2777',
        colorPrimaryBg: '#fce7f3',
        colorPrimaryBgHover: '#fbcfe8',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#ec4899',
        colorText: 'rgba(17, 24, 39, 0.88)',
        colorTextSecondary: 'rgba(17, 24, 39, 0.65)',
        colorTextTertiary: 'rgba(17, 24, 39, 0.45)',
        colorTextQuaternary: 'rgba(17, 24, 39, 0.25)',
        colorBorder: '#f9a8d4',
        colorBorderSecondary: '#fbcfe8',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#fdf2f8',
        colorBgSpotlight: '#fdf4ff',
        borderRadius: 10,
        borderRadiusLG: 14,
        borderRadiusSM: 6,
        boxShadow: '0 1px 3px rgba(236, 72, 153, 0.1), 0 4px 14px rgba(236, 72, 153, 0.15)',
        boxShadowSecondary: '0 8px 28px rgba(236, 72, 153, 0.2)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
          bodyBg: '#fdf2f8',
        },
        Menu: {
          darkItemBg: '#831843',
          darkItemSelectedBg: '#ec4899',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#ffffff',
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#fdf2f8',
        },
      },
    },
  },
  {
    name: '暗夜模式',
    key: 'dark',
    description: '深色护眼模式，减少眼睛疲劳，适合夜间使用',
    preview: {
      primary: '#6366f1',
      background: '#0f172a',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
    antTheme: {
      token: {
        colorPrimary: '#6366f1',
        colorPrimaryHover: '#818cf8',
        colorPrimaryActive: '#4f46e5',
        colorPrimaryBg: '#312e81',
        colorPrimaryBgHover: '#3730a3',
        colorSuccess: '#22c55e',
        colorWarning: '#eab308',
        colorError: '#f43f5e',
        colorInfo: '#6366f1',
        colorText: 'rgba(248, 250, 252, 0.95)',
        colorTextSecondary: 'rgba(248, 250, 252, 0.7)',
        colorTextTertiary: 'rgba(248, 250, 252, 0.5)',
        colorTextQuaternary: 'rgba(248, 250, 252, 0.3)',
        colorBorder: '#334155',
        colorBorderSecondary: '#1e293b',
        colorBgContainer: '#1e293b',
        colorBgElevated: '#334155',
        colorBgLayout: '#0f172a',
        colorBgSpotlight: '#1e293b',
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)',
        boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.5)',
        lineWidth: 1,
        lineType: 'solid',
      },
      components: {
        Layout: {
          headerBg: '#1e293b',
          siderBg: '#1e293b',
          bodyBg: '#0f172a',
        },
        Menu: {
          darkItemBg: '#0f172a',
          darkItemSelectedBg: '#6366f1',
          darkItemHoverBg: '#ffffff10',
        },
        Card: {
          colorBgContainer: '#1e293b',
        },
        Table: {
          colorBgContainer: '#1e293b',
          headerBg: '#334155',
        },
      },
    },
  },
];

// 获取主题配置
export const getThemeConfig = (key: string): ThemeConfig => {
  return ENTERPRISE_THEMES.find(t => t.key === key) || ENTERPRISE_THEMES[0];
};
