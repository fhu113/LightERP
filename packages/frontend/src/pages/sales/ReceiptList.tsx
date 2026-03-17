import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm, Badge, Tabs, Row, Col, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { ReceiptResponse, ReceiptStatus, PaymentMethod, CreateReceiptDto, PaginatedResult, Customer, SalesInvoiceResponse } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 状态标签颜色映射
const statusColor: Record<ReceiptStatus, string> = {
  PENDING: 'default',
  PAID: 'success',
  CANCELLED: 'error',
};

// 状态标签文本映射
const statusText: Record<ReceiptStatus, string> = {
  PENDING: '待处理',
  PAID: '已收款',
  CANCELLED: '已取消',
};

// 支付方式文本映射
const paymentMethodText: Record<PaymentMethod, string> = {
  CASH: '现金',
  BANK_TRANSFER: '银行转账',
  CHECK: '支票',
  CREDIT_CARD: '信用卡',
};

const TAB_ITEMS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待处理' },
  { key: 'PAID', label: '已收款' },
  { key: 'CANCELLED', label: '已取消' },
];

const ReceiptList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptResponse[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptResponse | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoiceResponse[]>([]);
  const [form] = Form.useForm();
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 筛选与排序状态
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [sortParam, setSortParam] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });

  const columns = [
    {
      title: '收款单号',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
      sorter: true,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_: any, record: ReceiptResponse) => `${record.customerCode} - ${record.customerName}`,
    },
    {
      title: '发票号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string | null) => invoiceNo || '-',
    },
    {
      title: '收款日期',
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ReceiptStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '收款金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: PaymentMethod) => paymentMethodText[method],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '凭证',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (voucherNo: string | null, record: ReceiptResponse) => {
        if (voucherNo && record.voucherId) {
          return (
            <Space>
              <Badge status="processing" />
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => (window.location.href = `/finance/voucher-list?voucherId=${record.voucherId}`)}
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
      render: (_: any, record: ReceiptResponse) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确认删除"
                description={`确定要删除收款单 "${record.receiptNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认收款
              </Button>
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const fetchReceipts = async (page = 1, limit = 10, search = searchText, tab = activeTab, f = filters, s = sortParam) => {
    setLoading(true);
    try {
      const queryParams: any = {
        page,
        limit,
        sortBy: s.sortBy,
        sortOrder: s.sortOrder,
        search,
        filters: { ...f }
      };

      if (tab !== 'ALL') {
        queryParams.filters.status = tab;
      }

      const result = await salesApi.getReceipts(queryParams);
      setReceipts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取收款单列表失败:', error);
      message.error('获取收款单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    try {
      const counts = await salesApi.getReceiptStatusCounts();
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

  const fetchIssuedInvoices = async () => {
    try {
      // 获取发票列表（已开具或部分付款）
      const result = await salesApi.getSalesInvoices({ limit: 1000 });
      const issued = result.data.filter(inv => inv.status === 'ISSUED' || inv.status === 'PAID');
      setInvoices(issued);
    } catch (error) {
      console.error('获取发票列表失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchCustomers();
    fetchIssuedInvoices();
    loadStatusCounts();
    fetchReceipts(1, pagination.limit);
  }, []);

  const handleTableChange = (pag: any, _filters: any, sorter: any) => {
    const sortParams = {
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    };
    setSortParam(sortParams);
    fetchReceipts(pag.current, pag.pageSize, searchText, activeTab, filters, sortParams);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchReceipts(1, pagination.limit, searchText, key, filters, sortParam);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchReceipts(1, pagination.limit, value, activeTab, filters, sortParam);
  };

  const handleFilterChange = (changedValues: any, allValues: any) => {
    const newFilters = {
      customerId: allValues.customerId,
      startDate: allValues.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: allValues.dateRange?.[1]?.format('YYYY-MM-DD'),
    };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    fetchReceipts(1, pagination.limit, searchText, activeTab, filters, sortParam);
  };

  const resetFilters = () => {
    setFilters({});
    setSearchText('');
    fetchReceipts(1, pagination.limit, '', activeTab, {}, sortParam);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const receiptData: CreateReceiptDto = {
        customerId: values.customerId,
        invoiceId: values.invoiceId || undefined,
        receiptDate: values.receiptDate ? values.receiptDate.toDate() : undefined,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
      };
      setLoading(true);
      if (editingReceipt) {
        await salesApi.updateReceipt(editingReceipt.id, receiptData);
        message.success('收款单更新成功');
      } else {
        await salesApi.createReceipt(receiptData);
        message.success('收款单创建成功');
      }
      setModalVisible(false);
      fetchReceipts(pagination.page, pagination.limit);
      loadStatusCounts();
    } catch (error) {
      console.error('保存收款单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (receipt: ReceiptResponse) => {
    if (receipt.status !== 'PENDING') {
      message.warning('只能编辑待处理状态的收款单');
      return;
    }
    setEditingReceipt(receipt);
    form.setFieldsValue({
      customerId: receipt.customerId,
      invoiceId: receipt.invoiceId || undefined,
      receiptDate: receipt.receiptDate ? dayjs(receipt.receiptDate) : undefined,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
    });
    setModalVisible(true);
  };

  const handleView = (receipt: ReceiptResponse) => {
    setViewingReceipt(receipt);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.deleteReceipt(id);
      message.success('收款单删除成功');
      fetchReceipts(pagination.page, pagination.limit);
      loadStatusCounts();
    } catch (error) {
      console.error('删除收款单失败:', error);
      message.error('删除收款单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.confirmReceipt(id);
      message.success('收款确认成功');
      fetchReceipts(pagination.page, pagination.limit);
      loadStatusCounts();
    } catch (error) {
      console.error('确认收款失败:', error);
      message.error('确认收款失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.cancelReceipt(id);
      message.success('收款单取消成功');
      fetchReceipts(pagination.page, pagination.limit);
      loadStatusCounts();
    } catch (error) {
      console.error('取消收款单失败:', error);
      message.error('取消收款单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customerInvoices = invoices.filter(invoice => invoice.customerId === customerId);
    setInvoices(customerInvoices);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>收款管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingReceipt(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增收款单
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form layout="inline" onValuesChange={handleFilterChange}>
          <Form.Item name="customerId" label="客户" style={{ marginBottom: 8 }}>
            <Select
              allowClear
              showSearch
              placeholder="请选择客户"
              style={{ width: 200 }}
              filterOption={(input, option: any) => 
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.code} - {c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="收款日期" style={{ marginBottom: 8 }}>
            <RangePicker />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Input
              placeholder="搜索单据号..."
              allowClear
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => applyFilters()}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 8 }}>
            <Space>
              <Button type="primary" onClick={applyFilters}>查询</Button>
              <Button onClick={resetFilters} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ITEMS.map(item => ({
             key: item.key,
             label: (
               <span>
                 {item.label}
                 <Badge
                    count={statusCounts[item.key] || 0}
                    style={{ backgroundColor: item.key === 'ALL' ? '#52c41a' : '#1890ff', marginLeft: 8 }}
                 />
               </span>
             )
          }))}
          style={{ padding: '0 16px' }}
        />
        <Table
          columns={columns}
          dataSource={receipts}
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

      <Modal
        title={editingReceipt ? "编辑收款单" : "新增收款单"}
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
            label="客户"
            name="customerId"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              placeholder="请选择客户"
              disabled={!!editingReceipt}
              onChange={handleCustomerChange}
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="发票"
            name="invoiceId"
          >
            <Select placeholder="请选择发票（可选）" disabled={!!editingReceipt}>
              <Option value="">不关联发票</Option>
              {/* @ts-ignore */}
              {invoices.map(invoice => (
                <Option key={invoice.id} value={invoice.id}>
                  {/* @ts-ignore */}
                  {invoice.invoiceNo} - ¥{invoice.amount.toFixed(2)} (剩余: ¥{(invoice.amount - (invoice.receipts?.reduce((sum, r) => sum + r.amount, 0) || 0)).toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="收款日期"
            name="receiptDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="收款金额"
            name="amount"
            rules={[{ required: true, message: '请输入收款金额' }]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="请输入收款金额"
            />
          </Form.Item>
          <Form.Item
            label="支付方式"
            name="paymentMethod"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              {Object.entries(paymentMethodText).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="查看收款单"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingReceipt && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>收款单号:</Typography.Text>
                <div>{viewingReceipt.receiptNo}</div>
              </div>
              <div>
                <Typography.Text strong>客户:</Typography.Text>
                <div>{viewingReceipt.customerCode} - {viewingReceipt.customerName}</div>
              </div>
              <div>
                <Typography.Text strong>发票号:</Typography.Text>
                <div>{viewingReceipt.invoiceNo || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>收款日期:</Typography.Text>
                <div>{dayjs(viewingReceipt.receiptDate).format('YYYY-MM-DD')}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingReceipt.status]}>{statusText[viewingReceipt.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>收款金额:</Typography.Text>
                <div>¥{viewingReceipt.amount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>支付方式:</Typography.Text>
                <div>{paymentMethodText[viewingReceipt.paymentMethod]}</div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{dayjs(viewingReceipt.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
              </div>
              {viewingReceipt.voucherNo && (
                <div style={{ gridColumn: '1 / 3' }}>
                    <Typography.Text strong>关联凭证:</Typography.Text>
                    <div>
                    <Button type="link" onClick={() => (window.location.href = `/finance/voucher-list?voucherId=${viewingReceipt.voucherId}`)}>
                        {viewingReceipt.voucherNo}
                    </Button>
                    </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptList;