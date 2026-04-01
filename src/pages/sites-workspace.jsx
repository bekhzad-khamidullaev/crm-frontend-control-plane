import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { landingsApi } from '../lib/api/client.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';
import { navigate } from '../router.js';

const statusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'published') return <Tag color="success">Опубликован</Tag>;
  if (normalized === 'draft') return <Tag color="warning">Черновик</Tag>;
  if (normalized === 'archived') return <Tag>Архив</Tag>;
  return <Tag>{status || '-'}</Tag>;
};

export default function SitesWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sites, setSites] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await landingsApi.list({ page_size: 300, ordering: '-updated_at' });
      setSites(toResults(response));
    } catch (err) {
      setSites([]);
      setError('Не удалось загрузить список сайтов/лендингов.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSites = useMemo(
    () =>
      sites.filter((item) =>
        containsText(item.title, search)
        || containsText(item.slug, search)
        || containsText(item.status, search)
      ),
    [sites, search],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Сайты"
        subtitle="Управление лендингами и web-воронками."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по сайтам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Сайты: ${filteredSites.length}`}
      />
      <Button type="primary" onClick={() => navigate('/landing-builder')}>Открыть конструктор</Button>
      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredSites}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          columns={[
            { title: 'Сайт', dataIndex: 'title', key: 'title', render: (value, record) => value || record.slug || 'Сайт' },
            { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (value) => value || '-' },
            { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => statusTag(value) },
            { title: 'Активен', dataIndex: 'is_active', key: 'is_active', render: (value) => value ? <Tag color="success">Да</Tag> : <Tag>Нет</Tag> },
            { title: 'Обновлено', dataIndex: 'updated_at', key: 'updated_at', render: (value) => formatDateSafe(value) },
          ]}
        />
      </Card>
    </Space>
  );
}
