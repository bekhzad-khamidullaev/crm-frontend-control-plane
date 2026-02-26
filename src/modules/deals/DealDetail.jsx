import dayjs from 'dayjs';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Clock,
    DollarSign,
    Edit,
    Phone,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import ActivityLog from '../../components/ActivityLog';
import CallButton from '../../components/CallButton';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { getDealCallLogs } from '../../lib/api/calls';
import { deleteDeal, getCompany, getContact, getDeal } from '../../lib/api/client';
import { getStages } from '../../lib/api/reference';
import { formatCurrency } from '../../lib/utils/format';
import ChatWidget from '../../modules/chat/ChatWidget';
import { navigate } from '../../router';

function DealDetail({ id }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [company, setCompany] = useState(null);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    loadDeal();
    loadCallLogs();
    loadStages();
  }, [id]);

  useEffect(() => {
    if (deal?.company) {
      loadCompany(deal.company);
    } else {
      setCompany(null);
    }
    if (deal?.contact) {
      loadContact(deal.contact);
    } else {
      setContact(null);
    }
  }, [deal]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const data = await getDeal(id);
      setDeal(data);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных сделки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const response = await getDealCallLogs(id);
      setCallLogs(response.results || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    } finally {
      setCallLogsLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      const response = await getStages({ page_size: 200 });
      setStages(response.results || response || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      setStages([]);
    }
  };

  const loadCompany = async (companyId) => {
    try {
      const data = await getCompany(companyId);
      setCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      setCompany(null);
    }
  };

  const loadContact = async (contactId) => {
    try {
      const data = await getContact(contactId);
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
      setContact(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal(id);
      toast({ title: 'Сделка удалена', description: 'Сделка удалена' });
      navigate('/deals');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления сделки', variant: 'destructive' });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (!deal) {
    return <div>Сделка не найдена</div>;
  }

  const sortedStages = [...stages].sort((a, b) => (a.index_number || 0) - (b.index_number || 0));
  const currentStageIndex = sortedStages.findIndex((stage) => stage.id === deal.stage);
  const stageLabel =
    deal.stage_name ||
    sortedStages.find((stage) => stage.id === deal.stage)?.name ||
    (deal.stage ? `Этап #${deal.stage}` : '-');
  const closeDate = deal.closing_date ? new Date(deal.closing_date) : null;
  const today = new Date();
  const daysLeft = closeDate ? Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24)) : null;

  const callColumns = [
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
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
          name={contact?.full_name || deal.name}
          entityType="deal"
          entityId={deal.id}
          size="small"
          type="link"
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/deals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Button onClick={() => navigate(`/deals/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </Button>
        {contact?.phone && (
          <CallButton
            phone={contact.phone}
            name={contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
            entityType="deal"
            entityId={deal.id}
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

      <h2 className="text-2xl font-semibold">{deal.name}</h2>

      <Card className="p-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="activity">История активности</TabsTrigger>
            <TabsTrigger value="messages">Сообщения</TabsTrigger>
            <TabsTrigger value="calls">История звонков ({callLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="mb-4 p-4">
              {sortedStages.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-4">
                  {sortedStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        index === currentStageIndex
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {stage.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Этапы не найдены</div>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Название сделки" value={<span className="text-base font-semibold">{deal.name}</span>} span />
              <DetailRow
                label="Сумма"
                value={
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">
                      {formatCurrency(deal.amount, deal.currency_name || 'RUB')}
                    </span>
                  </div>
                }
              />
              <DetailRow
                label="Стадия"
                value={deal.stage ? (
                  <Badge variant="secondary">{stageLabel}</Badge>
                ) : (
                  '-'
                )}
              />
              <DetailRow
                label="Вероятность"
                value={
                  <div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          Number(deal.probability || 0) >= 70
                            ? 'bg-emerald-500'
                            : Number(deal.probability || 0) >= 40
                            ? 'bg-sky-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Number(deal.probability || 0)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{Number(deal.probability || 0)}%</div>
                  </div>
                }
              />
              <DetailRow
                label="Дата закрытия"
                value={
                  closeDate ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {closeDate.toLocaleDateString('ru-RU')}
                      </div>
                      {daysLeft > 0 && <div className="text-xs text-muted-foreground">через {daysLeft} дней</div>}
                      {daysLeft < 0 && <div className="text-xs text-rose-600">просрочено на {Math.abs(daysLeft)} дней</div>}
                    </div>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Компания"
                value={
                  company ? (
                    <button className="flex items-center gap-2 text-left text-primary" onClick={() => navigate(`/companies/${company.id}`)}>
                      <Building2 className="h-4 w-4" />
                      {company.full_name || company.name || `#${company.id}`}
                    </button>
                  ) : deal.company ? (
                    `#${deal.company}`
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Контактное лицо"
                value={
                  contact ? (
                    <div className="space-y-1">
                      <button className="text-left text-primary" onClick={() => navigate(`/contacts/${contact.id}`)}>
                        {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || `#${contact.id}`}
                      </button>
                      {contact.title && <div className="text-xs text-muted-foreground">{contact.title}</div>}
                    </div>
                  ) : deal.contact ? (
                    `#${deal.contact}`
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow label="Ответственный" value={deal.owner_name || deal.owner || '-'} />
              <DetailRow label="Дата создания" value={deal.creation_date ? new Date(deal.creation_date).toLocaleString('ru-RU') : '-'} />
              <DetailRow label="Последнее обновление" value={deal.update_date ? new Date(deal.update_date).toLocaleString('ru-RU') : '-'} />
              {deal.description && <DetailRow label="Описание" value={deal.description} span />}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog entityType="deal" entityId={deal.id} />
          </TabsContent>

          <TabsContent value="messages">
            <ChatWidget
              entityType="deal"
              entityId={deal.id}
              entityName={`Сделка #${deal.id}`}
              entityPhone={contact?.phone}
            />
          </TabsContent>

          <TabsContent value="calls">
            <EnhancedTable
              columns={callColumns}
              dataSource={callLogs}
              loading={callLogsLoading}
              pagination={{ pageSize: 10, current: 1, total: callLogs.length }}
              onChange={() => {}}
              emptyText="Звонков по этой сделке пока не было"
              emptyDescription=""
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function DetailRow({ label, value, span = false }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

export default DealDetail;
