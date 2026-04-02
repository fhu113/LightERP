import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Popconfirm, message, Typography, Alert, Modal } from 'antd';
import { ReloadOutlined, DeleteOutlined, RollbackOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { backupApi, Backup } from '../../services/backup.api';

const { Title, Text } = Typography;
const { confirm } = Modal;

const DatabaseBackup: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await backupApi.getBackups();
      setBackups(data);
    } catch (error) {
      console.error('加载备份列表失败:', error);
      message.error('加载备份列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await backupApi.createBackup();
      message.success('备份创建成功');
      loadBackups();
    } catch (error) {
      console.error('创建备份失败:', error);
      message.error('创建备份失败');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = (record: Backup) => {
    confirm({
      title: '确认恢复备份',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要恢复以下备份吗？</p>
          <p style={{ fontWeight: 'bold' }}>{record.filename}</p>
          <p style={{ color: '#ff4d4f' }}>恢复前会自动创建当前数据库的备份</p>
        </div>
      ),
      okText: '确认恢复',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await backupApi.restoreBackup(record.filename);
          message.success('恢复成功，请刷新页面查看数据');
        } catch (error) {
          console.error('恢复备份失败:', error);
          message.error('恢复备份失败');
        }
      },
    });
  };

  const handleDelete = (record: Backup) => {
    confirm({
      title: '确认删除备份',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除备份 "${record.filename}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await backupApi.deleteBackup(record.filename);
          message.success('删除成功');
          loadBackups();
        } catch (error) {
          console.error('删除备份失败:', error);
          message.error('删除备份失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '备份文件',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '大小',
      dataIndex: 'sizeFormatted',
      key: 'size',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Backup) => (
        <Space>
          <Button
            type="link"
            icon={<RollbackOutlined />}
            onClick={() => handleRestore(record)}
          >
            恢复
          </Button>
          <Popconfirm
            title="确认删除此备份？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ marginBottom: 8 }}>数据库备份与恢复</Title>
          <Text type="secondary">
            系统会自动保留最新的5个备份版本。您可以手动创建备份、恢复任意版本或删除不需要的备份。
          </Text>
        </div>

        <Alert
          message="备份策略"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>自动备份：每6小时自动创建一次备份</li>
              <li>手动备份：可随时手动创建备份</li>
              <li>保留数量：最多保留5个最新备份</li>
              <li>恢复前自动备份：恢复时会自动备份当前数据库</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateBackup}
            loading={creating}
          >
            创建备份
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadBackups}
            style={{ marginLeft: 8 }}
          >
            刷新
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={backups}
          rowKey="filename"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无备份记录' }}
        />

        <div style={{ marginTop: 16, color: '#8c8c8c', fontSize: 12 }}>
          <Text type="secondary">
            提示：恢复备份后，需要刷新页面才能看到恢复的数据。
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default DatabaseBackup;
