import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Edit, RotateCcw, Trash2, User } from 'lucide-react';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tabs, Tag, Typography } from 'antd';

import ActivityLog from '../../components/ActivityLog';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getProject, deleteProject, getUsers, projectsApi } from '../../lib/api/client';
import { getProjectStages, getCrmTags } from '../../lib/api/reference';
import { navigate } from '../../router';

const { Title } = Typography;

function ProjectDetail({ id }) {
  const { message } = App.useApp();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignState, setAssignState] = useState({ owner: '', co_owner: '', responsible: [], subscribers: [] });

  useEffect(() => {
    loadProject();
    loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch {
      setProject(null);
      setLoadError(true);
      message.error('Ошибка загрузки данных проекта');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [stagesResponse, tagsResponse, usersResponse] = await Promise.all([
        getProjectStages({ page_size: 200 }),
        getCrmTags({ page_size: 200 }),
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
      await deleteProject(id);
      message.success('Проект удален');
      navigate('/projects');
    } catch {
      message.error('Ошибка удаления проекта');
    }
  };

  const handleComplete = async () => {
    try {
      await projectsApi.complete(id);
      message.success('Проект завершен');
      loadProject();
    } catch {
      message.error('Ошибка завершения проекта');
    }
  };

  const handleReopen = async () => {
    try {
      await projectsApi.reopen(id);
      message.success('Проект возобновлен');
      loadProject();
    } catch {
      message.error('Ошибка возобновления проекта');
    }
  };

  const openAssignModal = () => {
    setAssignState({
      owner: project?.owner || '',
      co_owner: project?.co_owner || '',
      responsible: project?.responsible || [],
      subscribers: project?.subscribers || [],
    });
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      await projectsApi.assign(id, assignState);
      message.success('Назначения обновлены');
      setAssignModalOpen(false);
      loadProject();
    } catch {
      message.error('Ошибка назначения');
    } finally {
      setAssigning(false);
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

  if (loadError) {
    return (
      <Result
        status="error"
        title="Не удалось открыть проект"
        subTitle="Попробуйте повторить загрузку"
        extra={<Button onClick={loadProject}>Повторить</Button>}
      />
    );
  }

  if (!project) {
    return (
      <Result
        status="404"
        title="Проект не найден"
        subTitle="Запись могла быть удалена или у вас нет доступа"
        extra={<Button onClick={() => navigate('/projects')}>К списку проектов</Button>}
      />
    );
  }

  const stage = stageMap[project.stage];
  const responsibleNames = Array.isArray(project.responsible) ? project.responsible.map((uid) => userMap[uid]).filter(Boolean) : [];
  const subscriberNames = Array.isArray(project.subscribers) ? project.subscribers.map((uid) => userMap[uid]).filter(Boolean) : [];
  const tagNames = Array.isArray(project.tags) ? project.tags.map((tagId) => tagMap[tagId]).filter(Boolean) : [];
  const isCompleted = stage?.done || project.active === false;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/projects')}>
          Назад
        </Button>
        <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/projects/${id}/edit`)}>
          Редактировать
        </Button>
        <Button icon={<User size={14} />} onClick={openAssignModal}>
          Назначить
        </Button>
        {isCompleted ? (
          <Button icon={<RotateCcw size={14} />} onClick={handleReopen}>
            Возобновить
          </Button>
        ) : (
          <Button icon={<CheckCircle size={14} />} onClick={handleComplete}>
            Завершить
          </Button>
        )}
        <Button danger icon={<Trash2 size={14} />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Card>
        <Title level={3}>{project.name}</Title>
        <Tabs
          items={[
            {
              key: 'details',
              label: 'Детали',
              children: (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Название">{project.name}</Descriptions.Item>
                  <Descriptions.Item label="Этап">{stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Приоритет">{project.priority ? `Приоритет ${project.priority}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата начала">{project.start_date ? dayjs(project.start_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Срок завершения">{project.due_date ? dayjs(project.due_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата закрытия">{project.closing_date ? dayjs(project.closing_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Следующий шаг">{project.next_step || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата следующего шага">{project.next_step_date ? dayjs(project.next_step_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Активен">{project.active ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="Напоминать">{project.remind_me ? <Tag color="gold">Да</Tag> : <Tag>Нет</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="Владелец">{project.owner ? userMap[project.owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Со-владелец">{project.co_owner ? userMap[project.co_owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Ответственные">{responsibleNames.length ? responsibleNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Подписчики">{subscriberNames.length ? subscriberNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Теги">{tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{project.creation_date ? dayjs(project.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Последнее обновление">{project.update_date ? dayjs(project.update_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Описание">{project.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Заметка">{project.note || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'activity',
              label: 'История активности',
              children: <ActivityLog entityType="project" entityId={project.id} />,
            },
          ]}
        />
      </Card>

      <Modal
        title="Назначения проекта"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleAssign}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={assigning}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <EntitySelect
            endpoint="users"
            value={assignState.owner}
            onChange={(value) => setAssignState((prev) => ({ ...prev, owner: value }))}
            placeholder="Владелец"
          />
          <EntitySelect
            endpoint="users"
            value={assignState.co_owner}
            onChange={(value) => setAssignState((prev) => ({ ...prev, co_owner: value }))}
            placeholder="Со-владелец"
          />
          <EntitySelect
            endpoint="users"
            mode="multiple"
            value={assignState.responsible}
            onChange={(value) => setAssignState((prev) => ({ ...prev, responsible: value || [] }))}
            placeholder="Ответственные"
          />
          <EntitySelect
            endpoint="users"
            mode="multiple"
            value={assignState.subscribers}
            onChange={(value) => setAssignState((prev) => ({ ...prev, subscribers: value || [] }))}
            placeholder="Подписчики"
          />
        </Space>
      </Modal>
    </Space>
  );
}

export default ProjectDetail;
