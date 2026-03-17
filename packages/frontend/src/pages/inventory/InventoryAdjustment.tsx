import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Tag, Modal, Form, Select, InputNumber, Input, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, InventoryAdjustment, InventoryAdjustmentDto } from '../../services/inventory.api';
import { masterApi } from '../../services/master.api';

const { Title, Text } = Typography;

const InventoryAdjustmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchAdjustments = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      console.log('Fetching adjustments...');
      const result: any = await inventoryApi.getInventoryAdjustments({ page, limit });
      console.log('Adjustments result:', result);
      setAdjustments(result.data);
      setPagination({
        current: page,
        pageSize: limit,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取库存调整失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      console.log('Fetching materials...');
      const result: any = await masterApi.getMaterials({ limit: 1000 });
      console.log('Materials result:', result);
      setMaterials(result.data || []);
    } catch (error) {
      console.error('获取物料列表失败:', error);
    }
  };

  useEffect(() => {
    fetchAdjustments();
    fetchMaterials();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const data: InventoryAdjustmentDto = {
        materialId: values.materialId,
        adjustmentType: values.adjustmentType,
        quantity: values.quantity,
        unitCost: values.unitCost,
        reason: values.reason,
        description: values.description,
      };

      await inventoryApi.createInventoryAdjustment(data);
      message.success('库存调整成功');
      setModalVisible(false);
      form.resetFields();
      fetchAdjustments(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('库存调整失败:', error);
      message.error(error.message || '库存调整失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchAdjustments(pagination.current, pagination.pageSize);
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      form.setFieldsValue({ unitCost: material.costPrice || 0 });
    }
  };

  const columns = [
    {
      title: '调整单号',
      dataIndex: 'adjustmentNo',
      key: 'adjustmentNo',
    },
    {
      title: '调整日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      title: '调整类型',
      dataIndex: 'adjustmentType',
      key: 'adjustmentType',
      render: (type: string) => (
        <Tag color={type === 'INCREASE' ? 'green' : 'red'}>
          {type === 'INCREASE' ? '调增' : '调减'}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, record: InventoryAdjustment) => (
        <span style={{ color: record.adjustmentType === 'INCREASE' ? '#52c41a' : '#ff4d4f' }}>
          {record.adjustmentType === 'INCREASE' ? '+' : '-'}{val.toFixed(2)}
        </span>
      ),
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
      render: (val: number, record: InventoryAdjustment) => (
        <span style={{ color: record.adjustmentType === 'INCREASE' ? '#52c41a' : '#ff4d4f' }}>
          {record.adjustmentType === 'INCREASE' ? '+' : '-'}¥{val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (voucherNo: string | null, record: InventoryAdjustment) => {
        if (voucherNo && record.voucherId) {
          return (
            <Space>
              <Tag color="green">已生成</Tag>
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/finance/voucher-list?voucherId=${record.voucherId}`)}
              >
                {voucherNo}
              </Button>
            </Space>
          );
        }
        return <Text type="secondary">未生成</Text>;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>库存调整</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新增调整
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={adjustments}
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

      <Modal
        title="库存调整"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="物料"
            name="materialId"
            rules={[{ required: true, message: '请选择物料' }]}
          >
            <Select
              placeholder="选择物料"
              onChange={handleMaterialChange}
              showSearch
              optionFilterProp="children"
            >
              {materials.map((m: any) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.code} - {m.name} (当前库存: {m.currentStock})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="调整类型"
            name="adjustmentType"
            rules={[{ required: true, message: '请选择调整类型' }]}
          >
            <Select placeholder="选择调整类型">
              <Select.Option value="INCREASE">调增</Select.Option>
              <Select.Option value="DECREASE">调减</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="数量"
            name="quantity"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0.01} step={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>

          <Form.Item
            label="单价"
            name="unitCost"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="请输入单价" formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value!.replace(/¥\s?|(,*)/g, '')} />
          </Form.Item>

          <Form.Item
            label="原因"
            name="reason"
            rules={[{ required: true, message: '请选择原因' }]}
          >
            <Select placeholder="选择原因">
              <Select.Option value="盘点">盘点</Select.Option>
              <Select.Option value="无PO收货">无PO收货</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="备注" name="description">
            <Input.TextArea rows={2} placeholder="请输入备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryAdjustmentPage;
