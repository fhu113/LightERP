import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, Select, Popconfirm, Badge, Input, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined, FilterOutlined, ReloadOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { SalesInvoiceResponse, SalesInvoiceStatus, CreateSalesInvoiceDto, PaginatedResult, SalesOrderResponse, Customer } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SalesInvoiceList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<SalesInvoiceResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoiceResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoiceResponse | null>(null);
  const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ========== 筛选状态 ==========
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sortParams, setSortParams] = useState({ sortBy: 'invoiceDate', sortOrder: 'desc' });

  const statusTabItems = [
    { key: 'ALL', label: '全部', color: '#1677ff' },
    { key: 'DRAFT', label: '草稿', color: '#d9d9d9' },
    { key: 'ISSUED', label: '已开具', color: '#1890ff' },
    { key: 'PAID', label: '已付款', color: '#52c41a' },
    { key: 'CANCELLED', label: '已取消', color: '#f5222d' },
  ];

  // 状态标签颜色映射
  const statusColor: Record<SalesInvoiceStatus, string> = {
    DRAFT: 'default',
    ISSUED: 'processing',
    PAID: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<SalesInvoiceStatus, string> = {
    DRAFT: '草稿',
    ISSUED: '已开具',
    PAID: '已付款',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      sorter: true,
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_: any, record: SalesInvoiceResponse) => `${record.customerCode} - ${record.customerName}`,
    },
    {
      title: '发票日期',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SalesInvoiceStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '发票金额',
      dataIndex: 'amount',
      key: 'amount',
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
      title: '凭证',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (voucherNo: string | null) => {
        if (voucherNo) {
          return (
            <Space>
              <Badge status="processing" />
              <Button 
                type="link" 
                size="small" 
                style={{ padding: 0 }}
                onClick={() => (window.location.href = `/finance/voucher-list?search=${voucherNo}`)}
              >
                {voucherNo}
              </Button>
            </Space>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>未生成</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SalesInvoiceResponse) => (
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
                description={`确定要删除销售发票 "${record.invoiceNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleIssue(record.id)}>
                开具
              </Button>
            </>
          )}
          {(record.status === 'DRAFT' || record.status === 'ISSUED') && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fetchInvoices = async (page = 1, limit = 10, sort = sortParams, currentFilters = filters, status = activeStatus) => {
    setLoading(true);
    try {
      const result: PaginatedResult<SalesInvoiceResponse> = await salesApi.getSalesInvoices({
        page,
        limit,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder as any,
        search: currentFilters.search,
        filters: {
          ...currentFilters,
          status: status === 'ALL' ? undefined : status,
        }
      });
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取销售发票列表失败:', error);
      message.error('获取销售发票列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const counts = await salesApi.getSalesInvoiceStatusCounts();
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

  const fetchCompletedOrders = async () => {
    try {
      // 获取已确认/完成的订单（可以创建发票的订单）
      // 先后获取两种状态的订单
      const [confirmedResult, completedResult] = await Promise.all([
        salesApi.getSalesOrders({ limit: 1000, filters: { status: 'CONFIRMED' } }),
        salesApi.getSalesOrders({ limit: 1000, filters: { status: 'COMPLETED' } })
      ]);
      const allOrders = [
        ...(confirmedResult.data || []),
        ...(completedResult.data || [])
      ];

      // 使用 Set 去重
      const uniqueOrdersMap = new Map();
      allOrders.forEach((order: SalesOrderResponse) => {
        uniqueOrdersMap.set(order.id, order);
      });
      const uniqueOrders = Array.from(uniqueOrdersMap.values());

      // 获取已开票的订单ID列表
      const invoicesResult = await salesApi.getSalesInvoices({ limit: 1000 });
      const invoicedOrderIds = new Set(
        (invoicesResult.data || []).map((inv: SalesInvoiceResponse) => inv.orderId)
      );

      // 过滤掉已开票的订单
      const availableOrders = uniqueOrders.filter(
        (order: SalesOrderResponse) => !invoicedOrderIds.has(order.id)
      );

      setOrders(availableOrders);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
    }
  };

  const handleRefresh = () => {
    fetchInvoices(pagination.page, pagination.limit);
    fetchStatusCounts();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      customerId: '',
      startDate: '',
      endDate: '',
      search: ''
    };
    setFilters(defaultFilters);
    setActiveStatus('ALL');
    fetchInvoices(1, pagination.limit, sortParams, defaultFilters, 'ALL');
    fetchStatusCounts();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const invoiceData: CreateSalesInvoiceDto = {
        orderId: values.orderId,
        invoiceDate: values.invoiceDate ? values.invoiceDate.toDate() : undefined,
      };
      setLoading(true);
      if (editingInvoice) {
        await salesApi.updateSalesInvoice(editingInvoice.id, invoiceData);
        message.success('销售发票更新成功');
      } else {
        await salesApi.createSalesInvoice(invoiceData);
        message.success('销售发票创建成功');
      }
      setModalVisible(false);
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存销售发票失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice: SalesInvoiceResponse) => {
    if (invoice.status !== 'DRAFT') {
      message.warning('只能编辑草稿状态的发票');
      return;
    }
    setEditingInvoice(invoice);
    form.setFieldsValue({
      orderId: invoice.orderId,
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleView = (invoice: SalesInvoiceResponse) => {
    setViewingInvoice(invoice);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.deleteSalesInvoice(id);
      message.success('销售发票删除成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除销售发票失败:', error);
      message.error('删除销售发票失败');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.issueInvoice(id);
      message.success('发票开具成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('开具发票失败:', error);
      message.error('开具发票失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.cancelInvoice(id);
      message.success('发票取消成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消发票失败:', error);
      message.error('取消发票失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchStatusCounts();
    fetchCustomers();
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    fetchInvoices(1, pagination.limit, sortParams, filters, activeStatus);
    fetchStatusCounts();
  }, [activeStatus]);

  const handleTableChange = (pag: any, _filters: any, sorter: any) => {
    const newSort = {
      sortBy: sorter.field || 'invoiceDate',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
    };
    setSortParams(newSort);
    fetchInvoices(pag.current, pag.pageSize, newSort);
  };

  const activeFilterCount = [filters.customerId, filters.startDate, filters.endDate].filter(Boolean).length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>销售发票管理</Title>
        <Space>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingInvoice(null);
            form.resetFields();
            fetchCompletedOrders();
            setModalVisible(true);
          }}>
            新增销售发票
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilters ? 16 : 0 }}>
          <Space size="middle">
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
          </Space>
          
          <Space>
            <Input
              placeholder="搜索发票号/订单号/客户"
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={() => fetchInvoices(1)}
            />
            <Button 
              icon={<FilterOutlined />} 
              type={showFilters || activeFilterCount > 0 ? 'primary' : 'default'}
              onClick={() => setShowFilters(!showFilters)}
            >
              高级筛选 {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            {(activeStatus !== 'ALL' || activeFilterCount > 0 || filters.search) && (
              <Button icon={<ClearOutlined />} onClick={handleResetFilters} danger type="text">重置</Button>
            )}
          </Space>
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>客户</div>
                <Select
                  showSearch
                  placeholder="过滤客户"
                  style={{ width: '100%' }}
                  value={filters.customerId || undefined}
                  onChange={val => {
                    const newFilters = { ...filters, customerId: val || '' };
                    setFilters(newFilters);
                    fetchInvoices(1, pagination.limit, sortParams, newFilters);
                  }}
                  allowClear
                  optionFilterProp="children"
                >
                  {customers.map(c => (
                    <Option key={c.id} value={c.id}>{c.code} - {c.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={10}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>发票日期范围</div>
                <RangePicker 
                  style={{ width: '100%' }}
                  value={filters.startDate ? [dayjs(filters.startDate), dayjs(filters.endDate)] : null}
                  onChange={(dates) => {
                    const newFilters = {
                      ...filters,
                      startDate: dates ? dates[0]!.format('YYYY-MM-DD') : '',
                      endDate: dates ? dates[1]!.format('YYYY-MM-DD') : ''
                    };
                    setFilters(newFilters);
                    fetchInvoices(1, pagination.limit, sortParams, newFilters);
                  }}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={invoices}
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
          style={{ padding: '0 16px' }}
        />
      </Card>

      {/* 新增/编辑销售发票模态框 */}
      <Modal
        title={editingInvoice ? "编辑销售发票" : "新增销售发票"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="销售订单"
            name="orderId"
            rules={[{ required: true, message: '请选择销售订单' }]}
          >
            <Select placeholder="请选择销售订单" disabled={!!editingInvoice}>
              {orders.map(order => (
                <Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.customerCode} - 总额: ¥{order.totalAmount.toFixed(2)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="发票日期"
            name="invoiceDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看销售发票模态框 */}
      <Modal
        title="查看销售发票"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {viewingInvoice && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>发票编号:</Typography.Text>
                <div>{viewingInvoice.invoiceNo}</div>
              </div>
              <div>
                <Typography.Text strong>订单编号:</Typography.Text>
                <div>{viewingInvoice.orderNo}</div>
              </div>
              <div>
                <Typography.Text strong>客户:</Typography.Text>
                <div>{viewingInvoice.customerCode} - {viewingInvoice.customerName}</div>
              </div>
              <div>
                <Typography.Text strong>发票日期:</Typography.Text>
                <div>{new Date(viewingInvoice.invoiceDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingInvoice.status]}>{statusText[viewingInvoice.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>发票金额:</Typography.Text>
                <div>¥{viewingInvoice.amount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>税额:</Typography.Text>
                <div>¥{viewingInvoice.taxAmount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingInvoice.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>更新时间:</Typography.Text>
                <div>{new Date(viewingInvoice.updatedAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            {viewingInvoice.receipts.length > 0 && (
              <>
                <Typography.Title level={5}>收款记录</Typography.Title>
                <Table
                  dataSource={viewingInvoice.receipts}
                  rowKey="id"
                  columns={[
                    { title: '收款单号', dataIndex: 'receiptNo', key: 'receiptNo' },
                    { title: '收款日期', dataIndex: 'receiptDate', key: 'receiptDate', render: (date) => new Date(date).toLocaleDateString('zh-CN') },
                    { title: '收款金额', dataIndex: 'amount', key: 'amount', render: (value) => `¥${value.toFixed(2)}` },
                    { title: '支付方式', dataIndex: 'paymentMethod', key: 'paymentMethod' },
                    { title: '状态', dataIndex: 'status', key: 'status' },
                  ]}
                  pagination={false}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesInvoiceList;