import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Input, Space, Statistic, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { inventoryApi, InventoryItem } from '../../services/inventory.api';

const { Title } = Typography;

const InventoryQuery: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [totalValue, setTotalValue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchInventory = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result: any = await inventoryApi.getInventoryList({ page, limit, search });
      setInventory(result.data);
      setPagination({
        current: page,
        pageSize: limit,
        total: result.pagination?.total || 0,
      });

      // 计算总库存价值
      const totalVal = result.data.reduce((sum: number, item: InventoryItem) => sum + (item.inventoryValue || 0), 0);
      setTotalValue(totalVal);
      setTotalItems(result.pagination.total);
    } catch (error) {
      console.error('获取库存列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchInventory(1, pagination.pageSize);
  };

  const handleTableChange = (pagination: any) => {
    fetchInventory(pagination.current, pagination.pageSize);
  };

  const columns = [
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
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      render: (val: string | null) => val || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '库存数量',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (val: number) => val?.toFixed(2) || '0.00',
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (val: number) => val ? `¥${val.toFixed(2)}` : '-',
    },
    {
      title: '销售价',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (val: number) => val ? `¥${val.toFixed(2)}` : '-',
    },
    {
      title: '库存价值',
      dataIndex: 'inventoryValue',
      key: 'inventoryValue',
      render: (val: number) => val ? `¥${val.toFixed(2)}` : '-',
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>库存查询</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="物料种类" value={totalItems} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="库存总价值" value={totalValue} precision={2} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索物料编码或名称"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={inventory}
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

export default InventoryQuery;
