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
  Typography,
  Avatar,
  Row,
  Col,
  Statistic,
  List,
  Table,
  Empty,
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
  ClockCircleOutlined,
  PhoneTwoTone,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getCompany, deleteCompany, getContacts, getDeals, getUsers } from '../../lib/api/client';
import { getCompanyCallLogs } from '../../lib/api/calls';
import {
  getClientTypes,
  getIndustries,
  getLeadSources,
  getCrmTags,
  getCountries,
  getCities,
  getDepartments,
} from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import CallButton from '../../components/CallButton';
import ChatWidget from '../../modules/chat/ChatWidget';
import { canWrite } from '../../lib/rbac.js';
import dayjs from 'dayjs';
import { getLocale } from '../../lib/i18n';
import { getClientTypeLabel } from '../../features/reference/lib/clientTypeLabel';

const { Title, Text } = Typography;

function CompanyDetail({ id }) {
  const canManage = canWrite('crm.change_company');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [clientTypes, setClientTypes] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [crmTags, setCrmTags] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadCompany();
    loadCallLogs();
    loadContacts();
    loadDeals();
    loadReferenceData();
  }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const data = await getCompany(id);
      setCompany(data);
    } catch (error) {
      message.error('Ошибка загрузки данных компании');
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const response = await getCompanyCallLogs(id);
      setCallLogs(response.results || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    } finally {
      setCallLogsLoading(false);
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const response = await getContacts({ company: id, page_size: 50 });
      setContacts(response.results || response || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadDeals = async () => {
    setDealsLoading(true);
    try {
      const response = await getDeals({ company: id, page_size: 50 });
      setDeals(response.results || response || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      setDeals([]);
    } finally {
      setDealsLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [
        clientTypesResponse,
        industriesResponse,
        leadSourcesResponse,
        crmTagsResponse,
        countriesResponse,
        citiesResponse,
        departmentsResponse,
        usersResponse,
      ] = await Promise.all([
        getClientTypes({ page_size: 200 }),
        getIndustries({ page_size: 200 }),
        getLeadSources({ page_size: 200 }),
        getCrmTags({ page_size: 200 }),
        getCountries({ page_size: 200 }),
        getCities({ page_size: 200 }),
        getDepartments({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setClientTypes(clientTypesResponse.results || clientTypesResponse || []);
      setIndustries(industriesResponse.results || industriesResponse || []);
      setLeadSources(leadSourcesResponse.results || leadSourcesResponse || []);
      setCrmTags(crmTagsResponse.results || crmTagsResponse || []);
      setCountries(countriesResponse.results || countriesResponse || []);
      setCities(citiesResponse.results || citiesResponse || []);
      setDepartments(departmentsResponse.results || departmentsResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
      setClientTypes([]);
      setIndustries([]);
      setLeadSources([]);
      setCrmTags([]);
      setCountries([]);
      setCities([]);
      setDepartments([]);
      setUsers([]);
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

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const locale = getLocale();
  const clientType = clientTypes.find((item) => item.id === company.type);
  const typeLabel = getClientTypeLabel(clientType?.name, locale) || '-';
  const companyName = company.full_name || company.name || company.company_name || 'Компания';
  const ownerName = users.find((u) => u.id === company.owner)?.username || '-';
  const departmentName = departments.find((d) => d.id === company.department)?.name || '-';
  const countryName = countries.find((c) => c.id === company.country)?.name || '-';
  const cityName = cities.find((c) => c.id === company.city)?.name || company.city_name || '-';
  const leadSourceName = leadSources.find((ls) => ls.id === company.lead_source)?.name || '-';
  const industryNames = Array.isArray(company.industry)
    ? company.industry.map((id) => industries.find((ind) => ind.id === id)?.name).filter(Boolean)
    : [];
  const tagNames = Array.isArray(company.tags)
    ? company.tags.map((id) => crmTags.find((tag) => tag.id === id)?.name).filter(Boolean)
    : [];
  const contactsCount = contacts.length;
  const dealsCount = deals.length;
  const dealsAmount = deals.reduce((sum, deal) => {
    const value = Number(deal.amount || deal.value || 0);
    return Number.isNaN(value) ? sum : sum + value;
  }, 0);

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
                  {companyName}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Отрасли">
              {industryNames.length ? industryNames.join(', ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Тип">
              {company.type ? <Tag color="blue">{typeLabel}</Tag> : '-'}
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
            <Descriptions.Item label="Источник">
              {leadSourceName || '-'}
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
            <Descriptions.Item label="Альтернативные названия">
              {company.alternative_names || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Регистрационный номер">
              {company.registration_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Страна">{countryName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Город">{cityName || '-'}</Descriptions.Item>
            {company.region && (
              <Descriptions.Item label="Регион">{company.region}</Descriptions.Item>
            )}
            {company.district && (
              <Descriptions.Item label="Район">{company.district}</Descriptions.Item>
            )}
            {company.address && (
              <Descriptions.Item label="Адрес" span={2}>
                <Space>
                  <HomeOutlined />
                  {company.address}
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Активна">
              <Tag color={company.active ? 'green' : 'default'}>
                {company.active ? 'Да' : 'Нет'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Дисквалифицирована">
              <Tag color={company.disqualified ? 'red' : 'default'}>
                {company.disqualified ? 'Да' : 'Нет'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Массовая рассылка">
              <Tag color={company.massmail ? 'blue' : 'default'}>
                {company.massmail ? 'Да' : 'Нет'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Последний контакт">
              {company.was_in_touch ? dayjs(company.was_in_touch).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Токен">{company.token || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ответственный">{ownerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Отдел">{departmentName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Теги" span={2}>
              {tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {new Date(company.creation_date || company.created_at).toLocaleString('ru-RU')}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {new Date(company.update_date || company.updated_at).toLocaleString('ru-RU')}
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
                  value={contactsCount}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Активных сделок"
                  value={dealsCount}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Сумма сделок"
                  value={dealsAmount}
                  prefix={<DollarOutlined />}
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
      key: 'contacts',
      label: 'Контакты',
      children: (
        <List
          loading={contactsLoading}
          dataSource={contacts}
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
                title={contact.full_name || contact.name}
                description={
                  <Space direction="vertical" size="small">
                    <Text>{contact.title || contact.position || '-'}</Text>
                    <Text type="secondary">
                      <PhoneOutlined /> {contact.phone || contact.mobile || contact.other_phone || '-'}
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
      children: (
        <Table
          dataSource={deals}
          loading={dealsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="Сделок с этой компанией пока нет"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          columns={[
            {
              title: 'Название',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <a onClick={() => navigate(`/deals/${record.id}`)}>{text}</a>
              ),
            },
            {
              title: 'Стадия',
              dataIndex: 'stage_name',
              key: 'stage_name',
              render: (value) => value || '-',
            },
            {
              title: 'Сумма',
              dataIndex: 'amount',
              key: 'amount',
              render: (value) => (value ? `${value} ₽` : '-'),
            },
            {
              title: 'Дата закрытия',
              dataIndex: 'closing_date',
              key: 'closing_date',
              render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
            },
          ]}
        />
      ),
    },
    {
      key: 'messages',
      label: 'Сообщения',
      children: (
        <ChatWidget
          entityType="company"
          entityId={company.id}
          entityName={companyName}
          entityPhone={company.phone}
        />
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: <ActivityLog entityType="company" entityId={company.id} />,
    },
    {
      key: 'calls',
      label: `История звонков (${callLogs.length})`,
      children: (
        <Table
          dataSource={callLogs}
          loading={callLogsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="Звонков с этой компанией пока не было"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          columns={[
            {
              title: 'Направление',
              dataIndex: 'direction',
              key: 'direction',
              width: 120,
              render: (direction) => (
                <Space>
                  <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
                  {direction === 'inbound' ? 'Входящий' : 'Исходящий'}
                </Space>
              ),
            },
            {
              title: 'Номер',
              dataIndex: 'number',
              key: 'number',
              width: 160,
              render: (value, record) => value || record.phone_number || '-',
            },
            {
              title: 'Дата и время',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 180,
              render: (date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
            },
            {
              title: 'Длительность',
              dataIndex: 'duration',
              key: 'duration',
              width: 120,
              render: (duration) => (
                <Space>
                  <ClockCircleOutlined />
                  {formatDuration(duration)}
                </Space>
              ),
            },
            {
              title: 'Действия',
              key: 'actions',
              width: 120,
              render: (_, record) => (
                <CallButton
                  phone={record.number || record.phone_number}
                  name={companyName}
                  entityType="company"
                  entityId={company.id}
                  size="small"
                  type="link"
                />
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
        {canManage ? (
          <>
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
          </>
        ) : null}
      </Space>

      <Title level={2}>{companyName}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default CompanyDetail;
