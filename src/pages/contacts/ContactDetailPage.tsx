import { useCompany } from '@/entities/company/api/queries';
import { useContact } from '@/entities/contact/api/queries';
import { navigate } from '@/router.js';
import { BankOutlined, EditOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Descriptions, Result, Space, Spin, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

const { Text, Title } = Typography;

export interface ContactDetailPageProps {
  id?: number;
}

export const ContactDetailPage: React.FC<ContactDetailPageProps> = ({ id }) => {
  const { data: contact, isLoading } = useContact(id!);
  const canManage = canWrite();
  const { data: company } = useCompany(contact?.company || 0, !!contact?.company);

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  if (!contact) {
    return <Result status="404" title="Контакт не найден" extra={<Button onClick={() => navigate('/contacts')}>К контактам</Button>} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/contacts')}>Назад</Button>
          {contact.massmail ? <Tag color="blue">В рассылке</Tag> : null}
        </Space>
        {canManage ? (
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/contacts/${id}/edit`)}>
            Редактировать
          </Button>
        ) : null}
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{contact.full_name}</Title>
        <Text type="secondary">{contact.email || contact.phone || contact.title || 'Карточка контакта'}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Компания">{company?.full_name || 'Не указана'}</Card>
        <Card size="small" title="Ответственный">{String(contact.owner || 'Не назначен')}</Card>
        <Card size="small" title="Создан">{contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY') : '-'}</Card>
      </Space>

      <Card>
        <Tabs
          defaultActiveKey="details"
          items={[
            {
              key: 'details',
              label: 'Детали',
              children: (
                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                  <Descriptions.Item label="ФИО" span={2}>
                    <Space><Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} /><Text strong>{contact.full_name}</Text></Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Должность">{contact.title || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Компания">{company ? <Space><BankOutlined /> {company.full_name || 'Компания'}</Space> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{contact.email ? <a href={`mailto:${contact.email}`}><MailOutlined /> {contact.email}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{contact.phone ? <a href={`tel:${contact.phone}`}><PhoneOutlined /> {contact.phone}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Адрес" span={2}>{contact.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Ответственный">{contact.owner || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Описание" span={2}>{contact.description || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            { key: 'activity', label: 'История', children: <div>История взаимодействий (В разработке)</div> },
          ]}
        />
      </Card>
    </Space>
  );
};

export default ContactDetailPage;
