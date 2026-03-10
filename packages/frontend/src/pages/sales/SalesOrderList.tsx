import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, Input, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { SalesOrderResponse, SalesOrderStatus, CreateSalesOrderDto, SalesOrderItemDto, PaginatedResult, Customer, Material } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const SalesOrderList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrderResponse | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form] = Form.useForm();
  const [items, setItems] = useState<SalesOrderItemDto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<SalesOrderStatus, string> = {
    DRAFT: 'default',
    CONFIRMED: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<SalesOrderStatus, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_: any, record: SalesOrderResponse) => `${record.customerCode} - ${record.customerName}`,
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SalesOrderStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
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
      render: (_: any, record: SalesOrderResponse) => (
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
                description={`确定要删除销售订单 "${record.orderNo}" 吗？`}
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

  const fetchOrders = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<SalesOrderResponse> = await salesApi.getSalesOrders({
        page,
        limit,
      });
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取销售订单列表失败:', error);
      message.error('获取销售订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await masterApi.getCustomers({ limit: 1000 });
      setCustomers(result.data);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const result = await masterApi.getMaterials({ limit: 1000 });
      setMaterials(result.data);
    } catch (error) {
      console.error('获取物料列表失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const orderData: CreateSalesOrderDto = {
        customerId: values.customerId,
        orderDate: values.orderDate ? values.orderDate.toDate() : undefined,
        deliveryDate: values.deliveryDate ? values.deliveryDate.toDate() : undefined,
        items,
      };
      setLoading(true);
      if (editingOrder) {
        await salesApi.updateSalesOrder(editingOrder.id, orderData);
        message.success('销售订单更新成功');
      } else {
        await salesApi.createSalesOrder(orderData);
        message.success('销售订单创建成功');
      }
      setModalVisible(false);
      fetchOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存销售订单失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: SalesOrderResponse) => {
    if (order.status !== 'DRAFT') {
      message.warning('只能编辑草稿状态的订单');
      return;
    }
    setEditingOrder(order);
    form.setFieldsValue({
      customerId: order.customerId,
      orderDate: order.orderDate ? new Date(order.orderDate) : undefined,
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
    });
    setItems(order.items.map(item => ({
      materialId: item.materialId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })));
    setModalVisible(true);
  };

  const handleView = (order: SalesOrderResponse) => {
    setViewingOrder(order);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.deleteSalesOrder(id);
      message.success('销售订单删除成功');
      fetchOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除销售订单失败:', error);
      message.error('删除销售订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.confirmOrder(id);
      message.success('订单确认成功');
      fetchOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('确认订单失败:', error);
      message.error('确认订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.cancelOrder(id);
      message.success('订单取消成功');
      fetchOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消订单失败:', error);
      message.error('取消订单失败');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 0, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof SalesOrderItemDto, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchMaterials();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchOrders(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>销售订单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingOrder(null);
          form.resetFields();
          setItems([]);
          setModalVisible(true);
        }}>
          新增销售订单
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
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

      {/* 新增/编辑销售订单模态框 */}
      <Modal
        title={editingOrder ? "编辑销售订单" : "新增销售订单"}
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
            label="客户"
            name="customerId"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户">
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="订单日期"
            name="orderDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="交货日期"
            name="deliveryDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Typography.Text strong>订单明细</Typography.Text>
              <Button type="dashed" size="small" onClick={addItem}>添加物料</Button>
            </div>
            {items.length === 0 ? (
              <Typography.Text type="secondary">暂无物料，请点击添加物料按钮</Typography.Text>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {items.map((item, index) => (
                  <div key={index} style={{
                    padding: 12,
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    marginBottom: 8,
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Typography.Text strong>物料 #{index + 1}</Typography.Text>
                      <Button type="link" danger size="small" onClick={() => removeItem(index)}>删除</Button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <Typography.Text type="secondary">物料</Typography.Text>
                        <Select
                          placeholder="选择物料"
                          value={item.materialId}
                          onChange={(value) => updateItem(index, 'materialId', value)}
                          style={{ width: '100%' }}
                        >
                          {materials.map(material => (
                            <Option key={material.id} value={material.id}>
                              {material.code} - {material.name}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Typography.Text type="secondary">数量</Typography.Text>
                        <InputNumber
                          placeholder="数量"
                          value={item.quantity}
                          onChange={(value) => updateItem(index, 'quantity', value || 0)}
                          min={0.01}
                          step={1}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary">单价</Typography.Text>
                        <InputNumber
                          placeholder="单价"
                          value={item.unitPrice}
                          onChange={(value) => updateItem(index, 'unitPrice', value || 0)}
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    {item.materialId && item.quantity > 0 && item.unitPrice > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text>金额: ¥{(item.quantity * item.unitPrice).toFixed(2)}</Typography.Text>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* 查看销售订单模态框 */}
      <Modal
        title="查看销售订单"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {viewingOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>订单编号:</Typography.Text>
                <div>{viewingOrder.orderNo}</div>
              </div>
              <div>
                <Typography.Text strong>客户:</Typography.Text>
                <div>{viewingOrder.customerCode} - {viewingOrder.customerName}</div>
              </div>
              <div>
                <Typography.Text strong>订单日期:</Typography.Text>
                <div>{new Date(viewingOrder.orderDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>交货日期:</Typography.Text>
                <div>{viewingOrder.deliveryDate ? new Date(viewingOrder.deliveryDate).toLocaleDateString('zh-CN') : '-'}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingOrder.status]}>{statusText[viewingOrder.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>总金额:</Typography.Text>
                <div>¥{viewingOrder.totalAmount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>税额:</Typography.Text>
                <div>¥{viewingOrder.taxAmount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingOrder.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            <Typography.Title level={5}>订单明细</Typography.Title>
            <Table
              dataSource={viewingOrder.items}
              rowKey="id"
              columns={[
                { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
                { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (value) => `¥${value.toFixed(2)}` },
                { title: '金额', dataIndex: 'amount', key: 'amount', render: (value) => `¥${value.toFixed(2)}` },
                { title: '已发货数量', dataIndex: 'deliveredQuantity', key: 'deliveredQuantity', render: (value) => value.toFixed(2) },
              ]}
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesOrderList;