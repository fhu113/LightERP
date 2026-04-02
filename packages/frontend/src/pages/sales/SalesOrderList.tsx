import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, Input, InputNumber, Select, Popconfirm, Descriptions, Badge, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined, FilterOutlined, ReloadOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { taxCodeApi, TaxCode } from '../../services/tax-code.api';
import { SalesOrderResponse, SalesOrderStatus, CreateSalesOrderDto, SalesOrderItemDto, PaginatedResult, Customer, Material, OrderProcessStatus, ProcessStatus } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SalesOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrderResponse | null>(null);
  const [orderProcessStatus, setOrderProcessStatus] = useState<OrderProcessStatus | null>(null);
  const [processLoading, setProcessLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [form] = Form.useForm();
  const [items, setItems] = useState<SalesOrderItemDto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ========== 筛选状态 ==========
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>(undefined);
  const [filterDateRange, setFilterDateRange] = useState<[any, any] | null>(null);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);

  // 流程状态颜色映射
  const processStatusColor: Record<ProcessStatus, string> = {
    none: 'default',
    draft: 'default',
    partial: 'processing',
    completed: 'success',
  };

  const processStatusText: Record<ProcessStatus, string> = {
    none: '未创建',
    draft: '草稿',
    partial: '部分完成',
    completed: '已完成',
  };

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

  const statusTabItems = [
    { key: 'ALL', label: '全部', color: '#1677ff' },
    { key: 'DRAFT', label: '草稿', color: '#d9d9d9' },
    { key: 'CONFIRMED', label: '已确认', color: '#1677ff' },
    { key: 'COMPLETED', label: '已完成', color: '#52c41a' },
    { key: 'CANCELLED', label: '已取消', color: '#ff4d4f' },
  ];

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      sorter: true,
      render: (text: string) => <Text strong style={{ color: '#1677ff' }}>{text}</Text>,
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
      sorter: true,
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
      sorter: true,
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
          {(record.status === 'DRAFT' || record.status === 'CONFIRMED') && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fetchOrders = useCallback(async (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
    setLoading(true);
    try {
      const params: any = { page, limit, sortBy, sortOrder };
      if (filterSearch) params.search = filterSearch;
      if (activeStatus !== 'ALL') params.status = activeStatus;
      if (filterCustomerId) params.customerId = filterCustomerId;
      if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
        params.startDate = filterDateRange[0].format('YYYY-MM-DD');
        params.endDate = filterDateRange[1].format('YYYY-MM-DD');
      }
      const result: PaginatedResult<SalesOrderResponse> = await salesApi.getSalesOrders(params);
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取销售订单列表失败:', error);
      message.error('获取销售订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [filterSearch, activeStatus, filterCustomerId, filterDateRange]);

  const fetchStatusCounts = async () => {
    try {
      const counts = await salesApi.getStatusCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('获取状态统计失败:', error);
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

  const fetchTaxCodes = async () => {
    try {
      // 销售订单使用销项税
      const result = await taxCodeApi.getAll('OUTPUT');
      setTaxCodes(result);
    } catch (error) {
      console.error('获取税码失败:', error);
    }
  };

  // 筛选变化时重新加载第一页
  useEffect(() => {
    fetchOrders(1, pagination.limit);
  }, [activeStatus, filterCustomerId, filterDateRange, fetchOrders]);

  useEffect(() => {
    fetchStatusCounts();
    fetchCustomers();
    fetchMaterials();
    fetchTaxCodes();
  }, []);

  // 计算当前有多少个活跃的高级筛选
  const activeFilterCount = [filterCustomerId, filterDateRange, filterSearch].filter(Boolean).length;

  // 重置所有筛选
  const handleResetFilters = () => {
    setActiveStatus('ALL');
    setFilterCustomerId(undefined);
    setFilterDateRange(null);
    setFilterSearch('');
  };

  // 获取客户名称
  const getCustomerName = (id: string) => {
    const customer = customers.find(c => c.id === id);
    return customer ? `${customer.code} - ${customer.name}` : id;
  };

  const handleTableChange = (pag: any, filters: any, sorter: any) => {
    const sortBy = sorter.field || 'createdAt';
    const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    fetchOrders(pag.current, pag.pageSize, sortBy, sortOrder);
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
      fetchStatusCounts();
    } catch (error) {
      console.error('保存销售订单失败:', error);
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
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
    })));
    setModalVisible(true);
  };

  const handleView = async (order: SalesOrderResponse) => {
    setViewingOrder(order);
    setViewModalVisible(true);
    setProcessLoading(true);
    try {
      const status = await salesApi.getOrderProcessStatus(order.id);
      setOrderProcessStatus(status);
    } catch (error) {
      console.error('获取订单流程状态失败:', error);
      setOrderProcessStatus(null);
    } finally {
      setProcessLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.deleteSalesOrder(id);
      message.success('销售订单删除成功');
      fetchOrders(pagination.page, pagination.limit);
      fetchStatusCounts();
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
      fetchStatusCounts();
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
      fetchStatusCounts();
    } catch (error) {
      console.error('取消订单失败:', error);
      message.error('取消订单失败');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 0, unitPrice: 0, taxRate: 0, taxAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof SalesOrderItemDto, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 如果更新的是税率，重新计算税额
    if (field === 'taxRate' || field === 'quantity' || field === 'unitPrice') {
      const item = newItems[index];
      const taxRate = item.taxRate || 0;
      const amount = (item.quantity || 0) * (item.unitPrice || 0);
      newItems[index].taxAmount = amount * taxRate;
    }

    setItems(newItems);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>销售订单管理</Title>
        <Space>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={() => { fetchOrders(pagination.page, pagination.limit); fetchStatusCounts(); }} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingOrder(null);
            form.resetFields();
            setItems([]);
            setModalVisible(true);
          }}>
            新增销售订单
          </Button>
        </Space>
      </div>

      {/* ========== 状态快捷标签页 ========== */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {statusTabItems.map(tab => {
          const count = statusCounts[tab.key] || 0;
          const isActive = activeStatus === tab.key;
          return (
            <Button
              key={tab.key}
              type={isActive ? 'primary' : 'default'}
              size="middle"
              onClick={() => setActiveStatus(tab.key)}
              style={{
                borderRadius: 20,
                ...(isActive ? {} : { borderColor: '#d9d9d9' }),
              }}
            >
              {tab.label}
              <Badge
                count={count}
                style={{
                  marginLeft: 6,
                  backgroundColor: isActive ? '#fff' : tab.color,
                  color: isActive ? tab.color : '#fff',
                  boxShadow: 'none',
                  fontSize: 11,
                }}
                overflowCount={999}
                showZero
              />
            </Button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* 高级筛选切换按钮 */}
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
          type={showFilters || activeFilterCount > 0 ? 'primary' : 'default'}
          ghost={showFilters || activeFilterCount > 0}
        >
          高级筛选 {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>

        {/* 重置按钮 */}
        {(activeStatus !== 'ALL' || activeFilterCount > 0) && (
          <Button icon={<ClearOutlined />} onClick={handleResetFilters} danger type="text">
            重置
          </Button>
        )}
      </div>

      {/* ========== 高级筛选面板 ========== */}
      {showFilters && (
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Row gutter={[16, 12]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>客户</Text></div>
              <Select
                placeholder="全部客户"
                value={filterCustomerId}
                onChange={(v) => setFilterCustomerId(v)}
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {customers.map(c => (
                  <Option key={c.id} value={c.id}>{c.code} - {c.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>创建时间</Text></div>
              <RangePicker
                value={filterDateRange as any}
                onChange={(dates) => setFilterDateRange(dates as any)}
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>订单号 / 客户名</Text></div>
              <Input.Search
                placeholder="输入搜索..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onSearch={() => fetchOrders(1, pagination.limit)}
                allowClear
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button block onClick={() => fetchOrders(1, pagination.limit)} type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* ========== 已激活筛选标签 ========== */}
      {activeFilterCount > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>当前筛选：</Text>
          {filterCustomerId && (
            <Tag closable onClose={() => setFilterCustomerId(undefined)} color="blue">
              客户: {getCustomerName(filterCustomerId)}
            </Tag>
          )}
          {filterDateRange && filterDateRange[0] && filterDateRange[1] && (
            <Tag closable onClose={() => setFilterDateRange(null)} color="green">
              时间: {filterDateRange[0].format('YYYY-MM-DD')} ~ {filterDateRange[1].format('YYYY-MM-DD')}
            </Tag>
          )}
          {filterSearch && (
            <Tag closable onClose={() => { setFilterSearch(''); }} color="orange">
              搜索: {filterSearch}
            </Tag>
          )}
        </div>
      )}

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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
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
                      <div>
                        <Typography.Text type="secondary">税码</Typography.Text>
                        <Select
                          placeholder="税码"
                          value={item.taxRate}
                          onChange={(value) => updateItem(index, 'taxRate', value)}
                          style={{ width: '100%' }}
                          allowClear
                        >
                          {taxCodes.map(tax => (
                            <Option key={tax.id} value={tax.rate}>
                              {tax.name} ({(tax.rate * 100).toFixed(0)}%)
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    {item.materialId && item.quantity > 0 && item.unitPrice > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text>金额: ¥{(item.quantity * item.unitPrice).toFixed(2)}</Typography.Text>
                        {(item.taxAmount || 0) > 0 && (
                          <Typography.Text type="secondary"> + 税额: ¥{item.taxAmount.toFixed(2)} = 含税: ¥{((item.quantity * item.unitPrice) + (item.taxAmount || 0)).toFixed(2)}</Typography.Text>
                        )}
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
          viewingOrder?.status === 'DRAFT' && (
            <Button key="confirm" type="primary" icon={<CheckOutlined />} onClick={() => {
              handleConfirm(viewingOrder.id);
              setViewModalVisible(false);
            }}>
              确认订单
            </Button>
          ),
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
                { title: '已发货数量', dataIndex: 'deliveredQuantity', key: 'deliveredQuantity', render: (value) => value?.toFixed(2) || '0.00' },
              ]}
              pagination={false}
            />

            {/* 订单流程状态 */}
            <Typography.Title level={5} style={{ marginTop: 24 }}>订单流程状态</Typography.Title>
            {processLoading ? (
              <div>加载中...</div>
            ) : orderProcessStatus ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {/* 发货状态 */}
                <Card size="small" title="发货状态" style={{ border: '1px solid #f0f0f0' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={processStatusColor[orderProcessStatus.delivery.status]}>
                      {processStatusText[orderProcessStatus.delivery.status]}
                    </Tag>
                  </div>
                  {orderProcessStatus.delivery.count > 0 && (
                    <div style={{ fontSize: 13 }}>
                      {orderProcessStatus.delivery.items.map(item => (
                        <div key={item.id} style={{ marginBottom: 4, padding: '4px 0', borderBottom: '1px dashed #f0f0f0' }}>
                          <Text type="secondary">{item.deliveryNo}</Text>
                          {item.voucherNo && (
                            <div style={{ marginTop: 2 }}>
                              <Badge status="processing" text="已生凭证" style={{ fontSize: 11 }} />
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, fontSize: 12, marginLeft: 8 }}
                                onClick={() => {
                                  navigate(`/finance/voucher-list?voucherId=${item.voucherId}`);
                                }}
                              >
                                {item.voucherNo}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 开票状态 */}
                <Card size="small" title="开票状态" style={{ border: '1px solid #f0f0f0' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={processStatusColor[orderProcessStatus.invoice.status]}>
                      {processStatusText[orderProcessStatus.invoice.status]}
                    </Tag>
                  </div>
                  {orderProcessStatus.invoice.count > 0 && (
                    <div style={{ fontSize: 13 }}>
                      {orderProcessStatus.invoice.items.map(item => (
                        <div key={item.id} style={{ marginBottom: 4, padding: '4px 0', borderBottom: '1px dashed #f0f0f0' }}>
                          <Text type="secondary">{item.invoiceNo}</Text>
                          <div style={{ fontSize: 12 }}>金额: ¥{item.amount.toFixed(2)}</div>
                          {item.voucherNo && (
                            <div style={{ marginTop: 2 }}>
                              <Badge status="processing" />
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, fontSize: 12 }}
                                onClick={() => {
                                  window.location.href = `/finance/voucher-list?voucherId=${item.voucherId}`;
                                }}
                              >
                                凭证: {item.voucherNo}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 收款状态 */}
                <Card size="small" title="收款状态" style={{ border: '1px solid #f0f0f0' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={processStatusColor[orderProcessStatus.receipt.status]}>
                      {processStatusText[orderProcessStatus.receipt.status]}
                    </Tag>
                  </div>
                  {orderProcessStatus.receipt.count > 0 && (
                    <div style={{ fontSize: 13 }}>
                      {orderProcessStatus.receipt.items.map(item => (
                        <div key={item.id} style={{ marginBottom: 4, padding: '4px 0', borderBottom: '1px dashed #f0f0f0' }}>
                          <Text type="secondary">{item.receiptNo}</Text>
                          <div style={{ fontSize: 12 }}>金额: ¥{item.amount.toFixed(2)}</div>
                          {item.voucherNo && (
                            <div style={{ marginTop: 2 }}>
                              <Badge status="processing" />
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, fontSize: 12 }}
                                onClick={() => {
                                  window.location.href = `/finance/voucher-list?voucherId=${item.voucherId}`;
                                }}
                              >
                                凭证: {item.voucherNo}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <div>暂无流程信息</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesOrderList;