import React, { useState, useEffect } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { taxCodeApi, TaxCode } from '../../services/tax-code.api';

const { Title } = Typography;

const TaxCodeManagement: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TaxCode[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await taxCodeApi.getAll();
      setData(result);
    } catch (error) {
      console.error('加载税码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldValue('taxType', 'INPUT');
    form.setFieldValue('rate', 5);
    setModalVisible(true);
  };

  const handleEdit = (record: TaxCode) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      rate: record.rate * 100,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await taxCodeApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        rate: Number(values.rate) / 100,
      };

      if (editingId) {
        await taxCodeApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await taxCodeApi.create(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('操作失败');
      }
    }
  };

  const columns = [
    {
      title: '税码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'taxType',
      key: 'taxType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'INPUT' ? 'green' : 'blue'}>
          {type === 'INPUT' ? '进项税' : '销项税'}
        </Tag>
      ),
    },
    {
      title: '税率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate: number) => `${(rate * 100).toFixed(0)}%`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: TaxCode) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除此税码？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="税码配置"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增税码
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingId ? '编辑税码' : '新增税码'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="税码"
            rules={[
              { required: true, message: '请输入税码' },
              { pattern: /^[A-Z0-9_]+$/, message: '只能输入大写字母、数字和下划线' },
            ]}
          >
            <Input placeholder="如: VAT_IN_13" disabled={!!editingId} />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如: 进项税13%" />
          </Form.Item>
          <Form.Item
            name="taxType"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="选择税码类型">
              <Select.Option value="INPUT">进项税</Select.Option>
              <Select.Option value="OUTPUT">销项税</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rate"
            label="税率 (%)"
            rules={[{ required: true, message: '请输入税率' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={1}
              style={{ width: '100%' }}
              formatter={(value) => `${value}%`}
              parser={(value) => parseFloat(value?.replace('%', '') || '0') as any}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TaxCodeManagement;
