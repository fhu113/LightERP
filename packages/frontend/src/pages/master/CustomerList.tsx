import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Form, Input, InputNumber, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { masterApi } from '../../services/master.api';
import { Customer, PaginatedResult, CreateCustomerDto, UpdateCustomerDto } from '../../types';

const { Title } = Typography;

const CustomerList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const columns = [
    {
      title: '客户编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (value: string | null) => value || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (value: string | null) => value || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (value: string | null) => value || '-',
    },
    {
      title: '信用额度',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '应收账款',
      dataIndex: 'receivableBalance',
      key: 'receivableBalance',
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除客户 "${record.code} - ${record.name}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchCustomers = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<Customer> = await masterApi.getCustomers({
        page,
        limit,
      });
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取客户列表失败:', error);
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingCustomer) {
        // 更新客户
        await masterApi.updateCustomer(editingCustomer.id, values);
        message.success('客户更新成功');
      } else {
        // 新增客户
        await masterApi.createCustomer(values);
        message.success('客户创建成功');
      }
      setModalVisible(false);
      fetchCustomers(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存客户失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      code: customer.code,
      name: customer.name,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      creditLimit: customer.creditLimit,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await masterApi.deleteCustomer(id);
      message.success('客户删除成功');
      fetchCustomers(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除客户失败:', error);
      message.error('删除客户失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchCustomers(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>客户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingCustomer(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增客户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新增/编辑客户模态框 */}
      <Modal
        title={editingCustomer ? "编辑客户" : "新增客户"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="客户编码"
            name="code"
            rules={[
              { required: true, message: '请输入客户编码' },
              { pattern: /^[A-Z0-9]{3,20}$/, message: '客户编码应为3-20位大写字母或数字' },
            ]}
          >
            <Input placeholder="3-20位大写字母或数字，如CUST001" disabled={!!editingCustomer} />
          </Form.Item>
          <Form.Item
            label="客户名称"
            name="name"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="例如: 示例客户有限公司" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contactPerson"
          >
            <Input placeholder="例如: 张经理" />
          </Form.Item>
          <Form.Item
            label="电话"
            name="phone"
            rules={[
              { pattern: /^[0-9+\-\s()]{7,20}$/, message: '请输入有效的电话号码' },
            ]}
          >
            <Input placeholder="例如: 13800138000" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="例如: contact@example.com" />
          </Form.Item>
          <Form.Item
            label="地址"
            name="address"
          >
            <Input.TextArea placeholder="例如: 北京市朝阳区" rows={2} />
          </Form.Item>
          <Form.Item
            label="信用额度"
            name="creditLimit"
            rules={[
              { type: 'number', min: 0, message: '信用额度不能为负数' },
            ]}
          >
            <InputNumber
              placeholder="例如: 100000"
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerList;