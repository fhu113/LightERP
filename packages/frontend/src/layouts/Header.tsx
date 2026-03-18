import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Typography, message, Tag, Modal, Input, Form, Upload, Spin, Tooltip, theme } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  BankOutlined,
  PlusOutlined,
  BgColorsOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ENTERPRISE_THEMES } from '../contexts/ThemeContext';
import { systemConfigApi } from '../services/system-config.api';
import api from '../services/api';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { useToken } = theme;

interface HeaderProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const roleText: Record<string, string> = {
  ADMIN: '管理员',
  KEY_USER: '关键用户',
  USER: '普通用户',
};

// 角色标签颜色映射
const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: '#1f1f1f', text: '#fff', border: '#1f1f1f' },
  KEY_USER: { bg: '#434343', text: '#fff', border: '#434343' },
  USER: { bg: '#595959', text: '#fff', border: '#595959' },
};

// 使用代理路径，避免跨域问题
const API_BASE = '';

const Header: React.FC<HeaderProps> = ({ collapsed, onCollapse }) => {
  const { user, loginTime, logout } = useAuth();
  const { themeKey, setThemeKey } = useTheme();
  const { token } = useToken();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('LightERP');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [logoForm] = Form.useForm();
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(true);

  // 加载企业配置和每日名言
  useEffect(() => {
    loadCompanyConfig();
    loadDailyQuote();
  }, []);

  const loadDailyQuote = async () => {
    setQuoteLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/quote/quote`);
      const data = await response.json();
      if (data?.success && data?.data?.quote) {
        setDailyQuote(data.data.quote);
      }
    } catch (error) {
      console.error('加载名言失败:', error);
    } finally {
      setQuoteLoading(false);
    }
  };

  const loadCompanyConfig = async () => {
    try {
      const configs = await systemConfigApi.getAll();
      const configMap: Record<string, string> = {};
      (configs || []).forEach((c: any) => {
        configMap[c.configKey] = c.configValue;
      });
      if (configMap.COMPANY_NAME) {
        setCompanyName(configMap.COMPANY_NAME);
      }
      if (configMap.COMPANY_LOGO) {
        setCompanyLogo(configMap.COMPANY_LOGO);
      }
    } catch (error) {
      console.error('加载企业配置失败:', error);
    }
  };

  const handleLogoSave = async () => {
    try {
      const values = await logoForm.validateFields();

      // 如果有上传新Logo，先上传
      if (logoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', logoFile as any);

        const uploadResponse = await fetch('/api/upload/logo', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success && uploadData.data?.url) {
            await systemConfigApi.set('COMPANY_LOGO', uploadData.data.url);
            setCompanyLogo(uploadData.data.url);
          }
        }
        setUploading(false);
      }

      if (values.companyName) {
        await systemConfigApi.set('COMPANY_NAME', values.companyName);
        setCompanyName(values.companyName);
      }

      message.success('企业信息保存成功');
      setLogoModalVisible(false);
      setLogoFile(null);
    } catch (error) {
      console.error('保存企业信息失败:', error);
      if (!uploading) {
        message.error('保存失败');
      }
    }
  };

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
        background: token.colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: token.boxShadow,
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onCollapse}
          style={{ fontSize: '16px' }}
        />

        {/* 左侧：Logo + 公司名称（水平排列） */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 6,
            transition: 'background 0.3s',
          }}
          onClick={() => {
            logoForm.setFieldsValue({ companyName, companyLogo: undefined });
            setLogoFile(null);
            setLogoModalVisible(true);
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = token.colorBgSpotlight}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {companyLogo ? (
            <img
              src={companyLogo.startsWith('http') ? companyLogo : `${API_BASE}${companyLogo}`}
              alt="Logo"
              style={{
                height: 40,
                width: 'auto',
                maxWidth: 100,
                objectFit: 'contain',
                marginRight: 12,
              }}
            />
          ) : (
            <BankOutlined style={{ fontSize: 32, marginRight: 12, color: token.colorPrimary }} />
          )}
          <Text strong style={{ fontSize: 18, marginRight: 12 }}>
            {companyName}
          </Text>
        </div>

        {/* 中间：每日名言 */}
        <div
          style={{
            borderLeft: `1px solid ${token.colorBorder}`,
            paddingLeft: 16,
            maxWidth: 500,
          }}
        >
          {quoteLoading ? (
            <Spin size="small" />
          ) : (
            <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
              "{dailyQuote}"
            </Text>
          )}
        </div>
      </Space>

      {/* 企业信息设置弹窗 */}
      <Modal
        title="企业信息设置"
        open={logoModalVisible}
        onOk={handleLogoSave}
        onCancel={() => {
          setLogoModalVisible(false);
          setLogoFile(null);
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={uploading}
      >
        <Form form={logoForm} layout="vertical">
          <Form.Item
            label="企业名称"
            name="companyName"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item
            label="企业Logo"
            name="companyLogo"
            tooltip="点击下方上传按钮选择本地图片"
          >
            <Upload
              maxCount={1}
              accept="image/*"
              beforeUpload={(file) => {
                setLogoFile(file as any);
                return false;
              }}
              onRemove={() => {
                setLogoFile(null);
              }}
              fileList={logoFile ? [logoFile] : []}
            >
              <Button icon={<PlusOutlined />}>上传Logo</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="预览">
            <div style={{
              border: `1px dashed ${token.colorBorder}`,
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              background: token.colorBgSpotlight,
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {logoFile ? (
                <img
                  src={URL.createObjectURL(logoFile as any)}
                  alt="Logo预览"
                  style={{ height: 40, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : companyLogo ? (
                <img
                  src={companyLogo.startsWith('http') ? companyLogo : `${API_BASE}${companyLogo}`}
                  alt="当前Logo"
                  style={{ height: 40, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Text type="secondary">预览区域</Text>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Space size="large">
        {/* 主题切换 */}
        <Dropdown
          menu={{
            items: ENTERPRISE_THEMES.map((theme) => ({
              key: theme.key,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 180, padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 20,
                      borderRadius: 4,
                      background: theme.preview.gradient || theme.preview.background,
                      border: `1px solid ${theme.antTheme.token.colorBorder}`,
                      overflow: 'hidden',
                      display: 'flex',
                      padding: 2,
                      gap: 2,
                    }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />
                      <div style={{ flex: 1, background: theme.preview.primary, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontWeight: themeKey === theme.key ? 600 : 400 }}>{theme.name}</span>
                  </div>
                  {themeKey === theme.key && <CheckOutlined style={{ color: theme.antTheme.token.colorPrimary }} />}
                </div>
              ),
              onClick: () => setThemeKey(theme.key),
            })),
          }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Tooltip title="切换主题">
            <Button
              type="text"
              icon={<BgColorsOutlined />}
              style={{
                fontSize: 18,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </Dropdown>

        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <div
            style={{
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 6,
              background: token.colorBgSpotlight,
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
                background: token.colorPrimary,
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
              <ClockCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>{formatLoginTime()}</Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;