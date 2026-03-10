import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, Input, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { deliveryApi } from '../../services/delivery.api';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { DeliveryResponse, DeliveryStatus, CreateDeliveryDto, DeliveryItemDto, PaginatedResult, SalesOrderResponse } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const DeliveryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState<DeliveryResponse | null>(null);
  const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderResponse | null>(null);
  const [form] = Form.useForm();
  const [items, setItems] = useState<DeliveryItemDto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<DeliveryStatus, string> = {
    DRAFT: 'default',
    CONFIRMED: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<DeliveryStatus, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '发货单号',
      dataIndex: 'deliveryNo',
      key: 'deliveryNo',
    },
    {
      title: '销售订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_: any, record: DeliveryResponse) => `${record.customerCode} - ${record.customerName}`,
    },
    {
      title: '发货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeliveryStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
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
      render: (_: any, record: DeliveryResponse) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确认删除"
                description={`确定要删除发货单 "${record.deliveryNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认
              </Button>
            </>
          )}
          {(record.status === 'DRAFT' || record.status === 'CONFIRMED') && record.status !== 'COMPLETED' && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fetchDeliveries = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<DeliveryResponse> = await deliveryApi.getDeliveries({
        page,
        limit,
      });
      setDeliveries(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取发货单列表失败:', error);
      message.error('获取发货单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedOrders = async () => {
    try {
      const result = await salesApi.getSalesOrders({ limit: 1000 });
      // 只显示已确认且未完全发货的订单
      const confirmedOrders = result.data.filter(order =>
        order.status === 'CONFIRMED' &&
        order.items.some(item => item.quantity > item.deliveredQuantity)
      );
      setOrders(confirmedOrders);
    } catch (error) {
      console.error('获取销售订单失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const deliveryData: CreateDeliveryDto = {
        orderId: values.orderId,
        deliveryDate: values.deliveryDate ? values.deliveryDate.toDate() : undefined,
        warehouseId: values.warehouseId,
        shippingInfo: values.shippingInfo,
        items,
      };
      setLoading(true);
      if (editingDelivery) {
        await deliveryApi.updateDelivery(editingDelivery.id, deliveryData);
        message.success('发货单更新成功');
      } else {
        await deliveryApi.createDelivery(deliveryData);
        message.success('发货单创建成功');
      }
      setModalVisible(false);
      fetchDeliveries(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存发货单失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (delivery: DeliveryResponse) => {
    if (delivery.status !== 'DRAFT') {
      message.warning('只能编辑草稿状态的发货单');
      return;
    }
    setEditingDelivery(delivery);
    // 加载订单信息
    const order = orders.find(o => o.id === delivery.orderId);
    setSelectedOrder(order || null);
    form.setFieldsValue({
      orderId: delivery.orderId,
      deliveryDate: delivery.deliveryDate ? new Date(delivery.deliveryDate) : undefined,
      warehouseId: delivery.warehouseId,
      shippingInfo: delivery.shippingInfo,
    });
    // 设置发货明细（需要从delivery.items转换为DeliveryItemDto格式）
    setItems(delivery.items.map(item => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity,
    })));
    setModalVisible(true);
  };

  const handleView = (delivery: DeliveryResponse) => {
    setViewingDelivery(delivery);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.deleteDelivery(id);
      message.success('发货单删除成功');
      fetchDeliveries(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除发货单失败:', error);
      message.error('删除发货单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.confirmDelivery(id);
      message.success('发货单确认成功');
      fetchDeliveries(pagination.page, pagination.limit);
      fetchConfirmedOrders(); // 刷新订单列表
    } catch (error) {
      console.error('确认发货单失败:', error);
      message.error('确认发货单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.cancelDelivery(id);
      message.success('发货单取消成功');
      fetchDeliveries(pagination.page, pagination.limit);
      fetchConfirmedOrders(); // 刷新订单列表
    } catch (error) {
      console.error('取消发货单失败:', error);
      message.error('取消发货单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    // 初始化发货明细为订单明细，数量为剩余可发货数量
    if (order) {
      const newItems = order.items
        .filter(item => item.quantity > item.deliveredQuantity)
        .map(item => ({
          orderItemId: item.id,
          quantity: item.quantity - item.deliveredQuantity, // 默认发完剩余数量
        }));
      setItems(newItems);
    } else {
      setItems([]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity };
    setItems(newItems);
  };

  useEffect(() => {
    fetchDeliveries();
    fetchConfirmedOrders();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchDeliveries(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>发货管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingDelivery(null);
          setSelectedOrder(null);
          form.resetFields();
          setItems([]);
          setModalVisible(true);
        }}>
          新增发货单
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={deliveries}
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

      {/* 新增/编辑发货单模态框 */}
      <Modal
        title={editingDelivery ? "编辑发货单" : "新增发货单"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="销售订单"
            name="orderId"
            rules={[{ required: true, message: '请选择销售订单' }]}
          >
            <Select
              placeholder="请选择销售订单"
              onChange={handleOrderChange}
              disabled={!!editingDelivery}
            >
              {orders.map(order => (
                <Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.customerName} (剩余可发货: {
                    order.items.reduce((total, item) => total + (item.quantity - item.deliveredQuantity), 0).toFixed(2)
                  })
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedOrder && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
              <Typography.Text strong>订单信息:</Typography.Text>
              <div>订单号: {selectedOrder.orderNo}</div>
              <div>客户: {selectedOrder.customerName}</div>
              <div>订单日期: {new Date(selectedOrder.orderDate).toLocaleDateString('zh-CN')}</div>
            </div>
          )}
          <Form.Item
            label="发货日期"
            name="deliveryDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="仓库"
            name="warehouseId"
          >
            <Input placeholder="请输入仓库编号" />
          </Form.Item>
          <Form.Item
            label="物流信息"
            name="shippingInfo"
          >
            <Input.TextArea placeholder="请输入物流信息" rows={2} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Typography.Text strong>发货明细</Typography.Text>
              <Typography.Text type="secondary">
                选择销售订单后自动填充可发货明细
              </Typography.Text>
            </div>
            {items.length === 0 ? (
              <Typography.Text type="secondary">请先选择销售订单</Typography.Text>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {items.map((item, index) => {
                  const orderItem = selectedOrder?.items.find(i => i.id === item.orderItemId);
                  if (!orderItem) return null;
                  const remainingQuantity = orderItem.quantity - orderItem.deliveredQuantity;

                  return (
                    <div key={index} style={{
                      padding: 12,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      marginBottom: 8,
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Typography.Text strong>{orderItem.materialName} ({orderItem.materialCode})</Typography.Text>
                        <Typography.Text type="secondary">
                          订单数量: {orderItem.quantity.toFixed(2)} | 已发货: {orderItem.deliveredQuantity.toFixed(2)} | 剩余: {remainingQuantity.toFixed(2)}
                        </Typography.Text>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <Typography.Text type="secondary">发货数量</Typography.Text>
                          <InputNumber
                            placeholder="发货数量"
                            value={item.quantity}
                            onChange={(value) => updateItemQuantity(index, value || 0)}
                            min={0.01}
                            max={remainingQuantity}
                            step={1}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <Typography.Text type="secondary">单位</Typography.Text>
                          <Input
                            value={orderItem.unit}
                            disabled
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* 查看发货单模态框 */}
      <Modal
        title="查看发货单"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {viewingDelivery && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>发货单号:</Typography.Text>
                <div>{viewingDelivery.deliveryNo}</div>
              </div>
              <div>
                <Typography.Text strong>销售订单:</Typography.Text>
                <div>{viewingDelivery.orderNo}</div>
              </div>
              <div>
                <Typography.Text strong>客户:</Typography.Text>
                <div>{viewingDelivery.customerName}</div>
              </div>
              <div>
                <Typography.Text strong>发货日期:</Typography.Text>
                <div>{new Date(viewingDelivery.deliveryDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingDelivery.status]}>{statusText[viewingDelivery.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>仓库:</Typography.Text>
                <div>{viewingDelivery.warehouseId || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>物流信息:</Typography.Text>
                <div>{viewingDelivery.shippingInfo || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingDelivery.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            <Typography.Title level={5}>发货明细</Typography.Title>
            <Table
              dataSource={viewingDelivery.items}
              rowKey="id"
              columns={[
                { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                { title: '发货数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
              ]}
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryList;