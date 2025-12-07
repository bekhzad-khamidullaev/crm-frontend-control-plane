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
  Avatar,
  Row,
  Col,
  Statistic,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  HomeOutlined,
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getCompany, deleteCompany } from '../../lib/api/client';

const { Title, Text } = Typography;

function CompanyDetail({ id }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const data = await getCompany(id);
      setCompany(data);
    } catch (error) {
      message.error('Ошибка загрузки данных компании');
      // Mock data for demo
      setCompany({
        id,
        name: 'ООО "ТехноПром"',
        email: 'info@technoprom.ru',
        phone: '+7 495 123-45-67',
        website: 'https://technoprom.ru',
        industry: 'Производство',
        employees_count: 150,
        annual_revenue: 50000000,
        type: 'client',
        address: 'г. Москва, Промышленная ул., д. 10',
        description: 'Крупный производитель промышленного оборудования. Работает на рынке с 2010 года.',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCompany(id);
      message.success('Компания удалена');
      navigate('/companies');
    } catch (error) {
      message.error('Ошибка удаления компании');
    }
  };

  const typeConfig = {
    client: { color: 'blue', text: 'Клиент' },
    partner: { color: 'green', text: 'Партнер' },
    supplier: { color: 'orange', text: 'Поставщик' },
    competitor: { color: 'red', text: 'Конкурент' },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return <div>Компания не найдена</div>;
  }

  const typeStyle = typeConfig[company.type] || typeConfig.client;

  const mockContacts = [
    { id: 1, name: 'Иван Петров', position: 'Директор', phone: '+7 999 111-22-33' },
    { id: 2, name: 'Мария Сидорова', position: 'Менеджер', phone: '+7 999 222-33-44' },
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
                <Avatar icon={<ShopOutlined />} size="large" style={{ backgroundColor: '#52c41a' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {company.name}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Отрасль">{company.industry}</Descriptions.Item>
            <Descriptions.Item label="Тип">
              <Tag color={typeStyle.color}>{typeStyle.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Телефон">
              <Space>
                <PhoneOutlined />
                <a href={`tel:${company.phone}`}>{company.phone}</a>
              </Space>
            </Descriptions.Item>
            {company.website && (
              <Descriptions.Item label="Веб-сайт" span={2}>
                <Space>
                  <GlobalOutlined />
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    {company.website}
                  </a>
                </Space>
              </Descriptions.Item>
            )}
            {company.address && (
              <Descriptions.Item label="Адрес" span={2}>
                <Space>
                  <HomeOutlined />
                  {company.address}
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Количество сотрудников">
              {company.employees_count ? `${company.employees_count} чел.` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Годовой доход">
              {company.annual_revenue
                ? `${(company.annual_revenue / 1000000).toFixed(1)} млн ₽`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {new Date(company.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {new Date(company.updated_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            {company.description && (
              <Descriptions.Item label="Описание" span={2}>
                {company.description}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Контактов"
                  value={2}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Активных сделок"
                  value={3}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Сумма сделок"
                  value={5500000}
                  prefix={<DollarOutlined />}
                  suffix="₽"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Задач"
                  value={7}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'contacts',
      label: 'Контакты',
      children: (
        <List
          dataSource={mockContacts}
          renderItem={(contact) => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => navigate(`/contacts/${contact.id}`)}>
                  Просмотр
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<TeamOutlined />} />}
                title={contact.name}
                description={
                  <Space direction="vertical" size="small">
                    <Text>{contact.position}</Text>
                    <Text type="secondary">
                      <PhoneOutlined /> {contact.phone}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'deals',
      label: 'Сделки',
      children: <div>Список сделок с этой компанией появится здесь</div>,
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
                  <Text strong>Компания создана</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(company.created_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Тип изменен на "{typeStyle.text}"</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(company.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>Новая сделка создана</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(company.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/companies')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/companies/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{company.name}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default CompanyDetail;
