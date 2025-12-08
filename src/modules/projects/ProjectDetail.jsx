import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Tabs,
  Timeline,
  Typography,
  Progress,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  FolderOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getProject, deleteProject } from '../../lib/api/client';

const { Title, Text } = Typography;

function ProjectDetail({ id }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (error) {
      message.error('Ошибка загрузки данных проекта');
      // Mock data for demo
      setProject({
        id,
        name: 'Внедрение CRM системы',
        description: 'Полное внедрение CRM системы для автоматизации бизнес-процессов компании. Включает анализ, разработку, внедрение и обучение персонала.',
        status: 'in_progress',
        progress: 45,
        start_date: '2024-01-15',
        end_date: '2024-04-30',
        budget: 2500000,
        spent: 1125000,
        client: { id: 1, name: 'ООО "ТехноПром"' },
        manager: { id: 1, name: 'Алексей Иванов' },
        team_size: 5,
        created_at: '2024-01-10T10:30:00Z',
        updated_at: '2024-01-22T15:45:00Z',
      });
    } finally {
      setLoading(false);
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

  const statusConfig = {
    planning: { color: 'default', text: 'Планирование' },
    in_progress: { color: 'blue', text: 'В работе' },
    on_hold: { color: 'orange', text: 'Приостановлен' },
    completed: { color: 'green', text: 'Завершен' },
    cancelled: { color: 'red', text: 'Отменен' },
  };

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

  const statusStyle = statusConfig[project.status] || statusConfig.planning;
  const startDate = new Date(project.start_date);
  const endDate = new Date(project.end_date);
  const today = new Date();
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const budgetUsed = ((project.spent / project.budget) * 100).toFixed(0);

  const mockTasks = [
    { id: 1, title: 'Анализ бизнес-процессов', status: 'completed', assignee: 'Алексей Иванов' },
    { id: 2, title: 'Разработка ТЗ', status: 'completed', assignee: 'Елена Смирнова' },
    { id: 3, title: 'Настройка системы', status: 'in_progress', assignee: 'Дмитрий Козлов' },
    { id: 4, title: 'Обучение персонала', status: 'todo', assignee: 'Алексей Иванов' },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название" span={2}>
              <Space>
                <FolderOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {project.name}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={statusStyle.color}>{statusStyle.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Прогресс">
              <Progress percent={project.progress} status="active" />
            </Descriptions.Item>
            <Descriptions.Item label="Клиент">
              <a onClick={() => navigate(`/companies/${project.client.id}`)}>
                {project.client.name}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Менеджер проекта">
              {project.manager.name}
            </Descriptions.Item>
            <Descriptions.Item label="Период выполнения" span={2}>
              <Space>
                <CalendarOutlined />
                {startDate.toLocaleDateString('ru-RU')} - {endDate.toLocaleDateString('ru-RU')}
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {totalDays} дней, осталось {daysLeft > 0 ? daysLeft : 0} дней
                </Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Бюджет">
              {project.budget.toLocaleString('ru-RU')} ₽
            </Descriptions.Item>
            <Descriptions.Item label="Потрачено">
              {project.spent.toLocaleString('ru-RU')} ₽ ({budgetUsed}%)
            </Descriptions.Item>
            <Descriptions.Item label="Размер команды">
              <Space>
                <TeamOutlined />
                {project.team_size} человек
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {new Date(project.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            {project.description && (
              <Descriptions.Item label="Описание" span={2}>
                {project.description}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Прогресс"
                  value={project.progress}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Дней осталось"
                  value={daysLeft > 0 ? daysLeft : 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: daysLeft > 0 ? '#1890ff' : '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Бюджет использован"
                  value={budgetUsed}
                  suffix="%"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: budgetUsed > 80 ? '#cf1322' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Команда"
                  value={project.team_size}
                  suffix="чел"
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'tasks',
      label: 'Задачи',
      children: (
        <List
          dataSource={mockTasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => navigate(`/tasks/${task.id}`)}>
                  Просмотр
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<CheckSquareOutlined />} />}
                title={task.title}
                description={
                  <Space>
                    <Tag color={task.status === 'completed' ? 'green' : task.status === 'in_progress' ? 'blue' : 'default'}>
                      {task.status === 'completed' ? 'Выполнено' : task.status === 'in_progress' ? 'В работе' : 'К выполнению'}
                    </Tag>
                    <Text type="secondary">{task.assignee}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: (
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Проект создан</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(project.created_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Статус изменен на "{statusStyle.text}"</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(project.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>Прогресс обновлен до {project.progress}%</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(project.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'team',
      label: 'Команда',
      children: <div>Список участников команды появится здесь</div>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/projects/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{project.name}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default ProjectDetail;
