import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Avatar,
  Checkbox,
  Progress,
} from 'antd';
import {
  UserOutlined,
  CheckOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getTasks, deleteTask } from '../../lib/api/client';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTasks = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getTasks({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setTasks(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки задач');
      // Mock data for demo
      setTasks([
        {
          id: 1,
          title: 'Подготовить коммерческое предложение',
          description: 'Для компании ООО "ТехноПром"',
          status: 'in_progress',
          priority: 'high',
          due_date: '2024-02-15',
          assignee: 'Алексей Иванов',
          related_to: 'Deal #1',
          progress: 60,
          created_at: '2024-01-20',
        },
        {
          id: 2,
          title: 'Провести встречу с клиентом',
          description: 'Обсудить условия сотрудничества',
          status: 'todo',
          priority: 'medium',
          due_date: '2024-02-20',
          assignee: 'Елена Смирнова',
          related_to: 'Contact #2',
          progress: 0,
          created_at: '2024-01-19',
        },
        {
          id: 3,
          title: 'Отправить документы',
          description: 'Договор и акты',
          status: 'completed',
          priority: 'low',
          due_date: '2024-02-10',
          assignee: 'Алексей Иванов',
          related_to: 'Deal #3',
          progress: 100,
          created_at: '2024-01-18',
        },
      ]);
      setPagination({
        ...pagination,
        current: 1,
        total: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1, searchText);
  }, []);

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

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    message.info(`Задача "${task.title}" отмечена как ${newStatus === 'completed' ? 'выполненная' : 'в работе'}`);
    // Here you would call updateTask API
  };

  const statusConfig = {
    todo: { color: 'default', text: 'К выполнению' },
    in_progress: { color: 'blue', text: 'В работе' },
    completed: { color: 'green', text: 'Выполнено' },
    cancelled: { color: 'red', text: 'Отменено' },
  };

  const priorityConfig = {
    low: { color: 'green', text: 'Низкий' },
    medium: { color: 'orange', text: 'Средний' },
    high: { color: 'red', text: 'Высокий' },
    urgent: { color: 'magenta', text: 'Срочно' },
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.status === 'completed'}
          onChange={() => handleToggleComplete(record)}
        />
      ),
    },
    {
      title: 'Задача',
      key: 'task',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusConfig[status] || statusConfig.todo;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(statusConfig).map((key) => ({
        text: statusConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const config = priorityConfig[priority] || priorityConfig.medium;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(priorityConfig).map((key) => ({
        text: priorityConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Прогресс',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <div style={{ width: 100 }}>
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        </div>
      ),
      sorter: (a, b) => a.progress - b.progress,
    },
    {
      title: 'Ответственный',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{assignee}</Text>
        </Space>
      ),
    },
    {
      title: 'Срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => {
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
      sorter: (a, b) => new Date(a.due_date) - new Date(b.due_date),
    },
    {
      title: 'Связано с',
      dataIndex: 'related_to',
      key: 'related_to',
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
          record.status === 'completed' ? 'row-completed' : ''
        }
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет задач"
        emptyDescription="Создайте первую задачу"
      />

      <style jsx>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

export default TasksList;
