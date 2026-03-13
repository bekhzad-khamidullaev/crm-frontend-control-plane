import React, { useMemo } from 'react';
import { Space, Button, Typography, Descriptions, Tag, Avatar, Spin, List, Table, Card, Result, Tabs } from 'antd';
import { EditOutlined, ShopOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '@/router.js';
import { useCompany, useCompanyContacts, useCompanyDeals } from '@/entities/company/api/queries';
import { useClientTypes, useIndustries } from '@/features/reference';
import { getClientTypeLabel } from '@/features/reference/lib/clientTypeLabel';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
// @ts-ignore
import { getLocale } from '@/lib/i18n';
// @ts-ignore
import { formatCurrency, formatDate } from '@/lib/utils/format.js';

const { Text, Title } = Typography;
const idsEqual = (left: unknown, right: unknown) => String(left) === String(right);

export interface CompanyDetailPageProps {
  id?: number;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ id }) => {
  const canManage = canWrite();

  const { data: company, isLoading: isLoadingCompany } = useCompany(id!);
  const { data: contactsData, isLoading: isLoadingContacts } = useCompanyContacts(id!);
  const { data: dealsData, isLoading: isLoadingDeals } = useCompanyDeals(id!);
  const { data: clientTypes } = useClientTypes();
  const { data: industries } = useIndustries();

  const contacts = contactsData?.results || [];
  const deals = dealsData?.results || [];
  const locale = getLocale();

  const companyName = company?.full_name || 'Компания';

  const clientTypeName = useMemo(
    () => getClientTypeLabel(clientTypes?.results?.find((t) => idsEqual(t.id, company?.type))?.name, locale),
    [clientTypes, company, locale],
  );

  const industryNames = useMemo(
    () => company?.industry?.map((indId: number) => industries?.results?.find((i) => idsEqual(i.id, indId))?.name).filter(Boolean) || [],
    [industries, company],
  );

  const dealsAmount = useMemo(() => deals.reduce((sum: number, deal: any) => sum + Number(deal.amount || 0), 0), [deals]);

  if (isLoadingCompany) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  if (!company) return <Result status="404" title="Компания не найдена" extra={<Button onClick={() => navigate('/companies')}>К компаниям</Button>} />;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/companies')}>Назад</Button>
          {company.active ? <Tag color="success">Активна</Tag> : <Tag>Неактивна</Tag>}
        </Space>
        {canManage ? (
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/companies/${id}/edit`)}>
            Редактировать
          </Button>
        ) : null}
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{companyName}</Title>
        <Text type="secondary">{company.email || company.phone || company.website || 'Карточка компании'}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Контакты">{contacts.length}</Card>
        <Card size="small" title="Сделки">{deals.length}</Card>
        <Card size="small" title="Сумма сделок">{formatCurrency(dealsAmount)}</Card>
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
                  <Descriptions.Item label="Название" span={2}>
                    <Space><Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} /><Text strong>{companyName}</Text></Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Тип">{clientTypeName ? <Tag color="blue">{clientTypeName}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Отрасли">{industryNames.length > 0 ? (industryNames as string[]).join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{company.phone ? <a href={`tel:${company.phone}`}>{company.phone}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Веб-сайт" span={2}>{company.website ? <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Адрес" span={2}>{company.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Последний контакт">{company.was_in_touch ? dayjs(company.was_in_touch).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{formatDate(company.creation_date, 'datetime')}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'contacts',
              label: `Контакты (${contacts.length})`,
              children: (
                <List
                  loading={isLoadingContacts}
                  dataSource={contacts}
                  renderItem={(contact: any) => (
                    <List.Item actions={[<Button type="link" onClick={() => navigate(`/contacts/${contact.id}`)}>Просмотр</Button>]}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<TeamOutlined />} />}
                        title={contact.full_name || contact.name}
                        description={<Space direction="vertical" size="small"><Text type="secondary">{contact.position || '-'}</Text><Text type="secondary"><PhoneOutlined /> {contact.phone || '-'}</Text></Space>}
                      />
                    </List.Item>
                  )}
                />
              ),
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
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (val: number, record: any) =>
                        val && record?.currency_code ? formatCurrency(val, record.currency_code) : '-',
                    },
                    { title: 'Стадия', dataIndex: 'stage', key: 'stage' },
                    { title: 'Дата', dataIndex: 'created_at', key: 'created_at', render: (val: string) => dayjs(val).format('DD.MM.YYYY') },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
};

export default CompanyDetailPage;
