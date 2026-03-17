import React, { useState, useRef, useEffect } from 'react';
import { Card, Select, Table, Button, Space, message, Typography, Alert, Divider, Popconfirm, Checkbox, Tabs } from 'antd';
import { UploadOutlined, DeleteOutlined, SaveOutlined, PlusOutlined, FileTextOutlined, InboxOutlined, DatabaseOutlined, TeamOutlined, ShopOutlined, ContainerOutlined } from '@ant-design/icons';
import { masterApi } from '../../services/master.api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

type ImportType = 'subject' | 'customer' | 'supplier' | 'material';

interface ImportConfig {
  key: ImportType;
  label: string;
  icon: React.ReactNode;
  columns: { title: string; dataIndex: string; required: boolean; placeholder?: string; options?: string[] }[];
}

const IMPORT_CONFIGS: ImportConfig[] = [
  {
    key: 'subject',
    label: '会计科目',
    icon: <DatabaseOutlined />,
    columns: [
      { title: '科目编码 *', dataIndex: 'code', required: true, placeholder: '如: 1001' },
      { title: '科目名称 *', dataIndex: 'name', required: true, placeholder: '如: 银行存款' },
      { title: '科目类型 *', dataIndex: 'type', required: true, options: ['ASSET', 'LIABILITY', 'EQUITY', 'COST', 'REVENUE', 'EXPENSE'] },
    ],
  },
  {
    key: 'customer',
    label: '客户',
    icon: <TeamOutlined />,
    columns: [
      { title: '客户编码 *', dataIndex: 'code', required: true, placeholder: '如: C001' },
      { title: '客户名称 *', dataIndex: 'name', required: true, placeholder: '如: XX公司' },
      { title: '联系人', dataIndex: 'contactPerson', required: false, placeholder: '如: 张三' },
      { title: '电话', dataIndex: 'phone', required: false, placeholder: '如: 13800138000' },
      { title: '邮箱', dataIndex: 'email', required: false, placeholder: '如: test@example.com' },
      { title: '地址', dataIndex: 'address', required: false, placeholder: '如: 北京市朝阳区XX路' },
      { title: '信用额度', dataIndex: 'creditLimit', required: false, placeholder: '如: 100000' },
    ],
  },
  {
    key: 'supplier',
    label: '供应商',
    icon: <ShopOutlined />,
    columns: [
      { title: '供应商编码 *', dataIndex: 'code', required: true, placeholder: '如: S001' },
      { title: '供应商名称 *', dataIndex: 'name', required: true, placeholder: '如: XX公司' },
      { title: '联系人', dataIndex: 'contactPerson', required: false, placeholder: '如: 张三' },
      { title: '电话', dataIndex: 'phone', required: false, placeholder: '如: 13800138000' },
      { title: '邮箱', dataIndex: 'email', required: false, placeholder: '如: test@example.com' },
      { title: '地址', dataIndex: 'address', required: false, placeholder: '如: 北京市朝阳区XX路' },
    ],
  },
  {
    key: 'material',
    label: '物料',
    icon: <ContainerOutlined />,
    columns: [
      { title: '物料编码 *', dataIndex: 'code', required: true, placeholder: '如: M001' },
      { title: '物料名称 *', dataIndex: 'name', required: true, placeholder: '如: 笔记本电脑' },
      { title: '规格型号', dataIndex: 'specification', required: false, placeholder: '如: i5/16G/512G' },
      { title: '单位 *', dataIndex: 'unit', required: true, placeholder: '如: 台' },
      { title: '成本价', dataIndex: 'costPrice', required: false, placeholder: '如: 5000' },
      { title: '销售价', dataIndex: 'salePrice', required: false, placeholder: '如: 6000' },
    ],
  },
];

