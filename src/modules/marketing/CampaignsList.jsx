import React, { useEffect, useState } from 'react';
import { App, Button, Card, DatePicker, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { activateCampaign, cloneCampaign, completeCampaign, deleteCampaign, getCampaigns, patchCampaign, pauseCampaign } from '../../lib/api/marketing';
import { canWrite } from '../../lib/rbac.js';
import QuickActions from '../../components/QuickActions.jsx';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { PageHeader } from '../../shared/ui/PageHeader';

const { Text } = Typography;

function CampaignsList({ embedded = false }) {
  const { message } = App.useApp();
  const canManage = canWrite('marketing.change_campaign');
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaignsCache, setAllCampaignsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startRange, setStartRange] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchCampaigns(1, searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCampaigns(1, searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startRange]);

  const fetchCampaigns = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize, search };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startRange && startRange.length === 2) {
        params.start_date_after = startRange[0].format('YYYY-MM-DD');
        params.start_date_before = startRange[1].format('YYYY-MM-DD');
      }
      const response = await getCampaigns(params);
      const results = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
          ? response.results
          : [];
      const parsedCount = Number(response?.count);
      const totalCount = Number.isFinite(parsedCount) && parsedCount >= results.length
        ? parsedCount
        : results.length;

      if (results.length > pageSize && results.length === totalCount) {
        setAllCampaignsCache(results);
        const startIndex = (page - 1) * pageSize;
        setCampaigns(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllCampaignsCache(null);
        setCampaigns(results);
      }

      setPagination((prev) => ({ ...prev, current: page, pageSize, total: totalCount }));
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить кампании');
      message.error('Ошибка загрузки кампаний');
      setCampaigns([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCampaigns(1, value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setStartRange(null);
    fetchCampaigns(1, '');
  };

  const handleDelete = async (id) => {
    try {
      await deleteCampaign(id);
      message.success('Кампания удалена');
      fetchCampaigns(pagination.current, searchText);
    } catch {
      message.error('Ошибка удаления кампании');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await patchCampaign(record.id, { is_active: !record.is_active });
      message.success('Статус обновлен');
      fetchCampaigns(pagination.current, searchText);
    } catch {
      message.error('Ошибка обновления статуса');
    }
  };

  const handleStatusTransition = async (record, nextStatus) => {
    try {
      if (nextStatus === 'active') await activateCampaign(record.id);
      if (nextStatus === 'paused') await pauseCampaign(record.id);
      if (nextStatus === 'completed') await completeCampaign(record.id);
      message.success('Статус кампании обновлен');
      fetchCampaigns(pagination.current, searchText);
    } catch {
      message.error('Не удалось обновить статус кампании');
    }
  };

  const handleClone = async (record) => {
    try {
      await cloneCampaign(record.id, `${record.name || 'Кампания'} (копия)`);
      message.success('Кампания клонирована');
      fetchCampaigns(1, searchText);
    } catch {
      message.error('Не удалось клонировать кампанию');
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;

    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllCampaignsCache(null);
      fetchCampaigns(nextPage, searchText, nextPageSize);
      return;
    }

    if (allCampaignsCache && allCampaignsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setCampaigns(allCampaignsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchCampaigns(nextPage, searchText, nextPageSize);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => <a onClick={() => navigate(`/campaigns/${record.id}`)}>{name}</a>,
    },
    { title: 'Сегмент', dataIndex: 'segment_name', key: 'segment_name', render: (value) => value || '-' },
    { title: 'Шаблон', dataIndex: 'template_name', key: 'template_name', render: (value) => value || '-' },
    { title: 'Дата старта', dataIndex: 'start_at', key: 'start_at', render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-') },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'active' || record.is_active) return <Tag color="success">Активна</Tag>;
        if (normalized === 'paused') return <Tag color="warning">Пауза</Tag>;
        if (normalized === 'completed') return <Tag color="processing">Завершена</Tag>;
        return <Tag>Черновик</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <QuickActions
            record={record}
            onView={(r) => navigate(`/campaigns/${r.id}`)}
            onEdit={canManage ? (r) => navigate(`/campaigns/${r.id}/edit`) : undefined}
            onDelete={canManage ? (r) => handleDelete(r.id) : undefined}
            onArchive={canManage ? () => handleToggleActive(record) : undefined}
            canManage={canManage}
          />
        </Space>
      ),
    },
  ];

  const content = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {embedded ? (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Кампании</Text>
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/new')}>
              Создать кампанию
            </Button>
          ) : null}
        </Space>
      ) : null}

      <EntityListToolbar
        searchValue={searchText}
        searchPlaceholder="Поиск по названию..."
        onSearchChange={handleSearch}
        filters={(
          <Space wrap>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
              }}
              style={{ width: 170 }}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'draft', label: 'Черновик' },
                { value: 'active', label: 'Активна' },
                { value: 'paused', label: 'Пауза' },
                { value: 'completed', label: 'Завершена' },
              ]}
            />
            <DatePicker.RangePicker
              value={startRange}
              onChange={(range) => {
                setStartRange(range || null);
              }}
              format="DD.MM.YYYY"
            />
          </Space>
        )}
        onRefresh={() => fetchCampaigns(pagination.current, searchText)}
        onReset={handleResetFilters}
        loading={loading}
        resultSummary={`Всего: ${pagination.total}`}
        activeFilters={[
          ...(searchText ? [{ key: 'search', label: 'Поиск', value: searchText, onClear: () => setSearchText('') }] : []),
          ...(statusFilter !== 'all' ? [{ key: 'status', label: 'Статус', value: statusFilter, onClear: () => setStatusFilter('all') }] : []),
        ]}
      />

      {error ? <Text type="danger">{error}</Text> : null}

      <Table
        columns={columns}
        dataSource={campaigns}
        loading={loading}
        rowKey="id"
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
        locale={{ emptyText: 'Нет кампаний' }}
        expandable={{
          expandedRowRender: (record) => (
            <Space size={8} wrap>
              <Button size="small" onClick={() => handleClone(record)}>Клонировать</Button>
              <Button size="small" onClick={() => handleStatusTransition(record, 'active')}>Запустить</Button>
              <Button size="small" onClick={() => handleStatusTransition(record, 'paused')}>Пауза</Button>
              <Button size="small" onClick={() => handleStatusTransition(record, 'completed')}>Завершить</Button>
              <Button size="small" onClick={() => handleToggleActive(record)}>
                {record.is_active ? 'Отключить флаг active' : 'Включить флаг active'}
              </Button>
            </Space>
          ),
          rowExpandable: () => true,
        }}
      />
    </Space>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <PageHeader
        title="Кампании"
        subtitle="Список маркетинговых кампаний"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/new')}>Создать кампанию</Button>
          ) : null
        }
      />
      <Card>
        {content}
      </Card>
    </>
  );
}

export default CampaignsList;
