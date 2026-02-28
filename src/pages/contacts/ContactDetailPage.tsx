import { useCompany } from '@/entities/company/api/queries';
import { useContact } from '@/entities/contact/api/queries';
import { navigate } from '@/router.js';
import {
    ArrowLeftOutlined,
    BankOutlined,
    EditOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Card,
    Descriptions,
    Grid,
    Space,
    Spin,
    Tabs,
    theme as antdTheme,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const { Title, Text } = Typography;

export interface ContactDetailPageProps {
  id?: number;
}

export const ContactDetailPage: React.FC<ContactDetailPageProps> = ({ id }) => {
  const { token } = antdTheme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { data: contact, isLoading } = useContact(id!);

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
    <div className="detail-page">
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')} block={isMobile}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/contacts/${id}/edit`)}
          block={isMobile}
        >
          Редактировать
        </Button>
      </Space>

      <Title level={isMobile ? 3 : 2}>{contact.full_name}</Title>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        <Tabs items={tabItems} defaultActiveKey="details" size={isMobile ? 'small' : 'middle'} />
      </Card>
    </div>
  );
};

export default ContactDetailPage;
