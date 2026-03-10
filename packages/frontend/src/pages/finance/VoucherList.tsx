import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Descriptions, DatePicker, Select, Input, message, Popconfirm } from 'antd';
import { EyeOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { voucherApi, Voucher } from '../../services/voucher.api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const VoucherList: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

  // 使用 ref 追踪 filters 变化
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, filtersRef.current.status, filtersRef.current.startDate, filtersRef.current.endDate]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      // 使用 ref 获取最新的 filters 值
      const currentFilters = filtersRef.current;
      // 过滤掉空的 filters，确保参数类型正确
      const queryParams: any = {
        page: Number(pagination.current),
        limit: Number(pagination.pageSize),
      };
      if (currentFilters.status) queryParams.status = currentFilters.status;
      if (currentFilters.startDate) queryParams.startDate = currentFilters.startDate;
      if (currentFilters.endDate) queryParams.endDate = currentFilters.endDate;

      const result = await voucherApi.getVouchers(queryParams) as any;
      // 确保 result 存在且有 data 属性
      if (result && result.data) {
        setVouchers(Array.isArray(result.data) ? result.data : []);
        setPagination(prev => ({ ...prev, total: result.pagination?.total || 0 }));
      } else {
        setVouchers([]);
      }
    } catch (error) {
      console.error('加载凭证失败:', error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: Voucher) => {
    setSelectedVoucher(record);
    setDetailVisible(true);
  };

  const handlePost = async (id: string) => {
    try {
      await voucherApi.postVoucher(id);
      message.success('凭证过账成功');
      loadVouchers();
    } catch (error) {
      console.error('过账失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await voucherApi.deleteVoucher(id);
      message.success('凭证删除成功');
      loadVouchers();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateChange = (dates: any) => {
    if (dates) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({ ...filters, startDate: '', endDate: '' });
    }
    setPagination({ ...pagination, current: 1 });
  };

  const columns = [
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
    },
    {
      title: '凭证日期',
      dataIndex: 'voucherDate',
      key: 'voucherDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '凭证类型',
      dataIndex: 'voucherType',
      key: 'voucherType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          GENERAL: '记账凭证',
          CASH: '现金凭证',
          BANK: '银行凭证',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: '借方合计',
      dataIndex: 'totalDebit',
      key: 'totalDebit',
      render: (val: number) => val?.toFixed(2) || '0.00',
    },
    {
      title: '贷方合计',
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      render: (val: number) => val?.toFixed(2) || '0.00',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          DRAFT: { color: 'default', text: '草稿' },
          POSTED: { color: 'green', text: '已过账' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Voucher) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button type="link" icon={<CheckOutlined />} onClick={() => handlePost(record.id)}>
                过账
              </Button>
              <Popconfirm title="确定删除此凭证吗?" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: '科目代码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
    },
    {
      title: '科目名称',
      dataIndex: 'subjectName',
      key: 'subjectName',
    },
    {
      title: '借方金额',
      dataIndex: 'debitAmount',
      key: 'debitAmount',
      render: (val: number) => val > 0 ? val.toFixed(2) : '-',
    },
    {
      title: '贷方金额',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      render: (val: number) => val > 0 ? val.toFixed(2) : '-',
    },
    {
      title: '摘要',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div>
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker onChange={handleDateChange} />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status || undefined}
            onChange={(value) => handleFilterChange('status', value || '')}
          >
            <Select.Option value="DRAFT">草稿</Select.Option>
            <Select.Option value="POSTED">已过账</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={vouchers}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination({ ...pagination, current: page }),
          }}
          rowKey="id"
        />
      </Card>

      <Modal
        title={`凭证详情 - ${selectedVoucher?.voucherNo}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedVoucher && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="凭证号">{selectedVoucher.voucherNo}</Descriptions.Item>
              <Descriptions.Item label="凭证日期">
                {dayjs(selectedVoucher.voucherDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="凭证类型">
                {selectedVoucher.voucherType === 'GENERAL' ? '记账凭证' :
                 selectedVoucher.voucherType === 'CASH' ? '现金凭证' : '银行凭证'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedVoucher.status === 'POSTED' ? '已过账' : '草稿'}
              </Descriptions.Item>
              <Descriptions.Item label="摘要" span={2}>
                {selectedVoucher.summary}
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={itemColumns}
              dataSource={selectedVoucher.items}
              pagination={false}
              rowKey="id"
              style={{ marginTop: 16 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>{selectedVoucher.totalDebit?.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong>{selectedVoucher.totalCredit?.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default VoucherList;
