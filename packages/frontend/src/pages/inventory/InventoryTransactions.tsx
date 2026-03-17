import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Input, Select, Space, DatePicker, Tag, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { inventoryApi, InventoryTransaction } from '../../services/inventory.api';
import { masterApi } from '../../services/master.api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const InventoryTransactions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    materialId: '',
    transactionType: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTransactions = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: any = await inventoryApi.getInventoryTransactions({
        page,
        limit,
        ...filters,
      });
      setTransactions(result.data);
      setPagination({
        current: page,
        pageSize: limit,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取库存流水失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const result = await masterApi.getMaterials({ limit: 1000 });
      setMaterials(result.data || []);
    } catch (error) {
      console.error('获取物料列表失败:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMaterials();
  }, []);

  const handleSearch = () => {
    fetchTransactions(1, pagination.pageSize);
  };

  const handleTableChange = (pagination: any) => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  const handleDateChange = (dates: any) => {
    if (dates) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
      }));
    }
  };

  const transactionTypeMap: Record<string, { color: string; text: string }> = {
    PURCHASE_RECEIPT: { color: 'green', text: '采购入库' },
    SALES_DELIVERY: { color: 'red', text: '销售出库' },
    STOCK_IN: { color: 'blue', text: '库存调增' },
    STOCK_OUT: { color: 'orange', text: '库存调减' },
    STOCK_ADJUSTMENT: { color: 'purple', text: '库存调整' },
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
    },
    {
      title: '业务类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => {
        const info = transactionTypeMap[type] || { color: 'default', text: type };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, record: InventoryTransaction) => {
        const isOut = record.transactionType === 'SALES_DELIVERY' || record.transactionType === 'STOCK_OUT';
        return <span style={{ color: isOut ? '#ff4d4f' : '#52c41a' }}>{isOut ? '-' : '+'}{Math.abs(val).toFixed(2)}</span>;
      },
    },
    {
      title: '单价',
      dataIndex: 'unitCost',
      key: 'unitCost',
      render: (val: number) => val ? `¥${val.toFixed(2)}` : '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number, record: InventoryTransaction) => {
        const isOut = record.transactionType === 'SALES_DELIVERY' || record.transactionType === 'STOCK_OUT';
        return <span style={{ color: isOut ? '#ff4d4f' : '#52c41a' }}>{isOut ? '-' : '+'}¥${Math.abs(val).toFixed(2)}</span>;
      },
    },
    {
      title: '参考单据',
      dataIndex: 'referenceType',
      key: 'referenceType',
      render: (type: string, record: InventoryTransaction) => `${type} - ${record.referenceId}`,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>库存流水</Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="选择物料"
            allowClear
            style={{ width: 200 }}
            value={filters.materialId || undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, materialId: value || '' }))}
            showSearch
            optionFilterProp="children"
          >
            {materials.map((m: any) => (
              <Select.Option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="业务类型"
            allowClear
            style={{ width: 150 }}
            value={filters.transactionType || undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, transactionType: value || '' }))}
          >
            <Select.Option value="PURCHASE_RECEIPT">采购入库</Select.Option>
            <Select.Option value="SALES_DELIVERY">销售出库</Select.Option>
            <Select.Option value="STOCK_IN">库存调增</Select.Option>
            <Select.Option value="STOCK_OUT">库存调减</Select.Option>
          </Select>

          <RangePicker onChange={handleDateChange} />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default InventoryTransactions;
