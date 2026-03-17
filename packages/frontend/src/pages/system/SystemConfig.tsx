import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Switch, Button, message, Typography, Spin, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { systemConfigApi, CONFIG_GROUPS, SystemConfig } from '../../services/system-config.api';
import { masterApi } from '../../services/master.api';
import { Subject } from '../../types';

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
