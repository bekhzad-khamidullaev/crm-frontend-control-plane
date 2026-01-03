import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Progress,
  Avatar,
  Modal,
  Select,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeals, deleteDeal, dealsApi } from '../../lib/api/client';
import { getStages } from '../../lib/api/reference';
import CallButton from '../../components/CallButton';
import QuickActions from '../../components/QuickActions';
import BulkActions from '../../components/ui-BulkActions';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';

function DealsList() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [stageChangeModalVisible, setStageChangeModalVisible] = useState(false);
  const [bulkStage, setBulkStage] = useState('');
  const [stages, setStages] = useState([]);
  const [stageFilter, setStageFilter] = useState(null);

  const fetchDeals = async (page = 1, search = '', stage = stageFilter) => {
    setLoading(true);
    try {
      const response = await getDeals({
        page,
        page_size: pagination.pageSize,
        search,
        stage: stage || undefined,
      });
      setDeals(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки сделок');
      setDeals([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(1, searchText, stageFilter);
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const response = await getStages({ page_size: 200 });
      setStages(response.results || response || []);
    } catch (error) {
      console.error('Error loading deal stages:', error);
      setStages([]);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchDeals(1, value, stageFilter);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      message.success('Сделка удалена');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка удаления сделки');
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchDeals(newPagination.current, searchText, stageFilter);
  };

  // Bulk actions handlers
  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteDeal(id)));
      message.success(`Удалено ${ids.length} сделок`);
      setSelectedRowKeys([]);
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка массового удаления');
    }
  };

  const handleBulkStageChange = () => {
    setStageChangeModalVisible(true);
  };

  const handleStageChangeConfirm = async () => {
    if (!bulkStage) {
      message.error('Выберите стадию');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map(id =>
          dealsApi.patch(id, { stage: Number(bulkStage) })
        )
      );
      message.success(`Стадия изменена для ${selectedRowKeys.length} сделок`);
      setSelectedRowKeys([]);
      setStageChangeModalVisible(false);
      setBulkStage('');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка изменения стадии');
    }
  };

  const exportColumns = [
    { key: 'name', label: 'Название' },
    { key: 'amount', label: 'Сумма' },
    { key: 'currency_name', label: 'Валюта' },
    { key: 'stage_name', label: 'Стадия' },
    { key: 'company_name', label: 'Компания' },
    { key: 'contact_name', label: 'Контакт' },
    { key: 'owner_name', label: 'Ответственный' },
  ];

  const buildExportRows = (ids = []) => {
    const source = ids.length ? deals.filter((deal) => ids.includes(deal.id)) : deals;
    return source;
  };

  const performExport = (format, ids = []) => {
    const rows = buildExportRows(ids);
    if (!rows.length) {
      message.warning('Нет данных для экспорта');
      return;
    }
    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const filename = `deals_${new Date().toISOString().split('T')[0]}.${ext}`;
    if (format === 'excel') {
      exportToExcel(rows, exportColumns, filename);
    } else {
      exportToCSV(rows, exportColumns, filename);
    }
    message.success('Данные экспортированы');
  };

  const handleBulkExport = (ids) => {
    performExport('csv', ids);
  };

  const handleDuplicate = async (record) => {
    try {
      const {
        id,
        creation_date,
        update_date,
        workflow,
        ticket,
        stage_name,
        stages_dates,
        ...payload
      } = record;
      const baseName = record.name || record.title || 'Сделка';
      const newDeal = {
        ...payload,
        name: `${baseName} (копия)`,
      };
      await dealsApi.create(newDeal);
      message.success('Сделка дублирована');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка дублирования сделки');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {});
  }, [stages]);

  const stageOptions = stages.map((stage) => ({
    label: stage.name,
    value: stage.id,
  }));

  // Обработчики для QuickActions
  const handleChangeStage = async (record, newStage) => {
    try {
      await dealsApi.patch(record.id, { stage: Number(newStage) });
      message.success('Стадия сделки изменена');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка изменения стадии');
    }
  };

  const handleArchive = async (record) => {
    try {
      await dealsApi.patch(record.id, { active: false });
      message.success('Сделка архивирована');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      message.error('Ошибка архивирования');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {(record.company_name || record.company) && (
            <div style={{ fontSize: 12, color: '#999' }}>
              <ShopOutlined /> {record.company_name || record.company}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount, record) => {
        const numeric = Number(amount);
        const formatted = Number.isFinite(numeric)
          ? numeric.toLocaleString('ru-RU')
          : amount || '0';
        return (
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontWeight: 500 }}>
              {formatted} {record.currency_name || '₽'}
            </span>
          </Space>
        );
      },
      sorter: (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
    },
    {
      title: 'Стадия',
      dataIndex: 'stage',
      key: 'stage',
      width: 140,
      render: (stage, record) => {
        const label = record.stage_name || stageMap[stage];
        const display = label || (stage ? `Этап #${stage}` : '-');
        return stage ? <Tag color="blue">{display}</Tag> : '-';
      },
      filters: stageOptions,
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      key: 'probability',
      width: 120,
      render: (probability) => {
        const value = Number(probability || 0);
        return (
          <Progress
            percent={value}
            size="small"
            status={value >= 70 ? 'success' : value >= 40 ? 'normal' : 'exception'}
          />
        );
      },
      sorter: (a, b) => Number(a.probability || 0) - Number(b.probability || 0),
    },
    {
      title: 'Контакт',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontSize: 13 }}>
              {record.contact_name || record.contact_full_name || (record.contact ? `#${record.contact}` : '-')}
            </div>
            {record.contact_phone && (
              <div style={{ fontSize: 11, color: '#999' }}>{record.contact_phone}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
      render: (owner, record) => record.owner_name || owner || '-',
      sorter: (a, b) => (a.owner_name || a.owner || '').toString().localeCompare((b.owner_name || b.owner || '').toString()),
    },
    {
      title: 'Закрытие',
      dataIndex: 'closing_date',
      key: 'closing_date',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const closeDate = new Date(date);
        const today = new Date();
        const daysLeft = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <div style={{ fontSize: 13 }}>{closeDate.toLocaleDateString('ru-RU')}</div>
            {daysLeft > 0 && daysLeft <= 7 && (
              <div style={{ fontSize: 11, color: '#faad14' }}>через {daysLeft} дн.</div>
            )}
            {daysLeft < 0 && (
              <div style={{ fontSize: 11, color: '#ff4d4f' }}>просрочено</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.closing_date) - new Date(b.closing_date),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {record.contact_phone && (
            <CallButton
              phone={record.contact_phone}
              name={record.contact}
              entityType="deal"
              entityId={record.id}
              size="small"
            />
          )}
          <QuickActions
            record={record}
            onView={(r) => navigate(`/deals/${r.id}`)}
            onEdit={(r) => navigate(`/deals/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
            onDuplicate={handleDuplicate}
            onCall={record.contact_phone ? (r) => window.open(`tel:${r.contact_phone}`) : null}
            onChangeStatus={(r) => {
              Modal.confirm({
                title: 'Изменить стадию',
                content: (
                  <Select
                    id="stage-select"
                    style={{ width: '100%', marginTop: 16 }}
                    placeholder="Выберите стадию"
                    options={stageOptions}
                  />
                ),
                onOk: () => {
                  const newStage = document.getElementById('stage-select')?.value;
                  if (newStage) handleChangeStage(r, newStage);
                },
              });
            }}
            onArchive={handleArchive}
          />
        </Space>
      ),
    },
  ];

  const handleExport = (format) => {
    performExport(format, selectedRowKeys);
  };

  // Фильтры для toolbar
  const stageFilters = stageOptions;

  return (
    <div>
      <TableToolbar
        title="Сделки"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, компании, контакту..."
        onSearch={handleSearch}
        onCreate={() => navigate('/deals/new')}
        onExport={handleExport}
        onRefresh={() => fetchDeals(pagination.current, searchText, stageFilter)}
        filters={[
          {
            key: 'stage',
            placeholder: 'Стадия',
            options: stageFilters,
            width: 150,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'stage') {
            setStageFilter(value || null);
            fetchDeals(1, searchText, value || null);
          }
        }}
        createButtonText="Создать сделку"
        showViewModeSwitch={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={deals}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        scroll={{ x: 1500 }}
        showTotal={true}
        showSizeChanger={true}
        showQuickJumper={true}
        emptyText="Нет сделок"
        emptyDescription="Создайте первую сделку или измените параметры поиска"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStageChange}
        onExport={handleBulkExport}
        entityName="сделок"
      />

      <Modal
        title="Изменить стадию сделок"
        open={stageChangeModalVisible}
        onCancel={() => setStageChangeModalVisible(false)}
        onOk={handleStageChangeConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Изменить стадию для {selectedRowKeys.length} выбранных сделок</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Выберите стадию"
          value={bulkStage}
          onChange={setBulkStage}
        >
          {stageOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default DealsList;
