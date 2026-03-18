import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Switch, Button, message, Typography, Spin, Row, Col, Tooltip } from 'antd';
const { Text } = Typography;
import { SaveOutlined, BgColorsOutlined, CheckCircleFilled } from '@ant-design/icons';
import { systemConfigApi, CONFIG_GROUPS, SystemConfig } from '../../services/system-config.api';
import { masterApi } from '../../services/master.api';
import { Subject } from '../../types';
import { useTheme, ENTERPRISE_THEMES } from '../../contexts/ThemeContext';

const { Title } = Typography;

interface ConfigItem {
  key: string;
  label: string;
  type: 'boolean' | 'subject';
}

interface ConfigGroup {
  title: string;
  description?: string;
  items: ConfigItem[];
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

const AccountingEnginePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const { themeKey, setThemeKey } = useTheme();

  // 加载会计科目
  const loadSubjects = async () => {
    try {
      const result = await masterApi.getSubjects({ limit: 1000 });
      setSubjects(result.data.map((s: Subject) => ({
        id: s.id,
        code: s.code,
        name: s.name,
      })));
    } catch (error) {
      console.error('加载科目失败:', error);
    }
  };

  // 加载配置
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const configs = await systemConfigApi.getAll();
      const values: Record<string, string> = {};
      (configs as SystemConfig[]).forEach((config: SystemConfig) => {
        values[config.configKey] = config.configValue;
      });
      setConfigValues(values);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadConfigs();
  }, []);

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(configValues).map(([key, value]) =>
        systemConfigApi.set(key, value)
      );
      await Promise.all(promises);
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新配置值
  const updateConfigValue = (key: string, value: string) => {
    setConfigValues(prev => ({ ...prev, [key]: value }));
  };

  // 选择主题
  const handleThemeSelect = (key: string) => {
    setThemeKey(key);
    // 同时保存到后端配置
    updateConfigValue('APP_THEME', key);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>会计引擎</Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          保存配置
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* 主题设置 */}
        <Col xs={24} lg={24} xl={24}>
          <Card
            title={<><BgColorsOutlined /> 主题设置</>}
            bordered={false}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 20, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              选择您喜欢的主题颜色，系统将实时应用相应的配色方案。主题设置会自动保存到本地和服务器。
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {ENTERPRISE_THEMES.map((theme) => (
                <div
                  key={theme.key}
                  onClick={() => handleThemeSelect(theme.key)}
                  style={{
                    padding: 20,
                    borderRadius: theme.antTheme.token.borderRadiusLG,
                    border: themeKey === theme.key ? '2px solid' : '1px solid',
                    borderColor: themeKey === theme.key ? theme.antTheme.token.colorPrimary : theme.antTheme.token.colorBorder,
                    background: theme.antTheme.token.colorBgContainer,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: themeKey === theme.key
                      ? theme.antTheme.token.boxShadow
                      : '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* 主题预览 - 大卡片展示 */}
                  <div style={{
                    height: 80,
                    borderRadius: theme.antTheme.token.borderRadius,
                    background: theme.preview.gradient || theme.preview.background,
                    marginBottom: 16,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}>
                    {/* 模拟卡片效果 */}
                    <div style={{
                      flex: 1,
                      height: 40,
                      borderRadius: theme.antTheme.token.borderRadiusSM,
                      background: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }} />
                    <div style={{
                      flex: 1,
                      height: 40,
                      borderRadius: theme.antTheme.token.borderRadiusSM,
                      background: 'rgba(255,255,255,0.7)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }} />
                    <div style={{
                      flex: 1,
                      height: 40,
                      borderRadius: theme.antTheme.token.borderRadiusSM,
                      background: theme.antTheme.token.colorPrimary,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }} />
                  </div>

                  {/* 主题名称和描述 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.antTheme.token.colorText,
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: theme.preview.primary,
                        }} />
                        {theme.name}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: theme.antTheme.token.colorTextSecondary,
                        lineHeight: 1.5,
                      }}>
                        {theme.description}
                      </div>
                    </div>
                    {themeKey === theme.key && (
                      <CheckCircleFilled style={{
                        fontSize: 22,
                        color: theme.antTheme.token.colorPrimary,
                        marginLeft: 12,
                      }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                当前主题: <strong>{ENTERPRISE_THEMES.find(t => t.key === themeKey)?.name || '默认蓝'}</strong>
              </Text>
            </div>
          </Card>
        </Col>

        {CONFIG_GROUPS.map((group) => (
          <Col xs={24} lg={12} xl={8} key={group.title}>
            <Card
              title={group.title}
              bordered={false}
              style={{ height: '100%' }}
              styles={{ body: { padding: group.items.length > 2 ? 12 : 16 } }}
            >
              {group.description && (
                <div style={{ marginBottom: 12, color: '#888', fontSize: 12 }}>
                  {group.description}
                </div>
              )}
              {group.items.map((item) => (
                <Form.Item
                  key={item.key}
                  label={item.label}
                  style={{ marginBottom: item.type === 'boolean' ? 8 : 12 }}
                  labelCol={{ span: item.type === 'boolean' ? 24 : 10 }}
                  wrapperCol={{ span: item.type === 'boolean' ? 24 : 14 }}
                >
                  {item.type === 'boolean' ? (
                    <Switch
                      checked={configValues[item.key] === 'true'}
                      onChange={(checked) => updateConfigValue(item.key, checked ? 'true' : 'false')}
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  ) : (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="请选择科目"
                      value={configValues[item.key] || undefined}
                      onChange={(value) => updateConfigValue(item.key, value || '')}
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      size="small"
                    >
                      {subjects.map((subject) => (
                        <Select.Option key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              ))}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AccountingEnginePage;
