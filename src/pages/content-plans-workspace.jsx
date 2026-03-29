import { CalendarOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Statistic, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCampaigns, getSegments, getTemplates } from '../lib/api/marketing.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';

const campaignStatusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return <Tag color="success">Активна</Tag>;
  if (normalized === 'paused') return <Tag color="warning">Пауза</Tag>;
  if (normalized === 'completed') return <Tag color="processing">Завершена</Tag>;
  return <Tag>{status || 'Черновик'}</Tag>;
};

export default function ContentPlansWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [campaignsRes, segmentsRes, templatesRes] = await Promise.allSettled([
      getCampaigns({ page_size: 300, ordering: '-update_date' }),
      getSegments({ page_size: 300, ordering: '-update_date' }),
      getTemplates({ page_size: 300, ordering: '-update_date' }),
    ]);

    setCampaigns(campaignsRes.status === 'fulfilled' ? toResults(campaignsRes.value) : []);
    setSegments(segmentsRes.status === 'fulfilled' ? toResults(segmentsRes.value) : []);
    setTemplates(templatesRes.status === 'fulfilled' ? toResults(templatesRes.value) : []);

    const hasFailure = [campaignsRes, segmentsRes, templatesRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть контент-данных недоступна. Показаны доступные записи.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCampaigns = useMemo(
    () => campaigns.filter((item) => containsText(item.name, search) || containsText(item.type, search) || containsText(item.status, search)),
    [campaigns, search],
  );
  const filteredSegments = useMemo(
    () => segments.filter((item) => containsText(item.name, search) || containsText(item.description, search)),
    [segments, search],
  );
  const filteredTemplates = useMemo(
    () => templates.filter((item) => containsText(item.name, search) || containsText(item.type, search) || containsText(item.subject, search)),
    [templates, search],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Контент планы"
        subtitle="Планирование контента и маркетинговых активностей по сегментам и каналам."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по планам контента"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Кампании: ${filteredCampaigns.length} | Сегменты: ${filteredSegments.length} | Шаблоны: ${filteredTemplates.length}`}
      />

      <Space size={16} wrap>
        <Card size="small">
          <Statistic title="Кампании" value={filteredCampaigns.length} prefix={<CalendarOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="Активные кампании" value={filteredCampaigns.filter((item) => String(item.status || '').toLowerCase() === 'active').length} />
        </Card>
      </Space>

      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'plans',
              label: 'Контент план',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredCampaigns}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Кампания', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Тип', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => campaignStatusTag(value) },
                    { title: 'Старт', dataIndex: 'start_date', key: 'start_date', render: (value) => formatDateSafe(value) },
                    { title: 'Окончание', dataIndex: 'end_date', key: 'end_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'segments',
              label: 'Сегменты',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredSegments}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Сегмент', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'templates',
              label: 'Шаблоны',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredTemplates}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Шаблон', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Канал', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                    { title: 'Тема', dataIndex: 'subject', key: 'subject', render: (value) => value || '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
