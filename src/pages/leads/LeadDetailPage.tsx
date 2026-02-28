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
    Space,
    Spin,
    Tabs,
    Tag,
    theme as antdTheme,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';
// @ts-ignore
import { useLead } from '@/entities/lead/api/queries';
import { navigate } from '@/router.js';

const { Title, Text } = Typography;

interface LeadDetailPageProps {
  id?: number;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ id }) => {
  const { token } = antdTheme.useToken();
  const { data: lead, isLoading } = useLead(id!);

  // Explicitly check for loading status
  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  // If loading is finished but no lead
  if (!lead) {
    return <div>Лид не найден</div>;
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
               <Text strong>{lead.full_name}</Text>
               {lead.disqualified && <Tag color="red">Дисквалифицирован</Tag>}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Должность">
             {lead.title || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Компания">
             {lead.company_name ? (
               <Space>
                 <BankOutlined /> {lead.company_name}
               </Space>
             ) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
             {lead.email ? <a href={`mailto:${lead.email}`}><MailOutlined /> {lead.email}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Телефон">
             {lead.phone ? <a href={`tel:${lead.phone}`}><PhoneOutlined /> {lead.phone}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Адрес" span={2}>
            {lead.address || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Ответственный">
            {lead.owner || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Источник">
            {lead.lead_source || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Дата создания">
            {lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Теги" span={2}>
            {(lead.tags || []).map(tag => <Tag key={tag}>{tag}</Tag>)}
          </Descriptions.Item>

          <Descriptions.Item label="Описание" span={2}>
            {lead.description || '-'}
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
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/leads/${id}/edit`)}
        >
          Редактировать
        </Button>
      </Space>

      <Title level={2}>{lead.full_name}</Title>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="details" />
      </Card>
    </div>
  );
};

export default LeadDetailPage;
