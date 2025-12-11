import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Progress,
  Avatar,
  Modal,
  Select,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeals, deleteDeal, dealsApi } from '../../lib/api/client';
import CallButton from '../../components/CallButton';
import QuickActions from '../../components/QuickActions';
import BulkActions from '../../components/ui-BulkActions';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { exportAndDownload } from '../../lib/api/export';

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

  const fetchDeals = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getDeals({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setDeals(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки сделок');
      // Mock data for demo
      setDeals([
        {
          id: 1,
          title: 'Поставка оборудования',
          amount: 1500000,
          stage: 'negotiation',
          probability: 70,
          expected_close_date: '2024-03-15',
          contact: 'Иван Петров',
          contact_phone: '+7 999 111-22-33',
          company: 'ООО "ТехноПром"',
          owner: 'Алексей Иванов',
          created_at: '2024-01-20',
        },
        {
          id: 2,
          title: 'Внедрение CRM системы',
          amount: 850000,
          stage: 'proposal',
          probability: 50,
          expected_close_date: '2024-03-30',
          contact: 'Мария Сидорова',
          contact_phone: '+7 999 222-33-44',
          company: 'АО "Инновации"',
          owner: 'Елена Смирнова',
          created_at: '2024-01-18',
        },
        {
          id: 3,
          title: 'Консалтинговые услуги',
          amount: 450000,
          stage: 'closed_won',
          probability: 100,
          expected_close_date: '2024-02-28',
          contact: 'Дмитрий Козлов',
          company: 'ИП Козлов',
          owner: 'Алексей Иванов',
          created_at: '2024-01-15',
        },
      ]);
      setPagination({
        ...pagination,
        current: 1,
        total: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(1, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchDeals(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      message.success('Сделка удалена');
      fetchDeals(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка удаления сделки');
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchDeals(newPagination.current, searchText);
  };

  // Bulk actions handlers
  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteDeal(id)));
      message.success(`Удалено ${ids.length} сделок`);
      setSelectedRowKeys([]);
      fetchDeals(pagination.current, searchText);
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
          dealsApi.patch(id, { stage: bulkStage })
        )
      );
      message.success(`Стадия изменена для ${selectedRowKeys.length} сделок`);
      setSelectedRowKeys([]);
      setStageChangeModalVisible(false);
      setBulkStage('');
      fetchDeals(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка изменения стадии');
    }
  };

  const handleBulkExport = async () => {
    try {
      await exportAndDownload('deals', {
        format: 'csv',
        filters: { id__in: selectedRowKeys.join(',') },
      });
      message.success('Данные экспортированы');
    } catch (error) {
      message.error('Ошибка экспорта данных');
    }
  };

  const handleDuplicate = async (record) => {
    try {
      const newDeal = { ...record };
      delete newDeal.id;
      newDeal.title = `${record.title} (копия)`;
      await dealsApi.create(newDeal);
      message.success('Сделка дублирована');
      fetchDeals(pagination.current, searchText);
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

  const stageConfig = {
    lead: { color: 'default', text: 'Лид' },
    qualification: { color: 'blue', text: 'Квалификация' },
    meeting: { color: 'cyan', text: 'Встреча' },
    proposal: { color: 'orange', text: 'Предложение' },
    negotiation: { color: 'gold', text: 'Переговоры' },
    closed_won: { color: 'green', text: 'Выиграна' },
    closed_lost: { color: 'red', text: 'Проиграна' },
  };

  // Обработчики для QuickActions
  const handleChangeStage = async (record, newStage) => {
    try {
      await dealsApi.patch(record.id, { stage: newStage });
      message.success('Стадия сделки изменена');
      fetchDeals(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка изменения стадии');
    }
  };

  const handleArchive = async (record) => {
    try {
      await dealsApi.patch(record.id, { is_archived: true });
      message.success('Сделка архивирована');
      fetchDeals(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка архивирования');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          {record.company && (
            <div style={{ fontSize: 12, color: '#999' }}>
              <ShopOutlined /> {record.company}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{amount.toLocaleString('ru-RU')} ₽</span>
        </Space>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Стадия',
      dataIndex: 'stage',
      key: 'stage',
      width: 140,
      render: (stage) => {
        const config = stageConfig[stage] || stageConfig.lead;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(stageConfig).map((key) => ({
        text: stageConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      key: 'probability',
      width: 120,
      render: (probability) => (
        <Progress
          percent={probability}
          size="small"
          status={probability >= 70 ? 'success' : probability >= 40 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a, b) => a.probability - b.probability,
    },
    {
      title: 'Контакт',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontSize: 13 }}>{record.contact}</div>
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
      sorter: (a, b) => (a.owner || '').localeCompare(b.owner || ''),
    },
    {
      title: 'Закрытие',
      dataIndex: 'expected_close_date',
      key: 'expected_close_date',
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
      sorter: (a, b) => new Date(a.expected_close_date) - new Date(b.expected_close_date),
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
                    options={Object.keys(stageConfig).map(key => ({
                      label: stageConfig[key].text,
                      value: key,
                    }))}
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

  const handleExport = async (format) => {
    try {
      await exportAndDownload('deals', {
        format: format === 'excel' ? 'xlsx' : 'csv',
        filters: selectedRowKeys.length > 0 ? { id__in: selectedRowKeys.join(',') } : {},
      });
      message.success(`Данные экспортированы в ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Ошибка экспорта данных');
    }
  };

  // Фильтры для toolbar
  const stageFilters = Object.keys(stageConfig).map(key => ({
    label: stageConfig[key].text,
    value: key,
  }));

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
        onRefresh={() => fetchDeals(pagination.current, searchText)}
        filters={[
          {
            key: 'stage',
            placeholder: 'Стадия',
            options: stageFilters,
            width: 150,
          },
        ]}
        onFilterChange={(key, value) => {
          // Здесь можно добавить логику фильтрации
          message.info(`Фильтр ${key}: ${value}`);
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
          {Object.keys(stageConfig).map(key => (
            <Select.Option key={key} value={key}>
              {stageConfig[key].text}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default DealsList;
