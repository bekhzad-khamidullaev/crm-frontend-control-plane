import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Tabs,
  Timeline,
  Typography,
  Progress,
  Row,
  Col,
  Checkbox,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getTask, deleteTask } from '../../lib/api/client';

const { Title, Text } = Typography;

function TaskDetail({ id }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(id);
      setTask(data);
    } catch (error) {
      message.error('Ошибка загрузки данных задачи');
      // Mock data for demo
      setTask({
        id,
        title: 'Подготовить коммерческое предложение',
        description: 'Создать детальное коммерческое предложение для компании ООО "ТехноПром". Включить прайс-лист, условия оплаты и сроки поставки.',
        status: 'in_progress',
        priority: 'high',
        due_date: '2024-02-15',
        assignee: { id: 1, name: 'Алексей Иванов' },
        related_type: 'deal',
        related_id: '1',
        related_name: 'Поставка оборудования',
        progress: 60,
        created_at: '2024-01-20T10:30:00Z',
        updated_at: '2024-01-22T15:45:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(id);
      message.success('Задача удалена');
      navigate('/tasks');
    } catch (error) {
      message.error('Ошибка удаления задачи');
    }
  };

  const handleToggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    message.success(`Задача отмечена как ${newStatus === 'completed' ? 'выполненная' : 'в работе'}`);
    setTask({ ...task, status: newStatus, progress: newStatus === 'completed' ? 100 : task.progress });
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return <div>Задача не найдена</div>;
  }

  const statusStyle = statusConfig[task.status] || statusConfig.todo;
  const priorityStyle = priorityConfig[task.priority] || priorityConfig.medium;
  const dueDate = new Date(task.due_date);
  const today = new Date();
  const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название" span={2}>
              <Space>
                <Checkbox
                  checked={task.status === 'completed'}
                  onChange={handleToggleComplete}
                />
                <Text strong style={{ fontSize: 16 }}>
                  {task.title}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={statusStyle.color}>{statusStyle.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Приоритет">
              <Tag color={priorityStyle.color}>{priorityStyle.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Прогресс" span={2}>
              <Progress
                percent={task.progress}
                status={task.progress === 100 ? 'success' : 'active'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Ответственный">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {task.assignee.name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Срок выполнения">
              <Space direction="vertical" size="small">
                <Space>
                  <CalendarOutlined />
                  {dueDate.toLocaleDateString('ru-RU')}
                </Space>
                {daysLeft > 0 && (
                  <Text type={daysLeft <= 3 ? 'warning' : 'secondary'} style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> через {daysLeft} дней
                  </Text>
                )}
                {daysLeft < 0 && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> просрочено на {Math.abs(daysLeft)} дней
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            {task.related_type && (
              <Descriptions.Item label="Связано с" span={2}>
                <Space>
                  <LinkOutlined />
                  <a onClick={() => navigate(`/${task.related_type}s/${task.related_id}`)}>
                    {task.related_name || `${task.related_type} #${task.related_id}`}
                  </a>
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Дата создания">
              {new Date(task.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {new Date(task.updated_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            {task.description && (
              <Descriptions.Item label="Описание" span={2}>
                {task.description}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>
                    {daysLeft > 0 ? daysLeft : 0}
                  </div>
                  <Text type="secondary">Дней до дедлайна</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8, color: '#52c41a' }}>
                    {task.progress}%
                  </div>
                  <Text type="secondary">Завершено</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: task.status === 'completed' ? '#52c41a' : '#d9d9d9' }} />
                  </div>
                  <Text type="secondary">{statusStyle.text}</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: (
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Задача создана</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(task.created_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Статус изменен на "{statusStyle.text}"</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(task.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>Прогресс обновлен до {task.progress}%</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(task.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'comments',
      label: 'Комментарии',
      children: <div>Комментарии к задаче появятся здесь</div>,
    },
    {
      key: 'files',
      label: 'Файлы',
      children: <div>Прикрепленные файлы появятся здесь</div>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/tasks/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button
          type={task.status === 'completed' ? 'default' : 'primary'}
          icon={<CheckCircleOutlined />}
          onClick={handleToggleComplete}
        >
          {task.status === 'completed' ? 'Вернуть в работу' : 'Отметить выполненной'}
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{task.title}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default TaskDetail;
