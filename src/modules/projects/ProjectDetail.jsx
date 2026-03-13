import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Edit, RotateCcw, Trash2, User } from 'lucide-react';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tabs, Tag, Typography } from 'antd';

import ActivityLog from '../../components/ActivityLog';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getProject, deleteProject, getUsers, projectsApi } from '../../lib/api/client';
import { getProjectStages, getCrmTags } from '../../lib/api/reference';
import { t } from '../../lib/i18n';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { Title } = Typography;

function ProjectDetail({ id }) {
  const { message } = App.useApp();
  const canManage = canWrite('tasks.change_project');
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
      message.error(t('projectDetailPage.messages.loadError'));
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
      message.success(t('projectDetailPage.messages.deleted'));
      navigate('/projects');
    } catch {
      message.error(t('projectDetailPage.messages.deleteError'));
    }
  };

  const handleComplete = async () => {
    try {
      await projectsApi.complete(id);
      message.success(t('projectDetailPage.messages.completed'));
      loadProject();
    } catch {
      message.error(t('projectDetailPage.messages.completeError'));
    }
  };

  const handleReopen = async () => {
    try {
      await projectsApi.reopen(id);
      message.success(t('projectDetailPage.messages.reopened'));
      loadProject();
    } catch {
      message.error(t('projectDetailPage.messages.reopenError'));
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
      message.success(t('projectDetailPage.messages.assignmentsUpdated'));
      setAssignModalOpen(false);
      loadProject();
    } catch {
      message.error(t('projectDetailPage.messages.assignmentsError'));
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
        title={t('projectDetailPage.loadError.title')}
        subTitle={t('projectDetailPage.loadError.subtitle')}
        extra={<Button onClick={loadProject}>{t('projectDetailPage.loadError.retry')}</Button>}
      />
    );
  }

  if (!project) {
    return (
      <Result
        status="404"
        title={t('projectDetailPage.notFound.title')}
        subTitle={t('projectDetailPage.notFound.subtitle')}
        extra={<Button onClick={() => navigate('/projects')}>{t('projectDetailPage.notFound.back')}</Button>}
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
          {t('projectDetailPage.actions.back')}
        </Button>
        {canManage ? (
          <>
            <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/projects/${id}/edit`)}>
              {t('projectDetailPage.actions.edit')}
            </Button>
            <Button icon={<User size={14} />} onClick={openAssignModal}>
              {t('projectDetailPage.actions.assign')}
            </Button>
            {isCompleted ? (
              <Button icon={<RotateCcw size={14} />} onClick={handleReopen}>
                {t('projectDetailPage.actions.reopen')}
              </Button>
            ) : (
              <Button icon={<CheckCircle size={14} />} onClick={handleComplete}>
                {t('projectDetailPage.actions.complete')}
              </Button>
            )}
            <Button danger icon={<Trash2 size={14} />} onClick={handleDelete}>
              {t('projectDetailPage.actions.delete')}
            </Button>
          </>
        ) : null}
      </Space>

      <Card>
        <Title level={3}>{project.name}</Title>
        <Tabs
          items={[
            {
              key: 'details',
              label: t('projectDetailPage.tabs.details'),
              children: (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t('projectDetailPage.fields.name')}>{project.name}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.stage')}>{stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.priority')}>{project.priority ? t('projectDetailPage.priorityValue', { value: project.priority }) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.startDate')}>{project.start_date ? dayjs(project.start_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.dueDate')}>{project.due_date ? dayjs(project.due_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.closingDate')}>{project.closing_date ? dayjs(project.closing_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.nextStep')}>{project.next_step || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.nextStepDate')}>{project.next_step_date ? dayjs(project.next_step_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.active')}>{project.active ? <Tag color="green">{t('projectDetailPage.yes')}</Tag> : <Tag>{t('projectDetailPage.no')}</Tag>}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.remindMe')}>{project.remind_me ? <Tag color="gold">{t('projectDetailPage.yes')}</Tag> : <Tag>{t('projectDetailPage.no')}</Tag>}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.owner')}>{project.owner ? userMap[project.owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.coOwner')}>{project.co_owner ? userMap[project.co_owner] || '-' : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.responsible')}>{responsibleNames.length ? responsibleNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.subscribers')}>{subscriberNames.length ? subscriberNames.join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.tags')}>{tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.createdAt')}>{project.creation_date ? dayjs(project.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.updatedAt')}>{project.update_date ? dayjs(project.update_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.description')}>{project.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('projectDetailPage.fields.note')}>{project.note || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'activity',
              label: t('projectDetailPage.tabs.activity'),
              children: <ActivityLog entityType="project" entityId={project.id} />,
            },
          ]}
        />
      </Card>

      <Modal
        title={t('projectDetailPage.assignModal.title')}
        open={assignModalOpen && canManage}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleAssign}
        okText={t('projectDetailPage.assignModal.save')}
        cancelText={t('projectDetailPage.assignModal.cancel')}
        confirmLoading={assigning}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <EntitySelect
            endpoint="users"
            value={assignState.owner}
            onChange={(value) => setAssignState((prev) => ({ ...prev, owner: value }))}
            placeholder={t('projectDetailPage.assignModal.placeholders.owner')}
          />
          <EntitySelect
            endpoint="users"
            value={assignState.co_owner}
            onChange={(value) => setAssignState((prev) => ({ ...prev, co_owner: value }))}
            placeholder={t('projectDetailPage.assignModal.placeholders.coOwner')}
          />
          <EntitySelect
            endpoint="users"
            mode="multiple"
            value={assignState.responsible}
            onChange={(value) => setAssignState((prev) => ({ ...prev, responsible: value || [] }))}
            placeholder={t('projectDetailPage.assignModal.placeholders.responsible')}
          />
          <EntitySelect
            endpoint="users"
            mode="multiple"
            value={assignState.subscribers}
            onChange={(value) => setAssignState((prev) => ({ ...prev, subscribers: value || [] }))}
            placeholder={t('projectDetailPage.assignModal.placeholders.subscribers')}
          />
        </Space>
      </Modal>
    </Space>
  );
}

export default ProjectDetail;
