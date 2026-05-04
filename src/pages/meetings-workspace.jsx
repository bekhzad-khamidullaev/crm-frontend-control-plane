import { Alert, App, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EditableCell from '@/components/editable-cell';
import { getCallLogs } from '../lib/api/calls.js';
import { getUpcomingReminders, patchReminder } from '../lib/api/reminders.js';
import { getTasks, patchTask } from '../lib/api/tasks.js';
import { BusinessEntityListShell } from '../components/business/BusinessEntityListShell';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';
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
  const { message } = App.useApp();
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
  const overdueFollowUps = useMemo(
    () =>
      taskMeetings.filter((item) => {
        if (!item?.due_date) return false;
        const due = new Date(item.due_date);
        if (Number.isNaN(due.getTime())) return false;
        return due.getTime() < Date.now();
      }).length,
    [taskMeetings],
  );
  const summaryItems = useMemo(
    () => [
      { key: 'today', label: 'Встречи сегодня', value: todayMeetings },
      { key: 'calls', label: 'Звонки в работе', value: filteredCalls.length },
      { key: 'followUp', label: 'Follow-up задачи', value: taskMeetings.length },
      { key: 'overdue', label: 'Просроченные follow-up', value: overdueFollowUps },
    ],
    [todayMeetings, filteredCalls.length, taskMeetings.length, overdueFollowUps],
  );

  const reminderStatusOptions = useMemo(
    () => [
      { value: true, label: 'Запланировано' },
      { value: false, label: 'Закрыто' },
    ],
    [],
  );

  const taskStatusOptions = useMemo(
    () => [
      { value: 'new', label: 'Не начато' },
      { value: 'in_progress', label: 'В работе' },
      { value: 'on_review', label: 'На проверке' },
      { value: 'completed', label: 'Завершено' },
      { value: 'cancelled', label: 'Отменено' },
    ],
    [],
  );

  const renderTaskStatus = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'completed') return <Tag color="success">Завершено</Tag>;
    if (normalized === 'cancelled') return <Tag color="error">Отменено</Tag>;
    if (normalized === 'in_progress') return <Tag color="processing">В работе</Tag>;
    if (normalized === 'on_review') return <Tag color="warning">На проверке</Tag>;
    return <Tag>{value || 'Не начато'}</Tag>;
  };

  const handleInlineSave = async (entity, record, dataIndex, value) => {
    const prevReminders = reminders;
    const prevTasks = tasks;

    let normalizedValue = value;
    if ((dataIndex === 'reminder_date' || dataIndex === 'due_date' || dataIndex === 'next_step_date') && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }

    const patch = { [dataIndex]: normalizedValue };
    if (entity === 'reminder') {
      setReminders((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }
    if (entity === 'task') {
      setTasks((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }

    try {
      if (entity === 'reminder') await patchReminder(record.id, patch);
      if (entity === 'task') await patchTask(record.id, patch);
      message.success('Изменения сохранены');
    } catch (saveError) {
      setReminders(prevReminders);
      setTasks(prevTasks);
      message.error('Не удалось сохранить изменения');
      throw saveError;
    }
  };

  return (
    <BusinessEntityListShell
      title="Встречи"
      subtitle="Планирование встреч, звонков и follow-up задач в одном окне."
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
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
      <WorkspaceSummaryStrip items={summaryItems} />

      <WorkspaceTabsShell>
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
                    {
                      title: 'Тема',
                      dataIndex: 'subject',
                      key: 'subject',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="subject"
                          onSave={(r, key, nextValue) => handleInlineSave('reminder', r, key, nextValue)}
                          placeholder="Тема напоминания"
                        />
                      ),
                    },
                    { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
                    {
                      title: 'Дата и время',
                      dataIndex: 'reminder_date',
                      key: 'reminder_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="reminder_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('reminder', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Статус',
                      key: 'status',
                      render: (_, record) => (
                        <EditableCell
                          value={record.active !== false}
                          record={record}
                          dataIndex="active"
                          type="select"
                          options={reminderStatusOptions}
                          saveOnBlur={false}
                          onSave={(r, key, nextValue) => handleInlineSave('reminder', r, key, nextValue)}
                          renderView={(val) => reminderStatusTag({ active: val })}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
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
                    {
                      title: 'Следующий шаг',
                      dataIndex: 'next_step',
                      key: 'next_step',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="next_step"
                          onSave={(r, key, nextValue) => handleInlineSave('task', r, key, nextValue)}
                          placeholder="Следующий шаг"
                        />
                      ),
                    },
                    {
                      title: 'Дата шага',
                      dataIndex: 'next_step_date',
                      key: 'next_step_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="next_step_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('task', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="status"
                          type="select"
                          options={taskStatusOptions}
                          saveOnBlur={false}
                          onSave={(r, key, nextValue) => handleInlineSave('task', r, key, nextValue)}
                          renderView={(val) => renderTaskStatus(val)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Дедлайн',
                      dataIndex: 'due_date',
                      key: 'due_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="due_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('task', r, key, nextValue)}
                          renderView={(viewDate) => {
                            if (!viewDate) return '-';
                            const due = new Date(viewDate);
                            if (Number.isNaN(due.getTime())) return viewDate;
                            return <Tag color={due.getTime() < Date.now() ? 'error' : 'processing'}>{formatDateSafe(viewDate)}</Tag>;
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </WorkspaceTabsShell>
      </Space>
    </BusinessEntityListShell>
  );
}
