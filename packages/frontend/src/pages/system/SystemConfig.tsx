import React, { useState, useEffect } from 'react';
import { Card, Select, Switch, Button, message, Typography, Spin, Row, Col, Collapse, Tag } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { systemConfigApi, CONFIG_GROUPS, CONFIG_KEYS, SystemConfig } from '../../services/system-config.api';
import { masterApi } from '../../services/master.api';
import { Subject } from '../../types';

const { Title } = Typography;
const { Panel } = Collapse;

interface ConfigItem {
  key: string;
  label: string;
  type: 'boolean' | 'subject';
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

  const loadSubjects = async () => {
    try {
      const result = await masterApi.getSubjects({ limit: 1000 });
      setSubjects(result.data.map((s: Subject) => ({ id: s.id, code: s.code, name: s.name })));
    } catch (error) {
      console.error('加载科目失败:', error);
    }
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const configs = await systemConfigApi.getAll();
      const values: Record<string, string> = {};
      (configs as SystemConfig[]).forEach((config: SystemConfig) => { values[config.configKey] = config.configValue; });
      setConfigValues(values);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubjects(); loadConfigs(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(configValues).map(([key, value]) => systemConfigApi.set(key, value)));
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const updateConfigValue = (key: string, value: string) => {
    setConfigValues(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" /></div>;
  }

  const globalEnabled = configValues[CONFIG_KEYS.AUTO_GENERATE_VOUCHER_ENABLED] === 'true';

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>会计引擎</Title>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存配置</Button>
      </div>

      {/* 全局开关单独一行 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Switch
              size="small"
              checked={globalEnabled}
              onChange={(checked) => updateConfigValue(CONFIG_KEYS.AUTO_GENERATE_VOUCHER_ENABLED, checked ? 'true' : 'false')}
            />
          </Col>
          <Col>
            <span style={{ fontWeight: 500 }}>启用自动生成凭证</span>
            <span style={{ color: '#52c41a', marginLeft: 8, fontSize: 12 }}>{globalEnabled ? '✓ 已启用' : '✗ 已禁用'}</span>
          </Col>
          <Col flex="auto" />
          <Col>
            <Tag color={globalEnabled ? 'green' : 'default'}>{globalEnabled ? '自动生成凭证已启用' : '自动生成凭证已禁用'}</Tag>
          </Col>
        </Row>
      </Card>

      {/* 紧凑配置表格 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Collapse bordered={false} defaultActiveKey={['OTC - 发货凭证', 'OTC - 销售发票凭证', 'OTC - 收款凭证', 'PTP - 采购收货凭证', 'PTP - 采购发票凭证', 'PTP - 付款凭证', '库存调整凭证']}>
          {CONFIG_GROUPS.map((group) => (
            <Panel
              key={group.title}
              header={
                <span>
                  <Tag color={group.title.startsWith('OTC') ? 'blue' : group.title.startsWith('PTP') ? 'purple' : 'orange'} style={{ marginRight: 8 }}>
                    {group.title.split(' - ')[0]}
                  </Tag>
                  <span style={{ fontWeight: 500 }}>{group.title.split(' - ')[1]}</span>
                  <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{group.description}</span>
                </span>
              }
              style={{ background: '#fafafa' }}
            >
              <Row gutter={[8, 4]}>
                {group.items.map((item) => (
                  <Col span={item.type === 'boolean' ? 6 : 9} key={item.key}>
                    <Row align="middle" gutter={6} style={{ padding: '2px 0' }}>
                      <Col flex="0 0 auto">
                        <span style={{ color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{item.label}</span>
                      </Col>
                      <Col flex="1 1 auto">
                        {item.type === 'boolean' ? (
                          <Switch
                            size="small"
                            checked={configValues[item.key] === 'true'}
                            onChange={(checked) => updateConfigValue(item.key, checked ? 'true' : 'false')}
                            checkedChildren="✓"
                            unCheckedChildren="✗"
                            style={{ marginLeft: 4 }}
                          />
                        ) : (
                          <Select
                            style={{ width: '100%', fontSize: 12 }}
                            size="small"
                            value={configValues[item.key] || undefined}
                            onChange={(value) => updateConfigValue(item.key, value || '')}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            placeholder="请选择科目"
                          >
                            {subjects.map((subject) => (
                              <Select.Option key={subject.id} value={subject.id}>
                                {subject.code} {subject.name}
                              </Select.Option>
                            ))}
                          </Select>
                        )}
                      </Col>
                      <Col flex="0 0 auto" style={{ minWidth: 14 }}>
                        {configValues[item.key] && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />}
                      </Col>
                    </Row>
                  </Col>
                ))}
              </Row>
            </Panel>
          ))}
        </Collapse>
      </Card>
    </div>
  );
};

export default AccountingEnginePage;
