import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Form, Input, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { masterApi } from '../../services/master.api';
import { Supplier, PaginatedResult, CreateSupplierDto, UpdateSupplierDto } from '../../types';

const { Title } = Typography;

const SupplierList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const columns = [
    {
      title: '供应商编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '供应商名称',
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
      title: '应付账款',
      dataIndex: 'payableBalance',
      key: 'payableBalance',
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
      render: (_: any, record: Supplier) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除供应商 "${record.code} - ${record.name}" 吗？`}
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

  const fetchSuppliers = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<Supplier> = await masterApi.getSuppliers({
        page,
        limit,
      });
      setSuppliers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
      message.error('获取供应商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingSupplier) {
        // 更新供应商
        await masterApi.updateSupplier(editingSupplier.id, values);
        message.success('供应商更新成功');
      } else {
        // 新增供应商
        await masterApi.createSupplier(values);
        message.success('供应商创建成功');
      }
      setModalVisible(false);
      fetchSuppliers(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存供应商失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue({
      code: supplier.code,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await masterApi.deleteSupplier(id);
      message.success('供应商删除成功');
      fetchSuppliers(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除供应商失败:', error);
      message.error('删除供应商失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchSuppliers(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>供应商管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingSupplier(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增供应商
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={suppliers}
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

      {/* 新增/编辑供应商模态框 */}
      <Modal
        title={editingSupplier ? "编辑供应商" : "新增供应商"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="供应商编码"
            name="code"
            rules={[
              { required: true, message: '请输入供应商编码' },
              { pattern: /^[A-Z0-9]{3,20}$/, message: '供应商编码应为3-20位大写字母或数字' },
            ]}
          >
            <Input placeholder="3-20位大写字母或数字，如SUPP001" disabled={!!editingSupplier} />
          </Form.Item>
          <Form.Item
            label="供应商名称"
            name="name"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="例如: 示例供应商有限公司" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contactPerson"
          >
            <Input placeholder="例如: 李经理" />
          </Form.Item>
          <Form.Item
            label="电话"
            name="phone"
            rules={[
              { pattern: /^[0-9+\-\s()]{7,20}$/, message: '请输入有效的电话号码' },
            ]}
          >
            <Input placeholder="例如: 13900139000" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="例如: supplier@example.com" />
          </Form.Item>
          <Form.Item
            label="地址"
            name="address"
          >
            <Input.TextArea placeholder="例如: 上海市浦东新区" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierList;