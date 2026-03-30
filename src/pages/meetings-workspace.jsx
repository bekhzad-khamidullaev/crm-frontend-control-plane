import { Alert, Card, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCallLogs } from '../lib/api/calls.js';
import { getUpcomingReminders } from '../lib/api/reminders.js';
import { getTasks } from '../lib/api/tasks.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';

const reminderStatusTag = (item) => {
  const active = item?.active;
  if (active === false) return <Tag color="default">Закрыто</Tag>;
  return <Tag color="processing">Запланировано</Tag>;
};

const callDirectionTag = (direction) => {
  const normalized = String(direction || '').toLowerCase();
  if (normalized === 'inbound') return <Tag color="processing">Входящий</Tag>;
  if (normalized === 'outbound') return <Tag color="blue">Исходящий</Tag>;
  return <Tag>{direction || '-'}</Tag>;
};

export default function MeetingsWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reminders, setReminders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [tasks, setTasks] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [remindersRes, callsRes, tasksRes] = await Promise.allSettled([
      getUpcomingReminders({ page_size: 300 }),
      getCallLogs({ page_size: 200, ordering: '-timestamp' }),
      getTasks({ page_size: 300, ordering: 'due_date' }),
    ]);

    setReminders(remindersRes.status === 'fulfilled' ? toResults(remindersRes.value) : []);
    setCalls(callsRes.status === 'fulfilled' ? toResults(callsRes.value) : []);
    setTasks(tasksRes.status === 'fulfilled' ? toResults(tasksRes.value) : []);

    const hasFailure = [remindersRes, callsRes, tasksRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть данных по встречам недоступна. Показаны доступные источники.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReminders = useMemo(
    () => reminders.filter((item) => containsText(item.subject, search) || containsText(item.description, search)),
    [reminders, search],
  );

  const filteredCalls = useMemo(
    () => calls.filter((item) => containsText(item.number, search) || containsText(item.contact_name, search) || containsText(item.direction, search)),
    [calls, search],
  );

  const taskMeetings = useMemo(
    () => tasks.filter((item) => containsText(item.name, search) || containsText(item.next_step, search)).slice(0, 200),
    [tasks, search],
  );

  const todayMeetings = useMemo(() => {
    const today = new Date();
    const key = today.toDateString();
    return filteredReminders.filter((item) => {
      if (!item.reminder_date) return false;
      const value = new Date(item.reminder_date);
      if (Number.isNaN(value.getTime())) return false;
      return value.toDateString() === key;
    }).length;
  }, [filteredReminders]);

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Встречи"
        subtitle="Планирование встреч, звонков и follow-up задач в одном окне."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по встречам, звонкам и задачам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Напоминания: ${filteredReminders.length} | Звонки: ${filteredCalls.length} | Follow-up: ${taskMeetings.length}`}
      />
      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'reminders',
              label: 'Календарь встреч',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredReminders}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Тема', dataIndex: 'subject', key: 'subject', render: (value) => value || '-' },
                    { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
                    { title: 'Дата и время', dataIndex: 'reminder_date', key: 'reminder_date', render: (value) => formatDateSafe(value) },
                    { title: 'Статус', key: 'status', render: (_, record) => reminderStatusTag(record) },
                  ]}
                />
              ),
            },
            {
              key: 'calls',
              label: 'Звонки',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredCalls}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Дата', dataIndex: 'timestamp', key: 'timestamp', render: (value) => formatDateSafe(value) },
                    { title: 'Контакт', dataIndex: 'contact_name', key: 'contact_name', render: (value) => value || '-' },
                    { title: 'Номер', dataIndex: 'number', key: 'number', render: (value) => value || '-' },
                    { title: 'Направление', dataIndex: 'direction', key: 'direction', render: (value) => callDirectionTag(value) },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => value || '-' },
                  ]}
                />
              ),
            },
            {
              key: 'follow-up',
              label: 'Follow-up',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={taskMeetings}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Задача', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Следующий шаг', dataIndex: 'next_step', key: 'next_step', render: (value) => value || '-' },
                    { title: 'Дата шага', dataIndex: 'next_step_date', key: 'next_step_date', render: (value) => formatDateSafe(value) },
                    {
                      title: 'Дедлайн',
                      dataIndex: 'due_date',
                      key: 'due_date',
                      render: (value) => {
                        if (!value) return '-';
                        const due = new Date(value);
                        if (Number.isNaN(due.getTime())) return value;
                        return <Tag color={due.getTime() < Date.now() ? 'error' : 'processing'}>{formatDateSafe(value)}</Tag>;
                      },
                    },
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
