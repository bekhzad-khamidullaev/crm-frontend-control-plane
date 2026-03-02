import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Home, User, Clock, PhoneCall } from 'lucide-react';
import dayjs from 'dayjs';

import { navigate } from '../../router';
import { getContact, deleteContact, getCompanies, getUsers } from '../../lib/api/client';
import { getEntityCallLogs } from '../../lib/api/calls';
import { getLeadSources, getCrmTags, getCountries, getCities, getDepartments } from '../../lib/api/reference';
import AIAssistantPanel from '../../components/AIAssistantPanel.jsx';
import CallButton from '../../components/CallButton';
import ChatWidget from '../../modules/chat/ChatWidget';
import ActivityLog from '../../components/ActivityLog';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';

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
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных контакта', variant: 'destructive' });
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
      toast({ title: 'Контакт удален', description: 'Контакт удален' });
      navigate('/contacts');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления контакта', variant: 'destructive' });
    }
  };

  const companyMap = useMemo(() => {
    return companies.reduce((acc, company) => {
      acc[company.id] = company.full_name || company.name || '-';
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
      acc[user.id] = user.username || user.email || '-';
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
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (!contact) {
    return <div>Контакт не найден</div>;
  }

  const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  const tagNames = Array.isArray(contact.tags) ? contact.tags.map((id) => tagMap[id]).filter(Boolean) : [];

  const callColumns = [
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-muted-foreground" />
          {direction === 'inbound' ? 'Входящий' : 'Исходящий'}
        </div>
      ),
    },
    {
      title: 'Дата и время',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date, record) => dayjs(date || record.started_at).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Длительность',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatDuration(duration)}
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Button onClick={() => navigate(`/contacts/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
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
            icon
          />
        )}
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </Button>
      </div>

      <h2 className="text-2xl font-semibold">{fullName}</h2>

      <Card className="p-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="activity">История активности</TabsTrigger>
            <TabsTrigger value="messages">Сообщения</TabsTrigger>
            <TabsTrigger value="calls">История звонков ({callLogs.length})</TabsTrigger>
            <TabsTrigger value="ai">AI ассистент</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Полное имя" icon={<User className="h-4 w-4" />} value={fullName} span />
              <DetailRow
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                value={contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : '-'}
              />
              <DetailRow
                label="Телефон"
                icon={<Phone className="h-4 w-4" />}
                value={contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : '-'}
              />
              <DetailRow label="Доп. Email" value={contact.secondary_email || '-'} />
              <DetailRow label="Доп. телефон" value={contact.other_phone || '-'} />
              <DetailRow label="Мобильный" value={contact.mobile || '-'} />
              <DetailRow label="Компания" value={contact.company ? companyMap[contact.company] || '-' : '-'} />
              <DetailRow label="Должность" value={contact.title || '-'} />
              <DetailRow label="Пол" value={contact.sex || '-'} />
              <DetailRow label="Дата рождения" value={contact.birth_date ? dayjs(contact.birth_date).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Источник" value={contact.lead_source ? leadSourceMap[contact.lead_source] || '-' : '-'} />
              <DetailRow label="Страна" value={contact.country ? countryMap[contact.country] || '-' : '-'} />
              <DetailRow label="Город" value={contact.city ? cityMap[contact.city] || '-' : contact.city_name || '-'} />
              <DetailRow label="Регион" value={contact.region || '-'} />
              <DetailRow label="Район" value={contact.district || '-'} />
              <DetailRow label="Адрес" icon={<Home className="h-4 w-4" />} value={contact.address || '-'} span />
              <DetailRow label="Ответственный" value={contact.owner ? userMap[contact.owner] || '-' : '-'} />
              <DetailRow label="Отдел" value={contact.department ? departmentMap[contact.department] || '-' : '-'} />
              <DetailRow label="Массовая рассылка" value={<Badge variant={contact.massmail ? 'default' : 'secondary'}>{contact.massmail ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow label="Дисквалифицирован" value={<Badge variant={contact.disqualified ? 'destructive' : 'secondary'}>{contact.disqualified ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow label="Последний контакт" value={contact.was_in_touch ? dayjs(contact.was_in_touch).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Токен" value={contact.token || '-'} />
              <DetailRow
                label="Теги"
                value={tagNames.length ? tagNames.map((tag) => (
                  <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
                )) : '-'}
                span
              />
              <DetailRow label="Дата создания" value={contact.creation_date ? dayjs(contact.creation_date).format('DD.MM.YYYY HH:mm') : '-'} />
              <DetailRow label="Последнее обновление" value={contact.update_date ? dayjs(contact.update_date).format('DD.MM.YYYY HH:mm') : '-'} />
              {contact.description && <DetailRow label="Описание" value={contact.description} span />}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog entityType="contact" entityId={contact.id} />
          </TabsContent>

          <TabsContent value="messages">
            <ChatWidget
              entityType="contact"
              entityId={contact.id}
              entityName={fullName || 'Контакт'}
              entityPhone={contact.phone}
            />
          </TabsContent>

          <TabsContent value="calls">
            <EnhancedTable
              columns={callColumns}
              dataSource={callLogs}
              loading={callLogsLoading}
              pagination={{ pageSize: 10, current: 1, total: callLogs.length }}
              onChange={() => {}}
              emptyText="Звонков по этому контакту пока не было"
              emptyDescription=""
            />
          </TabsContent>

          <TabsContent value="ai">
            <AIAssistantPanel
              entityType="contact"
              entityId={contact.id}
              defaultUseCase="email_reply"
              initialInput={`Составь короткий и вежливый follow-up для контакта "${fullName}".`}
              contextData={{
                full_name: fullName,
                email: contact.email || '',
                phone: contact.phone || '',
                title: contact.title || '',
                company_name: contact.company ? companyMap[contact.company] || '' : '',
                lead_source: contact.lead_source ? leadSourceMap[contact.lead_source] || '' : '',
                tags: tagNames,
                description: contact.description || '',
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function DetailRow({ label, value, icon, span = false }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {icon}
        <div>{value}</div>
      </div>
    </div>
  );
}

export default ContactDetail;
