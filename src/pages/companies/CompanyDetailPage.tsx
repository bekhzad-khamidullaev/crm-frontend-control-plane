import React, { useMemo } from 'react';
import {
  Space,
  Button,
  Tabs,
  Typography,
  Descriptions,
  Tag,
  Avatar,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
  List,
  Table,
  theme as antdTheme,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  ShopOutlined,
  PhoneOutlined,
  TeamOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '@/router.js';
import { useCompany, useCompanyContacts, useCompanyDeals } from '@/entities/company/api/queries';
import { useClientTypes, useIndustries } from '@/features/reference';

const { Title, Text } = Typography;

export interface CompanyDetailPageProps {
  id?: number;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ id }) => {
  const { token } = antdTheme.useToken();
  const formatAmount = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const { data: company, isLoading: isLoadingCompany } = useCompany(id!);
  const { data: contactsData, isLoading: isLoadingContacts } = useCompanyContacts(id!);
  const { data: dealsData, isLoading: isLoadingDeals } = useCompanyDeals(id!);

  // Reference data
  const { data: clientTypes } = useClientTypes();
  const { data: industries } = useIndustries();

  const contacts = contactsData?.results || [];
  const deals = dealsData?.results || [];

  const companyName = company?.full_name || 'Компания';

  // Derived Values
  const clientTypeName = useMemo(() =>
    clientTypes?.results?.find(t => t.id === company?.type)?.name || company?.type,
  [clientTypes, company]);

  const industryNames = useMemo(() =>
    company?.industry?.map((indId: number) =>
      industries?.results?.find(i => i.id === indId)?.name
    ).filter(Boolean) || [],
  [industries, company]);

  const dealsAmount = useMemo(() =>
    deals.reduce((sum: number, deal: any) => sum + Number(deal.amount || 0), 0),
  [deals]);

  if (isLoadingCompany) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!company) {
    return <div>Компания не найдена</div>;
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
          <Descriptions.Item label="Название" span={2}>
            <Space>
              <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
              <Text strong>{companyName}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Тип">
            {clientTypeName ? <Tag color="blue">{clientTypeName}</Tag> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Отрасли">
             {industryNames.length > 0 ? (industryNames as string[]).join(', ') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
             {company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Телефон">
             {company.phone ? <a href={`tel:${company.phone}`}>{company.phone}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Веб-сайт" span={2}>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer">
                {company.website}
              </a>
            ) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Адрес" span={2}>
            {company.address || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Последний контакт">
            {company.was_in_touch ? dayjs(company.was_in_touch).format('DD.MM.YYYY') : '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Дата создания">
            {company.creation_date ? dayjs(company.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'contacts',
      label: `Контакты (${contacts.length})`,
      children: (
        <List
          loading={isLoadingContacts}
          dataSource={contacts}
          renderItem={(contact: any) => (
            <List.Item
              actions={[
                 <Button type="link" onClick={() => navigate(`/contacts/${contact.id}`)}>Просмотр</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<TeamOutlined />} />}
                title={contact.full_name || contact.name}
                description={
                  <Space direction="vertical" size="small">
                     <Text type="secondary">{contact.position || '-'}</Text>
                     <Text type="secondary"><PhoneOutlined/> {contact.phone || '-'}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'deals',
      label: `Сделки (${deals.length})`,
      children: (
        <Table
          dataSource={deals}
          loading={isLoadingDeals}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name', render: (val: string, rec: any) => <a onClick={() => navigate(`/deals/${rec.id}`)}>{val}</a> },
            { title: 'Сумма', dataIndex: 'amount', key: 'amount', render: (val: number) => val ? formatAmount(val) : '-' },
            { title: 'Стадия', dataIndex: 'stage', key: 'stage' },
            { title: 'Дата', dataIndex: 'created_at', key: 'created_at', render: (val: string) => dayjs(val).format('DD.MM.YYYY') }
          ]}
        />
      )
    }
  ];

  return (
    <div className="detail-page">
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/companies')}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/companies/${id}/edit`)}
        >
          Редактировать
        </Button>
      </Space>

      <Title level={2}>{companyName}</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Контактов"
              value={contacts.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Сделок"
              value={deals.length}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
             <Statistic
              title="Сумма сделок"
              value={dealsAmount}
              prefix={<DollarOutlined />}
              formatter={(value) => formatAmount(Number(value || 0))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="details" />
      </Card>
    </div>
  );
};

export default CompanyDetailPage;
