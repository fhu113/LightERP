import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productionApi } from '../../services/production.api';
import { masterApi } from '../../services/master.api';

const { Text } = Typography;

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
}

interface BOMItem {
  id: string;
  materialId: string;
  material: Material;
  quantity: number;
  unit: string;
}

interface BOM {
  id: string;
  code: string;
  name: string;
  version: string;
  status: string;
  remark?: string;
  items: BOMItem[];
}

const BOMList: React.FC = () => {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form] = Form.useForm();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadBOMs();
    loadMaterials();
  }, [pagination.page, pagination.limit]);

  const loadBOMs = async () => {
    setLoading(true);
    try {
      const result: any = await productionApi.getBOMs({
        page: pagination.page,
        limit: pagination.limit,
      });
      setBOMs(result.data.data || result.data || []);
      setPagination(prev => ({ ...prev, total: result.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('加载BOM失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const result: any = await masterApi.getMaterials({ limit: 1000 });
      setMaterials(result.data || []);
    } catch (error) {
      console.error('加载物料失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingBOM(null);
    form.resetFields();
    setItems([{ materialId: undefined, quantity: 1, unit: '个' }]);
    setModalVisible(true);
  };

  const handleEdit = (record: BOM) => {
    setEditingBOM(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      version: record.version,
      status: record.status,
      remark: record.remark,
    });
    setItems(record.items.map(item => ({
      materialId: item.materialId,
      quantity: item.quantity,
      unit: item.unit,
    })));
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await productionApi.deleteBOM(id);
      message.success('删除成功');
      loadBOMs();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        items: items.filter(item => item.materialId && item.quantity > 0),
      };

      if (editingBOM) {
        await productionApi.updateBOM(editingBOM.id, data);
        message.success('更新成功');
      } else {
        await productionApi.createBOM(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadBOMs();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { materialId: undefined, quantity: 1, unit: '个' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      ACTIVE: { color: 'success', text: '启用' },
      INACTIVE: { color: 'default', text: '停用' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'BOM编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'BOM名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '子物料数量',
      dataIndex: 'items',
      key: 'items',
      render: (items: BOMItem[]) => items?.length || 0,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string) => remark || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BOM) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此BOM吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: BOM) => (
    <Table
      dataSource={record.items}
      columns={[
        { title: '子物料编码', dataIndex: ['material', 'code'], key: 'code' },
        { title: '子物料名称', dataIndex: ['material', 'name'], key: 'name' },
        { title: '数量', dataIndex: 'quantity', key: 'quantity' },
        { title: '单位', dataIndex: 'unit', key: 'unit' },
      ]}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );

  return (
    <div>
      <Card
        title="BOM管理"
        bordered={false}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建BOM
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={boms}
          loading={loading}
          rowKey="id"
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.items && record.items.length > 0,
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination({ ...pagination, page, limit: pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingBOM ? '编辑BOM' : '新建BOM'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="BOM编码"
            rules={[{ required: true, message: '请输入BOM编码' }]}
          >
            <Input placeholder="如: BOM-001" disabled={!!editingBOM} />
          </Form.Item>
          <Form.Item
            name="name"
            label="BOM名称"
            rules={[{ required: true, message: '请输入BOM名称' }]}
          >
            <Input placeholder="如: 产品A的BOM" />
          </Form.Item>
          <Form.Item name="version" label="版本" initialValue="1.0">
            <Input placeholder="如: 1.0" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">启用</Select.Option>
              <Select.Option value="INACTIVE">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Text strong>BOM明细</Text>
            <Button type="link" onClick={handleAddItem} style={{ marginLeft: 8 }}>
              + 添加子物料
            </Button>
          </div>

          {items.map((item, index) => (
            <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
              <Select
                placeholder="选择子物料"
                value={item.materialId}
                onChange={(value) => handleItemChange(index, 'materialId', value)}
                style={{ width: 200 }}
                showSearch
                optionFilterProp="children"
              >
                {materials.map(m => (
                  <Select.Option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </Select.Option>
                ))}
              </Select>
              <Input
                placeholder="数量"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                style={{ width: 80 }}
                type="number"
              />
              <Input
                placeholder="单位"
                value={item.unit}
                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                style={{ width: 60 }}
              />
              {items.length > 1 && (
                <Button type="link" danger onClick={() => handleRemoveItem(index)}>
                  删除
                </Button>
              )}
            </Space>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default BOMList;
