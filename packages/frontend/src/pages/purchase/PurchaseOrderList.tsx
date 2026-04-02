import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { purchaseApi } from '../../services/purchase.api';
import { masterApi } from '../../services/master.api';
import { taxCodeApi, TaxCode } from '../../services/tax-code.api';
import { PurchaseOrderResponse, PurchaseOrderStatus, CreatePurchaseOrderDto, PurchaseOrderItemDto, PaginatedResult, Supplier, Material } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const PurchaseOrderList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrderResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrderResponse | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [form] = Form.useForm();
  const [items, setItems] = useState<PurchaseOrderItemDto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<PurchaseOrderStatus, string> = {
    DRAFT: 'default',
    CONFIRMED: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<PurchaseOrderStatus, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '采购订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (_: any, record: PurchaseOrderResponse) => `${record.supplierCode} - ${record.supplierName}`,
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '期望到货日期',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PurchaseOrderStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
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
      render: (_: any, record: PurchaseOrderResponse) => (
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
                description={`确定要删除采购订单 "${record.orderNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认订单
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

  const fetchPurchaseOrders = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<PurchaseOrderResponse> = await purchaseApi.getPurchaseOrders({
        page,
        limit,
      });
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取采购订单列表失败:', error);
      message.error('获取采购订单列表失败');
    } finally {
      setLoading(false);
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
      // 采购订单使用进项税
      const result = await taxCodeApi.getAll('INPUT');
      setTaxCodes(result);
    } catch (error) {
      console.error('获取税码失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const orderData: CreatePurchaseOrderDto = {
        supplierId: values.supplierId,
        orderDate: values.orderDate ? values.orderDate.toDate() : undefined,
        expectedDate: values.expectedDate ? values.expectedDate.toDate() : undefined,
        items: items,
      };
      setLoading(true);
      if (editingOrder) {
        await purchaseApi.updatePurchaseOrder(editingOrder.id, orderData);
        message.success('采购订单更新成功');
      } else {
        await purchaseApi.createPurchaseOrder(orderData);
        message.success('采购订单创建成功');
      }
      setModalVisible(false);
      fetchPurchaseOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存采购订单失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: PurchaseOrderResponse) => {
    if (order.status !== 'DRAFT') {
      message.warning('只能编辑草稿状态的采购订单');
      return;
    }
    setEditingOrder(order);
    form.setFieldsValue({
      supplierId: order.supplierId,
      orderDate: order.orderDate ? new Date(order.orderDate) : undefined,
      expectedDate: order.expectedDate ? new Date(order.expectedDate) : undefined,
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

  const handleView = (order: PurchaseOrderResponse) => {
    setViewingOrder(order);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await purchaseApi.deletePurchaseOrder(id);
      message.success('采购订单删除成功');
      fetchPurchaseOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除采购订单失败:', error);
      message.error('删除采购订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await purchaseApi.confirmPurchaseOrder(id);
      message.success('采购订单确认成功');
      fetchPurchaseOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('确认采购订单失败:', error);
      message.error('确认采购订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await purchaseApi.cancelPurchaseOrder(id);
      message.success('采购订单取消成功');
      fetchPurchaseOrders(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消采购订单失败:', error);
      message.error('取消采购订单失败');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 1, unitPrice: 0, taxRate: 0, taxAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
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

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchMaterials();
    fetchTaxCodes();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchPurchaseOrders(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>采购订单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingOrder(null);
          form.resetFields();
          setItems([]);
          setModalVisible(true);
        }}>
          新增采购订单
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

      {/* 新增/编辑采购订单模态框 */}
      <Modal
        title={editingOrder ? "编辑采购订单" : "新增采购订单"}
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
            label="供应商"
            name="supplierId"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select
              placeholder="请选择供应商"
              disabled={!!editingOrder}
            >
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.code} - {supplier.name}
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
            label="期望到货日期"
            name="expectedDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Typography.Text strong>采购物料明细</Typography.Text>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                添加物料
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <Select
                  placeholder="选择物料"
                  style={{ flex: 2 }}
                  value={item.materialId}
                  onChange={(value) => updateItem(index, 'materialId', value)}
                  disabled={!!editingOrder}
                >
                  {materials.map(material => (
                    <Option key={material.id} value={material.id}>
                      {material.code} - {material.name} (¥{material.costPrice.toFixed(2)})
                    </Option>
                  ))}
                </Select>
                <InputNumber
                  placeholder="数量"
                  min={0.01}
                  step={1}
                  style={{ flex: 1 }}
                  value={item.quantity}
                  onChange={(value) => updateItem(index, 'quantity', value)}
                />
                <InputNumber
                  placeholder="单价"
                  min={0}
                  step={0.01}
                  style={{ flex: 1 }}
                  value={item.unitPrice}
                  onChange={(value) => updateItem(index, 'unitPrice', value)}
                />
                <Select
                  placeholder="税码"
                  style={{ width: 100 }}
                  value={item.taxRate}
                  onChange={(value) => updateItem(index, 'taxRate', value)}
                  disabled={!!editingOrder}
                  allowClear
                >
                  {taxCodes.map(tax => (
                    <Option key={tax.id} value={tax.rate}>
                      {tax.name} ({(tax.rate * 100).toFixed(0)}%)
                    </Option>
                  ))}
                </Select>
                <Typography.Text type="secondary" style={{ minWidth: 60 }}>
                  ¥{(item.taxAmount || 0).toFixed(2)}
                </Typography.Text>
                <Button type="text" danger onClick={() => removeItem(index)} disabled={!!editingOrder}>
                  删除
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <Typography.Text type="secondary">请至少添加一个物料</Typography.Text>
            )}
          </div>
        </Form>
      </Modal>

      {/* 查看采购订单模态框 */}
      <Modal
        title="查看采购订单"
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
                <Typography.Text strong>采购订单编号:</Typography.Text>
                <div>{viewingOrder.orderNo}</div>
              </div>
              <div>
                <Typography.Text strong>供应商:</Typography.Text>
                <div>{viewingOrder.supplierCode} - {viewingOrder.supplierName}</div>
              </div>
              <div>
                <Typography.Text strong>订单日期:</Typography.Text>
                <div>{new Date(viewingOrder.orderDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>期望到货日期:</Typography.Text>
                <div>{viewingOrder.expectedDate ? new Date(viewingOrder.expectedDate).toLocaleDateString('zh-CN') : '-'}</div>
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
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingOrder.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>更新时间:</Typography.Text>
                <div>{new Date(viewingOrder.updatedAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            <Typography.Text strong>物料明细:</Typography.Text>
            <Table
              dataSource={viewingOrder.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
                { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (value) => `¥${value.toFixed(2)}` },
                { title: '金额', dataIndex: 'amount', key: 'amount', render: (value) => `¥${value.toFixed(2)}` },
                { title: '已收货数量', dataIndex: 'receivedQuantity', key: 'receivedQuantity', render: (value) => value.toFixed(2) },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderList;