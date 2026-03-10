import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { salesApi } from '../../services/sales.api';
import { masterApi } from '../../services/master.api';
import { ReceiptResponse, ReceiptStatus, PaymentMethod, CreateReceiptDto, PaginatedResult, Customer, SalesInvoiceResponse } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const ReceiptList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptResponse[]>([]);
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

  const columns = [
    {
      title: '收款单号',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
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
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
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
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
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
            </>
          )}
          {record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fetchReceipts = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<ReceiptResponse> = await salesApi.getReceipts({
        page,
        limit,
      });
      setReceipts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取收款单列表失败:', error);
      message.error('获取收款单列表失败');
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

  const fetchIssuedInvoices = async () => {
    try {
      // 只获取已开具的发票（可以收款的发票）
      const result = await salesApi.getSalesInvoices({
        limit: 1000,
      });
      // 过滤已开具和已部分付款的发票
      const issuedInvoices = result.data.filter(
        invoice => invoice.status === 'ISSUED' || invoice.status === 'PAID'
      );
      setInvoices(issuedInvoices);
    } catch (error) {
      console.error('获取发票列表失败:', error);
      message.error('获取发票列表失败');
    }
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
    } catch (error) {
      console.error('保存收款单失败:', error);
      // 错误信息已由表单验证或API拦截器处理
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
      receiptDate: receipt.receiptDate ? new Date(receipt.receiptDate) : undefined,
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
    } catch (error) {
      console.error('取消收款单失败:', error);
      message.error('取消收款单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    // 当客户改变时，只显示该客户的发票
    const customerInvoices = invoices.filter(invoice => invoice.customerId === customerId);
    // 更新发票选择列表
    setInvoices(customerInvoices);
  };

  useEffect(() => {
    fetchReceipts();
    fetchCustomers();
    fetchIssuedInvoices();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchReceipts(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>收款管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingReceipt(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新增收款单
        </Button>
      </div>

      <Card>
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

      {/* 新增/编辑收款单模态框 */}
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
              {invoices.map(invoice => (
                <Option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNo} - ¥{invoice.amount.toFixed(2)} (剩余: ¥{(invoice.amount - invoice.receipts.reduce((sum, r) => sum + r.amount, 0)).toFixed(2)})
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

      {/* 查看收款单模态框 */}
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
                <div>{new Date(viewingReceipt.receiptDate).toLocaleDateString('zh-CN')}</div>
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
                <div>{new Date(viewingReceipt.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptList;