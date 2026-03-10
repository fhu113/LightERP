import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, DatePicker, Select, Statistic, Tabs, Space } from 'antd';
import { reportApi } from '../../services/report.api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface SalesReport {
  summary: {
    orderCount: number;
    totalAmount: number;
    totalTaxAmount: number;
    totalWithTax: number;
  };
  byCustomer: any[];
  byMaterial: any[];
  byMonth: any[];
}

const SalesReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getSalesReport(filters) as any;
      setReport(data);
    } catch (error) {
      console.error('加载销售报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any) => {
    if (dates) {
      setFilters({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({ startDate: '', endDate: '' });
    }
  };

  const customerColumns = [
    { title: '客户编码', dataIndex: 'customerCode', key: 'customerCode' },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '销售金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
    { title: '税额', dataIndex: 'taxAmount', key: 'taxAmount', render: (v: number) => v?.toFixed(2) },
  ];

  const materialColumns = [
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '销售数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '销售金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
  ];

  const monthColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '销售金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
    { title: '税额', dataIndex: 'taxAmount', key: 'taxAmount', render: (v: number) => v?.toFixed(2) },
  ];

  const tabItems = [
    {
      key: 'customer',
      label: '按客户',
      children: (
        <Table
          columns={customerColumns}
          dataSource={report?.byCustomer || []}
          pagination={false}
          rowKey="customerId"
        />
      ),
    },
    {
      key: 'material',
      label: '按物料',
      children: (
        <Table
          columns={materialColumns}
          dataSource={report?.byMaterial || []}
          pagination={false}
          rowKey="materialId"
        />
      ),
    },
    {
      key: 'month',
      label: '按月份',
      children: (
        <Table
          columns={monthColumns}
          dataSource={report?.byMonth || []}
          pagination={false}
          rowKey="month"
        />
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker onChange={handleDateChange} />
        </Space>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="订单数量"
                value={report?.summary?.orderCount || 0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="销售金额"
                value={report?.summary?.totalAmount || 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="税额"
                value={report?.summary?.totalTaxAmount || 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="价税合计"
                value={report?.summary?.totalWithTax || 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default SalesReport;
