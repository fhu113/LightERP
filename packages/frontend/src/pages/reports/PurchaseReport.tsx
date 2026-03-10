import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, DatePicker, Select, Statistic, Tabs, Space } from 'antd';
import { reportApi } from '../../services/report.api';

const { RangePicker } = DatePicker;

interface PurchaseReport {
  summary: {
    orderCount: number;
    totalAmount: number;
  };
  bySupplier: any[];
  byMaterial: any[];
  byMonth: any[];
}

const PurchaseReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PurchaseReport | null>(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getPurchaseReport(filters) as any;
      setReport(data);
    } catch (error) {
      console.error('加载采购报表失败:', error);
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

  const supplierColumns = [
    { title: '供应商编码', dataIndex: 'supplierCode', key: 'supplierCode' },
    { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '采购金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
  ];

  const materialColumns = [
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '采购数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '采购金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
  ];

  const monthColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '采购金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v?.toFixed(2) },
  ];

  const tabItems = [
    {
      key: 'supplier',
      label: '按供应商',
      children: (
        <Table
          columns={supplierColumns}
          dataSource={report?.bySupplier || []}
          pagination={false}
          rowKey="supplierId"
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
          <Col span={12}>
            <Card>
              <Statistic
                title="采购订单数量"
                value={report?.summary?.orderCount || 0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="采购金额"
                value={report?.summary?.totalAmount || 0}
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

export default PurchaseReport;
