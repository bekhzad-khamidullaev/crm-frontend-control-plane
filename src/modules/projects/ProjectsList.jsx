import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Edit, Eye, Folder, Trash2 } from 'lucide-react';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Input, Space, Table, Tag, Typography } from 'antd';

import {
  completeProject,
  deleteProject,
  getProjectStages,
  getProjects,
  getUsers,
  reopenProject,
} from '../../lib/api';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { Search } = Input;
const { Text, Title } = Typography;

function ProjectsList() {
  const { message } = App.useApp();
  const canManage = canWrite('tasks.change_project');
  const [projects, setProjects] = useState([]);
  const [allProjectsCache, setAllProjectsCache] = useState(null);
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

  useEffect(() => {
    fetchProjects(1, searchText);
    loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReferences = async () => {
    const [stagesRes, usersRes] = await Promise.allSettled([
      getProjectStages({ page_size: 200 }),
      getUsers({ page_size: 200 }),
    ]);

    if (stagesRes.status === 'fulfilled') {
      const data = stagesRes.value;
      setStages(data?.results || data || []);
    } else {
      setStages([]);
      message.warning('Не удалось загрузить стадии проектов');
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      setUsers([]);
      message.warning('Не удалось загрузить пользователей');
    }
  };

  const fetchProjects = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjects({
        page,
        page_size: pageSize,
        search: search || undefined,
      });

      const results = response.results || [];
      const totalCount = response.count || 0;

      if (results.length > pageSize && results.length === totalCount) {
        setAllProjectsCache(results);
        const startIndex = (page - 1) * pageSize;
        setProjects(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllProjectsCache(null);
        setProjects(results);
      }

      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: totalCount,
      }));
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить список проектов');
      message.error('Ошибка загрузки проектов');
      setProjects([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchProjects(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      message.success('Проект удален');
      fetchProjects(pagination.current, searchText);
    } catch {
      message.error('Ошибка удаления проекта');
    }
  };

  const handleToggleComplete = async (project) => {
    const doneStage = stages.find((stage) => stage.done);
    const isDone = doneStage ? project.stage === doneStage.id : project.active === false;
    try {
      if (isDone) {
        await reopenProject(project.id);
        message.success('Проект возобновлен');
      } else {
        await completeProject(project.id);
        message.success('Проект завершен');
      }
      fetchProjects(pagination.current, searchText);
    } catch {
      message.error('Ошибка обновления статуса проекта');
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;

    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllProjectsCache(null);
      fetchProjects(nextPage, searchText, nextPageSize);
      return;
    }

    if (allProjectsCache && allProjectsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setProjects(allProjectsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchProjects(nextPage, searchText, nextPageSize);
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
      title: 'Проект',
      key: 'project',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <Folder size={14} /> {record.name}
          </Text>
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
      title: 'Владелец',
      dataIndex: 'owner',
      key: 'owner',
      render: (ownerId) => userNameById[ownerId] || '-',
    },
    {
      title: 'Срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (date ? `${new Date(date).toLocaleDateString('ru-RU')}` : '-'),
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => navigate(`/projects/${record.id}`)}>
            Просмотр
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/projects/${record.id}/edit`)}>
                Редактировать
              </Button>
              <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record.id)}>
                Удалить
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Проекты
            </Title>
            <Text type="secondary">Список проектов</Text>
          </div>
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>
              Создать проект
            </Button>
          ) : null}
        </Space>

        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="Поиск проектов..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ maxWidth: 360 }}
          />
          <Button onClick={() => fetchProjects(pagination.current, searchText)} loading={loading}>
            Обновить
          </Button>
        </Space>

        {error ? <Text type="danger">{error}</Text> : null}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={projects}
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
          onChange={handleTableChange}
          locale={{ emptyText: 'Нет проектов' }}
        />
      </Space>
    </Card>
  );
}

export default ProjectsList;
