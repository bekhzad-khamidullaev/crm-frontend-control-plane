import { useCompany } from '@/entities/company/api/queries';
import { useContact } from '@/entities/contact/api/queries';
import { navigate } from '@/router.js';
import { EntityDetailShell } from '@/shared/ui';
import {
    BankOutlined,
    EditOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Descriptions,
    Space,
    Spin,
    theme as antdTheme,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

const { Text } = Typography;

export interface ContactDetailPageProps {
  id?: number;
}

export const ContactDetailPage: React.FC<ContactDetailPageProps> = ({ id }) => {
  const { token } = antdTheme.useToken();
  const { data: contact, isLoading } = useContact(id!);
  const canManage = canWrite();

  // Conditionally fetch company if exists
  const { data: company } = useCompany(contact?.company || 0, !!contact?.company);

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!contact) {
    return <div>Контакт не найден</div>;
  }

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2 }}
          contentStyle={{ background: token.colorBgContainer }}
          labelStyle={{ background: token.colorFillAlter }}
        >
          <Descriptions.Item label="ФИО" span={2}>
            <Space>
               <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
               <Text strong>{contact.full_name}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Должность">
             {contact.title || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Компания">
             {company ? (
               <Space>
                 <BankOutlined /> {company.full_name || 'Компанія'}
               </Space>
             ) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
             {contact.email ? <a href={`mailto:${contact.email}`}><MailOutlined /> {contact.email}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Телефон">
             {contact.phone ? <a href={`tel:${contact.phone}`}><PhoneOutlined /> {contact.phone}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Адрес" span={2}>
            {contact.address || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Ответственный">
            {contact.owner || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Дата создания">
            {contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Описание" span={2}>
            {contact.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'activity',
      label: 'История',
      children: <div>История взаимодействий (В разработке)</div>
    }
  ];

  return (
    <EntityDetailShell
      onBack={() => navigate('/contacts')}
      title={contact.full_name}
      subtitle={contact.email || contact.phone || contact.title || 'Карточка контакта'}
      statusTag={contact.massmail ? <Button size="small">В рассылке</Button> : undefined}
      primaryActions={
        canManage ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/contacts/${id}/edit`)}
          >
            Редактировать
          </Button>
        ) : null
      }
      stats={[
        { key: 'company', label: 'Компания', value: company?.full_name || 'Не указана' },
        { key: 'owner', label: 'Ответственный', value: String(contact.owner || 'Не назначен') },
        {
          key: 'created',
          label: 'Создан',
          value: contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY') : '-',
        },
      ]}
      tabs={tabItems}
      defaultTabKey="details"
    />
  );
};

export default ContactDetailPage;
