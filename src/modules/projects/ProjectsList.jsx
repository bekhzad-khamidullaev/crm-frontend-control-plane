import React, { useEffect, useMemo, useState } from 'react';
import { EditOutlined, EyeOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Popconfirm, Space, Table, Tag, Typography } from 'antd';

import {
  completeProject,
  deleteProject,
  getProjectStages,
  getProjects,
  getUsers,
  reopenProject,
} from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { LIST_HEADER_STYLE, LIST_STACK_STYLE, LIST_TITLE_STYLE } from '../../shared/ui/listLayout';

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
  const locale = getLocale();
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU';

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
      message.warning(t('projectsListPage.messages.stagesLoadWarning'));
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      setUsers([]);
      message.warning(t('projectsListPage.messages.usersLoadWarning'));
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
      setError(err?.message || t('projectsListPage.messages.listLoadError'));
      message.error(t('projectsListPage.messages.loadError'));
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

  const handleResetFilters = () => {
    setSearchText('');
    fetchProjects(1, '');
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      message.success(t('projectsListPage.messages.deleted'));
      fetchProjects(pagination.current, searchText);
    } catch {
      message.error(t('projectsListPage.messages.deleteError'));
    }
  };

  const handleToggleComplete = async (project) => {
    const doneStage = stages.find((stage) => stage.done);
    const isDone = doneStage ? project.stage === doneStage.id : project.active === false;
    try {
      if (isDone) {
        await reopenProject(project.id);
        message.success(t('projectsListPage.messages.reopened'));
      } else {
        await completeProject(project.id);
        message.success(t('projectsListPage.messages.completed'));
      }
      fetchProjects(pagination.current, searchText);
    } catch {
      message.error(t('projectsListPage.messages.statusUpdateError'));
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
      title: t('projectsListPage.columns.project'),
      key: 'project',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <FolderOutlined size={14} /> {record.name}
          </Text>
          {record.description ? <Text type="secondary">{record.description}</Text> : null}
        </Space>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: t('projectsListPage.columns.stage'),
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
      title: t('projectsListPage.columns.owner'),
      dataIndex: 'owner',
      key: 'owner',
      render: (ownerId) => userNameById[ownerId] || '-',
    },
    {
      title: t('projectsListPage.columns.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (date ? `${new Date(date).toLocaleDateString(dateLocale)}` : '-'),
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: t('projectsListPage.columns.actions'),
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined size={14} />} onClick={() => navigate(`/projects/${record.id}`)}>
            {t('projectsListPage.actions.view')}
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<EditOutlined size={14} />} onClick={() => navigate(`/projects/${record.id}/edit`)}>
                {t('projectsListPage.actions.edit')}
              </Button>
              <Popconfirm
                title={t('projectsListPage.actions.delete')}
                description={t('tasksListPage.deleteModal.description')}
                onConfirm={() => handleDelete(record.id)}
                okText={t('tasksListPage.deleteModal.confirm')}
                cancelText={t('tasksListPage.deleteModal.cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined size={14} />}>
                  {t('projectsListPage.actions.delete')}
                </Button>
              </Popconfirm>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={LIST_STACK_STYLE}>
        <Space wrap style={LIST_HEADER_STYLE}>
          <div>
            <Title level={3} style={LIST_TITLE_STYLE}>
              {t('projectsListPage.title')}
            </Title>
            <Text type="secondary">{t('projectsListPage.subtitle')}</Text>
          </div>
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>
              {t('projectsListPage.actions.create')}
            </Button>
          ) : null}
        </Space>

        <EntityListToolbar
          searchValue={searchText}
          searchPlaceholder={t('projectsListPage.searchPlaceholder')}
          onSearchChange={handleSearch}
          onRefresh={() => fetchProjects(pagination.current, searchText)}
          onReset={handleResetFilters}
          loading={loading}
          resultSummary={t('projectsListPage.pagination.total', { total: pagination.total })}
          activeFilters={searchText ? [{ key: 'search', label: t('actions.search'), value: searchText, onClear: handleResetFilters }] : []}
        />

        {error ? <Text type="danger">{error}</Text> : null}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={projects}
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => t('projectsListPage.pagination.total', { total }) }}
          onChange={handleTableChange}
          locale={{ emptyText: t('projectsListPage.empty') }}
        />
      </Space>
    </Card>
  );
}

export default ProjectsList;
