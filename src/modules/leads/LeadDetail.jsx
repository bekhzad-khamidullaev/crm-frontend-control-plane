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
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getLead, deleteLead } from '../../lib/api/client';

const { Title, Text } = Typography;

function LeadDetail({ id }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const data = await getLead(id);
      setLead(data);
    } catch (error) {
      message.error('Ошибка загрузки данных лида');
      // Mock data for demo
      setLead({
        id,
        first_name: 'Иван',
        last_name: 'Иванов',
        email: 'ivan@example.com',
        phone: '+7 999 123-45-67',
        company: 'ООО "Технологии"',
        position: 'Директор',
        status: 'new',
        source: 'website',
        description: 'Интересуется нашими услугами',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(id);
      message.success('Лид удален');
      navigate('/leads');
    } catch (error) {
      message.error('Ошибка удаления лида');
    }
  };

  const statusConfig = {
    new: { color: 'blue', text: 'Новый' },
    contacted: { color: 'orange', text: 'Связались' },
    qualified: { color: 'green', text: 'Квалифицирован' },
    converted: { color: 'cyan', text: 'Конвертирован' },
    lost: { color: 'red', text: 'Потерян' },
  };

  const sourceConfig = {
    website: 'Веб-сайт',
    referral: 'Реферал',
    email: 'Email',
    phone: 'Телефон',
    social: 'Соцсети',
    advertisement: 'Реклама',
    other: 'Другое',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lead) {
    return <div>Лид не найден</div>;
  }

  const statusStyle = statusConfig[lead.status] || statusConfig.new;

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Имя" span={2}>
            {lead.first_name} {lead.last_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <Space>
              <MailOutlined />
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Телефон">
            <Space>
              <PhoneOutlined />
              <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Компания">{lead.company || '-'}</Descriptions.Item>
          <Descriptions.Item label="Должность">{lead.position || '-'}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={statusStyle.color}>{statusStyle.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Источник">
            {sourceConfig[lead.source] || lead.source}
          </Descriptions.Item>
          <Descriptions.Item label="Дата создания">
            {new Date(lead.created_at).toLocaleString('ru-RU')}
          </Descriptions.Item>
          <Descriptions.Item label="Последнее обновление">
            {new Date(lead.updated_at).toLocaleString('ru-RU')}
          </Descriptions.Item>
          <Descriptions.Item label="Описание" span={2}>
            {lead.description || '-'}
          </Descriptions.Item>
        </Descriptions>
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
                  <Text strong>Лид создан</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(lead.created_at).toLocaleString('ru-RU')}
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
                    {new Date(lead.updated_at).toLocaleString('ru-RU')}
                  </Text>
                </>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'notes',
      label: 'Заметки',
      children: <div>Заметок пока нет</div>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/leads/${id}/edit`)}
        >
          Редактировать
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>
        {lead.first_name} {lead.last_name}
      </Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default LeadDetail;
