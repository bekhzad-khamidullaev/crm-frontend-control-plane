import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Tabs,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getTask, deleteTask, getUsers } from '../../lib/api/client';
import { getTaskStages, getTaskTags } from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function TaskDetail({ id }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadTask();
    loadReferences();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(id);
      setTask(data);
    } catch (error) {
      message.error('Ошибка загрузки данных задачи');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [stagesResponse, tagsResponse, usersResponse] = await Promise.all([
        getTaskStages({ page_size: 200 }),
        getTaskTags({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setStages(stagesResponse.results || stagesResponse || []);
      setTags(tagsResponse.results || tagsResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading task references:', error);
      setStages([]);
      setTags([]);
      setUsers([]);
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

  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {});
  }, [stages]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

  const tagMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag.name;
      return acc;
    }, {});
  }, [tags]);

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

  const stage = stageMap[task.stage];
  const priorityLabel = task.priority ? `Приоритет ${task.priority}` : '-';
  const responsibleNames = Array.isArray(task.responsible)
    ? task.responsible.map((id) => userMap[id]).filter(Boolean)
    : [];
  const subscriberNames = Array.isArray(task.subscribers)
    ? task.subscribers.map((id) => userMap[id]).filter(Boolean)
    : [];
  const tagNames = Array.isArray(task.tags)
    ? task.tags.map((id) => tagMap[id]).filter(Boolean)
    : [];

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {task.name}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Этап">
              {stage ? (
                <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>
                  {stage.name}
                </Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Приоритет">{priorityLabel}</Descriptions.Item>
            <Descriptions.Item label="Дата начала">
              {task.start_date ? (
                <Space>
                  <CalendarOutlined />
                  {dayjs(task.start_date).format('DD.MM.YYYY')}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Срок выполнения">
              {task.due_date ? (
                <Space>
                  <CalendarOutlined />
                  {dayjs(task.due_date).format('DD.MM.YYYY')}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Дата закрытия">
              {task.closing_date ? dayjs(task.closing_date).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Следующий шаг">{task.next_step || '-'}</Descriptions.Item>
            <Descriptions.Item label="Дата следующего шага">
              {task.next_step_date ? dayjs(task.next_step_date).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Lead time">{task.lead_time || '-'}</Descriptions.Item>
            <Descriptions.Item label="Активна">
              <Tag color={task.active ? 'green' : 'default'}>{task.active ? 'Да' : 'Нет'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Напоминать">
              <Tag color={task.remind_me ? 'blue' : 'default'}>{task.remind_me ? 'Да' : 'Нет'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Владелец">
              <Space>
                <UserOutlined />
                {task.owner ? userMap[task.owner] || `#${task.owner}` : '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Со-владелец">
              {task.co_owner ? userMap[task.co_owner] || `#${task.co_owner}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ответственные" span={2}>
              {responsibleNames.length ? responsibleNames.join(', ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Подписчики" span={2}>
              {subscriberNames.length ? subscriberNames.join(', ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Теги" span={2}>
              {tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {task.creation_date ? dayjs(task.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {task.update_date ? dayjs(task.update_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            {task.description && (
              <Descriptions.Item label="Описание" span={2}>
                {task.description}
              </Descriptions.Item>
            )}
            {task.note && (
              <Descriptions.Item label="Заметка" span={2}>
                {task.note}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: <ActivityLog entityType="task" entityId={task.id} />,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/tasks/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{task.name}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default TaskDetail;
