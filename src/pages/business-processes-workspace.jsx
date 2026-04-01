import { Alert, Card, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getProjects } from '../lib/api/projects.js';
import { getRequests } from '../lib/api/requests.js';
import { getTasks } from '../lib/api/tasks.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';
import { navigate } from '../router.js';

const PROCESS_WIP_LIMIT = 25;

const processStatusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['active', 'in_progress'].includes(normalized)) return <Tag color="processing">В работе</Tag>;
  if (['completed', 'done', 'closed'].includes(normalized)) return <Tag color="success">Завершен</Tag>;
  if (['cancelled', 'rejected', 'failed'].includes(normalized)) return <Tag color="error">Остановлен</Tag>;
  if (!normalized) return <Tag>Черновик</Tag>;
  return <Tag>{status}</Tag>;
};

export default function BusinessProcessesWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [projectsRes, tasksRes, requestsRes] = await Promise.allSettled([
      getProjects({ page_size: 300, ordering: '-update_date' }),
      getTasks({ page_size: 300, ordering: '-update_date' }),
      getRequests({ page_size: 300, ordering: '-update_date' }),
    ]);

    setProjects(projectsRes.status === 'fulfilled' ? toResults(projectsRes.value) : []);
    setTasks(tasksRes.status === 'fulfilled' ? toResults(tasksRes.value) : []);
    setRequests(requestsRes.status === 'fulfilled' ? toResults(requestsRes.value) : []);

    const hasFailure = [projectsRes, tasksRes, requestsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть процессных данных не загрузилась. Показаны доступные записи.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProjects = useMemo(
    () => projects.filter((item) => containsText(item.name, search) || containsText(item.description, search) || containsText(item.owner_name, search)),
    [projects, search],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((item) => containsText(item.name, search) || containsText(item.description, search) || containsText(item.next_step, search)),
    [tasks, search],
  );

  const filteredRequests = useMemo(
    () => requests.filter((item) => containsText(item.title || item.description, search) || containsText(item.type, search) || containsText(item.status, search)),
    [requests, search],
  );

  const runningProcesses = useMemo(
    () => filteredProjects.filter((item) => ['active', 'in_progress'].includes(String(item.status || '').toLowerCase())).length,
    [filteredProjects],
  );

  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return filteredTasks.filter((item) => {
      if (!item.due_date) return false;
      const due = new Date(item.due_date);
      if (Number.isNaN(due.getTime())) return false;
      return due.getTime() < now;
    }).length;
  }, [filteredTasks]);

  const activeInstances = useMemo(
    () => filteredRequests.filter((item) => !['completed', 'cancelled', 'rejected'].includes(String(item.status || '').toLowerCase())).length,
    [filteredRequests],
  );

  const wipByStage = useMemo(() => {
    const map = new Map();
    filteredTasks.forEach((task) => {
      const status = String(task?.status || '').toLowerCase();
      if (['completed', 'done', 'closed', 'cancelled', 'canceled'].includes(status)) return;
      const stageKey = String(task?.stage_name || 'Без стадии');
      map.set(stageKey, (map.get(stageKey) || 0) + 1);
    });
    return map;
  }, [filteredTasks]);

  const wipBreaches = useMemo(
    () => Array.from(wipByStage.entries()).filter(([, count]) => count > PROCESS_WIP_LIMIT),
    [wipByStage],
  );

  const processTimeline = useMemo(() => {
    const processEvents = filteredProjects.map((project) => ({
      key: `project-${project.id}`,
      entity: 'Процесс',
      title: project.name || 'Процесс',
      status: project.status || 'draft',
      date: project.update_date || project.creation_date || null,
      link: `/projects/${project.id}`,
    }));
    const requestEvents = filteredRequests.map((request) => ({
      key: `request-${request.id}`,
      entity: 'Инстанс',
      title: request.title || request.description || 'Инстанс',
      status: request.status || 'new',
      date: request.update_date || request.creation_date || null,
      link: null,
    }));

    return [...processEvents, ...requestEvents]
      .sort((left, right) => {
        const leftTs = left.date ? new Date(left.date).getTime() : 0;
        const rightTs = right.date ? new Date(right.date).getTime() : 0;
        return rightTs - leftTs;
      })
      .slice(0, 50);
  }, [filteredProjects, filteredRequests]);

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Бизнес-процессы"
        subtitle="Управление процессами, инстансами и очередью операционных задач."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по процессам, инстансам и задачам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Проекты: ${filteredProjects.length} | Инстансы: ${filteredRequests.length} | Задачи: ${filteredTasks.length}`}
      />
      {error ? <Alert type="warning" showIcon message={error} /> : null}
      {wipBreaches.length ? (
        <Alert
          type="warning"
          showIcon
          message="Превышены WIP-лимиты по стадиям"
          description={wipBreaches.map(([stage, count]) => `${stage}: ${count}`).join(' | ')}
        />
      ) : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'processes',
              label: 'Процессы (проекты)',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredProjects}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Процесс',
                      dataIndex: 'name',
                      key: 'name',
                      render: (value, record) => <a onClick={() => navigate(`/projects/${record.id}`)}>{value || 'Без названия'}</a>,
                    },
                    { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
                    { title: 'Ответственный', dataIndex: 'owner_name', key: 'owner_name', render: (value) => value || '-' },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => processStatusTag(value) },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'instances',
              label: 'Инстансы',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredRequests}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Инстанс', dataIndex: 'title', key: 'title', render: (value, record) => value || record.description || 'Без названия' },
                    { title: 'Тип', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => processStatusTag(value) },
                    { title: 'Приоритет', dataIndex: 'priority', key: 'priority', render: (value) => value || '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'task-queue',
              label: 'Очередь задач',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredTasks}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Задача',
                      dataIndex: 'name',
                      key: 'name',
                      render: (value, record) => <a onClick={() => navigate(`/tasks/${record.id}`)}>{value || 'Без названия'}</a>,
                    },
                    { title: 'Следующий шаг', dataIndex: 'next_step', key: 'next_step', render: (value) => value || '-' },
                    { title: 'Дата шага', dataIndex: 'next_step_date', key: 'next_step_date', render: (value) => formatDateSafe(value) },
                    {
                      title: 'Срок',
                      dataIndex: 'due_date',
                      key: 'due_date',
                      render: (value) => {
                        if (!value) return '-';
                        const due = new Date(value);
                        if (Number.isNaN(due.getTime())) return value;
                        const isOverdue = due.getTime() < Date.now();
                        return <Tag color={isOverdue ? 'error' : 'processing'}>{formatDateSafe(value)}</Tag>;
                      },
                    },
                    { title: 'Стадия', dataIndex: 'stage_name', key: 'stage_name', render: (value) => value || '-' },
                    {
                      title: 'WIP',
                      key: 'wip',
                      render: (_, record) => {
                        const stageKey = String(record?.stage_name || 'Без стадии');
                        const currentLoad = wipByStage.get(stageKey) || 0;
                        if (currentLoad > PROCESS_WIP_LIMIT) {
                          return <Tag color="error">{currentLoad}/{PROCESS_WIP_LIMIT}</Tag>;
                        }
                        return <Tag color="success">{currentLoad}/{PROCESS_WIP_LIMIT}</Tag>;
                      },
                    },
                  ]}
                />
              ),
            },
            {
              key: 'timeline',
              label: 'Таймлайн',
              children: (
                <Table
                  rowKey="key"
                  loading={loading}
                  dataSource={processTimeline}
                  pagination={{ pageSize: 12, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Тип', dataIndex: 'entity', key: 'entity', width: 120 },
                    {
                      title: 'Сущность',
                      dataIndex: 'title',
                      key: 'title',
                      render: (value, record) =>
                        record.link ? <a onClick={() => navigate(record.link)}>{value}</a> : value,
                    },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => processStatusTag(value) },
                    { title: 'Дата', dataIndex: 'date', key: 'date', render: (value) => formatDateSafe(value) },
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
