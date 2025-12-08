import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Popconfirm,
  message,
  Card,
  Typography,
  Avatar,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FolderOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getProjects, deleteProject } from '../../lib/api/client';

const { Title, Text } = Typography;

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchProjects = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getProjects({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setProjects(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки проектов');
      // Mock data for demo
      setProjects([
        {
          id: 1,
          name: 'Внедрение CRM системы',
          description: 'Полное внедрение CRM для компании',
          status: 'in_progress',
          progress: 45,
          start_date: '2024-01-15',
          end_date: '2024-04-30',
          budget: 2500000,
          client: 'ООО "ТехноПром"',
          manager: 'Алексей Иванов',
          team_size: 5,
          created_at: '2024-01-10',
        },
        {
          id: 2,
          name: 'Разработка мобильного приложения',
          description: 'iOS и Android приложение',
          status: 'planning',
          progress: 10,
          start_date: '2024-02-01',
          end_date: '2024-06-30',
          budget: 3500000,
          client: 'АО "Инновации"',
          manager: 'Елена Смирнова',
          team_size: 8,
          created_at: '2024-01-20',
        },
        {
          id: 3,
          name: 'Консалтинг по автоматизации',
          description: 'Аудит и рекомендации',
          status: 'completed',
          progress: 100,
          start_date: '2023-12-01',
          end_date: '2024-01-31',
          budget: 850000,
          client: 'ИП Козлов',
          manager: 'Дмитрий Козлов',
          team_size: 3,
          created_at: '2023-11-25',
        },
      ]);
      setPagination({
        ...pagination,
        current: 1,
        total: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1, searchText);
  }, []);

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

  const statusConfig = {
    planning: { color: 'default', text: 'Планирование' },
    in_progress: { color: 'blue', text: 'В работе' },
    on_hold: { color: 'orange', text: 'Приостановлен' },
    completed: { color: 'green', text: 'Завершен' },
    cancelled: { color: 'red', text: 'Отменен' },
  };

  const columns = [
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
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusConfig[status] || statusConfig.planning;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(statusConfig).map((key) => ({
        text: statusConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Прогресс',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        </div>
      ),
      sorter: (a, b) => a.progress - b.progress,
    },
    {
      title: 'Клиент',
      dataIndex: 'client',
      key: 'client',
      sorter: (a, b) => a.client.localeCompare(b.client),
    },
    {
      title: 'Менеджер',
      dataIndex: 'manager',
      key: 'manager',
      sorter: (a, b) => a.manager.localeCompare(b.manager),
    },
    {
      title: 'Команда',
      dataIndex: 'team_size',
      key: 'team_size',
      render: (size) => (
        <Space>
          <TeamOutlined />
          <Text>{size} чел.</Text>
        </Space>
      ),
      sorter: (a, b) => a.team_size - b.team_size,
    },
    {
      title: 'Бюджет',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `${(budget / 1000000).toFixed(1)} млн ₽`,
      sorter: (a, b) => a.budget - b.budget,
    },
    {
      title: 'Сроки',
      key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <CalendarOutlined />
            <Text style={{ fontSize: 12 }}>
              {new Date(record.start_date).toLocaleDateString('ru-RU')}
            </Text>
          </Space>
          <Space size="small">
            <CalendarOutlined />
            <Text style={{ fontSize: 12 }}>
              {new Date(record.end_date).toLocaleDateString('ru-RU')}
            </Text>
          </Space>
        </Space>
      ),
      sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date),
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>Проекты</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/projects/new')}
        >
          Создать проект
        </Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Поиск по названию, описанию, клиенту..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
        />
      </Card>
    </div>
  );
}

export default ProjectsList;
