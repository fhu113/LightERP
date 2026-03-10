import React from 'react';
import { Card, Row, Col, Statistic, Table, Space, Button } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  ShopOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  // 统计数据
  const stats = [
    {
      title: '本月销售额',
      value: 125430,
      prefix: '¥',
      icon: <DollarOutlined />,
      color: '#52c41a',
      change: 12.5,
    },
    {
      title: '待处理订单',
      value: 23,
      icon: <ShoppingOutlined />,
      color: '#1890ff',
      change: -5.2,
    },
    {
      title: '库存商品',
      value: 156,
      icon: <InboxOutlined />,
      color: '#faad14',
      change: 8.3,
    },
    {
      title: '活跃客户',
      value: 42,
      icon: <ShopOutlined />,
      color: '#722ed1',
      change: 15.7,
    },
  ];

  // 最近订单数据
  const recentOrders = [
    {
      key: '1',
      orderNo: 'SO-20250307-001',
      customer: '示例客户有限公司',
      amount: 15600,
      status: '已发货',
      date: '2025-03-07',
    },
    {
      key: '2',
      orderNo: 'SO-20250306-002',
      customer: '测试客户公司',
      amount: 8900,
      status: '待发货',
      date: '2025-03-06',
    },
    {
      key: '3',
      orderNo: 'PO-20250305-001',
      supplier: '示例供应商有限公司',
      amount: 23400,
      status: '已收货',
      date: '2025-03-05',
    },
  ];

  const orderColumns = [
    {
      title: '单据编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户/供应商',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string, record: any) => text || record.supplier,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === '已发货' || status === '已收货') color = 'success';
        if (status === '待发货') color = 'warning';
        return <span className={`ant-tag ant-tag-${color}`}>{status}</span>;
      },
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
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.prefix}
                    valueStyle={{ color: stat.color }}
                  />
                  <div style={{ fontSize: 32, color: stat.color }}>{stat.icon}</div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {stat.change > 0 ? (
                    <span style={{ color: '#52c41a' }}>
                      <ArrowUpOutlined /> {stat.change}%
                    </span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>
                      <ArrowDownOutlined /> {Math.abs(stat.change)}%
                    </span>
                  )}
                  <span style={{ marginLeft: 8 }}>较上月</span>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近订单 */}
        <Col xs={24} lg={16}>
          <Card
            title="最近业务单据"
            extra={
              <Space>
                <Button type="link" size="small">
                  查看所有销售
                </Button>
                <Button type="link" size="small">
                  查看所有采购
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block type="primary" size="large">
                创建销售订单
              </Button>
              <Button block size="large">
                创建采购订单
              </Button>
              <Button block size="large">
                录入财务凭证
              </Button>
              <Button block size="large">
                库存调整
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>最后备份</span>
                <span>2025-03-06 23:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数据总量</span>
                <span>1.2MB</span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;