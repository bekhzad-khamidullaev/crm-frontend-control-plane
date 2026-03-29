import { OrderedListOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Statistic, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getDeals } from '../lib/api/deals.js';
import { getLeads } from '../lib/api/leads.js';
import { getTasks } from '../lib/api/tasks.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';
import { navigate } from '../router.js';

export default function BacklogWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [tasksRes, dealsRes, leadsRes] = await Promise.allSettled([
      getTasks({ page_size: 300, ordering: 'due_date' }),
      getDeals({ page_size: 300, ordering: 'next_step_date' }),
      getLeads({ page_size: 300, ordering: 'was_in_touch' }),
    ]);

    setTasks(tasksRes.status === 'fulfilled' ? toResults(tasksRes.value) : []);
    setDeals(dealsRes.status === 'fulfilled' ? toResults(dealsRes.value) : []);
    setLeads(leadsRes.status === 'fulfilled' ? toResults(leadsRes.value) : []);

    const hasFailure = [tasksRes, dealsRes, leadsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть backlog-данных недоступна. Показаны доступные записи.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const backlogTasks = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter((item) => containsText(item.name, search) || containsText(item.next_step, search))
      .filter((item) => {
        const doneStatuses = ['done', 'completed', 'closed', 'cancelled', 'canceled'];
        if (doneStatuses.includes(String(item?.status || '').toLowerCase())) return false;
        if (!item?.due_date) return true;
        const dueDate = new Date(item.due_date);
        if (Number.isNaN(dueDate.getTime())) return true;
        return dueDate.getTime() <= now;
      });
  }, [tasks, search]);

  const backlogDeals = useMemo(
    () =>
      deals
        .filter((item) => containsText(item.name, search) || containsText(item.company_name, search))
        .filter((item) => item.active !== false && !item.next_step_date),
    [deals, search],
  );

  const backlogLeads = useMemo(
    () =>
      leads
        .filter((item) => containsText(item.full_name || item.first_name || item.company_name, search) || containsText(item.email, search))
        .filter((item) => !item.was_in_touch),
    [leads, search],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Беклог"
        subtitle="Очередь приоритетных элементов: просроченные задачи, сделки без next step и лиды без контакта."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по backlog"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Задачи: ${backlogTasks.length} | Сделки: ${backlogDeals.length} | Лиды: ${backlogLeads.length}`}
      />

      <Space size={16} wrap>
        <Card size="small">
          <Statistic title="Всего в backlog" value={backlogTasks.length + backlogDeals.length + backlogLeads.length} prefix={<OrderedListOutlined />} />
        </Card>
      </Space>

      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'tasks',
              label: 'Задачи',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={backlogTasks}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Задача', dataIndex: 'name', key: 'name', render: (value, record) => <a onClick={() => navigate(`/tasks/${record.id}`)}>{value || `#${record.id}`}</a> },
                    { title: 'Следующий шаг', dataIndex: 'next_step', key: 'next_step', render: (value) => value || '-' },
                    { title: 'Дедлайн', dataIndex: 'due_date', key: 'due_date', render: (value) => value ? <Tag color="error">{formatDateSafe(value)}</Tag> : <Tag color="warning">Не указан</Tag> },
                  ]}
                />
              ),
            },
            {
              key: 'deals',
              label: 'Сделки без next step',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={backlogDeals}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Сделка', dataIndex: 'name', key: 'name', render: (value, record) => <a onClick={() => navigate(`/deals/${record.id}`)}>{value || `#${record.id}`}</a> },
                    { title: 'Компания', dataIndex: 'company_name', key: 'company_name', render: (value) => value || '-' },
                    { title: 'Стадия', dataIndex: 'stage_name', key: 'stage_name', render: (value) => value || '-' },
                    { title: 'Next step', key: 'next_step', render: () => <Tag color="warning">Не заполнен</Tag> },
                  ]}
                />
              ),
            },
            {
              key: 'leads',
              label: 'Лиды без контакта',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={backlogLeads}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Лид', key: 'lead', render: (_, record) => <a onClick={() => navigate(`/leads/${record.id}`)}>{record.full_name || record.first_name || record.company_name || `#${record.id}`}</a> },
                    { title: 'Email', dataIndex: 'email', key: 'email', render: (value) => value || '-' },
                    { title: 'Телефон', dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
                    { title: 'Контакт', key: 'touch', render: () => <Tag color="error">Не выполнен</Tag> },
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
