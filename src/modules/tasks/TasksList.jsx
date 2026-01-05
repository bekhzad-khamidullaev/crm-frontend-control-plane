import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Avatar,
  Checkbox,
  Typography,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getTasks, deleteTask, updateTask, getUsers, getTaskStages } from '../../lib/api';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';

const { Text } = Typography;

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchTasks(1, searchText);
    loadReferences();
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
      console.error('Error loading task stages:', stagesRes.reason);
      setStages([]);
      message.warning('Не удалось загрузить стадии задач. Фильтры будут ограничены.');
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      console.error('Error loading users:', usersRes.reason);
      setUsers([]);
      message.warning('Не удалось загрузить пользователей. Фильтры будут ограничены.');
    }
  };

  const fetchTasks = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getTasks({
        page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });
      setTasks(response.results || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.count || 0,
      }));
    } catch (error) {
      message.error('Ошибка загрузки задач');
      setTasks([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
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
    } catch (error) {
      message.error('Ошибка удаления задачи');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchTasks(newPagination.current, searchText);
  };

  const stagesById = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {});
  }, [stages]);

  const userNameById = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

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
    } catch (error) {
      message.error('Ошибка обновления статуса задачи');
    }
  };

  const priorityConfig = {
    1: { color: 'green', text: 'Низкий' },
    2: { color: 'orange', text: 'Средний' },
    3: { color: 'red', text: 'Высокий' },
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={doneStage ? record.stage === doneStage.id : false}
          onChange={() => handleToggleComplete(record)}
        />
      ),
    },
    {
      title: 'Задача',
      key: 'task',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Этап',
      dataIndex: 'stage',
      key: 'stage',
      render: (stageId) => {
        const stage = stagesById[stageId];
        return stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-';
      },
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const config = priorityConfig[priority] || { color: 'default', text: '-' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ответственные',
      dataIndex: 'responsible',
      key: 'responsible',
      render: (responsible, record) => {
        const ids = Array.isArray(responsible) ? responsible : [];
        const names = ids.map((id) => userNameById[id]).filter(Boolean);
        const ownerLabel = record.owner ? userNameById[record.owner] || `#${record.owner}` : null;
        const display = names.length ? names.join(', ') : ownerLabel;
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{display || '-'}</Text>
          </Space>
        );
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
          <Space direction="vertical" size="small">
            <Space size="small">
              <CalendarOutlined />
              {dueDate.toLocaleDateString('ru-RU')}
            </Space>
            {daysLeft > 0 && daysLeft <= 3 && (
              <Text type="warning" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {daysLeft} дн.
              </Text>
            )}
            {daysLeft < 0 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> просрочено
              </Text>
            )}
          </Space>
        );
      },
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/tasks/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить эту задачу?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <TableToolbar
        title="Задачи"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, описанию..."
        onSearch={handleSearch}
        onCreate={() => navigate('/tasks/new')}
        onRefresh={() => fetchTasks(pagination.current, searchText)}
        createButtonText="Создать задачу"
        showViewModeSwitch={false}
        showExportButton={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          doneStage && record.stage === doneStage.id ? 'row-completed' : ''
        }
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет задач"
        emptyDescription="Создайте первую задачу"
      />

      <style>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

export default TasksList;
