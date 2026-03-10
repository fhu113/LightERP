import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Form, Input, Select, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { masterApi } from '../../services/master.api';
import { Subject, PaginatedResult, CreateSubjectDto, UpdateSubjectDto } from '../../types';

const { Title } = Typography;

const SubjectList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const columns = [
    {
      title: '科目编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '科目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '科目类型',
      dataIndex: 'type',
      key: 'type',
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
      render: (_: any, record: Subject) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除科目 "${record.code} - ${record.name}" 吗？`}
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

  const fetchSubjects = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<Subject> = await masterApi.getSubjects({
        page,
        limit,
      });
      setSubjects(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取科目列表失败:', error);
      message.error('获取科目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingSubject) {
        // 更新科目
        await masterApi.updateSubject(editingSubject.id, values);
        message.success('科目更新成功');
      } else {
        // 新增科目
        await masterApi.createSubject(values);
        message.success('科目创建成功');
      }
      setModalVisible(false);
      fetchSubjects(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存科目失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    form.setFieldsValue({
      code: subject.code,
      name: subject.name,
      type: subject.type,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await masterApi.deleteSubject(id);
      message.success('科目删除成功');
      fetchSubjects(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除科目失败:', error);
      message.error('删除科目失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchSubjects(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>会计科目管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingSubject(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增科目
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={subjects}
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

      {/* 新增/编辑科目模态框 */}
      <Modal
        title={editingSubject ? "编辑会计科目" : "新增会计科目"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="科目编码"
            name="code"
            rules={[
              { required: true, message: '请输入科目编码' },
              { pattern: /^[0-9]{4,10}$/, message: '科目编码应为4-10位数字' },
            ]}
          >
            <Input placeholder="4-10位数字，如1001" disabled={!!editingSubject} />
          </Form.Item>
          <Form.Item
            label="科目名称"
            name="name"
            rules={[{ required: true, message: '请输入科目名称' }]}
          >
            <Input placeholder="例如: 库存现金" />
          </Form.Item>
          <Form.Item
            label="科目类型"
            name="type"
            rules={[{ required: true, message: '请选择科目类型' }]}
          >
            <Select placeholder="请选择科目类型">
              <Select.Option value="ASSET">资产</Select.Option>
              <Select.Option value="LIABILITY">负债</Select.Option>
              <Select.Option value="EQUITY">所有者权益</Select.Option>
              <Select.Option value="COST">成本</Select.Option>
              <Select.Option value="REVENUE">收入</Select.Option>
              <Select.Option value="EXPENSE">费用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectList;