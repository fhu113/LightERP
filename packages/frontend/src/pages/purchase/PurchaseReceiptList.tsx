import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, message, Tag, Modal, Form, DatePicker, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { purchaseReceiptApi } from '../../services/purchase-receipt.api';
import { purchaseApi } from '../../services/purchase.api';
import { masterApi } from '../../services/master.api';
import { PurchaseReceiptResponse, PurchaseReceiptStatus, CreatePurchaseReceiptDto, PurchaseReceiptItemDto, PaginatedResult, PurchaseOrderResponse, Material } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const PurchaseReceiptList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<PurchaseReceiptResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<PurchaseReceiptResponse | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<PurchaseReceiptResponse | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderResponse | null>(null);
  const [form] = Form.useForm();
  const [items, setItems] = useState<PurchaseReceiptItemDto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 状态标签颜色映射
  const statusColor: Record<PurchaseReceiptStatus, string> = {
    DRAFT: 'default',
    CONFIRMED: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };

  // 状态标签文本映射
  const statusText: Record<PurchaseReceiptStatus, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  const columns = [
    {
      title: '收货单号',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
    },
    {
      title: '采购订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (_: any, record: PurchaseReceiptResponse) => record.orderNo,
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (_: any, record: PurchaseReceiptResponse) => `${record.supplierCode} - ${record.supplierName}`,
    },
    {
      title: '收货日期',
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PurchaseReceiptStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
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
      render: (_: any, record: PurchaseReceiptResponse) => (
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
                description={`确定要删除收货单 "${record.receiptNo}" 吗？`}
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
                确认收货
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

  const fetchPurchaseReceipts = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: PaginatedResult<PurchaseReceiptResponse> = await purchaseReceiptApi.getPurchaseReceipts({
        page,
        limit,
      });
      setReceipts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取采购收货单列表失败:', error);
      message.error('获取采购收货单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedOrders = async () => {
    try {
      const result = await purchaseApi.getPurchaseOrders({ limit: 1000 });
      // 只显示已确认的采购订单
      const confirmedOrders = result.data.filter(order => order.status === 'CONFIRMED');
      setOrders(confirmedOrders);
    } catch (error) {
      console.error('获取采购订单列表失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const receiptData: CreatePurchaseReceiptDto = {
        orderId: values.orderId,
        receiptDate: values.receiptDate ? values.receiptDate.toDate() : undefined,
        warehouseId: values.warehouseId,
        items: items,
      };
      setLoading(true);
      if (editingReceipt) {
        await purchaseReceiptApi.updatePurchaseReceipt(editingReceipt.id, receiptData);
        message.success('采购收货单更新成功');
      } else {
        await purchaseReceiptApi.createPurchaseReceipt(receiptData);
        message.success('采购收货单创建成功');
      }
      setModalVisible(false);
      fetchPurchaseReceipts(pagination.page, pagination.limit);
    } catch (error) {
      console.error('保存采购收货单失败:', error);
      // 错误信息已由表单验证或API拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (receipt: PurchaseReceiptResponse) => {
    if (receipt.status !== 'DRAFT') {
      message.warning('只能编辑草稿状态的采购收货单');
      return;
    }
    setEditingReceipt(receipt);
    form.setFieldsValue({
      orderId: receipt.orderId,
      receiptDate: receipt.receiptDate ? new Date(receipt.receiptDate) : undefined,
      warehouseId: receipt.warehouseId,
    });
    setItems(receipt.items.map(item => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity,
    })));
    // 加载订单信息
    const order = orders.find(o => o.id === receipt.orderId);
    setSelectedOrder(order || null);
    setModalVisible(true);
  };

  const handleView = (receipt: PurchaseReceiptResponse) => {
    setViewingReceipt(receipt);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await purchaseReceiptApi.deletePurchaseReceipt(id);
      message.success('采购收货单删除成功');
      fetchPurchaseReceipts(pagination.page, pagination.limit);
    } catch (error) {
      console.error('删除采购收货单失败:', error);
      message.error('删除采购收货单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setLoading(true);
      await purchaseReceiptApi.confirmPurchaseReceipt(id);
      message.success('采购收货确认成功');
      fetchPurchaseReceipts(pagination.page, pagination.limit);
      // 重新加载订单列表（状态可能已改变）
      fetchConfirmedOrders();
    } catch (error) {
      console.error('确认采购收货失败:', error);
      message.error('确认采购收货失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      await purchaseReceiptApi.cancelPurchaseReceipt(id);
      message.success('采购收货单取消成功');
      fetchPurchaseReceipts(pagination.page, pagination.limit);
    } catch (error) {
      console.error('取消采购收货单失败:', error);
      message.error('取消采购收货单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    // 重置收货明细
    setItems([]);
  };

  const addItem = () => {
    if (!selectedOrder) {
      message.warning('请先选择采购订单');
      return;
    }
    // 默认添加第一个可收货的订单项
    const orderItem = selectedOrder.items.find(item => item.receivedQuantity < item.quantity);
    if (orderItem) {
      const maxReceivable = orderItem.quantity - orderItem.receivedQuantity;
      setItems([...items, { orderItemId: orderItem.id, quantity: maxReceivable }]);
    } else {
      message.warning('该订单没有可收货的物料');
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  useEffect(() => {
    fetchPurchaseReceipts();
    fetchConfirmedOrders();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchPurchaseReceipts(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>采购收货管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingReceipt(null);
          form.resetFields();
          setItems([]);
          setSelectedOrder(null);
          setModalVisible(true);
        }}>
          新增收货单
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

      {/* 新增/编辑采购收货单模态框 */}
      <Modal
        title={editingReceipt ? "编辑采购收货单" : "新增采购收货单"}
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
            label="采购订单"
            name="orderId"
            rules={[{ required: true, message: '请选择采购订单' }]}
          >
            <Select
              placeholder="请选择采购订单"
              onChange={handleOrderChange}
              disabled={!!editingReceipt}
            >
              {orders.map(order => (
                <Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.supplierName} (¥{order.totalAmount.toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedOrder && (
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>订单物料明细:</Typography.Text>
              <Table
                dataSource={selectedOrder.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                  { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                  { title: '订单数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
                  { title: '已收货数量', dataIndex: 'receivedQuantity', key: 'receivedQuantity', render: (value) => value.toFixed(2) },
                  { title: '可收货数量', key: 'receivable', render: (_: any, record: any) => (record.quantity - record.receivedQuantity).toFixed(2) },
                ]}
              />
            </div>
          )}
          <Form.Item
            label="收货日期"
            name="receiptDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="仓库"
            name="warehouseId"
          >
            <Select placeholder="请选择仓库（可选）">
              {/* 仓库选项待实现 */}
              <Option value="WH001">主仓库</Option>
              <Option value="WH002">备件仓库</Option>
            </Select>
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Typography.Text strong>收货物料明细</Typography.Text>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                添加物料
              </Button>
            </div>
            {items.map((item, index) => {
              const orderItem = selectedOrder?.items.find(oi => oi.id === item.orderItemId);
              const maxReceivable = orderItem ? orderItem.quantity - orderItem.receivedQuantity : 0;
              return (
                <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <Select
                    placeholder="选择订单物料"
                    style={{ flex: 2 }}
                    value={item.orderItemId}
                    onChange={(value) => updateItem(index, 'orderItemId', value)}
                    disabled={!!editingReceipt}
                  >
                    {selectedOrder?.items
                      .filter(oi => oi.receivedQuantity < oi.quantity)
                      .map(oi => (
                        <Option key={oi.id} value={oi.id}>
                          {oi.materialCode} - {oi.materialName} (可收: {(oi.quantity - oi.receivedQuantity).toFixed(2)})
                        </Option>
                      ))}
                  </Select>
                  <InputNumber
                    placeholder="收货数量"
                    min={0.01}
                    max={maxReceivable}
                    step={1}
                    style={{ flex: 1 }}
                    value={item.quantity}
                    onChange={(value) => updateItem(index, 'quantity', value)}
                  />
                  <Button type="text" danger onClick={() => removeItem(index)} disabled={!!editingReceipt}>
                    删除
                  </Button>
                </div>
              );
            })}
            {items.length === 0 && (
              <Typography.Text type="secondary">请至少添加一个收货物料</Typography.Text>
            )}
          </div>
        </Form>
      </Modal>

      {/* 查看采购收货单模态框 */}
      <Modal
        title="查看采购收货单"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {viewingReceipt && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Typography.Text strong>收货单号:</Typography.Text>
                <div>{viewingReceipt.receiptNo}</div>
              </div>
              <div>
                <Typography.Text strong>采购订单:</Typography.Text>
                <div>{viewingReceipt.orderNo}</div>
              </div>
              <div>
                <Typography.Text strong>供应商:</Typography.Text>
                <div>{viewingReceipt.supplierCode} - {viewingReceipt.supplierName}</div>
              </div>
              <div>
                <Typography.Text strong>收货日期:</Typography.Text>
                <div>{new Date(viewingReceipt.receiptDate).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>仓库:</Typography.Text>
                <div>{viewingReceipt.warehouseId || '-'}</div>
              </div>
              <div>
                <Typography.Text strong>状态:</Typography.Text>
                <div><Tag color={statusColor[viewingReceipt.status]}>{statusText[viewingReceipt.status]}</Tag></div>
              </div>
              <div>
                <Typography.Text strong>创建时间:</Typography.Text>
                <div>{new Date(viewingReceipt.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              <div>
                <Typography.Text strong>更新时间:</Typography.Text>
                <div>{new Date(viewingReceipt.updatedAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            <Typography.Text strong>收货物料明细:</Typography.Text>
            <Table
              dataSource={viewingReceipt.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                { title: '收货数量', dataIndex: 'quantity', key: 'quantity', render: (value) => value.toFixed(2) },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseReceiptList;