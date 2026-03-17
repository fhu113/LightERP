import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DollarOutlined,
  ShoppingOutlined,
  ShopOutlined,
  InboxOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { salesApi } from '../services/sales.api';
import { purchaseApi } from '../services/purchase.api';
import { masterApi } from '../services/master.api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    pendingDeliveries: 0,
    inventoryCount: 0,
    totalSales: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 获取销售订单状态统计
      const statusCounts = await salesApi.getStatusCounts();

      // 获取待处理销售订单列表
      const pendingOrdersData = await salesApi.getSalesOrders({ status: 'PENDING', limit: 5 } as any);

      // 获取采购订单状态统计
      const purchaseCounts = await purchaseApi.getStatusCounts();

      // 获取采购待处理订单
      const pendingPurchases = await purchaseApi.getPurchaseOrders({ status: 'PENDING', limit: 5 } as any);

      // 获取库存统计
      const inventoryData = await masterApi.getMaterials({ limit: 1000 });
      const inventoryCount = inventoryData.data.filter((m: any) => (m.currentStock || 0) > 0).length;

      // 获取本月销售总额
      const allSales = await salesApi.getSalesOrders({ limit: 1000 });
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthlySales = allSales.data
        .filter((order: any) => new Date(order.orderDate) >= thisMonth)
        .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

      setStats({
        pendingOrders: (statusCounts.PENDING || 0) + (statusCounts.IN_PROGRESS || 0),
        pendingDeliveries: purchaseCounts.PENDING || 0,
        inventoryCount,
        totalSales: monthlySales,
      });

      // 合并销售订单和采购订单作为最近单据
      const orders = [
        ...pendingOrdersData.data.map((order: any) => ({
          key: order.id,
          orderNo: order.orderNo,
          type: '销售',
          customer: order.customer?.name || '-',
          amount: order.totalAmount,
          status: order.status,
          date: new Date(order.orderDate).toLocaleDateString(),
        })),
        ...pendingPurchases.data.map((order: any) => ({
          key: 'p-' + order.id,
          orderNo: order.orderNo,
          type: '采购',
          customer: order.supplier?.name || '-',
          amount: order.totalAmount,
          status: order.status,
          date: new Date(order.orderDate).toLocaleDateString(),
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setRecentOrders(orders);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string, type: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: '待处理' },
      IN_PROGRESS: { color: 'blue', text: '进行中' },
      RECEIVED: { color: 'cyan', text: '已收货' },
      COMPLETED: { color: 'green', text: '已完成' },
      CANCELLED: { color: 'red', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const orderColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === '销售' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '单据编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户/供应商',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => getStatusTag(status, record.type),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>仪表盘</h2>
        <p style={{ margin: '4px 0 0', color: '#8c8c8c' }}>
          欢迎使用LightERP系统，这里是您的业务概览
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/sales/orders')}>
            <Statistic
              title="待处理销售订单"
              value={stats.pendingOrders}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/purchase/orders')}>
            <Statistic
              title="待处理采购订单"
              value={stats.pendingDeliveries}
              prefix={<SendOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/inventory/query')}>
            <Statistic
              title="有库存物料"
              value={stats.inventoryCount}
              prefix={<InboxOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/sales/orders')}>
            <Statistic
              title="本月销售额"
              value={stats.totalSales}
              prefix={<><DollarOutlined style={{ color: '#722ed1' }} /> </>}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近业务单据 */}
        <Col xs={24} lg={16}>
          <Card
            title="最近业务单据"
            extra={
              <Space>
                <Button type="link" size="small" onClick={() => navigate('/sales/orders')}>
                  销售订单
                </Button>
                <Button type="link" size="small" onClick={() => navigate('/purchase/orders')}>
                  采购订单
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block type="primary" size="large" onClick={() => navigate('/sales/orders')}>
                销售订单
              </Button>
              <Button block size="large" onClick={() => navigate('/purchase/orders')}>
                采购订单
              </Button>
              <Button block size="large" onClick={() => navigate('/finance/vouchers')}>
                录入凭证
              </Button>
              <Button block size="large" onClick={() => navigate('/inventory/query')}>
                库存查询
              </Button>
            </Space>
          </Card>

          {/* 系统状态 */}
          <Card title="系统状态" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数据库</span>
                <span style={{ color: '#52c41a' }}>正常</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API服务</span>
                <span style={{ color: '#52c41a' }}>正常</span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
