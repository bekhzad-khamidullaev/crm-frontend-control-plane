import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Avatar,
  Checkbox,
  Typography,
  Popconfirm,
  Modal,
  Form,
} from 'antd';
import {
  FolderOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getProjects, deleteProject, getUsers, projectsApi } from '../../lib/api/client';
import { getProjectStages } from '../../lib/api/reference';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect.jsx';
import { exportAndDownload } from '../../lib/api/export.js';

const { Text } = Typography;

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkTagModalVisible, setBulkTagModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchProjects(1, searchText);
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      const [stagesResponse, usersResponse] = await Promise.all([
        getProjectStages({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setStages(stagesResponse.results || stagesResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading project references:', error);
      setStages([]);
      setUsers([]);
    }
  };

  const fetchProjects = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getProjects({
        page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });
      setProjects(response.results || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.count || 0,
      }));
    } catch (error) {
      message.error('Ошибка загрузки проектов');
      setProjects([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
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
    } catch (error) {
      message.error('Ошибка удаления проекта');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchProjects(newPagination.current, searchText);
  };

  const handleExport = async (format) => {
    try {
      await exportAndDownload('projects', {
        format: format === 'excel' ? 'xlsx' : 'csv',
      });
      message.success('Проекты экспортированы');
    } catch (error) {
      message.error('Ошибка экспорта проектов');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => deleteProject(id)));
      message.success(`Удалено ${ids.length} проектов`);
      setSelectedRowKeys([]);
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка массового удаления');
    }
  };

  const handleBulkTag = () => {
    setBulkTagModalVisible(true);
  };

  const handleBulkTagConfirm = async () => {
    if (!selectedTags.length) {
      message.error('Выберите хотя бы один тег');
      return;
    }

    try {
      await projectsApi.bulkTag({
        project_ids: selectedRowKeys,
        tag_ids: selectedTags,
      });
      message.success(`Теги применены к ${selectedRowKeys.length} проектам`);
      setSelectedRowKeys([]);
      setBulkTagModalVisible(false);
      setSelectedTags([]);
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка применения тегов';
      message.error(errorMessage);
    }
  };

  const stagesById = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {});
  }, [stages]);

  const userNameById = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

  const doneStage = stages.find((stage) => stage.done);

  const handleToggleComplete = async (project) => {
    const isDone = doneStage ? project.stage === doneStage.id : project.active === false;
    try {
      if (isDone) {
        await projectsApi.reopen(project.id);
        message.success('Проект возобновлен');
      } else {
        await projectsApi.complete(project.id);
        message.success('Проект завершен');
      }
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка обновления статуса проекта');
    }
  };

  const priorityConfig = {
    1: { color: 'green', text: 'Низкий' },
    2: { color: 'orange', text: 'Средний' },
    3: { color: 'red', text: 'Высокий' },
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={doneStage ? record.stage === doneStage.id : false}
          onChange={() => handleToggleComplete(record)}
        />
      ),
    },
    {
      title: 'Проект',
      key: 'project',
      render: (_, record) => (
        <Space>
          <Avatar icon={<FolderOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            {record.description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            )}
          </div>
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
        return stage ? <Tag color={stage.done ? 'green' : stage.in_progress ? 'blue' : 'default'}>{stage.name}</Tag> : '-';
      },
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const config = priorityConfig[priority] || { color: 'default', text: '-' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ответственные',
      dataIndex: 'responsible',
      key: 'responsible',
      render: (responsible, record) => {
        const ids = Array.isArray(responsible) ? responsible : [];
        const names = ids.map((id) => userNameById[id]).filter(Boolean);
        const ownerLabel = record.owner ? userNameById[record.owner] || `#${record.owner}` : null;
        return <Text>{names.length ? names.join(', ') : ownerLabel || '-'}</Text>;
      },
    },
    {
      title: 'Срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => {
        if (!date) return '-';
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
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
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
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/projects/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить этот проект?"
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <TableToolbar
        title="Проекты"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, описанию..."
        onSearch={handleSearch}
        onCreate={() => navigate('/projects/new')}
        onRefresh={() => fetchProjects(pagination.current, searchText)}
        onExport={handleExport}
        createButtonText="Создать проект"
        showViewModeSwitch={false}
        showExportButton={true}
      />

      <EnhancedTable
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          doneStage && record.stage === doneStage.id ? 'row-completed' : ''
        }
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет проектов"
        emptyDescription="Создайте первый проект"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onBulkTag={handleBulkTag}
        entityName="проектов"
      />

      <Modal
        title="Добавить теги к проектам"
        open={bulkTagModalVisible}
        onCancel={() => {
          setBulkTagModalVisible(false);
          setSelectedTags([]);
        }}
        onOk={handleBulkTagConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Добавить теги к {selectedRowKeys.length} выбранным проектам</p>
        <Form.Item label="Теги">
          <ReferenceSelect
            type="crm-tags"
            mode="multiple"
            placeholder="Выберите теги"
            value={selectedTags}
            onChange={setSelectedTags}
          />
        </Form.Item>
      </Modal>

      <style jsx>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

export default ProjectsList;
