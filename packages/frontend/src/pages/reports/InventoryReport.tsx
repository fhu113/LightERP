import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Statistic, Tabs } from 'antd';
import { reportApi } from '../../services/report.api';

interface InventoryReport {
  summary: {
    materialCount: number;
    totalInventoryValue: number;
    totalStock: number;
  };
  byMaterial: any[];
  recentTransactions: any[];
  byTransactionType: Record<string, number>;
}

const InventoryReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<InventoryReport | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getInventoryReport() as any;
      setReport(data);
    } catch (error) {
      console.error('加载库存报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const materialColumns = [
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock', width: 100 },
    { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', width: 100, render: (v: number) => v?.toFixed(2) },
    { title: '销售价', dataIndex: 'salePrice', key: 'salePrice', width: 100, render: (v: number) => v?.toFixed(2) },
    { title: '库存价值', dataIndex: 'inventoryValue', key: 'inventoryValue', width: 120, render: (v: number) => v?.toFixed(2) },
  ];

  const transactionColumns = [
    { title: '日期', dataIndex: 'transactionDate', key: 'transactionDate', width: 160,
      render: (v: string) => new Date(v).toLocaleString() },
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
    { title: '交易类型', dataIndex: 'transactionType', key: 'transactionType', width: 100,
      render: (v: string) => {
        const typeMap: Record<string, string> = {
          PURCHASE_IN: '采购入库',
          PURCHASE_RETURN: '采购退货',
          SALES_OUT: '销售出库',
          SALES_RETURN: '销售退货',
          ADJUSTMENT: '库存调整',
        };
        return typeMap[v] || v;
      }
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位成本', dataIndex: 'unitCost', key: 'unitCost', width: 100, render: (v: number) => v?.toFixed(2) },
  ];

  const tabItems = [
    {
      key: 'material',
      label: '库存明细',
      children: (
        <Table
          columns={materialColumns}
          dataSource={report?.byMaterial || []}
          pagination={false}
          rowKey="materialId"
          size="small"
        />
      ),
    },
    {
      key: 'transaction',
      label: '最近流水',
      children: (
        <Table
          columns={transactionColumns}
          dataSource={report?.recentTransactions || []}
          pagination={false}
          rowKey="id"
          size="small"
        />
      ),
    },
  ];

  // 计算合计
  const totalValue = (report?.byMaterial || []).reduce(
    (sum, item) => sum + (item.inventoryValue || 0),
    0
  );
  const totalStock = (report?.byMaterial || []).reduce(
    (sum, item) => sum + (item.currentStock || 0),
    0
  );

  return (
    <div>
      <Card bordered={false}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="物料种类"
                value={report?.summary?.materialCount || 0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总库存数量"
                value={totalStock}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="库存总值"
                value={report?.summary?.totalInventoryValue || 0}
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

export default InventoryReport;
