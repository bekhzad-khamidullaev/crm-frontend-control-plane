import React, { useEffect, useMemo, useState } from 'react';
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
  Table,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PhoneTwoTone,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getContact, deleteContact, getCompanies, getUsers } from '../../lib/api/client';
import { getEntityCallLogs } from '../../lib/api/calls';
import { getLeadSources, getCrmTags, getCountries, getCities, getDepartments } from '../../lib/api/reference';
import CallButton from '../../components/CallButton';
import ChatWidget from '../../modules/chat/ChatWidget';
import ActivityLog from '../../components/ActivityLog';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function ContactDetail({ id }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [crmTags, setCrmTags] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadContact();
    loadCallLogs();
    loadReferences();
  }, [id]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const data = await getContact(id);
      setContact(data);
    } catch (error) {
      message.error('Ошибка загрузки данных контакта');
      console.error('Error loading contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const response = await getEntityCallLogs('contact', id);
      setCallLogs(response.results || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    } finally {
      setCallLogsLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [
        companiesResponse,
        leadSourcesResponse,
        crmTagsResponse,
        countriesResponse,
        citiesResponse,
        departmentsResponse,
        usersResponse,
      ] = await Promise.all([
        getCompanies({ page_size: 200 }),
        getLeadSources({ page_size: 200 }),
        getCrmTags({ page_size: 200 }),
        getCountries({ page_size: 200 }),
        getCities({ page_size: 200 }),
        getDepartments({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setCompanies(companiesResponse.results || companiesResponse || []);
      setLeadSources(leadSourcesResponse.results || leadSourcesResponse || []);
      setCrmTags(crmTagsResponse.results || crmTagsResponse || []);
      setCountries(countriesResponse.results || countriesResponse || []);
      setCities(citiesResponse.results || citiesResponse || []);
      setDepartments(departmentsResponse.results || departmentsResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading references:', error);
      setCompanies([]);
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
      await deleteContact(id);
      message.success('Контакт удален');
      navigate('/contacts');
    } catch (error) {
      message.error('Ошибка удаления контакта');
    }
  };

  const companyMap = useMemo(() => {
    return companies.reduce((acc, company) => {
      acc[company.id] = company.full_name || company.name || `#${company.id}`;
      return acc;
    }, {});
  }, [companies]);

  const leadSourceMap = useMemo(() => {
    return leadSources.reduce((acc, source) => {
      acc[source.id] = source.name;
      return acc;
    }, {});
  }, [leadSources]);

  const tagMap = useMemo(() => {
    return crmTags.reduce((acc, tag) => {
      acc[tag.id] = tag.name;
      return acc;
    }, {});
  }, [crmTags]);

  const countryMap = useMemo(() => {
    return countries.reduce((acc, country) => {
      acc[country.id] = country.name;
      return acc;
    }, {});
  }, [countries]);

  const cityMap = useMemo(() => {
    return cities.reduce((acc, city) => {
      acc[city.id] = city.name;
      return acc;
    }, {});
  }, [cities]);

  const departmentMap = useMemo(() => {
    return departments.reduce((acc, dep) => {
      acc[dep.id] = dep.name;
      return acc;
    }, {});
  }, [departments]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

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

  if (!contact) {
    return <div>Контакт не найден</div>;
  }

  const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  const tagNames = Array.isArray(contact.tags)
    ? contact.tags.map((id) => tagMap[id]).filter(Boolean)
    : [];

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Полное имя" span={2}>
              <Space>
                <UserOutlined />
                <Text strong style={{ fontSize: 16 }}>{fullName}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {contact.email ? (
                <Space>
                  <MailOutlined />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Телефон">
              {contact.phone ? (
                <Space>
                  <PhoneOutlined />
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Доп. Email">
              {contact.secondary_email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Доп. телефон">{contact.other_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Мобильный">{contact.mobile || '-'}</Descriptions.Item>
            <Descriptions.Item label="Компания">
              {contact.company ? companyMap[contact.company] || `#${contact.company}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Должность">{contact.title || '-'}</Descriptions.Item>
            <Descriptions.Item label="Пол">{contact.sex || '-'}</Descriptions.Item>
            <Descriptions.Item label="Дата рождения">
              {contact.birth_date ? dayjs(contact.birth_date).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Источник">
              {contact.lead_source ? leadSourceMap[contact.lead_source] || `#${contact.lead_source}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Страна">
              {contact.country ? countryMap[contact.country] || `#${contact.country}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Город">
              {contact.city ? cityMap[contact.city] || `#${contact.city}` : contact.city_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Регион">{contact.region || '-'}</Descriptions.Item>
            <Descriptions.Item label="Район">{contact.district || '-'}</Descriptions.Item>
            <Descriptions.Item label="Адрес" span={2}>
              <Space>
                <HomeOutlined />
                {contact.address || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Ответственный">
              {contact.owner ? userMap[contact.owner] || `#${contact.owner}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Отдел">
              {contact.department ? departmentMap[contact.department] || `#${contact.department}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Массовая рассылка">
              <Tag color={contact.massmail ? 'blue' : 'default'}>{contact.massmail ? 'Да' : 'Нет'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Дисквалифицирован">
              <Tag color={contact.disqualified ? 'red' : 'default'}>
                {contact.disqualified ? 'Да' : 'Нет'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Последний контакт">
              {contact.was_in_touch ? dayjs(contact.was_in_touch).format('DD.MM.YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Токен">{contact.token || '-'}</Descriptions.Item>
            <Descriptions.Item label="Теги" span={2}>
              {tagNames.length ? tagNames.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {contact.update_date ? dayjs(contact.update_date).format('DD.MM.YYYY HH:mm') : '-'}
            </Descriptions.Item>
            {contact.description && (
              <Descriptions.Item label="Описание" span={2}>
                {contact.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: <ActivityLog entityType="contact" entityId={contact.id} />,
    },
    {
      key: 'messages',
      label: 'Сообщения',
      children: (
        <ChatWidget
          entityType="contact"
          entityId={contact.id}
          entityName={fullName || `Контакт #${contact.id}`}
          entityPhone={contact.phone}
        />
      ),
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
                description="Звонков по этому контакту пока не было"
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
              title: 'Дата и время',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 180,
              render: (date, record) => dayjs(date || record.started_at).format('DD.MM.YYYY HH:mm'),
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
                  phone={record.phone_number || record.number}
                  name={fullName}
                  entityType="contact"
                  entityId={contact.id}
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
        {contact.phone && (
          <CallButton
            phone={contact.phone}
            name={fullName}
            entityType="contact"
            entityId={contact.id}
            size="middle"
            type="default"
            icon={true}
          />
        )}
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{fullName}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default ContactDetail;
