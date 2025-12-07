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
  Steps,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeal, deleteDeal } from '../../lib/api/client';

const { Title, Text } = Typography;

function DealDetail({ id }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeal();
  }, [id]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const data = await getDeal(id);
      setDeal(data);
    } catch (error) {
      message.error('Ошибка загрузки данных сделки');
      // Mock data for demo
      setDeal({
        id,
        title: 'Поставка оборудования',
        amount: 1500000,
        stage: 'negotiation',
        probability: 70,
        expected_close_date: '2024-03-15',
        contact: { id: 1, name: 'Иван Петров', position: 'Директор' },
        company: { id: 1, name: 'ООО "ТехноПром"', industry: 'Производство' },
        owner: 'Алексей Иванов',
        description: 'Поставка промышленного оборудования для производственной линии. Включает монтаж и настройку.',
        created_at: '2024-01-20T10:30:00Z',
        updated_at: '2024-01-25T15:45:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal(id);
      message.success('Сделка удалена');
      navigate('/deals');
    } catch (error) {
      message.error('Ошибка удаления сделки');
    }
  };

  const stageConfig = {
    lead: { color: 'default', text: 'Лид', step: 0 },
    qualification: { color: 'blue', text: 'Квалификация', step: 1 },
    meeting: { color: 'cyan', text: 'Встреча', step: 2 },
    proposal: { color: 'orange', text: 'Предложение', step: 3 },
    negotiation: { color: 'gold', text: 'Переговоры', step: 4 },
    closed_won: { color: 'green', text: 'Выиграна', step: 5 },
    closed_lost: { color: 'red', text: 'Проиграна', step: 5 },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!deal) {
    return <div>Сделка не найдена</div>;
  }

  const stageStyle = stageConfig[deal.stage] || stageConfig.lead;
  const closeDate = new Date(deal.expected_close_date);
  const today = new Date();
  const daysLeft = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));

  const salesSteps = [
    { title: 'Лид', icon: <UserOutlined /> },
    { title: 'Квалификация', icon: <CheckCircleOutlined /> },
    { title: 'Встреча', icon: <CalendarOutlined /> },
    { title: 'Предложение', icon: <DollarOutlined /> },
    { title: 'Переговоры', icon: <ClockCircleOutlined /> },
    { title: 'Завершение', icon: <CheckCircleOutlined /> },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Steps
              current={stageStyle.step}
              items={salesSteps}
              status={deal.stage === 'closed_lost' ? 'error' : 'process'}
            />
          </Card>

          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название сделки" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {deal.title}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Сумма">
              <Space>
                <DollarOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {deal.amount.toLocaleString('ru-RU')} ₽
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Стадия">
              <Tag color={stageStyle.color}>{stageStyle.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Вероятность">
              <Progress
                percent={deal.probability}
                size="small"
                status={
                  deal.probability >= 70
                    ? 'success'
                    : deal.probability >= 40
                    ? 'normal'
                    : 'exception'
                }
              />
            </Descriptions.Item>
            <Descriptions.Item label="Ожидаемая дата закрытия">
              <Space direction="vertical" size="small">
                <Space>
                  <CalendarOutlined />
                  {closeDate.toLocaleDateString('ru-RU')}
                </Space>
                {daysLeft > 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    через {daysLeft} дней
                  </Text>
                )}
                {daysLeft < 0 && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    просрочено на {Math.abs(daysLeft)} дней
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Компания">
              <Space>
                <ShopOutlined />
                <a onClick={() => navigate(`/companies/${deal.company.id}`)}>
                  {deal.company.name}
                </a>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Контактное лицо">
              <Space direction="vertical" size="small">
                <a onClick={() => navigate(`/contacts/${deal.contact.id}`)}>
                  {deal.contact.name}
                </a>
                {deal.contact.position && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {deal.contact.position}
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Ответственный">{deal.owner}</Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {new Date(deal.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {new Date(deal.updated_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            {deal.description && (
              <Descriptions.Item label="Описание" span={2}>
                {deal.description}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Задач"
                  value={5}
                  suffix="шт"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Завершено задач"
                  value={3}
                  suffix="/ 5"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Дней до закрытия"
                  value={daysLeft > 0 ? daysLeft : 0}
                  valueStyle={{ color: daysLeft > 0 ? '#1890ff' : '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        </>
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
                  <Text strong>Сделка создана</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(deal.created_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Стадия изменена на "{stageStyle.text}"</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(deal.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>Встреча запланирована</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(deal.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'cyan',
              children: (
                <>
                  <Text strong>Отправлено коммерческое предложение</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(deal.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'tasks',
      label: 'Задачи',
      children: <div>Список задач по этой сделке появится здесь</div>,
    },
    {
      key: 'files',
      label: 'Файлы',
      children: <div>Прикрепленные файлы появятся здесь</div>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/deals/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{deal.title}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default DealDetail;
