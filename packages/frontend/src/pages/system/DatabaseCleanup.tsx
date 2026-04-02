import React, { useState } from 'react';
import { Card, Button, message, Modal, Divider, Alert, Typography, Descriptions, Space, Tag } from 'antd';
import { DeleteOutlined, WarningOutlined, DatabaseOutlined, SyncOutlined, InboxOutlined } from '@ant-design/icons';
import { cleanupApi } from '../../services/cleanup.api';

const { Title, Text } = Typography;

interface CleanupResult {
  salesOrders: number;
  salesOrderItems: number;
  deliveries: number;
  deliveryItems: number;
  salesInvoices: number;
  salesInvoiceItems: number;
  receipts: number;
  receiptItems: number;
  purchaseOrders: number;
  purchaseOrderItems: number;
  purchaseReceipts: number;
  purchaseReceiptItems: number;
  purchaseInvoices: number;
  purchaseInvoiceItems: number;
  payments: number;
  paymentItems: number;
  vouchers: number;
  voucherItems: number;
  inventoryTransactions: number;
}

interface CleanupResponse {
  otc: CleanupResult;
  ptp: CleanupResult;
  inventory: CleanupResult;
  total: {
    salesOrders: number;
    deliveries: number;
    salesInvoices: number;
    receipts: number;
    purchaseOrders: number;
    purchaseReceipts: number;
    purchaseInvoices: number;
    payments: number;
    vouchers: number;
    inventoryTransactions: number;
  };
}

interface InitInventoryResponse {
  inventoryTransactions: number;
  voucherItems: number;
  vouchers: number;
  materials: number;
}

