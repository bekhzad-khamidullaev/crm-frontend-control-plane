import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Edit, Trash2, User } from 'lucide-react';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Empty, Result, Skeleton, Space, Tabs, Tag, Typography } from 'antd';

import ActivityLog from '../../components/ActivityLog';
import { getTask, deleteTask, getUsers } from '../../lib/api/client';
import { getTaskStages, getTaskTags } from '../../lib/api/reference';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { Text, Title } = Typography;

function TaskDetail({ id }) {
  const { message } = App.useApp();
  const canManage = canWrite('tasks.change_task');
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadTask();
    loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(id);
      setTask(data);
    } catch {
      message.error('Ошибка загрузки данных задачи');
      setTask(null);
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
    } catch {
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
    } catch {
      message.error('Ошибка удаления задачи');
    }
  };

  const stageMap = useMemo(
    () =>
      stages.reduce((acc, stage) => {
        acc[stage.id] = stage;
        return acc;
      }, {}),
    [stages],
  );

  const userMap = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = user.username || user.email || '-';
        return acc;
      }, {}),
    [users],
  );

  const tagMap = useMemo(
    () =>
      tags.reduce((acc, tag) => {
        acc[tag.id] = tag.name;
        return acc;
      }, {}),
    [tags],
  );

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!task) {
    return (
      <Result
        status="404"
        title="Задача не найдена"
        subTitle="Запись могла быть удалена или больше не доступна"
        extra={
          <Button type="primary" onClick={() => navigate('/tasks')}>
            Вернуться к задачам
          </Button>
        }
      />
    );
  }

  const stage = stageMap[task.stage];
  const responsibleNames = Array.isArray(task.responsible) ? task.responsible.map((userId) => userMap[userId]).filter(Boolean) : [];
  const subscriberNames = Array.isArray(task.subscribers) ? task.subscribers.map((userId) => userMap[userId]).filter(Boolean) : [];
  const tagNames = Array.isArray(task.tags) ? task.tags.map((tagId) => tagMap[tagId]).filter(Boolean) : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/tasks')}>
          Назад
        </Button>
        {canManage ? (
          <>
            <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/tasks/${id}/edit`)}>
              Редактировать
            </Button>
            <Button danger icon={<Trash2 size={14} />} onClick={handleDelete}>
              Удалить
            </Button>
          </>
        ) : null}
      </Space>

      <Card>
        <Title level={3}>{task.name}</Title>
        <Tabs
          items={[
            {
              key: 'details',
              label: 'Детали',
              children: (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Название">{task.name}</Descriptions.Item>
                  <Descriptions.Item label="Этап">{stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Приоритет">{task.priority ? `Приоритет ${task.priority}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата начала">{task.start_date ? dayjs(task.start_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Срок выполнения">{task.due_date ? dayjs(task.due_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата закрытия">{task.closing_date ? dayjs(task.closing_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Следующий шаг">{task.next_step || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата следующего шага">{task.next_step_date ? dayjs(task.next_step_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Активна">{task.active ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="Напоминать">{task.remind_me ? <Tag color="gold">Да</Tag> : <Tag>Нет</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="Владелец">{task.owner ? userMap[task.owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Со-владелец">{task.co_owner ? userMap[task.co_owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Ответственные">{responsibleNames.length ? responsibleNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Подписчики">{subscriberNames.length ? subscriberNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Теги">{tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{task.creation_date ? dayjs(task.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Последнее обновление">{task.update_date ? dayjs(task.update_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Описание">{task.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Заметка">{task.note || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'activity',
              label: 'История активности',
              children: <ActivityLog entityType="task" entityId={task.id} />,
            },
          ]}
        />
      </Card>
    </Space>
  );
}

export default TaskDetail;
