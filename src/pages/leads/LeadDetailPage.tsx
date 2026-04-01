import { BankOutlined, BellOutlined, CheckCircleOutlined, ClockCircleOutlined, EditOutlined, LinkOutlined, MailOutlined, MessageOutlined, PhoneOutlined, ReloadOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, App, Avatar, Button, Card, Descriptions, Empty, List, Modal, Result, Space, Spin, Steps, Tag, Tabs, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDeals } from '@/entities/deal';
// @ts-ignore
import { useLead } from '@/entities/lead/api/queries';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { UsersService } from '@/shared/api/generated/services/UsersService';
import { navigate } from '@/router.js';
import ChatWidget from '@/modules/chat/ChatWidget.jsx';
import ActivityLog from '@/components/ActivityLog.jsx';
import QuickReminderModal from '@/components/reminders/QuickReminderModal.jsx';
// @ts-ignore
import { canWrite, hasAnyFeature } from '@/lib/rbac.js';
// @ts-ignore
import { api, getUsers } from '@/lib/api/client.js';
// @ts-ignore
import { getLeadSources } from '@/lib/api/reference.js';

const { Text, Title } = Typography;

interface LeadDetailPageProps {
  id?: number;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ id }) => {
  const { message } = App.useApp();
  const { data: lead, isLoading } = useLead(id!);
  const { data: leadDealsResponse, isLoading: isLeadDealsLoading } = useDeals({ lead: id, page: 1, ordering: '-creation_date' } as any);
  const [isConverting, setIsConverting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('details');
  const [leadSources, setLeadSources] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [resolvedOwnerName, setResolvedOwnerName] = React.useState<string | null>(null);
  const [insights, setInsights] = React.useState<any>(null);
  const [insightsLoading, setInsightsLoading] = React.useState(false);
  const [quickReminderOpen, setQuickReminderOpen] = React.useState(false);
  const canManage = canWrite();
  const canUseAiAssist = hasAnyFeature('ai.assist');
  const openAiChat = () => navigate(`/ai-chat?entity_type=lead&entity_id=${id}`);

  const isConverted = Boolean(lead?.contact || lead?.company || lead?.was_in_touch);
  const leadDeal = leadDealsResponse?.results?.[0];

  const loadInsights = React.useCallback(async (includeAi = true, aiDays?: number) => {
    if (!id) return;
    setInsightsLoading(true);
    try {
      const data = await api.get(`/api/leads/${id}/insights/`, {
        params: {
          include_ai: includeAi ? 1 : 0,
          ...(aiDays ? { ai_days: aiDays } : {}),
        },
      });
      setInsights(data);
    } catch (error) {
      console.error(error);
      setInsights(null);
      message.error('Не удалось загрузить расширенную аналитику лида');
    } finally {
      setInsightsLoading(false);
    }
  }, [id, message]);

  React.useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        const [leadSourcesResponse, usersResponse] = await Promise.all([
          getLeadSources({ page_size: 200 }),
          getUsers({ page_size: 200 }),
        ]);
        if (!active) return;
        setLeadSources(leadSourcesResponse?.results || leadSourcesResponse || []);
        setUsers(usersResponse?.results || usersResponse || []);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setLeadSources([]);
        setUsers([]);
      }
    };
    loadLookups();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    loadInsights(canUseAiAssist);
  }, [loadInsights, canUseAiAssist]);

  React.useEffect(() => {
    const ownerId = Number(lead?.owner);
    if (!ownerId || Number.isNaN(ownerId)) {
      setResolvedOwnerName(null);
      return;
    }
    const localOwner = users.find((u) => String(u.id) === String(ownerId));
    if (localOwner) {
      setResolvedOwnerName(null);
      return;
    }

    let cancelled = false;
    UsersService.usersRetrieve({ id: ownerId })
      .then((user) => {
        if (cancelled) return;
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || null;
        setResolvedOwnerName(name);
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOwnerName(null);
      });

    return () => {
      cancelled = true;
    };
  }, [lead?.owner, users]);

  const handleConvertToDeal = () => {
    if (!id || isConverting || isConverted || !canManage) return;

    Modal.confirm({
      title: 'Конвертировать лид в сделку?',
      content: 'Будут созданы/связаны контакт, компания и новая сделка.',
      okText: 'Конвертировать',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          setIsConverting(true);
          const result = await LeadsService.leadsConvertCreate({ id, requestBody: { create_deal: true } as any });
          message.success('Лид успешно конвертирован');
          if ((result as any)?.deal) {
            navigate(`/deals/${(result as any).deal}`);
            return;
          }
          navigate('/deals');
        } catch (error) {
          console.error(error);
          message.error('Не удалось конвертировать лид');
        } finally {
          setIsConverting(false);
        }
      },
    });
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  if (!lead) return <Result status="404" title="Лид не найден" extra={<Button onClick={() => navigate('/leads')}>К лидам</Button>} />;

  const leadSourceName =
    insights?.lead?.lead_source_name
    || leadSources.find((ls) => String(ls.id) === String(lead.lead_source))?.name
    || 'Не указан';
  const ownerName =
    insights?.lead?.owner_name
    || (() => {
      const user = users.find((u) => String(u.id) === String(lead.owner));
      if (!user) return null;
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || null;
    })()
    || resolvedOwnerName
    || 'Не назначен';

  const leadStatusFunnel = Array.isArray(insights?.funnel?.lead_status) ? insights.funnel.lead_status : [];
  const currentLeadStatusStep = Math.max(0, leadStatusFunnel.findIndex((stage: any) => stage.is_current));
  const dealStageFunnel = Array.isArray(insights?.funnel?.deal_stage) ? insights.funnel.deal_stage : [];
  const currentDealStageStep = Math.max(0, dealStageFunnel.findIndex((stage: any) => stage.is_current));

  const activityEvents = [
    lead.creation_date ? { key: 'created', timestamp: lead.creation_date, color: 'green', icon: <ClockCircleOutlined />, title: 'Лид создан', description: 'Лид добавлен в CRM' } : null,
    lead.was_in_touch ? { key: 'converted', timestamp: lead.was_in_touch, color: 'blue', icon: <CheckCircleOutlined />, title: 'Лид конвертирован', description: leadDeal ? `Создана сделка #${leadDeal.id}` : 'Лид отмечен как конвертированный' } : null,
    leadDeal?.creation_date ? { key: 'deal-created', timestamp: leadDeal.creation_date, color: 'cyan', icon: <LinkOutlined />, title: leadDeal.name || 'Связанная сделка', description: leadDeal.name || 'Связанная сделка' } : null,
    lead.disqualified ? { key: 'disqualified', timestamp: lead.update_date || lead.creation_date, color: 'red', icon: <ClockCircleOutlined />, title: 'Лид дисквалифицирован', description: 'Лид переведен в статус "Потерян"' } : null,
    lead.update_date && lead.update_date !== lead.creation_date ? { key: 'updated', timestamp: lead.update_date, color: 'gray', icon: <ClockCircleOutlined />, title: 'Последнее обновление', description: 'Изменены данные лида' } : null,
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf()) as Array<{ key: string; timestamp: string; color: string; icon: React.ReactNode; title: string; description: string }>;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {isConverted ? (
        <Alert
          type="success"
          showIcon
          message={leadDeal ? <Space size={4}>Лид конвертирован. <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>Открыть сделку</Button></Space> : 'Лид конвертирован'}
        />
      ) : null}

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/leads')}>Назад</Button>
          {lead.disqualified ? <Tag color="red">Потерян</Tag> : isConverted ? <Tag color="success">Конвертирован</Tag> : <Tag color="processing">В работе</Tag>}
        </Space>
        <Space wrap>
          <Button icon={<MessageOutlined />} onClick={() => setActiveTab('messages')}>Сообщения</Button>
          <Button icon={<BellOutlined />} onClick={() => setQuickReminderOpen(true)}>Напомнить</Button>
          {canUseAiAssist ? <Button icon={<RobotOutlined />} onClick={openAiChat}>Спросить AI</Button> : null}
          {canManage ? <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/leads/${id}/edit`)}>Редактировать</Button> : null}
          {canManage ? <Button onClick={handleConvertToDeal} loading={isConverting} disabled={isConverted}>{isConverted ? 'Уже конвертирован' : 'Конвертировать в сделку'}</Button> : null}
          {leadDeal ? <Button icon={<LinkOutlined />} onClick={() => navigate(`/deals/${leadDeal.id}`)}>Открыть сделку</Button> : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{lead.full_name}</Title>
        <Text type="secondary">{lead.email || lead.phone || lead.title || 'Карточка лида'}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Источник">{leadSourceName}</Card>
        <Card size="small" title="Ответственный">{ownerName}</Card>
        <Card size="small" title="Создан">{lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY') : '-'}</Card>
      </Space>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'details',
              label: 'Детали',
              children: (
                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                  <Descriptions.Item label="ФИО" span={2}><Space><Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} /><Text strong>{lead.full_name}</Text>{lead.disqualified ? <Tag color="red">Дисквалифицирован</Tag> : null}</Space></Descriptions.Item>
                  <Descriptions.Item label="Должность">{lead.title || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Компания">{lead.company_name ? <Space><BankOutlined /> {lead.company_name}</Space> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{lead.email ? <a href={`mailto:${lead.email}`}><MailOutlined /> {lead.email}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{lead.phone ? <a href={`tel:${lead.phone}`}><PhoneOutlined /> {lead.phone}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Адрес" span={2}>{lead.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Ответственный">{ownerName}</Descriptions.Item>
                  <Descriptions.Item label="Источник">{leadSourceName}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Теги" span={2}>{(lead.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Descriptions.Item>
                  <Descriptions.Item label="Сделка" span={2}>{isConverted ? leadDeal ? <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>{leadDeal.name || 'Связанная сделка'}</Button> : <Text type="secondary">{isLeadDealsLoading ? 'Поиск сделки...' : 'Сделка не найдена'}</Text> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Сообщения" span={2}>
                    <Button type="link" style={{ paddingInline: 0 }} icon={<MessageOutlined />} onClick={() => setActiveTab('messages')}>
                      Перейти к сообщениям по лиду
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item label="Описание" span={2}>{lead.description || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'messages',
              label: 'Сообщения',
              children: (
                <ChatWidget
                  entityType="lead"
                  entityId={lead.id}
                  entityName={lead.full_name}
                  entityPhone={lead.phone}
                />
              ),
            },
            {
              key: 'activity',
              label: 'История',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {activityEvents.length ? (
                    <Timeline
                      items={activityEvents.map((event) => ({
                        color: event.color,
                        dot: event.icon,
                        children: <Space direction="vertical" size={2}><Text strong>{event.title}</Text><Text>{event.description}</Text><Text type="secondary">{dayjs(event.timestamp).format('DD.MM.YYYY HH:mm')}</Text></Space>,
                      }))}
                    />
                  ) : (
                    <Empty description="История взаимодействий пока пуста" />
                  )}

                  <Card size="small" title="Итерации с пользователем (мессенджеры и внутренний чат)">
                    {insightsLoading ? (
                      <Spin />
                    ) : Array.isArray(insights?.iterations) && insights.iterations.length ? (
                      <List
                        dataSource={insights.iterations}
                        renderItem={(item: any) => (
                          <List.Item>
                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                              <Space wrap>
                                <Tag color={item.source === 'external' ? 'geekblue' : 'default'}>
                                  {item.source === 'external' ? 'Внешний канал' : 'Внутренний чат'}
                                </Tag>
                                <Tag>{item.channel || 'unknown'}</Tag>
                                <Tag color={item.direction === 'in' ? 'green' : 'orange'}>
                                  {item.direction === 'in' ? 'Входящее' : 'Исходящее'}
                                </Tag>
                                <Text type="secondary">{item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-'}</Text>
                              </Space>
                              <Text>{item.text || '-'}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="Итераций пока нет" />
                    )}
                  </Card>

                  <ActivityLog entityType="lead" entityId={lead.id} showFilters={false} maxHeight={320} />
                </Space>
              ),
            },
            {
              key: 'funnel',
              label: 'Воронка',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Card
                    size="small"
                    title="Воронка лидов (текущая позиция лида)"
                    extra={insightsLoading ? <Spin size="small" /> : null}
                  >
                    {leadStatusFunnel.length ? (
                      <Steps
                        current={currentLeadStatusStep}
                        items={leadStatusFunnel.map((stage: any) => ({
                          title: stage.label,
                          description: `${stage.count} лидов`,
                          status: stage.is_current ? 'process' : 'wait',
                        }))}
                      />
                    ) : (
                      <Empty description="Нет данных по воронке лидов" />
                    )}
                  </Card>

                  <Card
                    size="small"
                    title="Воронка сделок (связанные этапы)"
                    extra={leadDeal ? <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)}>Открыть текущую сделку</Button> : null}
                  >
                    {dealStageFunnel.length ? (
                      <Steps
                        current={currentDealStageStep}
                        size="small"
                        items={dealStageFunnel.map((stage: any) => ({
                          title: stage.label,
                          description: `${stage.count} сделок`,
                          status: stage.is_current ? 'process' : 'wait',
                        }))}
                      />
                    ) : (
                      <Empty description="Нет данных по этапам сделок" />
                    )}
                  </Card>
                </Space>
              ),
            },
            ...(canUseAiAssist
              ? [
                  {
                    key: 'ai',
                    label: 'AI рекомендация',
                    children: (
                      <Card
                        size="small"
                        title={<Space><RobotOutlined /> Рекомендация по лиду</Space>}
                        extra={
                          <Space>
                            <Button onClick={() => loadInsights(true, 7)} loading={insightsLoading}>За 7 дней</Button>
                            <Button icon={<ReloadOutlined />} onClick={() => loadInsights(true)} loading={insightsLoading}>Полный контекст</Button>
                          </Space>
                        }
                      >
                        {insightsLoading ? (
                          <Spin />
                        ) : insights?.ai?.enabled ? (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary">
                              {insights.ai.provider ? `${insights.ai.provider}${insights.ai.model ? ` • ${insights.ai.model}` : ''}` : 'AI провайдер'}
                            </Text>
                            {insights.ai.window_days ? (
                              <Tag color="blue">Окно анализа: {insights.ai.window_days} дней</Tag>
                            ) : null}
                            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                              {insights.ai.recommendation || 'AI не вернул текст рекомендации'}
                            </Typography.Paragraph>
                          </Space>
                        ) : (
                          <Alert
                            type="info"
                            showIcon
                            message="AI интеграция отключена или не настроена"
                            description={insights?.ai?.error || 'Добавьте и активируйте AI провайдера в настройках интеграций.'}
                          />
                        )}
                      </Card>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <QuickReminderModal
        open={quickReminderOpen}
        onClose={() => setQuickReminderOpen(false)}
        entityType="lead"
        entityId={lead.id}
        entityLabel={lead.full_name}
      />
    </Space>
  );
};

export default LeadDetailPage;
