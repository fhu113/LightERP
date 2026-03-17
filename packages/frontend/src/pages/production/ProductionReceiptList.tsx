import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message, Popconfirm, Select, InputNumber, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { productionApi } from '../../services/production.api';

const { Text } = Typography;

interface Material {
  id: string;
  code: string;
  name: string;
}

interface OrderItem {
  id: string;
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
}

interface ProductionOrder {
  id: string;
  orderNo: string;
  items: OrderItem[];
}

interface ReceiptItem {
  orderItemId: string;
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
}

interface ProductionReceipt {
  id: string;
  receiptNo: string;
  orderId: string;
  order: { orderNo: string };
  receiptDate: string;
  status: string;
  remark?: string;
  items: ReceiptItem[];
}

const ProductionReceiptList: React.FC = () => {
  const [receipts, setReceipts] = useState<ProductionReceipt[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    loadReceipts();
    loadOrders();
  }, [pagination.page, pagination.limit]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const result: any = await productionApi.getReceipts({
        page: pagination.page,
        limit: pagination.limit,
      });
      setReceipts(result.data.data || result.data || []);
      setPagination(prev => ({ ...prev, total: result.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('加载生产收货单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const result: any = await productionApi.getOrders({ limit: 1000, status: 'PENDING' });
      setOrders(result.data.data || result.data || []);
    } catch (error) {
      console.error('加载生产订单失败:', error);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setSelectedOrder('');
    setReceiptItems([]);
    setModalVisible(true);
  };

  const handleOrderChange = async (orderId: string) => {
    setSelectedOrder(orderId);
    if (!orderId) {
      setReceiptItems([]);
      return;
    }

    try {
      const result: any = await productionApi.getOrderById(orderId);
      const order = result.data;

      // 预填所有明细，可修改数量
      setReceiptItems(order.items.map((item: any) => ({
        orderItemId: item.id,
        materialId: item.materialId,
        material: item.material,
        quantity: item.quantity - item.receivedQuantity, // 默认填入未收货数量
        unitPrice: item.unitPrice,
      })));
    } catch (error) {
      console.error('加载订单详情失败:', error);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...receiptItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setReceiptItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedOrder) {
      message.warning('请选择生产订单');
      return;
    }

    const validItems = receiptItems.filter(item => item.quantity > 0);
    if (validItems.length === 0) {
      message.warning('请至少填写一项收货数量');
      return;
    }

    try {
      await productionApi.createReceipt({
        orderId: selectedOrder,
        items: validItems.map(item => ({
          orderItemId: item.orderItemId,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      message.success('创建成功');
      setModalVisible(false);
      loadReceipts();
    } catch (error) {
      console.error('创建失败:', error);
      message.error('创建失败');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await productionApi.confirmReceipt(id);
      message.success('确认成功');
      loadReceipts();
    } catch (error) {
      console.error('确认失败:', error);
      message.error('确认失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productionApi.deleteReceipt(id);
      message.success('删除成功');
      loadReceipts();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待确认' },
      COMPLETED: { color: 'success', text: '已完成' },
      CANCELLED: { color: 'error', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '收货单号',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
    },
    {
      title: '生产订单',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '收货日期',
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '明细数量',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0,
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
      render: (_: any, record: ProductionReceipt) => (
        <Space>
          {record.status === 'PENDING' && (
            <>
              <Popconfirm title="确认收货后将更新库存，是否继续?" onConfirm={() => handleConfirm(record.id)}>
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  确认
                </Button>
              </Popconfirm>
              <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="生产收货"
        bordered={false}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建收货单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={receipts}
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
        title="新建生产收货单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderId"
            label="生产订单"
            rules={[{ required: true, message: '请选择生产订单' }]}
          >
            <Select
              placeholder="选择生产订单"
              onChange={handleOrderChange}
              showSearch
              optionFilterProp="children"
            >
              {orders.map(order => (
                <Select.Option key={order.id} value={order.id}>
                  {order.orderNo}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {receiptItems.length > 0 && (
            <div>
              <Text strong>收货明细</Text>
              {receiptItems.map((item, index) => (
                <Space key={index} style={{ display: 'flex', marginTop: 8 }} align="baseline">
                  <Text>{item.material.code} - {item.material.name}</Text>
                  <Text type="secondary">库存余量: {item.quantity}</Text>
                  <InputNumber
                    placeholder="收货数量"
                    value={item.quantity}
                    onChange={(value) => handleItemChange(index, 'quantity', value)}
                    min={0}
                    max={item.quantity}
                    style={{ width: 100 }}
                  />
                </Space>
              ))}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

import { Form } from 'antd';
export default ProductionReceiptList;
