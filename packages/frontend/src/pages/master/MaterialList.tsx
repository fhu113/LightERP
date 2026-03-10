import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Form, Input, InputNumber, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { masterApi } from '../../services/master.api';
import { Material, PaginatedResult, CreateMaterialDto, UpdateMaterialDto } from '../../types';

const { Title } = Typography;

const MaterialList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const columns = [
    {
      title: '物料编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      render: (value: string | null) => value || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '销售价',
      dataIndex: 'salePrice',
      key: 'salePrice',
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
      render: (_: any, record: Material) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除物料 "${record.code} - ${record.name}" 吗？`}
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

  const fetchMaterials = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<Material> = await masterApi.getMaterials({
        page,
        limit,
      });
      setMaterials(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取物料列表失败:', error);
      message.error('获取物料列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingMaterial) {
        // 更新物料
        await masterApi.updateMaterial(editingMaterial.id, values);
        message.success('物料更新成功');
      } else {
        // 新增物料
        await masterApi.createMaterial(values);
        message.success('物料创建成功');
      }
      setModalVisible(false);
      fetchMaterials(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存物料失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    form.setFieldsValue({
      code: material.code,
      name: material.name,
      specification: material.specification,
      unit: material.unit,
      costPrice: material.costPrice,
      salePrice: material.salePrice,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await masterApi.deleteMaterial(id);
      message.success('物料删除成功');
      fetchMaterials(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除物料失败:', error);
      message.error('删除物料失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchMaterials(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>物料管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingMaterial(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增物料
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={materials}
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

      {/* 新增/编辑物料模态框 */}
      <Modal
        title={editingMaterial ? "编辑物料" : "新增物料"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="物料编码"
            name="code"
            rules={[
              { required: true, message: '请输入物料编码' },
              { pattern: /^[A-Z0-9]{3,20}$/, message: '物料编码应为3-20位大写字母或数字' },
            ]}
          >
            <Input placeholder="3-20位大写字母或数字，如MAT001" disabled={!!editingMaterial} />
          </Form.Item>
          <Form.Item
            label="物料名称"
            name="name"
            rules={[{ required: true, message: '请输入物料名称' }]}
          >
            <Input placeholder="例如: 笔记本电脑" />
          </Form.Item>
          <Form.Item
            label="规格型号"
            name="specification"
          >
            <Input placeholder="例如: 15寸 i7 16GB 512GB" />
          </Form.Item>
          <Form.Item
            label="单位"
            name="unit"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="例如: 台、张、把" />
          </Form.Item>
          <Form.Item
            label="成本价"
            name="costPrice"
            rules={[
              { type: 'number', min: 0, message: '成本价不能为负数' },
            ]}
          >
            <InputNumber
              placeholder="例如: 5000"
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            label="销售价"
            name="salePrice"
            rules={[
              { type: 'number', min: 0, message: '销售价不能为负数' },
            ]}
          >
            <InputNumber
              placeholder="例如: 6500"
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

export default MaterialList;