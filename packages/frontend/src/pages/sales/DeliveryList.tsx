import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, Input, InputNumber, Select, Popconfirm, Descriptions, Badge, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UndoOutlined, FilterOutlined, ReloadOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deliveryApi } from '../../services/delivery.api';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { DeliveryResponse, DeliveryStatus, CreateDeliveryDto, DeliveryItemDto, PaginatedResult, SalesOrderResponse, Customer } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DeliveryList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryResponse[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    ALL: 0, DRAFT: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0
  });
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState<DeliveryResponse | null>(null);
  const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderResponse | null>(null);
  const [form] = Form.useForm();
  const [items, setItems] = useState<DeliveryItemDto[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
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

  const statusTabItems = [
    { key: 'ALL', label: '全部', color: '#1677ff' },
    { key: 'DRAFT', label: '草稿', color: '#d9d9d9' },
    { key: 'CONFIRMED', label: '已确认', color: '#1890ff' },
    { key: 'COMPLETED', label: '已完成', color: '#52c41a' },
    { key: 'CANCELLED', label: '已取消', color: '#f5222d' },
  ];

  const fetchStatusCounts = async () => {
    try {
      const counts = await deliveryApi.getStatusCounts();
      setStatusCounts(counts as any);
    } catch (error) {
      console.error('获取发货单统计失败:', error);
    }
  };

  const fetchDeliveries = useCallback(async (
    page = pagination.current, 
    pageSize = pagination.pageSize,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        search: filters.search,
        filters: {
          ...filters,
          status: activeTab === 'ALL' ? undefined : activeTab
        }
      };
      const result = await deliveryApi.getDeliveries(params);
      setDeliveries(result.data);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      console.error('获取发货单列表失败:', error);
      message.error('获取发货单列表失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  const fetchCustomers = async () => {
    try {
      const result = await masterApi.getCustomers({ limit: 1000 });
      setCustomers(result.data);
    } catch (error) {
      console.error('获取客户列表失败:', error);
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

  useEffect(() => {
    fetchStatusCounts();
    fetchDeliveries();
    fetchCustomers();
  }, [fetchDeliveries]);

  const handleRefresh = () => {
    fetchStatusCounts();
    fetchDeliveries();
  };

  const handleResetFilters = () => {
    setFilters({
      customerId: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setActiveTab('ALL');
  };

  const handleRemoveFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
  };

  const columns = [
    {
      title: '发货单号',
      dataIndex: 'deliveryNo',
      key: 'deliveryNo',
      sorter: true,
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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeliveryStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '凭证',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (voucherNo: string | null, record: DeliveryResponse) => {
        if (voucherNo) {
          return (
            <Space>
              <Badge status="processing" />
              <Button 
                type="link" 
                size="small" 
                style={{ padding: 0 }}
                onClick={() => navigate(`/finance/voucher-list?voucherId=${record.voucherId}`)}
              >
                {voucherNo}
              </Button>
            </Space>
          );
        }
        return <Text type="secondary">未生成</Text>;
      },
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
          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="确认冲销"
              description={`确定要冲销发货单 "${record.deliveryNo}" 吗？冲销将恢复库存并将关联凭证设为已冲销。`}
              onConfirm={() => handleReverse(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<UndoOutlined />}>
                冲销
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.confirmDelivery(id);
      message.success('发货单确认成功，已生成会计凭证');
      handleRefresh();
    } catch (error) {
      console.error('确认发货单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.reverseDelivery(id);
      message.success('发货单冲销成功');
      handleRefresh();
    } catch (error) {
      console.error('冲销发货单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.cancelDelivery(id);
      message.success('发货单已取消');
      handleRefresh();
    } catch (error) {
      console.error('取消发货单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deliveryApi.deleteDelivery(id);
      message.success('发货单删除成功');
      handleRefresh();
    } catch (error) {
      console.error('删除发货单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (delivery: DeliveryResponse) => {
    setViewingDelivery(delivery);
    setViewModalVisible(true);
  };

  const handleEdit = (delivery: DeliveryResponse) => {
    setEditingDelivery(delivery);
    fetchConfirmedOrders();
    form.setFieldsValue({
      orderId: delivery.orderId,
      deliveryDate: dayjs(delivery.deliveryDate),
      warehouseId: delivery.warehouseId,
      shippingInfo: delivery.shippingInfo,
    });
    setItems(delivery.items.map(item => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity
    })));
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingDelivery) {
        await deliveryApi.updateDelivery(editingDelivery.id, {
          ...values,
          items
        });
        message.success('发货单更新成功');
      } else {
        await deliveryApi.createDelivery({
          ...values,
          items
        });
        message.success('发货单创建成功');
      }
      setModalVisible(false);
      handleRefresh();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>发货管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingDelivery(null);
            form.resetFields();
            setItems([]);
            fetchConfirmedOrders();
            setModalVisible(true);
          }}>
            创建发货单
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="large">
            {statusTabItems.map(tab => {
              const count = statusCounts[tab.key] || 0;
              const isActive = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  type={isActive ? 'primary' : 'default'}
                  size="middle"
                  onClick={() => setActiveTab(tab.key)}
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
          </Space>
          
          <Space>
            <Input
              placeholder="搜索发货单号/订单号/客户"
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={() => fetchDeliveries(1)}
            />
            <Button 
              icon={<FilterOutlined />} 
              type={showFilters ? 'primary' : 'default'}
              onClick={() => setShowFilters(!showFilters)}
            >
              高级筛选
            </Button>
            {(filters.customerId || filters.startDate || filters.endDate || filters.search) && (
              <Button icon={<ClearOutlined />} onClick={handleResetFilters}>重置</Button>
            )}
          </Space>
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>客户</div>
                <Select
                  showSearch
                  placeholder="选择客户"
                  style={{ width: '100%' }}
                  value={filters.customerId || undefined}
                  onChange={val => setFilters(prev => ({ ...prev, customerId: val }))}
                  optionFilterProp="children"
                >
                  {customers.map(c => (
                    <Option key={c.id} value={c.id}>{c.code} - {c.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>发货日期范围</div>
                <RangePicker 
                  style={{ width: '100%' }}
                  value={filters.startDate ? [dayjs(filters.startDate), dayjs(filters.endDate)] : null}
                  onChange={(dates) => {
                    if (dates) {
                      setFilters(prev => ({
                        ...prev,
                        startDate: dates[0]!.format('YYYY-MM-DD'),
                        endDate: dates[1]!.format('YYYY-MM-DD')
                      }));
                    } else {
                      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
                    }
                  }}
                />
              </Col>
            </Row>
          </div>
        )}

        {/* 激活的筛选标签 */}
        <div style={{ marginTop: 16 }}>
          <Space size={[0, 8]} wrap>
            {filters.customerId && (
              <Tag closable onClose={() => handleRemoveFilter('customerId')}>
                客户: {customers.find(c => c.id === filters.customerId)?.name}
              </Tag>
            )}
            {filters.startDate && (
              <Tag closable onClose={() => {
                handleRemoveFilter('startDate');
                handleRemoveFilter('endDate');
              }}>
                日期: {filters.startDate} ~ {filters.endDate}
              </Tag>
            )}
          </Space>
        </div>
      </Card>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={deliveries}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条数据`
          }}
          onChange={(pag, _filters, sorter: any) => {
            const sortBy = sorter.field || 'createdAt';
            const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
            fetchDeliveries(pag.current, pag.pageSize, sortBy, sortOrder);
          }}
          rowKey="id"
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingDelivery ? '编辑发货单' : '创建发货单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="orderId" label="关联销售订单" rules={[{ required: true }]}>
                <Select 
                  placeholder="搜索已确认的订单" 
                  disabled={!!editingDelivery}
                  onChange={(val) => {
                    const order = orders.find(o => o.id === val);
                    setSelectedOrder(order || null);
                    if (order) {
                      setItems(order.items.map(i => ({
                        orderItemId: i.id,
                        quantity: i.quantity - i.deliveredQuantity
                      })));
                    }
                  }}
                >
                  {orders.map(o => (
                    <Option key={o.id} value={o.id}>{o.orderNo} ({o.customerName})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deliveryDate" label="发货日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouseId" label="仓库">
                <Input placeholder="主仓库" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shippingInfo" label="物流信息">
                <Input placeholder="顺丰速运" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>发货明细</Title>
          <Table
            dataSource={items}
            rowKey="orderItemId"
            pagination={false}
            columns={[
              {
                title: '物料',
                key: 'material',
                render: (_, record) => {
                  const orderItem = selectedOrder?.items.find(i => i.id === record.orderItemId);
                  return orderItem ? `${orderItem.materialCode} - ${orderItem.materialName}` : '未知物料';
                }
              },
              {
                title: '待发数量',
                key: 'pending',
                render: (_, record) => {
                  const orderItem = selectedOrder?.items.find(i => i.id === record.orderItemId);
                  return orderItem ? (orderItem.quantity - orderItem.deliveredQuantity).toFixed(2) : '-';
                }
              },
              {
                title: '本次发货',
                key: 'quantity',
                render: (_, record, index) => (
                  <InputNumber
                    min={0}
                    value={record.quantity}
                    onChange={val => {
                      const newItems = [...items];
                      newItems[index].quantity = val || 0;
                      setItems(newItems);
                    }}
                  />
                )
              }
            ]}
          />
        </Form>
      </Modal>

      {/* 查看弹窗 */}
      <Modal
        title={`发货单详情 - ${viewingDelivery?.deliveryNo}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          viewingDelivery?.status === 'DRAFT' && (
            <Button key="confirm" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirm(viewingDelivery!.id)}>
              确认发货
            </Button>
          ),
          <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>
        ]}
        width={850}
      >
        {viewingDelivery && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="发货单号"><Text strong>{viewingDelivery.deliveryNo}</Text></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[viewingDelivery.status]}>{statusText[viewingDelivery.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="销售订单">{viewingDelivery.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{viewingDelivery.customerName}</Descriptions.Item>
              <Descriptions.Item label="发货日期">{dayjs(viewingDelivery.deliveryDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(viewingDelivery.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="会计凭证">
                {viewingDelivery.voucherNo ? (
                  <Space>
                    <Badge status="processing" text={viewingDelivery.voucherNo} />
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => navigate(`/finance/voucher-list?voucherId=${viewingDelivery.voucherId}`)}
                    >
                      查看分录
                    </Button>
                  </Space>
                ) : <Text type="secondary">未生成</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="物流信息">{viewingDelivery.shippingInfo || '暂无'}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>发货明细</Title>
            <Table
              dataSource={viewingDelivery.items}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                { title: '发货数量', dataIndex: 'quantity', key: 'quantity', render: val => val.toFixed(2) }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryList;