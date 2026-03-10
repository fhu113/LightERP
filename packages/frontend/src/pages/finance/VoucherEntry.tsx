import React, { useState, useEffect } from 'react';
import { Card, Form, Input, DatePicker, Button, Table, InputNumber, Select, Space, message, Divider, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import { voucherApi, CreateVoucherDto, VoucherItem } from '../../services/voucher.api';
import { masterApi } from '../../services/master.api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Subject {
  id: string;
  code: string;
  name: string;
}

const VoucherEntry: React.FC = () => {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<VoucherItem[]>([
    { subjectId: '', debitAmount: 0, creditAmount: 0, description: '' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载科目列表
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await masterApi.getSubjects();
      setSubjects(data?.data || []);
    } catch (error) {
      console.error('加载科目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算借贷合计
  const totalDebit = items.reduce((sum, item) => sum + (item.debitAmount || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (item.creditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  // 添加分录行
  const addItem = () => {
    setItems([...items, { subjectId: '', debitAmount: 0, creditAmount: 0, description: '' }]);
  };

  // 删除分录行
  const removeItem = (index: number) => {
    if (items.length <= 1) {
      message.warning('至少需要一行分录');
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // 更新分录行
  const updateItem = (index: number, field: keyof VoucherItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // 保存凭证
  const handleSave = async () => {
    if (!isBalanced) {
      message.error('借贷不平衡，请调整后再保存');
      return;
    }

    // 检查是否有有效的分录
    const validItems = items.filter(item => item.subjectId);
    if (validItems.length === 0) {
      message.error('请至少添加一条分录');
      return;
    }

    const values = form.getFieldsValue();
    setSaving(true);

    try {
      const voucherData = {
        voucherDate: values.voucherDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        voucherType: values.voucherType || 'GENERAL',
        summary: values.summary || '',
        items: validItems.map(item => ({
          subjectId: item.subjectId,
          debitAmount: item.debitAmount || 0,
          creditAmount: item.creditAmount || 0,
          description: item.description || '',
        })),
      };

      await voucherApi.createVoucher(voucherData);
      message.success('凭证保存成功');

      // 重置表单
      form.resetFields();
      setItems([{ subjectId: '', debitAmount: 0, creditAmount: 0, description: '' }]);
    } catch (error) {
      console.error('保存凭证失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '科目',
      dataIndex: 'subjectId',
      key: 'subjectId',
      width: 250,
      render: (_: any, __: any, index: number) => (
        <Select
          placeholder="选择科目"
          style={{ width: '100%' }}
          value={items[index].subjectId || undefined}
          onChange={(value) => updateItem(index, 'subjectId', value)}
          showSearch
          optionFilterProp="children"
        >
          {subjects.map((subject) => (
            <Select.Option key={subject.id} value={subject.id}>
              {subject.code} - {subject.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '借方金额',
      dataIndex: 'debitAmount',
      key: 'debitAmount',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          placeholder="借方"
          style={{ width: '100%' }}
          value={items[index].debitAmount}
          onChange={(value) => updateItem(index, 'debitAmount', value || 0)}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '贷方金额',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          placeholder="贷方"
          style={{ width: '100%' }}
          value={items[index].creditAmount}
          onChange={(value) => updateItem(index, 'creditAmount', value || 0)}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '摘要',
      dataIndex: 'description',
      key: 'description',
      render: (_: any, __: any, index: number) => (
        <Input
          placeholder="摘要说明"
          value={items[index].description}
          onChange={(e) => updateItem(index, 'description', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card title="凭证录入" bordered={false}>
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="voucherDate" label="凭证日期" initialValue={dayjs()}>
            <DatePicker style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="voucherType" label="凭证类型" initialValue="GENERAL">
            <Select style={{ width: 150 }}>
              <Select.Option value="GENERAL">记账凭证</Select.Option>
              <Select.Option value="CASH">现金凭证</Select.Option>
              <Select.Option value="BANK">银行凭证</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="summary" label="凭证摘要">
            <Input placeholder="凭证摘要" style={{ width: 300 }} />
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={items.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
          loading={loading}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong type={isBalanced ? 'success' : 'danger'}>
                    {totalDebit.toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong type={isBalanced ? 'success' : 'danger'}>
                    {totalCredit.toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  {isBalanced ? (
                    <Text type="success"><CheckOutlined /> 平衡</Text>
                  ) : (
                    <Text type="danger">不平衡</Text>
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <div style={{ marginTop: 16 }}>
          <Button type="dashed" onClick={addItem} icon={<PlusOutlined />} style={{ marginRight: 8 }}>
            添加分录
          </Button>
          <Button type="primary" onClick={handleSave} icon={<SaveOutlined />} loading={saving} disabled={!isBalanced}>
            保存凭证
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VoucherEntry;
