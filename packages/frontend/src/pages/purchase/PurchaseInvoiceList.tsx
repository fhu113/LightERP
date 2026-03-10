import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { purchaseInvoiceApi } from '../../services/purchase-invoice.api';
import { purchaseReceiptApi } from '../../services/purchase-receipt.api';
import { masterApi } from '../../services/master.api';
import { PurchaseInvoiceResponse, PurchaseInvoiceStatus, CreatePurchaseInvoiceDto, PaginatedResult, PurchaseReceiptResponse, Supplier } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const PurchaseInvoiceList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<PurchaseInvoiceResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoiceResponse | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<PurchaseInvoiceStatus, string> = {
    DRAFT: 'default',
    ISSUED: 'processing',
    PAID: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<PurchaseInvoiceStatus, string> = {
    DRAFT: '草稿',
    ISSUED: '已开票',
    PAID: '已付款',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (_: any, record: PurchaseInvoiceResponse) => `${record.supplierCode} - ${record.supplierName}`,
    },
    {
      title: '收货单号',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
      render: (receiptNo: string) => receiptNo || '-',
    },
    {
      title: '发票日期',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (taxAmount: number) => `¥${taxAmount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PurchaseInvoiceStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
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
      render: (_: any, record: PurchaseInvoiceResponse) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Popconfirm
                title="确认删除"
                description={`确定要删除发票 "${record.invoiceNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认开票
              </Button>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fetchInvoices = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<PurchaseInvoiceResponse> = await purchaseInvoiceApi.getPurchaseInvoices({
        page,
        limit,
      });
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取采购发票列表失败:', error);
      message.error('获取采购发票列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsForInvoicing = async () => {
    try {
      const result = await purchaseInvoiceApi.getReceiptsForInvoicing();
      setReceipts(result);
    } catch (error) {
      console.error('获取收货单列表失败:', error);
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
      const invoiceData: CreatePurchaseInvoiceDto = {
        supplierId: values.supplierId,
        receiptId: values.receiptId,
        invoiceDate: values.invoiceDate ? values.invoiceDate.toDate() : undefined,
        items: selectedReceipt?.items?.map((item: any) => ({
          receiptItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      };
      setLoading(true);
      await purchaseInvoiceApi.createPurchaseInvoice(invoiceData);
      message.success('采购发票创建成功');
      setModalVisible(false);
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存采购发票失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (invoice: PurchaseInvoiceResponse) => {
    setViewingInvoice(invoice);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await purchaseInvoiceApi.deletePurchaseInvoice(id);
      message.success('采购发票删除成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除采购发票失败:', error);
      message.error('删除采购发票失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await purchaseInvoiceApi.confirmPurchaseInvoice(id);
      message.success('采购发票确认成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('确认采购发票失败:', error);
      message.error('确认采购发票失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await purchaseInvoiceApi.cancelPurchaseInvoice(id);
      message.success('采购发票取消成功');
      fetchInvoices(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消采购发票失败:', error);
      message.error('取消采购发票失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptChange = (receiptId: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    setSelectedReceipt(receipt || null);
    if (receipt) {
      form.setFieldsValue({ supplierId: receipt.supplierId });
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchReceiptsForInvoicing();
    fetchSuppliers();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchInvoices(pagination.current, pagination.pageSize);
  };

  // 计算总金额
  const totalAmount = selectedReceipt?.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
  const taxAmount = totalAmount * 0.13;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>采购发票管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          form.resetFields();
          setSelectedReceipt(null);
          setModalVisible(true);
        }}>
          新增发票
        </Button>
      </div>

      <Card>
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
        />
      </Card>

      {/* 新增采购发票模态框 */}
      <Modal
        title="新增采购发票"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="收货单"
            name="receiptId"
            rules={[{ required: true, message: '请选择收货单' }]}
          >
            <Select
              placeholder="请选择收货单"
              onChange={handleReceiptChange}
            >
              {receipts.map(receipt => (
                <Option key={receipt.id} value={receipt.id}>
                  {receipt.receiptNo} - {receipt.supplierName} (¥{receipt.amount?.toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="供应商"
            name="supplierId"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="请选择供应商">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.code} - {supplier.name}
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
          {selectedReceipt && (
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>收货物料明细:</Typography.Text>
              <Table
                dataSource={selectedReceipt.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                  { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
                  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (value) => `¥${value.toFixed(2)}` },
                  { title: '金额', dataIndex: 'amount', key: 'amount', render: (value) => `¥${value.toFixed(2)}` },
                ]}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong>合计</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>¥{totalAmount.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong>税额 (13%)</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>¥{taxAmount.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          )}
        </Form>
      </Modal>

      {/* 查看采购发票模态框 */}
      <Modal
        title="查看采购发票"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {viewingInvoice && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>发票编号:</Typography.Text>
                <div>{viewingInvoice.invoiceNo}</div>
              </div>
              <div>
                <Typography.Text strong>供应商:</Typography.Text>
                <div>{viewingInvoice.supplierCode} - {viewingInvoice.supplierName}</div>
              </div>
              <div>
                <Typography.Text strong>收货单号:</Typography.Text>
                <div>{viewingInvoice.receiptNo || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>发票日期:</Typography.Text>
                <div>{new Date(viewingInvoice.invoiceDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>金额:</Typography.Text>
                <div>¥{viewingInvoice.amount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>税额:</Typography.Text>
                <div>¥{viewingInvoice.taxAmount.toFixed(2)}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingInvoice.status]}>{statusText[viewingInvoice.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingInvoice.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseInvoiceList;
