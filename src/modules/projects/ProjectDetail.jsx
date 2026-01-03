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
  Modal,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getProject, deleteProject, getUsers, getUser, projectsApi } from '../../lib/api/client';
import { getProjectStages, getCrmTags } from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import EntitySelect from '../../components/EntitySelect.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function ProjectDetail({ id }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadProject();
    loadReferences();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (error) {
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
    } catch (error) {
      console.error('Error loading project references:', error);
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
    } catch (error) {
      message.error('Ошибка удаления проекта');
    }
  };

  const handleComplete = async () => {
    try {
      await projectsApi.complete(id);
      message.success('Проект завершен');
      loadProject();
    } catch (error) {
      message.error('Ошибка завершения проекта');
    }
  };

  const handleReopen = async () => {
    try {
      await projectsApi.reopen(id);
      message.success('Проект возобновлен');
      loadProject();
    } catch (error) {
      message.error('Ошибка возобновления проекта');
    }
  };

  const openAssignModal = () => {
    assignForm.setFieldsValue({
      owner: project?.owner || null,
      co_owner: project?.co_owner || null,
      responsible: project?.responsible || [],
      subscribers: project?.subscribers || [],
    });
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      setAssigning(true);
      await projectsApi.assign(id, values);
      message.success('Назначения обновлены');
      setAssignModalOpen(false);
      assignForm.resetFields();
      loadProject();
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Ошибка назначения');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignCancel = () => {
    setAssignModalOpen(false);
    assignForm.resetFields();
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

  if (!project) {
    return <div>Проект не найден</div>;
  }

  const stage = stageMap[project.stage];
  const responsibleNames = Array.isArray(project.responsible)
    ? project.responsible.map((id) => userMap[id]).filter(Boolean)
    : [];
  const subscriberNames = Array.isArray(project.subscribers)
    ? project.subscribers.map((id) => userMap[id]).filter(Boolean)
    : [];
  const tagNames = Array.isArray(project.tags)
    ? project.tags.map((id) => tagMap[id]).filter(Boolean)
    : [];
  const isCompleted = stage?.done || project.active === false;

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {project.name}
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
            <Descriptions.Item label="Приоритет">
              {project.priority ? `Приоритет ${project.priority}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата начала">
              {project.start_date ? (
                <Space>
                  <CalendarOutlined />
                  {dayjs(project.start_date).format('DD.MM.YYYY')}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Срок завершения">
              {project.due_date ? (
                <Space>
                  <CalendarOutlined />
                  {dayjs(project.due_date).format('DD.MM.YYYY')}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Дата закрытия">
              {project.closing_date ? dayjs(project.closing_date).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Следующий шаг">{project.next_step || '-'}</Descriptions.Item>
            <Descriptions.Item label="Дата следующего шага">
              {project.next_step_date ? dayjs(project.next_step_date).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Активен">
              <Tag color={project.active ? 'green' : 'default'}>{project.active ? 'Да' : 'Нет'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Напоминать">
              <Tag color={project.remind_me ? 'blue' : 'default'}>{project.remind_me ? 'Да' : 'Нет'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Владелец">
              <Space>
                <UserOutlined />
                {project.owner ? userMap[project.owner] || `#${project.owner}` : '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Со-владелец">
              {project.co_owner ? userMap[project.co_owner] || `#${project.co_owner}` : '-'}
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
              {project.creation_date ? dayjs(project.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {project.update_date ? dayjs(project.update_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            {project.description && (
              <Descriptions.Item label="Описание" span={2}>
                {project.description}
              </Descriptions.Item>
            )}
            {project.note && (
              <Descriptions.Item label="Заметка" span={2}>
                {project.note}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: <ActivityLog entityType="project" entityId={project.id} />,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/projects/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button icon={<UserOutlined />} onClick={openAssignModal}>
          Назначить
        </Button>
        {isCompleted ? (
          <Button icon={<RedoOutlined />} onClick={handleReopen}>
            Возобновить
          </Button>
        ) : (
          <Button icon={<CheckCircleOutlined />} onClick={handleComplete}>
            Завершить
          </Button>
        )}
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{project.name}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="Назначения проекта"
        open={assignModalOpen}
        onCancel={handleAssignCancel}
        onOk={handleAssign}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={assigning}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="owner" label="Владелец">
            <EntitySelect
              fetchOptions={getUsers}
              fetchById={getUser}
              placeholder="Выберите владельца"
            />
          </Form.Item>
          <Form.Item name="co_owner" label="Со-владелец">
            <EntitySelect
              fetchOptions={getUsers}
              fetchById={getUser}
              placeholder="Выберите со-владельца"
            />
          </Form.Item>
          <Form.Item name="responsible" label="Ответственные">
            <EntitySelect
              fetchOptions={getUsers}
              fetchById={getUser}
              mode="multiple"
              placeholder="Выберите ответственных"
            />
          </Form.Item>
          <Form.Item name="subscribers" label="Подписчики">
            <EntitySelect
              fetchOptions={getUsers}
              fetchById={getUser}
              mode="multiple"
              placeholder="Выберите подписчиков"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectDetail;
