import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message, Popconfirm, InputNumber, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { productionApi } from '../../services/production.api';
import { masterApi } from '../../services/master.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Material {
  id: string;
  code: string;
  name: string;
  specification?: string;
  unit: string;
}

interface OrderItem {
  id: string;
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
  amount: number;
  receivedQuantity: number;
}

interface ProductionOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  expectedDate?: string;
  status: string;
  totalAmount: number;
  remark?: string;
  items: OrderItem[];
}

const ProductionOrderList: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form] = Form.useForm();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadMaterials();
  }, [pagination.page, pagination.limit]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result: any = await productionApi.getOrders({
        page: pagination.page,
        limit: pagination.limit,
      });
      setOrders(result.data.data || result.data || []);
      setPagination(prev => ({ ...prev, total: result.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('加载生产订单失败:', error);
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
    setEditingOrder(null);
    form.resetFields();
    setItems([{ materialId: undefined, quantity: 1, unitPrice: 0 }]);
    setModalVisible(true);
  };

  const handleEdit = (record: ProductionOrder) => {
    setEditingOrder(record);
    form.setFieldsValue({
      orderDate: record.orderDate ? dayjs(record.orderDate) : null,
      expectedDate: record.expectedDate ? dayjs(record.expectedDate) : null,
      status: record.status,
      remark: record.remark,
    });
    setItems(record.items.map(item => ({
      materialId: item.materialId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })));
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await productionApi.deleteOrder(id);
      message.success('删除成功');
      loadOrders();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        orderDate: values.orderDate?.toDate(),
        expectedDate: values.expectedDate?.toDate(),
        status: values.status,
        remark: values.remark,
        items: items.filter(item => item.materialId && item.quantity > 0),
      };

      if (editingOrder) {
        await productionApi.updateOrder(editingOrder.id, data);
        message.success('更新成功');
      } else {
        await productionApi.createOrder(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadOrders();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { materialId: undefined, quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 计算金额
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }

    setItems(newItems);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待生产' },
      IN_PROGRESS: { color: 'processing', text: '生产中' },
      COMPLETED: { color: 'success', text: '已完成' },
      CANCELLED: { color: 'error', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '预计完成日期',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => amount?.toFixed(2) || '0.00',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductionOrder) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此订单吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        title="生产订单"
        bordered={false}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建订单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination({ ...pagination, page, limit: pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingOrder ? '编辑生产订单' : '新建生产订单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="orderDate" label="订单日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expectedDate" label="预计完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待生产</Select.Option>
              <Select.Option value="IN_PROGRESS">生产中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Text strong>订单明细</Text>
            <Button type="link" onClick={handleAddItem} style={{ marginLeft: 8 }}>
              + 添加物料
            </Button>
          </div>

          {items.map((item, index) => (
            <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
              <Select
                placeholder="选择物料"
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
              <InputNumber
                placeholder="数量"
                value={item.quantity}
                onChange={(value) => handleItemChange(index, 'quantity', value)}
                min={0}
                style={{ width: 100 }}
              />
              <InputNumber
                placeholder="单价"
                value={item.unitPrice}
                onChange={(value) => handleItemChange(index, 'unitPrice', value)}
                min={0}
                precision={2}
                style={{ width: 100 }}
              />
              <Text>金额: {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</Text>
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

export default ProductionOrderList;
