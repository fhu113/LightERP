import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { paymentApi } from '../../services/payment.api';
import { masterApi } from '../../services/master.api';
import { PaymentResponse, PaymentStatus, PaymentMethod, CreatePaymentDto, PaginatedResult, Supplier } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentResponse | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<PaymentStatus, string> = {
    PENDING: 'processing',
    PAID: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<PaymentStatus, string> = {
    PENDING: '待付款',
    PAID: '已付款',
    CANCELLED: '已取消',
  };

  // 付款方式映射
  const paymentMethodText: Record<PaymentMethod, string> = {
    CASH: '现金',
    BANK_TRANSFER: '银行转账',
    CHECK: '支票',
    CREDIT_CARD: '信用卡',
  };

  const columns = [
    {
      title: '付款单号',
      dataIndex: 'paymentNo',
      key: 'paymentNo',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (_: any, record: PaymentResponse) => `${record.supplierCode} - ${record.supplierName}`,
    },
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string) => invoiceNo || '-',
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: PaymentMethod) => paymentMethodText[method],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PaymentStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (voucherNo: string | null, record: PaymentResponse) => voucherNo ? (
        <a onClick={() => navigate(`/finance/voucher-list?voucherId=${record.voucherId}`)}>{voucherNo}</a>
      ) : '-',
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
      render: (_: any, record: PaymentResponse) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Popconfirm
                title="确认删除"
                description={`确定要删除付款单 "${record.paymentNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认付款
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

  const fetchPayments = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<PaymentResponse> = await paymentApi.getPayments({
        page,
        limit,
      });
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取付款单列表失败:', error);
      message.error('获取付款单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesForPayment = async () => {
    try {
      const result = await paymentApi.getInvoicesForPayment();
      setInvoices(result);
    } catch (error) {
      console.error('获取可付款发票列表失败:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await masterApi.getSuppliers({ limit: 1000 });
      setSuppliers(result.data);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const paymentData: CreatePaymentDto = {
        supplierId: values.supplierId,
        invoiceId: values.invoiceId || undefined,
        paymentDate: values.paymentDate ? values.paymentDate.toDate() : undefined,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
      };
      setLoading(true);
      await paymentApi.createPayment(paymentData);
      message.success('付款单创建成功');
      setModalVisible(false);
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存付款单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (payment: PaymentResponse) => {
    setViewingPayment(payment);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await paymentApi.deletePayment(id);
      message.success('付款单删除成功');
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除付款单失败:', error);
      message.error('删除付款单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await paymentApi.confirmPayment(id);
      message.success('付款确认成功');
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      console.error('确认付款失败:', error);
      message.error('确认付款失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await paymentApi.cancelPayment(id);
      message.success('付款单取消成功');
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消付款失败:', error);
      message.error('取消付款失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    setSelectedInvoice(invoice || null);
    if (invoice) {
      form.setFieldsValue({
        supplierId: invoice.supplierId,
        amount: invoice.remainingAmount,
      });
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    // 筛选该供应商的发票
    const supplierInvoices = invoices.filter(inv => inv.supplierId === supplierId);
    setInvoices([...supplierInvoices]);
  };

  useEffect(() => {
    fetchPayments();
    fetchInvoicesForPayment();
    fetchSuppliers();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchPayments(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>付款管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          form.resetFields();
          setSelectedInvoice(null);
          setModalVisible(true);
        }}>
          新增付款单
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={payments}
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

      {/* 新增付款单模态框 */}
      <Modal
        title="新增付款单"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="供应商"
            name="supplierId"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="请选择供应商" onChange={handleSupplierChange}>
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.code} - {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="关联发票（可选）"
            name="invoiceId"
          >
            <Select
              placeholder="请选择发票（可选）"
              onChange={handleInvoiceChange}
              allowClear
            >
              {invoices.map(invoice => (
                <Option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNo} - ¥{invoice.remainingAmount?.toFixed(2)} (待付)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="付款日期"
            name="paymentDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="付款金额"
            name="amount"
            rules={[{ required: true, message: '请输入付款金额' }]}
          >
            <InputNumber
              placeholder="请输入付款金额"
              min={0.01}
              step={100}
              style={{ width: '100%' }}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            label="付款方式"
            name="paymentMethod"
            rules={[{ required: true, message: '请选择付款方式' }]}
          >
            <Select placeholder="请选择付款方式">
              <Option value="CASH">现金</Option>
              <Option value="BANK_TRANSFER">银行转账</Option>
              <Option value="CHECK">支票</Option>
              <Option value="CREDIT_CARD">信用卡</Option>
            </Select>
          </Form.Item>
          {selectedInvoice && (
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
              <Typography.Text strong>发票信息:</Typography.Text>
              <div>发票号: {selectedInvoice.invoiceNo}</div>
              <div>发票金额: ¥{selectedInvoice.amount?.toFixed(2)}</div>
              <div>已付金额: ¥{selectedInvoice.paidAmount?.toFixed(2)}</div>
              <div>剩余金额: ¥{selectedInvoice.remainingAmount?.toFixed(2)}</div>
            </div>
          )}
        </Form>
      </Modal>

      {/* 查看付款单模态框 */}
      <Modal
        title="查看付款单"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingPayment && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>付款单号:</Typography.Text>
                <div>{viewingPayment.paymentNo}</div>
              </div>
              <div>
                <Typography.Text strong>供应商:</Typography.Text>
                <div>{viewingPayment.supplierCode} - {viewingPayment.supplierName}</div>
              </div>
              <div>
                <Typography.Text strong>发票编号:</Typography.Text>
                <div>{viewingPayment.invoiceNo || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>付款日期:</Typography.Text>
                <div>{new Date(viewingPayment.paymentDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>付款金额:</Typography.Text>
                <div>¥{viewingPayment.amount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>付款方式:</Typography.Text>
                <div>{paymentMethodText[viewingPayment.paymentMethod]}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingPayment.status]}>{statusText[viewingPayment.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>凭证号:</Typography.Text>
                <div>{viewingPayment.voucherNo || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingPayment.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentList;
