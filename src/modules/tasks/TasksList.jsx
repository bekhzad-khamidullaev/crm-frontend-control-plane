import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  theme,
  DatePicker,
} from 'antd';

import { createTask, deleteTask, getTasks, getTaskStages, getUsers, patchTask } from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { LIST_HEADER_STYLE, LIST_STACK_STYLE, LIST_TITLE_STYLE } from '../../shared/ui/listLayout';
import {
  buildTaskKanbanColumns,
  parseTaskCardId,
  parseTaskStageFromDroppable,
  toTaskCardId,
  toTaskStageDroppableId,
} from './model/kanbanHelpers';
import { buildTaskGanttRows, getTaskGanttBar, getTaskGanttBounds } from './model/ganttHelpers';

const { Text, Title } = Typography;

const TASK_VIEW_MODE_STORAGE_KEY = 'tasks:view-mode';
const KANBAN_PAGE_SIZE = 200;

const getErrorStatus = (error) =>
  Number(error?.status || error?.response?.status || error?.body?.status || error?.details?.status || 0);

const formatDateSafe = (value, dateLocale) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(dateLocale);
};

const isPastDate = (value) => Boolean(value) && dayjs(value).isBefore(dayjs().startOf('day'), 'day');

function TaskKanbanCard({
  task,
  readOnly,
  stage,
  doneStageId,
  dateLocale,
  onToggleComplete,
  onEdit,
}) {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: toTaskCardId(task.id),
    disabled: readOnly,
  });

  const isDone = doneStageId ? task.stage === doneStageId : Boolean(stage?.done);
  const dueDateText = formatDateSafe(task.due_date, dateLocale);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.65 : 1,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${isDragging ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
    boxShadow: isDragging ? token.boxShadowSecondary : undefined,
    cursor: readOnly ? 'pointer' : 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      bodyStyle={{ padding: 12 }}
      hoverable
      onClick={() => navigate(`/tasks/${task.id}`)}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Text strong ellipsis>
            {task.name || 'Задача'}
          </Text>
          {task.description ? (
            <Text type="secondary" ellipsis={{ tooltip: task.description }}>
              {task.description}
            </Text>
          ) : null}
        </Space>

        <Space size={[6, 6]} wrap>
          {task.priority ? <Tag color="blue">P{task.priority}</Tag> : null}
          {task.responsible?.length ? <Tag>{task.responsible.length} resp.</Tag> : null}
          {dueDateText ? (
            <Tag color={isDone ? 'default' : 'warning'} icon={<CalendarOutlined />}>
              {dueDateText}
            </Tag>
          ) : null}
        </Space>

        <Space size={6} wrap>
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/tasks/${task.id}`);
            }}
          >
            {t('tasksListPage.actions.view')}
          </Button>
          {!readOnly ? (
            <>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(task.id);
                }}
              >
                {t('tasksListPage.actions.edit')}
              </Button>
              <Button
                size="small"
                type="text"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleComplete(task);
                }}
              >
                {isDone
                  ? t('tasksListPage.actions.reopen') === 'tasksListPage.actions.reopen'
                    ? 'Reopen'
                    : t('tasksListPage.actions.reopen')
                  : t('tasksListPage.actions.complete') === 'tasksListPage.actions.complete'
                    ? 'Complete'
                    : t('tasksListPage.actions.complete')}
              </Button>
            </>
          ) : null}
        </Space>
      </Space>
    </Card>
  );
}

function TaskKanbanColumn({
  column,
  tasks,
  loading,
  readOnly,
  onCreate,
  renderTask,
}) {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: column.droppableId });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '0 0 320px',
        minWidth: 300,
        width: 320,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${isOver ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        background: isOver ? token.colorPrimaryBg : token.colorFillQuaternary,
        padding: 12,
        transition: 'all 0.2s ease',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Space>
          <Badge color={column.done ? token.colorSuccess : token.colorPrimary} />
          <Text strong>{column.title}</Text>
        </Space>
        <Space size={8}>
          <Text type="secondary">{tasks.length}</Text>
          {!readOnly ? (
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => onCreate(column.stageId)}
            >
              {t('tasksListPage.actions.createShort') === 'tasksListPage.actions.createShort'
                ? 'Add'
                : t('tasksListPage.actions.createShort')}
            </Button>
          ) : null}
        </Space>
      </Flex>

      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {loading && tasks.length === 0 ? <Skeleton active paragraph={{ rows: 2 }} /> : null}
        {!loading && tasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              t('tasksListPage.kanban.emptyColumn') === 'tasksListPage.kanban.emptyColumn'
                ? 'No tasks'
                : t('tasksListPage.kanban.emptyColumn')
            }
          />
        ) : null}
        {tasks.map((task) => renderTask(task))}
      </Space>
    </div>
  );
}

function TasksList() {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [quickCreateForm] = Form.useForm();
  const canManage = canWrite('tasks.change_task');
  const [viewMode, setViewMode] = useState(() => {
    const stored = localStorage.getItem(TASK_VIEW_MODE_STORAGE_KEY);
    if (stored === 'kanban' || stored === 'gantt') return stored;
    return 'table';
  });
  const [tasks, setTasks] = useState([]);
  const [allTasksCache, setAllTasksCache] = useState(null);
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kanbanError, setKanbanError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [kanbanTotal, setKanbanTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [quickCreate, setQuickCreate] = useState({ open: false, stageId: null });
  const [quickCreating, setQuickCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const locale = getLocale();
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    if (localized !== key) return localized;
    return Object.entries(vars || {}).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      String(fallback || ''),
    );
  };

  useEffect(() => {
    localStorage.setItem(TASK_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchTasks(1, searchText);
    loadKanbanTasks(searchText);
    loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReferences = async () => {
    const [stagesRes, usersRes] = await Promise.allSettled([
      getTaskStages({ page_size: 200 }),
      getUsers({ page_size: 200 }),
    ]);

    if (stagesRes.status === 'fulfilled') {
      const data = stagesRes.value;
      setStages(data?.results || data || []);
    } else {
      setStages([]);
      message.warning(t('tasksListPage.messages.stagesLoadWarning'));
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      setUsers([]);
      message.warning(t('tasksListPage.messages.usersLoadWarning'));
    }
  };

  const fetchTasks = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTasks({
        page,
        page_size: pageSize,
        search: search || undefined,
      });
      const results = response.results || [];
      const totalCount = response.count || 0;

      if (results.length > pageSize && results.length === totalCount) {
        setAllTasksCache(results);
        const startIndex = (page - 1) * pageSize;
        setTasks(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllTasksCache(null);
        setTasks(results);
      }

      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: totalCount,
      }));
    } catch (err) {
      setError(err?.message || t('tasksListPage.messages.listLoadError'));
      message.error(t('tasksListPage.messages.loadError'));
      setTasks([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const loadKanbanTasks = async (search = '') => {
    setKanbanLoading(true);
    setKanbanError(null);
    try {
      const response = await getTasks({
        page: 1,
        page_size: KANBAN_PAGE_SIZE,
        search: search || undefined,
      });
      const results = response?.results || [];
      setKanbanTasks(Array.isArray(results) ? results : []);
      setKanbanTotal(Number(response?.count || results.length || 0));
    } catch (err) {
      setKanbanTasks([]);
      setKanbanTotal(0);
      setKanbanError(err?.message || tr('tasksListPage.kanban.loadError', 'Не удалось загрузить kanban задач'));
    } finally {
      setKanbanLoading(false);
    }
  };

  const refreshTaskData = async () => {
    await Promise.all([fetchTasks(pagination.current, searchText), loadKanbanTasks(searchText)]);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchTasks(1, value);
    loadKanbanTasks(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    fetchTasks(1, '');
    loadKanbanTasks('');
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      message.success(t('tasksListPage.messages.deleted'));
      await refreshTaskData();
    } catch {
      message.error(t('tasksListPage.messages.deleteError'));
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;

    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllTasksCache(null);
      fetchTasks(nextPage, searchText, nextPageSize);
      return;
    }

    if (allTasksCache && allTasksCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setTasks(allTasksCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchTasks(nextPage, searchText, nextPageSize);
    }
  };

  const stagesById = useMemo(
    () =>
      stages.reduce((acc, stage) => {
        acc[stage.id] = stage;
        return acc;
      }, {}),
    [stages],
  );

  const userNameById = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || '-';
        return acc;
      }, {}),
    [users],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: userNameById[user.id] || 'Пользователь',
      })),
    [users, userNameById],
  );

  const doneStage = stages.find((stage) => stage.done);
  const inProgressStage = stages.find((stage) => stage.in_progress) || stages.find((stage) => stage.default);

  const kanbanColumns = useMemo(
    () => buildTaskKanbanColumns(stages, tr('tasksListPage.kanban.noStage', 'Без стадии')),
    [stages],
  );

  const groupedKanbanTasks = useMemo(() => {
    const grouped = kanbanColumns.reduce((acc, column) => {
      acc[column.droppableId] = [];
      return acc;
    }, {});

    kanbanTasks.forEach((task) => {
      const bucketId = toTaskStageDroppableId(task.stage ?? null);
      if (!grouped[bucketId]) grouped[bucketId] = [];
      grouped[bucketId].push(task);
    });

    return grouped;
  }, [kanbanColumns, kanbanTasks]);

  const isKanbanTruncated = kanbanTotal > kanbanTasks.length;

  const ganttRows = useMemo(
    () =>
      buildTaskGanttRows({
        tasks: kanbanTasks,
        stagesById,
        userNameById,
        noStageLabel: tr('tasksListPage.kanban.noStage', 'Без стадии'),
      }),
    [kanbanTasks, stagesById, userNameById],
  );

  const ganttBounds = useMemo(() => getTaskGanttBounds(ganttRows), [ganttRows]);

  const ganttTicks = useMemo(() => {
    if (!ganttRows.length) return [];
    if (ganttBounds.totalDays <= 1) {
      return [{ left: 0, label: ganttBounds.minStart.format('DD.MM') }];
    }
    const tickCount = Math.min(8, Math.max(3, ganttBounds.totalDays));
    return Array.from({ length: tickCount }).map((_, index) => {
      const offsetDays = Math.round((index / (tickCount - 1)) * (ganttBounds.totalDays - 1));
      const day = ganttBounds.minStart.add(offsetDays, 'day');
      return {
        left: (offsetDays / ganttBounds.totalDays) * 100,
        label: day.format('DD.MM'),
      };
    });
  }, [ganttBounds, ganttRows.length]);

  const handleToggleComplete = async (task) => {
    if (!doneStage || !inProgressStage) {
      message.warning(t('tasksListPage.messages.stagesNotConfigured'));
      return;
    }

    const isDone = task.stage === doneStage.id;
    const newStage = isDone ? inProgressStage.id : doneStage.id;
    try {
      await patchTask(task.id, { stage: newStage });
      message.success(t('tasksListPage.messages.statusUpdated'));
      await refreshTaskData();
    } catch {
      message.error(t('tasksListPage.messages.statusUpdateError'));
    }
  };

  const handleStageChange = async (taskId, toStage) => {
    const currentTask = kanbanTasks.find((item) => item.id === taskId);
    if (!currentTask) return;

    const fromStage = currentTask.stage ?? null;
    if (fromStage === toStage) return;

    const previousTasks = kanbanTasks;
    setKanbanTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, stage: toStage } : task)));
    setUpdatingTaskId(taskId);

    try {
      await patchTask(taskId, { stage: toStage });
      message.success(
        tr(
          'tasksListPage.kanban.moved',
          'Задача перемещена в {stage}',
          { stage: stagesById[toStage]?.name || tr('tasksListPage.kanban.noStage', 'Без стадии') },
        ),
      );
    } catch (stageError) {
      setKanbanTasks(previousTasks);
      if (getErrorStatus(stageError) === 403) {
        message.error(tr('tasksListPage.kanban.rbacError', 'Недостаточно прав или лицензии для изменения стадии задачи'));
      } else {
        message.error(tr('tasksListPage.kanban.moveError', 'Не удалось изменить стадию задачи'));
      }
    } finally {
      setUpdatingTaskId(null);
      await fetchTasks(pagination.current, searchText);
      await loadKanbanTasks(searchText);
    }
  };

  const handleKanbanDragEnd = async (event) => {
    if (!canManage || updatingTaskId) return;
    if (!event?.active || !event?.over) return;

    const taskId = parseTaskCardId(event.active.id);
    const toStage = parseTaskStageFromDroppable(event.over.id);

    if (taskId === null || toStage === undefined) return;
    await handleStageChange(taskId, toStage);
  };

  const openQuickCreate = (stageId) => {
    if (!canManage) return;
    setQuickCreate({ open: true, stageId });
    quickCreateForm.setFieldsValue({
      name: '',
      next_step: tr('tasksListPage.quickCreate.defaultNextStep', 'Первичный контакт'),
      next_step_date: dayjs(),
      due_date: null,
      responsible: [],
      stage: stageId,
    });
  };

  const closeQuickCreate = () => {
    setQuickCreate({ open: false, stageId: null });
    quickCreateForm.resetFields();
  };

  const handleQuickCreate = async () => {
    try {
      const values = await quickCreateForm.validateFields();
      if (isPastDate(values.next_step_date)) {
        quickCreateForm.setFields([
          { name: 'next_step_date', errors: [tr('tasksListPage.quickCreate.validation.nextStepDateFuture', 'Дата не может быть в прошлом')] },
        ]);
        return;
      }
      const payload = {
        name: String(values.name || '').trim(),
        stage: values.stage ?? null,
        next_step: String(values.next_step || '').trim() || tr('tasksListPage.quickCreate.defaultNextStep', 'Первичный контакт'),
        next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        responsible: Array.isArray(values.responsible) ? values.responsible : [],
        active: true,
      };

      setQuickCreating(true);
      await createTask(payload);
      message.success(tr('tasksListPage.quickCreate.created', 'Задача создана'));
      closeQuickCreate();
      await refreshTaskData();
    } catch (createError) {
      if (createError?.errorFields) return;
      const detailsMessage =
        createError?.details?.message
        || createError?.details?.detail
        || createError?.message;
      message.error(detailsMessage || tr('tasksListPage.quickCreate.error', 'Не удалось создать задачу'));
    } finally {
      setQuickCreating(false);
    }
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 56,
      render: (_, record) => (
        <Checkbox
          checked={doneStage ? record.stage === doneStage.id : false}
          onChange={() => handleToggleComplete(record)}
          disabled={!canManage}
        />
      ),
    },
    {
      title: t('tasksListPage.columns.task'),
      key: 'task',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          {record.description ? <Text type="secondary">{record.description}</Text> : null}
        </Space>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: t('tasksListPage.columns.stage'),
      dataIndex: 'stage',
      key: 'stage',
      render: (stageId) => {
        const stage = stagesById[stageId];
        if (!stage) return '-';
        const color = stage.done ? 'green' : stage.in_progress ? 'blue' : 'default';
        return <Tag color={color}>{stage.name}</Tag>;
      },
    },
    {
      title: t('tasksListPage.columns.responsible'),
      dataIndex: 'responsible',
      key: 'responsible',
      render: (responsible) => {
        const ids = Array.isArray(responsible) ? responsible : [];
        const names = ids.map((userId) => userNameById[userId]).filter(Boolean);
        return names.length ? names.join(', ') : '-';
      },
    },
    {
      title: t('tasksListPage.columns.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => {
        if (!date) return '-';
        const dueDate = new Date(date);
        const today = new Date();
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return (
          <Space direction="vertical" size={0}>
            <Text>
              <CalendarOutlined /> {dueDate.toLocaleDateString(dateLocale)}
            </Text>
            {daysLeft > 0 && daysLeft <= 3 ? (
              <Text type="warning">
                <ClockCircleOutlined /> {t('tasksListPage.deadline.daysLeft', { count: daysLeft })}
              </Text>
            ) : null}
            {daysLeft < 0 ? (
              <Text type="danger">
                <ClockCircleOutlined /> {t('tasksListPage.deadline.overdue')}
              </Text>
            ) : null}
          </Space>
        );
      },
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: t('tasksListPage.columns.actions'),
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>
            {t('tasksListPage.actions.view')}
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/tasks/${record.id}/edit`)}>
                {t('tasksListPage.actions.edit')}
              </Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(record)}>
                {t('tasksListPage.actions.delete')}
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Space direction="vertical" size={16} style={LIST_STACK_STYLE}>
          <Space style={LIST_HEADER_STYLE} wrap>
            <div>
              <Title level={3} style={LIST_TITLE_STYLE}>
                {t('tasksListPage.title')}
              </Title>
              <Text type="secondary">{t('tasksListPage.subtitle')}</Text>
            </div>
            {canManage ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
                {t('tasksListPage.actions.create')}
              </Button>
            ) : null}
          </Space>

          <EntityListToolbar
            searchValue={searchText}
            searchPlaceholder={t('tasksListPage.searchPlaceholder')}
            onSearchChange={handleSearch}
            onRefresh={refreshTaskData}
            onReset={handleResetFilters}
            loading={loading || kanbanLoading}
            filters={(
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value)}
                options={[
                  {
                    value: 'table',
                    icon: <UnorderedListOutlined />,
                    label:
                      t('tasksListPage.view.table') === 'tasksListPage.view.table'
                        ? 'Таблица'
                        : t('tasksListPage.view.table'),
                  },
                  {
                    value: 'kanban',
                    icon: <AppstoreOutlined />,
                    label:
                      t('tasksListPage.view.kanban') === 'tasksListPage.view.kanban'
                        ? 'Канбан'
                        : t('tasksListPage.view.kanban'),
                  },
                  {
                    value: 'gantt',
                    icon: <CalendarOutlined />,
                    label:
                      t('tasksListPage.view.gantt') === 'tasksListPage.view.gantt'
                        ? 'Гант'
                        : t('tasksListPage.view.gantt'),
                  },
                ]}
              />
            )}
            resultSummary={
              viewMode === 'table'
                ? t('tasksListPage.pagination.total', { total: pagination.total })
                : tr('tasksListPage.kanban.summary', 'Показано {visible} из {total}', {
                    visible: kanbanTasks.length,
                    total: kanbanTotal,
                  })
            }
            activeFilters={searchText ? [{ key: 'search', label: t('actions.search'), value: searchText, onClear: handleResetFilters }] : []}
          />

          {error && viewMode === 'table' ? <Text type="danger">{error}</Text> : null}
          {kanbanError && (viewMode === 'kanban' || viewMode === 'gantt') ? (
            <Alert
              type="error"
              showIcon
              message={tr('tasksListPage.kanban.loadErrorTitle', 'Kanban недоступен')}
              description={kanbanError}
              action={
                <Button size="small" onClick={() => loadKanbanTasks(searchText)}>
                  {tr('actions.retry', 'Повторить')}
                </Button>
              }
            />
          ) : null}
          {(viewMode === 'kanban' || viewMode === 'gantt') && isKanbanTruncated ? (
            <Alert
              type="warning"
              showIcon
              message={tr('tasksListPage.kanban.truncatedTitle', 'Показаны не все задачи')}
              description={tr(
                'tasksListPage.kanban.truncatedDescription',
                'Для kanban загружено {loaded} из {total} задач. Уточните поиск или фильтр.',
                { loaded: kanbanTasks.length, total: kanbanTotal },
              )}
            />
          ) : null}

          {viewMode === 'table' ? (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={tasks}
              loading={loading}
              pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => t('tasksListPage.pagination.total', { total }) }}
              onChange={handleTableChange}
              rowClassName={(record) => (doneStage && record.stage === doneStage.id ? 'row-completed' : '')}
              locale={{ emptyText: t('tasksListPage.empty') }}
            />
          ) : null}

          {viewMode === 'kanban' ? (
            <DndContext sensors={sensors} onDragEnd={handleKanbanDragEnd}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: 8,
                }}
              >
                <Space align="start" size={12} wrap={false}>
                  {kanbanColumns.map((column) => (
                    <TaskKanbanColumn
                      key={column.droppableId}
                      column={column}
                      tasks={groupedKanbanTasks[column.droppableId] || []}
                      loading={kanbanLoading}
                      readOnly={!canManage}
                      onCreate={openQuickCreate}
                      renderTask={(task) => (
                        <TaskKanbanCard
                          key={task.id}
                          task={task}
                          readOnly={!canManage}
                          stage={stagesById[task.stage]}
                          doneStageId={doneStage?.id}
                          dateLocale={dateLocale}
                          onToggleComplete={handleToggleComplete}
                          onEdit={(id) => navigate(`/tasks/${id}/edit`)}
                        />
                      )}
                    />
                  ))}
                </Space>
              </div>
              {!kanbanLoading && !kanbanTasks.length && !kanbanError ? (
                <Empty
                  description={tr('tasksListPage.empty', 'Список пуст')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  {canManage ? (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
                      {t('tasksListPage.actions.create')}
                    </Button>
                  ) : null}
                </Empty>
              ) : null}
            </DndContext>
          ) : null}

          {viewMode === 'gantt' ? (
            ganttRows.length ? (
              <div
                style={{
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 360px) minmax(640px, 1fr)',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <div style={{ padding: '10px 12px' }}>
                    {tr('tasksListPage.gantt.taskColumn', 'Задача')}
                  </div>
                  <div style={{ padding: '10px 12px', position: 'relative', minHeight: 38 }}>
                    {ganttTicks.map((tick) => (
                      <span
                        key={`${tick.label}-${tick.left}`}
                        style={{
                          position: 'absolute',
                          left: `${tick.left}%`,
                          transform: 'translateX(-50%)',
                          color: token.colorTextSecondary,
                          fontWeight: 500,
                        }}
                      >
                        {tick.label}
                      </span>
                    ))}
                  </div>
                </div>

                {ganttRows.map((row) => {
                  const bar = getTaskGanttBar(row, ganttBounds);
                  const isDone = doneStage ? row.stageId === doneStage.id : false;
                  const isOverdue = !isDone && dayjs(row.endDate).isBefore(dayjs(), 'day');
                  const barColor = isDone ? token.colorSuccess : (isOverdue ? token.colorWarning : token.colorPrimary);

                  return (
                    <div
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(280px, 360px) minmax(640px, 1fr)',
                        borderBottom: `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <div
                        style={{ padding: '10px 12px', cursor: 'pointer' }}
                        onClick={() => navigate(`/tasks/${row.id}`)}
                      >
                        <Space direction="vertical" size={0}>
                          <Text strong>{row.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {row.stageLabel} · {row.responsibleLabel}
                          </Text>
                        </Space>
                      </div>

                      <div style={{ padding: '10px 12px', position: 'relative', minHeight: 56 }}>
                        {ganttTicks.map((tick) => (
                          <span
                            key={`line-${row.id}-${tick.left}`}
                            style={{
                              position: 'absolute',
                              left: `${tick.left}%`,
                              top: 6,
                              bottom: 6,
                              borderLeft: `1px dashed ${token.colorBorderSecondary}`,
                            }}
                          />
                        ))}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${bar.leftPercent}%`,
                            width: `${bar.widthPercent}%`,
                            top: 16,
                            height: 24,
                            borderRadius: 12,
                            background: barColor,
                            color: token.colorWhite,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '0 8px',
                          }}
                          title={`${row.startDate} — ${row.endDate}`}
                        >
                          {row.startDate} - {row.endDate}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                description={tr('tasksListPage.empty', 'Список пуст')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {canManage ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
                    {t('tasksListPage.actions.create')}
                  </Button>
                ) : null}
              </Empty>
            )
          ) : null}
        </Space>
      </Card>

      <style>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>

      <Modal
        title={t('tasksListPage.deleteModal.title')}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={() => {
          if (!deleteTarget) return;
          handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        okText={t('tasksListPage.deleteModal.confirm')}
        cancelText={t('tasksListPage.deleteModal.cancel')}
        okButtonProps={{ danger: true }}
      >
        <Text>{t('tasksListPage.deleteModal.description')}</Text>
      </Modal>

      <Modal
        title={tr('tasksListPage.quickCreate.title', 'Быстрое создание задачи')}
        open={quickCreate.open}
        onCancel={closeQuickCreate}
        onOk={handleQuickCreate}
        confirmLoading={quickCreating}
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={tr('tasksListPage.quickCreate.name', 'Название')}
            name="name"
            rules={[{ required: true, message: tr('tasksListPage.quickCreate.validation.name', 'Введите название') }]}
          >
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item
            label={tr('tasksListPage.quickCreate.nextStep', 'Следующий шаг')}
            name="next_step"
            rules={[{ required: true, message: tr('tasksListPage.quickCreate.validation.nextStep', 'Укажите следующий шаг') }]}
          >
            <Input maxLength={255} />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item
              label={tr('tasksListPage.quickCreate.nextStepDate', 'Дата следующего шага')}
              name="next_step_date"
              rules={[
                { required: true, message: tr('tasksListPage.quickCreate.validation.nextStepDate', 'Укажите дату') },
                {
                  validator: async (_, value) => {
                    if (value && isPastDate(value)) {
                      throw new Error(tr('tasksListPage.quickCreate.validation.nextStepDateFuture', 'Дата не может быть в прошлом'));
                    }
                  },
                },
              ]}
              style={{ minWidth: 220 }}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} disabledDate={(current) => isPastDate(current)} />
            </Form.Item>

            <Form.Item
              label={tr('tasksListPage.quickCreate.dueDate', 'Дедлайн')}
              name="due_date"
              style={{ minWidth: 220 }}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item label={tr('tasksListPage.quickCreate.responsible', 'Ответственные')} name="responsible">
            <Select mode="multiple" allowClear options={userOptions} />
          </Form.Item>

          <Form.Item name="stage" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default TasksList;
