import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Space, Select, DatePicker, Button, Typography } from 'antd';
import { SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { reportApi } from '../../services/report.api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const DocumentQuery: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [params, setParams] = useState({
        documentType: undefined,
        keyword: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await reportApi.getDocumentQuery(params) as any;
            setData(results);
        } catch (error) {
            console.error('查询失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadData();
    };

    const handleReset = () => {
        const defaultParams = {
            documentType: undefined,
            keyword: '',
            startDate: '',
            endDate: '',
        };
        setParams(defaultParams);
        // Use timeout to ensure state update before loading
        setTimeout(() => {
            loadData();
        }, 0);
    };

    const docTypeMap: any = {
        'SALES_ORDER': { label: '销售订单', color: 'blue' },
        'PURCHASE_ORDER': { label: '采购订单', color: 'cyan' },
        'DELIVERY': { label: '发货单', color: 'green' },
        'PURCHASE_RECEIPT': { label: '收货单', color: 'orange' },
        'SALES_INVOICE': { label: '销售发票', color: 'purple' },
        'PURCHASE_INVOICE': { label: '采购发票', color: 'magenta' },
        'RECEIPT': { label: '收款单', color: 'gold' },
        'PAYMENT': { label: '付款单', color: 'volcano' },
        'VOUCHER': { label: '会计凭证', color: 'geekblue' },
    };

    const columns = [
        {
            title: '单据类型',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={docTypeMap[type]?.color || 'default'}>
                    {docTypeMap[type]?.label || type}
                </Tag>
            ),
        },
        {
            title: '单据编号',
            dataIndex: 'documentNo',
            key: 'documentNo',
            render: (text: string) => <Text copyable>{text}</Text>,
        },
        {
            title: '日期',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: '业务伙伴/摘要',
            dataIndex: 'partnerName',
            key: 'partnerName',
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right' as const,
            render: (val: number) => (val > 0 ? `¥${val.toFixed(2)}` : '-'),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag>{status}</Tag>,
        },
    ];

    return (
        <Card title="综合单据查询" bordered={false}>
            <Space size="middle" direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                    <Select
                        placeholder="所有单据类型"
                        style={{ width: 160 }}
                        allowClear
                        value={params.documentType}
                        onChange={(val) => setParams({ ...params, documentType: val })}
                    >
                        {Object.entries(docTypeMap).map(([key, item]: [string, any]) => (
                            <Select.Option key={key} value={key}>{item.label}</Select.Option>
                        ))}
                    </Select>
                    <RangePicker
                        onChange={(dates) => {
                            setParams({
                                ...params,
                                startDate: dates ? dates[0]!.format('YYYY-MM-DD') : '',
                                endDate: dates ? dates[1]!.format('YYYY-MM-DD') : '',
                            });
                        }}
                    />
                    <Input
                        placeholder="单号/伙伴名称搜索"
                        style={{ width: 200 }}
                        value={params.keyword}
                        onChange={(e) => setParams({ ...params, keyword: e.target.value })}
                        onPressEnter={handleSearch}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        搜索
                    </Button>
                    <Button onClick={handleReset}>
                        重置
                    </Button>
                </Space>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Space>
        </Card>
    );
};

export default DocumentQuery;