const MasterDataMaintenance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('import');
  const [importType, setImportType] = useState<ImportType>('subject');
  const [dataSource, setDataSource] = useState<Record<string, any>[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [previewCount, setPreviewCount] = useState(0);

  // Batch delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const currentConfig = IMPORT_CONFIGS.find(c => c.key === importType)!;

  // Load counts for batch delete
  const loadCounts = async () => {
    try {
      const newCounts: Record<string, number> = {};

      const subjects = await masterApi.getSubjects({ limit: 1 });
      newCounts.subject = subjects.pagination.total;

      const customers = await masterApi.getCustomers({ limit: 1 });
      newCounts.customer = customers.pagination.total;

      const suppliers = await masterApi.getSuppliers({ limit: 1 });
      newCounts.supplier = suppliers.pagination.total;

      const materials = await masterApi.getMaterials({ limit: 1 });
      newCounts.material = materials.pagination.total;

      setCounts(newCounts);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'delete') {
      loadCounts();
    }
  }, [activeTab]);

  // Parse paste text into table data
  const parsePasteData = (text: string): Record<string, any>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Detect delimiter: tab, comma, or semicolon
    let delimiter = '\t';
    const firstLine = lines[0];
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    } else {
      const delimiters = ['\t', ',', ';'];
      let maxCount = 0;
      for (const d of delimiters) {
        const count = (firstLine.match(new RegExp(d === '\t' ? '\\t' : d, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          delimiter = d;
        }
      }
    }

    const parsed: Record<string, any>[] = [];
    for (let i = 0; i < lines.length && i < 30; i++) {
      const cells = lines[i].split(delimiter);
      if (cells.length < currentConfig.columns.length) continue;

      const row: Record<string, any> = {};
      currentConfig.columns.forEach((col, index) => {
        let value: string | number = cells[index]?.trim() || '';
        if (['creditLimit', 'costPrice', 'salePrice'].includes(col.dataIndex) && value) {
          value = parseFloat(String(value)) || 0;
        }
        row[col.dataIndex] = value;
      });
      parsed.push(row);
    }
    return parsed;
  };

  const handleParse = () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴数据');
      return;
    }

    const lines = pasteText.trim().split('\n').filter(line => line.trim());
    message.info(`检测到 ${lines.length} 行数据，正在解析...`);

    const parsed = parsePasteData(pasteText);
    if (parsed.length > 0) {
      setDataSource(parsed);
      setPreviewCount(parsed.length);
      message.success(`成功解析 ${parsed.length} 条数据`);
    } else {
      console.log('Raw paste text:', pasteText);
      console.log('Lines:', lines);
      message.error(`无法解析数据，请检查格式。当前检测到 ${lines.length} 行`);
    }
  };

  const handleClear = () => {
    setDataSource([]);
    setPasteText('');
    setSavedCount(0);
    setPreviewCount(0);
  };

  const handleCellChange = (rowIndex: number, field: string, value: any) => {
    const newData = [...dataSource];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setDataSource(newData);
  };

  const handleAddRow = () => {
    if (dataSource.length >= 30) {
      message.warning('最多只能导入30条数据');
      return;
    }
    const newRow: Record<string, any> = {};
    currentConfig.columns.forEach(col => {
      newRow[col.dataIndex] = '';
    });
    setDataSource([...dataSource, newRow]);
    setPreviewCount(dataSource.length + 1);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = dataSource.filter((_, index) => index !== rowIndex);
    setDataSource(newData);
    setPreviewCount(newData.length);
  };

  const validateData = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    dataSource.forEach((row, index) => {
      currentConfig.columns.forEach(col => {
        if (col.required && !row[col.dataIndex]) {
          errors.push(`第${index + 1}行 "${row.name || row.code || '未填写'}" : ${col.title} 为必填项`);
        }
      });
      if (row.code) {
        const duplicates = dataSource.filter(r => r.code === row.code);
        if (duplicates.length > 1) {
          errors.push(`第${index + 1}行: 编码 "${row.code}" 重复`);
        }
      }
    });
    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    if (dataSource.length === 0) {
      message.warning('没有数据可导入');
      return;
    }

    const validation = validateData();
    if (!validation.valid) {
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>数据验证失败，请修正以下问题：</div>
            {validation.errors.slice(0, 10).map((err, i) => (
              <div key={i} style={{ fontSize: 12 }}>• {err}</div>
            ))}
            {validation.errors.length > 10 && (
              <div style={{ fontSize: 12, marginTop: 8 }}>...还有 {validation.errors.length - 10} 个错误</div>
            )}
          </div>
        ),
        duration: 5,
      });
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      const failRows: number[] = [];

      for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
        try {
          switch (importType) {
            case 'subject':
              await masterApi.createSubject({
                code: row.code,
                name: row.name,
                type: row.type || 'ASSET',
              } as any);
              break;
            case 'customer':
              await masterApi.createCustomer({
                code: row.code,
                name: row.name,
                contactPerson: row.contactPerson,
                phone: row.phone,
                email: row.email,
                address: row.address,
                creditLimit: row.creditLimit || 0,
              });
              break;
            case 'supplier':
              await masterApi.createSupplier({
                code: row.code,
                name: row.name,
                contactPerson: row.contactPerson,
                phone: row.phone,
                email: row.email,
                address: row.address,
              });
              break;
            case 'material':
              await masterApi.createMaterial({
                code: row.code,
                name: row.name,
                specification: row.specification,
                unit: row.unit,
                costPrice: row.costPrice || 0,
                salePrice: row.salePrice || 0,
              });
              break;
          }
          successCount++;
        } catch (error: any) {
          console.error(`导入失败:`, error);
          failCount++;
          failRows.push(i + 1);
          break;
        }
      }

      if (failCount > 0) {
        const errorMsg = `第 ${failRows.join(', ')} 行导入失败，已停止导入。请修正后重新导入。`;
        message.error(errorMsg);
        setSavedCount(0);
      } else {
        setSavedCount(successCount);
        message.success(`成功导入 ${successCount} 条${currentConfig.label}数据`);
        setDataSource([]);
        setPasteText('');
        setPreviewCount(0);
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查数据格式');
    } finally {
      setLoading(false);
    }
  };

  const getColumns = (): ColumnsType<Record<string, any>> => {
    return [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 60,
        render: (_, __, index) => index + 1,
      },
      ...currentConfig.columns.map(col => ({
        title: col.title,
        dataIndex: col.dataIndex,
        key: col.dataIndex,
        width: col.options ? 150 : 140,
        render: (value: any, record: Record<string, any>, rowIndex: number) => {
          if (col.options) {
            return (
              <Select
                value={value}
                onChange={(val) => handleCellChange(rowIndex, col.dataIndex, val)}
                style={{ width: '100%' }}
                placeholder={col.placeholder || `请选择${col.title}`}
                allowClear
                size="small"
              >
                {col.options.map(opt => (
                  <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                ))}
              </Select>
            );
          }
          return (
            <input
              value={value || ''}
              onChange={(e) => handleCellChange(rowIndex, col.dataIndex, e.target.value)}
              placeholder={col.placeholder}
              style={{
                width: '100%',
                border: value ? 'none' : '1px dashed #d9d9d9',
                borderRadius: 4,
                padding: '4px 8px',
                background: value ? 'transparent' : '#fafafa',
              }}
            />
          );
        },
      })),
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_: any, __: any, rowIndex: number) => (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRow(rowIndex)}
          >
            删除
          </Button>
        ),
      },
    ];
  };

  // Batch delete functions
  const handleCategoryChange = (checkedValues: string[]) => {
    setSelectedCategories(checkedValues);
  };

  const handleBatchDelete = async () => {
    if (selectedCategories.length === 0) {
      message.warning('请选择要删除的数据类别');
      return;
    }

    setDeleteLoading(true);
    try {
      let totalDeleted = 0;
      const results: string[] = [];

      for (const category of selectedCategories) {
        let deleted = 0;
        switch (category) {
          case 'subject':
            const subjects = await masterApi.getSubjects({ limit: 1000 });
            for (const s of subjects.data) {
              await masterApi.deleteSubject(s.id);
              deleted++;
            }
            results.push(`会计科目: ${deleted} 条`);
            break;
          case 'customer':
            const customers = await masterApi.getCustomers({ limit: 1000 });
            for (const c of customers.data) {
              await masterApi.deleteCustomer(c.id);
              deleted++;
            }
            results.push(`客户: ${deleted} 条`);
            break;
          case 'supplier':
            const suppliers = await masterApi.getSuppliers({ limit: 1000 });
            for (const s of suppliers.data) {
              await masterApi.deleteSupplier(s.id);
              deleted++;
            }
            results.push(`供应商: ${deleted} 条`);
            break;
          case 'material':
            const materials = await masterApi.getMaterials({ limit: 1000 });
            for (const m of materials.data) {
              await masterApi.deleteMaterial(m.id);
              deleted++;
            }
            results.push(`物料: ${deleted} 条`);
            break;
        }
        totalDeleted += deleted;
      }

      message.success(`批量删除完成，共删除 ${totalDeleted} 条数据`);
      setSelectedCategories([]);
      loadCounts();
    } catch (error: any) {
      console.error('批量删除失败:', error);
      message.error(error.response?.data?.error || '批量删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const importTab = (
    <div style={{ padding: 0 }}>
      <Alert
        message="使用说明"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              1. 选择要导入的数据类型（会计科目/客户/供应商/物料）
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              2. 从Excel复制数据，粘贴到下方文本框中（支持Tab或逗号分隔）
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              3. 点击"解析数据"按钮预览数据，或点击"添加行"手动输入
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              4. 每批次最多导入30条数据，确认无误后点击"导入数据"
            </Paragraph>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 数据类型选择 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Text strong style={{ marginRight: 8 }}>数据类型：</Text>
            <Select
              value={importType}
              onChange={(val) => {
                setImportType(val);
                setDataSource([]);
                setSavedCount(0);
                setPreviewCount(0);
                setPasteText('');
              }}
              style={{ width: 200 }}
            >
              {IMPORT_CONFIGS.map(config => (
                <Select.Option key={config.key} value={config.key}>
                  <Space>{config.icon}{config.label}</Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1, background: '#f5f5f5', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
            <Text strong>字段说明：</Text>
            <div style={{ marginTop: 4 }}>
              {currentConfig.columns.map((col, idx) => (
                <span key={col.dataIndex} style={{ marginRight: 12 }}>
                  {col.required && <Text type="danger">*</Text>}
                  {col.title}
                  {idx < currentConfig.columns.length - 1 ? ' |' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 粘贴数据区域 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>粘贴Excel数据：</Text>
          <Space.Compact style={{ width: '100%' }}>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`从Excel粘贴数据到这里...\n\n例如：\n编码\t名称\t类型\n1001\t银行存款\tASSET\n1002\t应收账款\tASSET`}
              rows={4}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                padding: 8,
                border: '1px solid #d9d9d9',
                borderRadius: '6px 0 0 6px',
                resize: 'vertical',
              }}
            />
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleParse}
              style={{ height: 'auto', borderRadius: '0 6px 6px 0' }}
            >
              解析数据
            </Button>
          </Space.Compact>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddRow}
              disabled={dataSource.length >= 30}
            >
              添加行
            </Button>
            <Popconfirm
              title="确定要清空所有数据吗？"
              onConfirm={handleClear}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                style={{ marginLeft: 8 }}
                disabled={dataSource.length === 0}
              >
                清空
              </Button>
            </Popconfirm>
          </div>
          <div>
            {savedCount > 0 && <Text type="success">已成功导入 {savedCount} 条数据</Text>}
            {previewCount > 0 && savedCount === 0 && <Text type="secondary">预览: {previewCount} 条数据</Text>}
          </div>
        </div>

        {/* 数据预览表格 */}
        {dataSource.length > 0 && (
          <Table
            dataSource={dataSource}
            columns={getColumns()}
            rowKey={(_, index) => String(index)}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            bordered
          />
        )}

        {/* 导入按钮 */}
        {dataSource.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClear}>取消</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                导入数据 ({dataSource.length} 条)
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </div>
  );

  const deleteTab = (
    <div style={{ padding: 0 }}>
      <Alert
        message="批量删除说明"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              选择要删除的数据类别，系统将删除该类别下的所有主数据记录。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0, color: '#ff4d4f' }}>
              注意：此操作不可恢复！请谨慎操作。
            </Paragraph>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card size="small" style={{ marginBottom: 24 }}>
        <Checkbox.Group
          value={selectedCategories}
          onChange={handleCategoryChange}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox value="subject">
              <Space>
                <DatabaseOutlined />
                <span>会计科目</span>
                <Text type="secondary">({counts.subject || 0} 条)</Text>
              </Space>
            </Checkbox>
            <Checkbox value="customer">
              <Space>
                <TeamOutlined />
                <span>客户</span>
                <Text type="secondary">({counts.customer || 0} 条)</Text>
              </Space>
            </Checkbox>
            <Checkbox value="supplier">
              <Space>
                <ShopOutlined />
                <span>供应商</span>
                <Text type="secondary">({counts.supplier || 0} 条)</Text>
              </Space>
            </Checkbox>
            <Checkbox value="material">
              <Space>
                <ContainerOutlined />
                <span>物料</span>
                <Text type="secondary">({counts.material || 0} 条)</Text>
              </Space>
            </Checkbox>
          </Space>
        </Checkbox.Group>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Popconfirm
          title="确认批量删除"
          description={
            <div>
              <div>确定要删除以下类别的主数据吗？</div>
              <div style={{ marginTop: 8, fontWeight: 'bold' }}>
                {selectedCategories.map(c => {
                  const config = IMPORT_CONFIGS.find(cfg => cfg.key === c);
                  return `${config?.label}: ${counts[c] || 0} 条`;
                }).join('、')}
              </div>
              <div style={{ marginTop: 8, color: '#ff4d4f' }}>此操作不可恢复！</div>
            </div>
          }
          onConfirm={handleBatchDelete}
          okText="确认删除"
          cancelText="取消"
          okButtonProps={{ danger: true, loading: deleteLoading }}
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="large"
            disabled={selectedCategories.length === 0}
            loading={deleteLoading}
          >
            批量删除 ({selectedCategories.length} 个类别)
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'import',
      label: (
        <Space>
          <UploadOutlined />
          <span>批量导入</span>
        </Space>
      ),
      children: importTab,
    },
    {
      key: 'delete',
      label: (
        <Space>
          <DeleteOutlined />
          <span>批量删除</span>
        </Space>
      ),
      children: deleteTab,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false}>
        <Title level={4} style={{ marginBottom: 16 }}>
          <Space>
            <InboxOutlined />
            <span>主数据维护</span>
          </Space>
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default MasterDataMaintenance;
