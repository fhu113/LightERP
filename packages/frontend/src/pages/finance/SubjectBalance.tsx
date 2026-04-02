import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Typography } from 'antd';
import { voucherApi } from '../../services/voucher.api';

const { Text } = Typography;

interface SubjectBalance {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  balanceDirection: string;
  initialDebit: number;
  initialCredit: number;
  currentDebit: number;
  currentCredit: number;
  endingDebit: number;
  endingCredit: number;
}

const SubjectBalance: React.FC = () => {
  const [balances, setBalances] = useState<SubjectBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    setLoading(true);
    try {
      const data = await voucherApi.getSubjectBalance() as any;
      setBalances(data || []);
    } catch (error) {
      console.error('加载科目余额失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '科目代码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 120,
    },
    {
      title: '科目名称',
      dataIndex: 'subjectName',
      key: 'subjectName',
    },
    {
      title: '期初余额',
      key: 'initialBalance',
      width: 150,
      render: (_: any, record: SubjectBalance) => {
        const balance = record.balanceDirection === 'DEBIT'
          ? record.initialDebit - record.initialCredit
          : record.initialCredit - record.initialDebit;
        return (
          <Text type={balance > 0 ? 'success' : balance < 0 ? 'danger' : undefined}>
            {balance.toFixed(2)}
          </Text>
        );
      },
    },
    {
      title: '借方发生额',
      dataIndex: 'currentDebit',
      key: 'currentDebit',
      width: 120,
      render: (val: number) => val?.toFixed(2) || '0.00',
    },
    {
      title: '贷方发生额',
      dataIndex: 'currentCredit',
      key: 'currentCredit',
      width: 120,
      render: (val: number) => val?.toFixed(2) || '0.00',
    },
    {
      title: '期末余额',
      key: 'endingBalance',
      width: 150,
      render: (_: any, record: SubjectBalance) => {
        const balance = record.balanceDirection === 'DEBIT'
          ? record.endingDebit - record.endingCredit
          : record.endingCredit - record.endingDebit;
        return (
          <Text type={balance > 0 ? 'success' : balance < 0 ? 'danger' : undefined} strong>
            {balance.toFixed(2)}
          </Text>
        );
      },
    },
  ];

  // 计算合计
  const summaryData = balances.reduce(
    (acc, item) => ({
      initialDebit: acc.initialDebit + (item.initialDebit || 0),
      initialCredit: acc.initialCredit + (item.initialCredit || 0),
      currentDebit: acc.currentDebit + (item.currentDebit || 0),
      currentCredit: acc.currentCredit + (item.currentCredit || 0),
      endingDebit: acc.endingDebit + (item.endingDebit || 0),
      endingCredit: acc.endingCredit + (item.endingCredit || 0),
    }),
    {
      initialDebit: 0,
      initialCredit: 0,
      currentDebit: 0,
      currentCredit: 0,
      endingDebit: 0,
      endingCredit: 0,
    }
  );

  return (
    <div>
      <Card title="科目余额表" bordered={false}>
        <Table
          columns={columns}
          dataSource={balances}
          loading={loading}
          pagination={false}
          rowKey="subjectId"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong>
                    {(summaryData.initialDebit - summaryData.initialCredit).toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong>{summaryData.currentDebit.toFixed(2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Text strong>{summaryData.currentCredit.toFixed(2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Text strong>
                    {(summaryData.endingDebit - summaryData.endingCredit).toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default SubjectBalance;
