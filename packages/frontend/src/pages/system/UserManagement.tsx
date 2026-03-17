import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Checkbox, Typography } from 'antd';
const { Text } = Typography;
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { authApi } from '../../services/auth.api';

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result: any = await authApi.getUsers();
      setUsers(result.data || []);
    } catch (error) {
      console.error('加载用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      permissions: record.permissions || [],
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await authApi.deleteUser(id);
      message.success('用户删除成功');
      loadUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 处理权限 - 将数组转换为逗号分隔的字符串
      const data = {
        ...values,
        permissions: values.role === 'USER' && values.permissions
          ? values.permissions.join(',')
          : undefined,
      };

      if (editingUser) {
        await authApi.updateUser(editingUser.id, data);
        message.success('用户更新成功');
      } else {
        await authApi.createUser(data);
        message.success('用户创建成功');
      }

      setModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error('保存用户失败:', error);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, { color: string; text: string }> = {
          ADMIN: { color: 'red', text: '管理员' },
          KEY_USER: { color: 'orange', text: '关键用户' },
          USER: { color: 'blue', text: '普通用户' },
        };
        const config = roleMap[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => {
        if (!permissions || permissions.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        const permissionMap: Record<string, string> = {
          finance: '财务',
          otc: '销售',
          ptp: '采购',
          production: '生产',
          warehouse: '仓库',
          reports: '报表',
        };
        return (
          <Space wrap>
            {permissions.map((p: string) => (
              <Tag key={p} color="blue">{permissionMap[p] || p}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此用户吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="用户管理"
        bordered={false}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item name="role" label="角色" initialValue="USER">
            <Select>
              <Select.Option value="USER">普通用户</Select.Option>
              <Select.Option value="KEY_USER">关键用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
            {() => (
              <Form.Item name="permissions" label="模块权限" hidden={form.getFieldValue('role') !== 'USER'}>
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value="finance">财务</Checkbox>
                    <Checkbox value="otc">销售 (OTC)</Checkbox>
                    <Checkbox value="ptp">采购 (PTP)</Checkbox>
                    <Checkbox value="production">生产</Checkbox>
                    <Checkbox value="warehouse">仓库</Checkbox>
                    <Checkbox value="reports">报表</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Form.Item>

          {editingUser && (
            <Form.Item name="status" label="状态" initialValue="ACTIVE">
              <Select>
                <Select.Option value="ACTIVE">启用</Select.Option>
                <Select.Option value="INACTIVE">禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
