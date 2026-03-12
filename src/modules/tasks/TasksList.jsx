import { Calendar, Clock, Edit, Eye, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Input, Modal, Space, Table, Tag, Typography } from 'antd';

import { deleteTask, getTasks, getTaskStages, getUsers, updateTask } from '../../lib/api';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { Search } = Input;
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
      message.warning('Не удалось загрузить стадии задач');
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      setUsers([]);
      message.warning('Не удалось загрузить пользователей');
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
      setError(err?.message || 'Не удалось загрузить список задач');
      message.error('Ошибка загрузки задач');
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

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      message.success('Задача удалена');
      fetchTasks(pagination.current, searchText);
    } catch {
      message.error('Ошибка удаления задачи');
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
      message.warning('Этапы задач не настроены');
      return;
    }

    const isDone = task.stage === doneStage.id;
    const newStage = isDone ? inProgressStage.id : doneStage.id;
    try {
      await updateTask(task.id, { stage: newStage });
      message.success('Статус задачи обновлен');
      fetchTasks(pagination.current, searchText);
    } catch {
      message.error('Ошибка обновления статуса задачи');
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
      title: 'Задача',
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
      title: 'Этап',
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
      title: 'Ответственные',
      dataIndex: 'responsible',
      key: 'responsible',
      render: (responsible) => {
        const ids = Array.isArray(responsible) ? responsible : [];
        const names = ids.map((userId) => userNameById[userId]).filter(Boolean);
        return names.length ? names.join(', ') : '-';
      },
    },
    {
      title: 'Срок',
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
              <Calendar size={14} /> {dueDate.toLocaleDateString('ru-RU')}
            </Text>
            {daysLeft > 0 && daysLeft <= 3 ? (
              <Text type="warning">
                <Clock size={14} /> {daysLeft} дн.
              </Text>
            ) : null}
            {daysLeft < 0 ? (
              <Text type="danger">
                <Clock size={14} /> просрочено
              </Text>
            ) : null}
          </Space>
        );
      },
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => navigate(`/tasks/${record.id}`)}>
            Просмотр
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/tasks/${record.id}/edit`)}>
                Редактировать
              </Button>
              <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(record)}>
                Удалить
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
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Задачи
              </Title>
              <Text type="secondary">Список задач</Text>
            </div>
            {canManage ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
                Создать задачу
              </Button>
            ) : null}
          </Space>

          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Search
              placeholder="Поиск по названию, описанию..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 360 }}
            />
            <Button onClick={() => fetchTasks(pagination.current, searchText)} loading={loading}>
              Обновить
            </Button>
          </Space>

          {error ? <Text type="danger">{error}</Text> : null}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={tasks}
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={handleTableChange}
            rowClassName={(record) => (doneStage && record.stage === doneStage.id ? 'row-completed' : '')}
            locale={{ emptyText: 'Нет задач' }}
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
        title="Удалить эту задачу?"
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={() => {
          if (!deleteTarget) return;
          handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        okText="Да"
        cancelText="Нет"
        okButtonProps={{ danger: true }}
      >
        <Text>Это действие нельзя отменить.</Text>
      </Modal>
    </>
  );
}

export default TasksList;
