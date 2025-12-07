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
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getContact, deleteContact } from '../../lib/api/client';

const { Title, Text } = Typography;

function ContactDetail({ id }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const data = await getContact(id);
      setContact(data);
    } catch (error) {
      message.error('Ошибка загрузки данных контакта');
      // Mock data for demo
      setContact({
        id,
        first_name: 'Анна',
        last_name: 'Смирнова',
        email: 'anna@example.com',
        phone: '+7 999 111-22-33',
        company: 'ООО "Альфа"',
        position: 'Менеджер',
        type: 'client',
        address: 'г. Москва, ул. Ленина, д. 1',
        website: 'https://example.com',
        notes: 'Постоянный клиент, работает с компанией с 2022 года',
        created_at: '2024-01-20T10:30:00Z',
        updated_at: '2024-01-20T10:30:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact(id);
      message.success('Контакт удален');
      navigate('/contacts');
    } catch (error) {
      message.error('Ошибка удаления контакта');
    }
  };

  const typeConfig = {
    client: { color: 'blue', text: 'Клиент' },
    partner: { color: 'green', text: 'Партнер' },
    supplier: { color: 'orange', text: 'Поставщик' },
    employee: { color: 'purple', text: 'Сотрудник' },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contact) {
    return <div>Контакт не найден</div>;
  }

  const typeStyle = typeConfig[contact.type] || typeConfig.client;

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Полное имя" span={2}>
              <Space>
                <Avatar icon={<UserOutlined />} size="large" />
                <Text strong style={{ fontSize: 16 }}>
                  {contact.first_name} {contact.last_name}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Телефон">
              <Space>
                <PhoneOutlined />
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Компания">{contact.company || '-'}</Descriptions.Item>
            <Descriptions.Item label="Должность">{contact.position || '-'}</Descriptions.Item>
            <Descriptions.Item label="Тип">
              <Tag color={typeStyle.color}>{typeStyle.text}</Tag>
            </Descriptions.Item>
            {contact.website && (
              <Descriptions.Item label="Веб-сайт">
                <Space>
                  <GlobalOutlined />
                  <a href={contact.website} target="_blank" rel="noopener noreferrer">
                    {contact.website}
                  </a>
                </Space>
              </Descriptions.Item>
            )}
            {contact.address && (
              <Descriptions.Item label="Адрес" span={2}>
                <Space>
                  <HomeOutlined />
                  {contact.address}
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Дата создания">
              {new Date(contact.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {new Date(contact.updated_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            {contact.notes && (
              <Descriptions.Item label="Заметки" span={2}>
                {contact.notes}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Сделок"
                  value={5}
                  suffix="шт"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Задач"
                  value={3}
                  suffix="шт"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Общая сумма сделок"
                  value={1250000}
                  suffix="₽"
                  valueStyle={{ color: '#cf1322' }}
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
                  <Text strong>Контакт создан</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(contact.created_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Статус изменен на "{typeStyle.text}"</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(contact.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>Отправлено письмо</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(contact.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'deals',
      label: 'Сделки',
      children: <div>Список сделок с этим контактом появится здесь</div>,
    },
    {
      key: 'tasks',
      label: 'Задачи',
      children: <div>Список задач связанных с контактом появится здесь</div>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/contacts/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>
        {contact.first_name} {contact.last_name}
      </Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default ContactDetail;