const DatabaseCleanup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanupResponse | null>(null);
  const [initResult, setInitResult] = useState<InitInventoryResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [initModalVisible, setInitModalVisible] = useState(false);
  const [cleanupType, setCleanupType] = useState<'otc' | 'ptp' | 'inventory' | 'all'>('all');

  const handleCleanup = async (type: 'otc' | 'ptp' | 'inventory' | 'all') => {
    setCleanupType(type);
    setModalVisible(true);
  };

  const confirmCleanup = async () => {
    setLoading(true);
    try {
      let response;
      switch (cleanupType) {
        case 'otc':
          response = await cleanupApi.cleanupOTC();
          break;
        case 'ptp':
          response = await cleanupApi.cleanupPTP();
          break;
        case 'inventory':
          response = await cleanupApi.cleanupInventory();
          break;
        case 'all':
        default:
          response = await cleanupApi.cleanupAll();
          break;
      }
      setResult(response.data);
      message.success('数据清理完成');
    } catch (error: any) {
      console.error('清理数据失败:', error);
      message.error(error.response?.data?.error || '清理数据失败');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const handleInitInventory = () => {
    setInitModalVisible(true);
  };

  const confirmInitInventory = async () => {
    setLoading(true);
    try {
      const response = await cleanupApi.initInventory();
      setInitResult(response.data);
      message.success('库存初始化完成');
    } catch (error: any) {
      console.error('库存初始化失败:', error);
      message.error(error.response?.data?.error || '库存初始化失败');
    } finally {
      setLoading(false);
      setInitModalVisible(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'otc': return 'OTC销售单据';
      case 'ptp': return 'PTP采购单据';
      case 'inventory': return '库存调整单据';
      case 'all': return '所有业务单据';
      default: return type;
    }
  };

  const getWarningMessage = () => {
    switch (cleanupType) {
      case 'otc':
        return '此操作将删除所有销售订单、发货单、销售发票、收款单及其关联的凭证数据。此操作不可恢复！';
      case 'ptp':
        return '此操作将删除所有采购订单、采购收货单、采购发票、付款单及其关联的凭证数据。此操作不可恢复！';
      case 'inventory':
        return '此操作将删除所有库存调整记录及其关联的凭证数据。此操作不可恢复！';
      case 'all':
        return '此操作将删除所有业务单据（OTC + PTP + 库存调整）及其关联的凭证数据。此操作不可恢复！';
      default:
        return '';
    }
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <Card style={{ marginTop: 16 }} title="清理结果">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="销售订单">{result.total.salesOrders}</Descriptions.Item>
          <Descriptions.Item label="发货单">{result.total.deliveries}</Descriptions.Item>
          <Descriptions.Item label="销售发票">{result.total.salesInvoices}</Descriptions.Item>
          <Descriptions.Item label="收款单">{result.total.receipts}</Descriptions.Item>
          <Descriptions.Item label="采购订单">{result.total.purchaseOrders}</Descriptions.Item>
          <Descriptions.Item label="采购收货单">{result.total.purchaseReceipts}</Descriptions.Item>
          <Descriptions.Item label="采购发票">{result.total.purchaseInvoices}</Descriptions.Item>
          <Descriptions.Item label="付款单">{result.total.payments}</Descriptions.Item>
          <Descriptions.Item label="会计凭证">
            <Tag color="red">{result.total.vouchers}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="库存调整">{result.total.inventoryTransactions}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const renderInitResult = () => {
    if (!initResult) return null;

    return (
      <Card style={{ marginTop: 16 }} title="库存初始化结果">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="删除库存记录">{initResult.inventoryTransactions}</Descriptions.Item>
          <Descriptions.Item label="删除凭证分录">{initResult.voucherItems}</Descriptions.Item>
          <Descriptions.Item label="删除凭证">
            <Tag color="red">{initResult.vouchers}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="重置物料库存">{initResult.materials}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>数据库清理</span>
          </Space>
        }
        bordered={false}
      >
        <Alert
          message="危险操作警告"
          description="数据库清理功能将永久删除业务数据，此操作不可恢复。请谨慎操作！"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 库存初始化 */}
          <div>
            <Text strong style={{ fontSize: 16 }}>
              <Space>
                <InboxOutlined />
                <span>库存初始化</span>
              </Space>
            </Text>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              删除所有库存记录（出入库流水、调整记录）、关联的会计凭证，并将所有物料库存数量重置为0
            </Text>
            <br />
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleInitInventory}
              style={{ marginTop: 8 }}
            >
              库存初始化
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>清理OTC销售单据：</Text>
            <Text type="secondary">删除所有销售订单、发货单、销售发票、收款单及关联凭证</Text>
            <br />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCleanup('otc')}
              style={{ marginTop: 8 }}
            >
              清理OTC数据
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>清理PTP采购单据：</Text>
            <Text type="secondary">删除所有采购订单、采购收货单、采购发票、付款单及关联凭证</Text>
            <br />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCleanup('ptp')}
              style={{ marginTop: 8 }}
            >
              清理PTP数据
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>清理库存调整单据：</Text>
            <Text type="secondary">删除所有库存调整记录及关联凭证</Text>
            <br />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCleanup('inventory')}
              style={{ marginTop: 8 }}
            >
              清理库存调整数据
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>清理所有业务单据：</Text>
            <Text type="secondary">删除OTC + PTP + 库存调整所有数据及关联凭证</Text>
            <br />
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCleanup('all')}
              style={{ marginTop: 8 }}
            >
              清理所有业务数据
            </Button>
          </div>
        </Space>

        {result && renderResult()}
        {initResult && renderInitResult()}
      </Card>

      {/* 清理确认弹窗 */}
      <Modal
        title="确认清理数据"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={confirmCleanup}
        okText="确认删除"
        okButtonProps={{ danger: true, loading }}
      >
        <Alert
          message={`确定要清理 ${getTypeName(cleanupType)} 吗？`}
          description={getWarningMessage()}
          type="error"
          showIcon
        />
      </Modal>

      {/* 库存初始化确认弹窗 */}
      <Modal
        title="确认库存初始化"
        open={initModalVisible}
        onCancel={() => setInitModalVisible(false)}
        onOk={confirmInitInventory}
        okText="确认初始化"
        okButtonProps={{ danger: true, loading }}
      >
        <Alert
          message="确定要进行库存初始化吗？"
          description="此操作将：\n1. 删除所有库存交易记录（出入库流水）\n2. 删除所有库存调整记录\n3. 删除关联的会计凭证\n4. 将所有物料的库存数量重置为0\n\n此操作不可恢复！"
          type="error"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default DatabaseCleanup;
