import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, CalendarOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Space, Tabs, Tag, Typography } from 'antd';

import ActivityLog from '../../components/ActivityLog';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';
import { getTask, deleteTask, getUsers } from '../../lib/api/client';
import { getTaskStages, getTaskTags } from '../../lib/api/reference';
import { t } from '../../lib/i18n';
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
      message.error(t('taskDetailPage.messages.loadError'));
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
      message.success(t('taskDetailPage.messages.deleted'));
      navigate('/tasks');
    } catch {
      message.error(t('taskDetailPage.messages.deleteError'));
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
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка задачи"
        description="Открываем карточку задачи."
      />
    );
  }

  if (!task) {
    return (
      <BusinessScreenState
        variant="notFound"
        title={t('taskDetailPage.notFound.title')}
        description={t('taskDetailPage.notFound.subtitle')}
        actionLabel={t('taskDetailPage.notFound.back')}
        onAction={() => navigate('/tasks')}
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
        <Button icon={<ArrowLeftOutlined size={14} />} onClick={() => navigate('/tasks')}>
          {t('taskDetailPage.actions.back')}
        </Button>
        {canManage ? (
          <>
            <Button type="primary" icon={<EditOutlined size={14} />} onClick={() => navigate(`/tasks/${id}/edit`)}>
              {t('taskDetailPage.actions.edit')}
            </Button>
            <Button danger icon={<DeleteOutlined size={14} />} onClick={handleDelete}>
              {t('taskDetailPage.actions.delete')}
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
              label: t('taskDetailPage.tabs.details'),
              children: (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t('taskDetailPage.fields.name')}>{task.name}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.stage')}>{stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.priority')}>{task.priority ? t('taskDetailPage.priorityValue', { value: task.priority }) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.startDate')}>{task.start_date ? dayjs(task.start_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.dueDate')}>{task.due_date ? dayjs(task.due_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.closingDate')}>{task.closing_date ? dayjs(task.closing_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.nextStep')}>{task.next_step || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.nextStepDate')}>{task.next_step_date ? dayjs(task.next_step_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.active')}>{task.active ? <Tag color="green">{t('taskDetailPage.yes')}</Tag> : <Tag>{t('taskDetailPage.no')}</Tag>}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.remindMe')}>{task.remind_me ? <Tag color="gold">{t('taskDetailPage.yes')}</Tag> : <Tag>{t('taskDetailPage.no')}</Tag>}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.owner')}>{task.owner ? userMap[task.owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.coOwner')}>{task.co_owner ? userMap[task.co_owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.responsible')}>{responsibleNames.length ? responsibleNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.subscribers')}>{subscriberNames.length ? subscriberNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.tags')}>{tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.createdAt')}>{task.creation_date ? dayjs(task.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.updatedAt')}>{task.update_date ? dayjs(task.update_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.description')}>{task.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('taskDetailPage.fields.note')}>{task.note || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'activity',
              label: t('taskDetailPage.tabs.activity'),
              children: <ActivityLog entityType="task" entityId={task.id} />,
            },
          ]}
        />
      </Card>
    </Space>
  );
}

export default TaskDetail;
