import { CalendarOutlined, ClockCircleOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Modal, Space, Table, Tag, Typography } from 'antd';

import { deleteTask, getTasks, getTaskStages, getUsers, updateTask } from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { LIST_HEADER_STYLE, LIST_STACK_STYLE, LIST_TITLE_STYLE } from '../../shared/ui/listLayout';

const { Text, Title } = Typography;

function TasksList() {
  const { message } = App.useApp();
  const canManage = canWrite('tasks.change_task');
  const [tasks, setTasks] = useState([]);
  const [allTasksCache, setAllTasksCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const locale = getLocale();
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU';

  useEffect(() => {
    fetchTasks(1, searchText);
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

  const handleSearch = (value) => {
    setSearchText(value);
    fetchTasks(1, value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    fetchTasks(1, '');
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      message.success(t('tasksListPage.messages.deleted'));
      fetchTasks(pagination.current, searchText);
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
        acc[user.id] = user.username || user.email || '-';
        return acc;
      }, {}),
    [users],
  );

  const doneStage = stages.find((stage) => stage.done);
  const inProgressStage = stages.find((stage) => stage.in_progress) || stages.find((stage) => stage.default);

  const handleToggleComplete = async (task) => {
    if (!doneStage || !inProgressStage) {
      message.warning(t('tasksListPage.messages.stagesNotConfigured'));
      return;
    }

    const isDone = task.stage === doneStage.id;
    const newStage = isDone ? inProgressStage.id : doneStage.id;
    try {
      await updateTask(task.id, { stage: newStage });
      message.success(t('tasksListPage.messages.statusUpdated'));
      fetchTasks(pagination.current, searchText);
    } catch {
      message.error(t('tasksListPage.messages.statusUpdateError'));
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
              <CalendarOutlined size={14} /> {dueDate.toLocaleDateString(dateLocale)}
            </Text>
            {daysLeft > 0 && daysLeft <= 3 ? (
              <Text type="warning">
                <ClockCircleOutlined size={14} /> {t('tasksListPage.deadline.daysLeft', { count: daysLeft })}
              </Text>
            ) : null}
            {daysLeft < 0 ? (
              <Text type="danger">
                <ClockCircleOutlined size={14} /> {t('tasksListPage.deadline.overdue')}
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
          <Button size="small" icon={<EyeOutlined size={14} />} onClick={() => navigate(`/tasks/${record.id}`)}>
            {t('tasksListPage.actions.view')}
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<EditOutlined size={14} />} onClick={() => navigate(`/tasks/${record.id}/edit`)}>
                {t('tasksListPage.actions.edit')}
              </Button>
              <Button size="small" danger icon={<DeleteOutlined size={14} />} onClick={() => setDeleteTarget(record)}>
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
            onRefresh={() => fetchTasks(pagination.current, searchText)}
            onReset={handleResetFilters}
            loading={loading}
            resultSummary={t('tasksListPage.pagination.total', { total: pagination.total })}
            activeFilters={searchText ? [{ key: 'search', label: t('actions.search'), value: searchText, onClear: handleResetFilters }] : []}
          />

          {error ? <Text type="danger">{error}</Text> : null}

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
    </>
  );
}

export default TasksList;
