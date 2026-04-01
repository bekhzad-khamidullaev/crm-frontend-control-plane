import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  DatePicker,
  Empty,
  Grid,
  Input,
  InputNumber,
  Layout,
  List,
  Result,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FacebookOutlined,
  InstagramOutlined,
  MessageOutlined,
  ReloadOutlined,
  SendOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useMemo, useState } from 'react';
import {
  getOmnichannelConversationContext,
  getOmnichannelTimeline,
  runOmnichannelConversationAction,
  sendOmnichannelMessage,
  updateOmnichannelConversationContext,
} from '../lib/api/compliance.js';
import { readStoredLicenseFeatures } from '../lib/api/licenseFeatures.js';
import { readStoredLicenseState, shouldEnforceLicenseFeatures } from '../lib/api/licenseState.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import CommunicationsHub from '../modules/communications/CommunicationsHub.jsx';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Sider, Content } = Layout;
const { Search, TextArea } = Input;
const { Title, Text } = Typography;

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: 'green', icon: <WhatsAppOutlined /> },
  telegram: { label: 'Telegram', color: 'blue', icon: <SendOutlined /> },
  instagram: { label: 'Instagram', color: 'magenta', icon: <InstagramOutlined /> },
  facebook: { label: 'Facebook', color: 'geekblue', icon: <FacebookOutlined /> },
  playmobile: { label: 'SMS', color: 'gold', icon: <MessageOutlined /> },
  eskiz: { label: 'SMS', color: 'gold', icon: <MessageOutlined /> },
};

const BUCKET_OPTIONS = [
  { label: 'Все', value: 'all' },
  { label: 'Очередь', value: 'queue' },
  { label: 'В работе', value: 'active' },
  { label: 'Закрыто', value: 'resolved' },
  { label: 'SLA риск', value: 'breached' },
];

const SEGMENT_OPTIONS = [
  { label: 'Все', value: 'all' },
  { label: 'Клиенты', value: 'clients' },
  { label: 'Задачи', value: 'tasks' },
  { label: 'Команда', value: 'team' },
];

const SEGMENT_LABELS = {
  clients: 'Клиенты',
  tasks: 'Задачи',
  team: 'Команда',
};

const META_24H_CHANNELS = new Set(['whatsapp', 'instagram', 'facebook']);

function channelMeta(channelType) {
  return CHANNEL_META[channelType] || { label: channelType || 'Канал', color: 'default', icon: <MessageOutlined /> };
}

function normalizeQueueState(value) {
  return String(value || '').trim().toLowerCase();
}

function queueStateMeta(queueState, status, slaStatus) {
  if (slaStatus === 'breached') return { label: 'SLA risk', color: 'red' };
  const normalized = normalizeQueueState(queueState) || normalizeQueueState(status);
  if (!normalized) return null;
  if (['waiting', 'queued', 'pending', 'accepted'].includes(normalized)) {
    return { label: 'В очереди', color: 'gold' };
  }
  if (['in_progress', 'processing', 'active'].includes(normalized)) {
    return { label: 'В работе', color: 'processing' };
  }
  if (['resolved', 'sent', 'delivered'].includes(normalized)) {
    return { label: 'Закрыто', color: 'success' };
  }
  if (['failed', 'error', 'dead_letter'].includes(normalized)) {
    return { label: 'Ошибка', color: 'error' };
  }
  return { label: normalized, color: 'default' };
}

function respondedAtLabel(value) {
  return value ? `Ответ ${dayjs(value).fromNow()}` : '';
}

function normalizeList(response) {
  return Array.isArray(response?.results) ? response.results : [];
}

function normalizeSummary(response, items) {
  const fallback = {
    total: items.length,
    queue: items.filter((item) => item.queue_bucket === 'queue').length,
    active: items.filter((item) => item.queue_bucket === 'active').length,
    resolved: items.filter((item) => item.queue_bucket === 'resolved').length,
    breached: items.filter((item) => item.sla_status === 'breached').length,
    inbound: items.filter((item) => item.direction === 'in').length,
    outbound: items.filter((item) => item.direction === 'out').length,
  };
  return response?.summary && typeof response.summary === 'object' ? { ...fallback, ...response.summary } : fallback;
}

function messageTimestamp(item) {
  return item?.created_at ? new Date(item.created_at).getTime() : 0;
}

function resolveParticipantId(item) {
  return String(
    item?.participant_id ||
      (item?.direction === 'in' ? item?.sender_id : item?.recipient_id) ||
      item?.sender_id ||
      item?.recipient_id ||
      item?.external_id ||
      ''
  ).trim();
}

function buildConversationKey(item) {
  return String(
    item?.conversation_key ||
      `${item?.channel || 'na'}:${item?.subject_content_type || 'na'}:${item?.subject_object_id || resolveParticipantId(item) || item?.id}`
  );
}

function buildConversationTitle(item) {
  const participantId = resolveParticipantId(item);
  if (item?.subject_object_id) {
    return 'Сущность';
  }
  return participantId || 'Диалог';
}

function toLowerString(value) {
  return String(value || '').trim().toLowerCase();
}

function classifyConversationSegment(conversation) {
  const subjectToken = toLowerString(conversation?.subjectContentType);
  const haystack = [
    conversation?.title,
    conversation?.preview,
    conversation?.channelName,
    conversation?.participantId,
    conversation?.subjectContentType,
    conversation?.latest?.text,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    ['task', 'tasks', 'project', 'projects', 'reminder', 'memo'].some((token) => subjectToken.includes(token))
    || /(задач|task|проект|project|reminder|напомин|memo|ticket)/i.test(haystack)
  ) {
    return 'tasks';
  }

  if (
    conversation?.channelType === 'telegram'
    && !conversation?.subjectObjectId
    && !subjectToken
    && /(команд|team|internal|сотрудник|оператор|agent)/i.test(haystack)
  ) {
    return 'team';
  }

  if (/(команд|team|internal|сотрудник|оператор|agent)/i.test(haystack)) {
    return 'team';
  }

  return 'clients';
}

function findLastInboundAt(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item?.direction === 'in' && item?.created_at) return item.created_at;
  }
  return null;
}

export function resolveConversationCompliance(conversation, now = new Date()) {
  if (!conversation) {
    return { restricted: false, withinWindow: true, channelRequiresWindow: false };
  }

  const channelType = toLowerString(conversation.channelType);
  const channelRequiresWindow = META_24H_CHANNELS.has(channelType);
  if (!channelRequiresWindow) {
    return { restricted: false, withinWindow: true, channelRequiresWindow };
  }

  const lastInboundAt = findLastInboundAt(conversation.messages);
  if (!lastInboundAt) {
    return {
      restricted: true,
      withinWindow: false,
      channelRequiresWindow,
      lastInboundAt: null,
      hoursSinceInbound: null,
      reason: 'missing_inbound',
    };
  }

  const createdAtMs = new Date(lastInboundAt).getTime();
  if (!Number.isFinite(createdAtMs)) {
    return {
      restricted: true,
      withinWindow: false,
      channelRequiresWindow,
      lastInboundAt,
      hoursSinceInbound: null,
      reason: 'invalid_inbound_timestamp',
    };
  }

  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const hoursSinceInbound = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60));
  const withinWindow = hoursSinceInbound <= 24;

  return {
    restricted: !withinWindow,
    withinWindow,
    channelRequiresWindow,
    lastInboundAt,
    hoursSinceInbound,
    reason: withinWindow ? 'within_window' : 'window_expired',
  };
}

function groupConversations(items) {
  const byKey = new Map();
  items.forEach((item) => {
    const key = buildConversationKey(item);
    const row = byKey.get(key) || {
      key,
      channelId: item.channel,
      channelType: item.channel_type,
      channelName: item.channel_name,
      participantId: resolveParticipantId(item),
      title: buildConversationTitle(item),
      subjectContentType: item.subject_content_type,
      subjectObjectId: item.subject_object_id,
      messages: [],
    };
    row.messages.push(item);
    byKey.set(key, row);
  });

  return Array.from(byKey.values())
    .map((conversation) => {
      const messages = [...conversation.messages].sort((a, b) => messageTimestamp(a) - messageTimestamp(b));
      const latest = messages[messages.length - 1];
      const hasBreached = messages.some((item) => item.sla_status === 'breached');
      const queueBucket = hasBreached
        ? 'breached'
        : latest?.queue_bucket || 'other';
      const draft = {
        ...conversation,
        messages,
        latest,
        preview: latest?.text || 'Без текста',
        lastActivityAt: latest?.created_at || null,
        latestQueueState: latest?.queue_state || null,
        latestStatus: latest?.status || null,
        latestRespondedAt: latest?.responded_at || null,
        inboundCount: messages.filter((item) => item.direction === 'in').length,
        outboundCount: messages.filter((item) => item.direction === 'out').length,
        queueBucket,
        latestSlaStatus: latest?.sla_status || 'ok',
      };
      return {
        ...draft,
        segment: classifyConversationSegment(draft),
      };
    })
    .sort((a, b) => messageTimestamp(b.latest) - messageTimestamp(a.latest));
}

function filterConversations(conversations, { searchQuery, bucket, channel, segment }) {
  const needle = searchQuery.trim().toLowerCase();
  return conversations.filter((conversation) => {
    if (segment !== 'all' && conversation.segment !== segment) {
      return false;
    }
    if (bucket !== 'all') {
      if (bucket === 'breached') {
        if (conversation.latestSlaStatus !== 'breached') return false;
      } else if (conversation.queueBucket !== bucket) {
        return false;
      }
    }
    if (channel !== 'all' && conversation.channelType !== channel) {
      return false;
    }
    if (!needle) return true;
    const haystack = [
      conversation.title,
      conversation.preview,
      conversation.channelName,
      conversation.channelType,
      conversation.participantId,
      conversation.subjectObjectId,
      SEGMENT_LABELS[conversation.segment],
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

function buildSendPayload(conversation, text) {
  const channel = conversation?.channelType;
  const channelId = conversation?.channelId;
  const targetId = conversation?.participantId;
  if (!channel || !channelId || !targetId) return null;

  if (channel === 'whatsapp') {
    return { channel, channel_id: channelId, to: targetId, text };
  }
  if (channel === 'telegram') {
    return { channel, channel_id: channelId, chat_id: targetId, sender_id: targetId, text };
  }
  if (channel === 'instagram') {
    return { channel, channel_id: channelId, recipient_id: targetId, handle: targetId, text };
  }
  if (channel === 'facebook') {
    return { channel, channel_id: channelId, recipient_id: targetId, text };
  }
  return null;
}

function buildConversationContextPayload(conversation) {
  if (!conversation?.channelId || !conversation?.participantId) return null;
  return {
    channel_id: conversation.channelId,
    participant_id: conversation.participantId,
    conversation_key: conversation.key,
  };
}

const QUICK_ACTIONS = [
  { action: 'create_lead', label: 'Create lead' },
  { action: 'create_contact', label: 'Create contact' },
  { action: 'create_deal', label: 'Create deal' },
  { action: 'create_task', label: 'Create task' },
  { action: 'snooze', label: 'Snooze 30m', extra: { minutes: 30 } },
  { action: 'start_call', label: 'Start call' },
];

function ChatPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    queue: 0,
    active: 0,
    resolved: 0,
    breached: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [licenseState, setLicenseState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [bucket, setBucket] = useState('all');
  const [channel, setChannel] = useState('all');
  const [activeConversationKey, setActiveConversationKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [contextState, setContextState] = useState(null);
  const [contextMetrics, setContextMetrics] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSaving, setContextSaving] = useState(false);
  const [internalNoteDraft, setInternalNoteDraft] = useState('');
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [linkSubjectContentType, setLinkSubjectContentType] = useState(null);
  const [linkSubjectObjectId, setLinkSubjectObjectId] = useState(null);
  const licenseFeatures = readStoredLicenseFeatures();
  const storedLicenseState = readStoredLicenseState();
  const enforceLicenseFeatures = shouldEnforceLicenseFeatures(storedLicenseState);

  const bg = theme === 'dark' ? 'transparent' : '#ffffff';
  const bgSecondary = theme === 'dark' ? '#101827' : '#f8fafc';
  const border = theme === 'dark' ? '#243041' : '#e2e8f0';
  const activeBg = theme === 'dark' ? '#172132' : '#eef6ff';

  const hasInboxLicense = useMemo(
    () =>
      !enforceLicenseFeatures
      || ['inbox.unified', 'integrations.core'].some((feature) => licenseFeatures.includes(feature)),
    [enforceLicenseFeatures, licenseFeatures]
  );

  const loadInbox = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorState(null);

    try {
      const response = await getOmnichannelTimeline({ limit: 300 });
      const rows = normalizeList(response);
      setItems(rows);
      setSummary(normalizeSummary(response, rows));
      setLicenseState(null);
    } catch (error) {
      const code = String(error?.details?.code || '');
      if (code === 'LICENSE_FEATURE_DISABLED') {
        setLicenseState({
          code,
          message: error?.details?.message || error?.details?.detail || 'Лицензия не включает unified inbox.',
        });
        setItems([]);
        setSummary({ total: 0, queue: 0, active: 0, resolved: 0, breached: 0 });
      } else {
        setErrorState(error?.details?.message || error?.details?.detail || error?.message || 'Не удалось загрузить inbox.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const conversations = useMemo(() => groupConversations(items), [items]);
  const filteredConversations = useMemo(
    () => filterConversations(conversations, { searchQuery, bucket, channel, segment }),
    [bucket, channel, conversations, searchQuery, segment]
  );

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setActiveConversationKey(null);
      return;
    }
    const exists = filteredConversations.some((item) => item.key === activeConversationKey);
    if (!exists) {
      setActiveConversationKey(filteredConversations[0].key);
    }
  }, [activeConversationKey, filteredConversations]);

  const activeConversation = filteredConversations.find((item) => item.key === activeConversationKey) || null;
  const activeConversationCompliance = useMemo(
    () => resolveConversationCompliance(activeConversation),
    [activeConversation]
  );
  const hasOutboundAdapter = useMemo(
    () => Boolean(buildSendPayload(activeConversation, '__probe__')),
    [activeConversation]
  );
  const channelOptions = useMemo(() => {
    const dynamic = Array.from(new Set(conversations.map((item) => item.channelType).filter(Boolean))).map((value) => ({
      label: channelMeta(value).label,
      value,
    }));
    return [{ label: 'Все каналы', value: 'all' }, ...dynamic];
  }, [conversations]);

  const loadConversationContext = async (conversation) => {
    const payload = buildConversationContextPayload(conversation);
    if (!payload) {
      setContextState(null);
      setContextMetrics(null);
      return;
    }
    setContextLoading(true);
    try {
      const response = await getOmnichannelConversationContext(payload);
      setContextState(response?.state || null);
      setContextMetrics(response?.metrics || null);
      if (response?.state?.assigned_user) {
        setOwnerUserId(response.state.assigned_user);
      }
    } catch (error) {
      setContextState(null);
      setContextMetrics(null);
      message.error(error?.details?.message || error?.details?.detail || error?.message || 'Не удалось загрузить контекст диалога');
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    if (!activeConversation) {
      setContextState(null);
      setContextMetrics(null);
      setInternalNoteDraft('');
      setOwnerUserId(null);
      setLinkSubjectContentType(null);
      setLinkSubjectObjectId(null);
      return;
    }
    loadConversationContext(activeConversation);
  }, [activeConversationKey]);

  const patchConversationContext = async (patchPayload) => {
    const payload = buildConversationContextPayload(activeConversation);
    if (!payload) return;
    setContextSaving(true);
    try {
      const response = await updateOmnichannelConversationContext({ ...payload, ...patchPayload });
      setContextState(response?.state || null);
      setContextMetrics(response?.metrics || null);
      message.success('Контекст обновлён');
    } catch (error) {
      message.error(error?.details?.message || error?.details?.detail || error?.message || 'Не удалось обновить контекст');
    } finally {
      setContextSaving(false);
    }
  };

  const runQuickAction = async (action, extra = {}) => {
    const payload = buildConversationContextPayload(activeConversation);
    if (!payload) return;
    setContextSaving(true);
    try {
      const response = await runOmnichannelConversationAction({ ...payload, action, ...extra });
      setContextState(response?.state || null);
      if (action === 'add_internal_note') {
        setInternalNoteDraft('');
      }
      if (action === 'assign_owner' && extra?.owner_user_id) {
        setOwnerUserId(extra.owner_user_id);
      }
      message.success('Действие выполнено');
    } catch (error) {
      message.error(error?.details?.message || error?.details?.detail || error?.message || 'Не удалось выполнить действие');
    } finally {
      setContextSaving(false);
    }
  };

  const handleSend = async () => {
    if (activeConversationCompliance.restricted) {
      message.warning('24h окно ответа истекло. Для продолжения используйте шаблонное сообщение в Meta канале.');
      return;
    }
    const text = draft.trim();
    const payload = buildSendPayload(activeConversation, text);
    if (!text || !payload) return;

    setSending(true);
    try {
      await sendOmnichannelMessage(payload);
      setDraft('');
      message.success('Сообщение отправлено');
      await loadInbox({ silent: true });
    } catch (error) {
      message.error(error?.details?.message || error?.details?.detail || error?.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <Space direction="vertical" size={16} style={{ width: '100%', padding: 64, textAlign: 'center' }}>
          <Spin size="large" />
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              Unified Inbox is loading
            </Title>
            <Text type="secondary">
              Conversations, queue summary, and conversation context are being fetched.
            </Text>
          </div>
        </Space>
      </Card>
    );
  }

  if (!hasInboxLicense || licenseState) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <Result
          status="403"
          title="Unified Inbox недоступен"
          subTitle={
            <Space direction="vertical" size={4}>
              <Text>
                {licenseState?.message ||
                  'Для messenger-first workspace нужен entitlement `integrations.core` или `inbox.unified`.'}
              </Text>
              <Text type="secondary">
                Current page is blocked until the license exposes the unified inbox feature set.
              </Text>
            </Space>
          }
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => loadInbox()}>
              Обновить
            </Button>
          }
        />
      </Card>
    );
  }

  if (errorState) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <Result
          status="error"
          title="Не удалось загрузить inbox"
          subTitle={
            <Space direction="vertical" size={4}>
              <Text>{errorState}</Text>
              <Text type="secondary">Retry reloads the omnichannel timeline and rebuilds the conversation list.</Text>
            </Space>
          }
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => loadInbox()}>
              Повторить
            </Button>
          }
        />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <Result
          status="info"
          title="Unified Inbox is empty"
          subTitle="No omnichannel timeline rows were returned yet. Once conversations arrive, they will appear here."
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => loadInbox()}>
              Обновить
            </Button>
          }
        />
      </Card>
    );
  }

  const inboxLayout = (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card
        variant="borderless"
        style={{ background: bg }}
        styles={{ body: { padding: '12px 16px 10px' } }}
        extra={
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadInbox({ silent: true })}>
            Обновить
          </Button>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Title level={4} style={{ margin: 0, lineHeight: 1.1 }}>
              Unified Inbox
            </Title>
            <Text type="secondary">
              Messenger-first workspace для WhatsApp, Instagram, Facebook и Telegram.
            </Text>
          </div>

          <Space wrap size={10}>
            <Statistic title="Всего" value={summary.total} />
            <Statistic title="В очереди" value={summary.queue} />
            <Statistic title="В работе" value={summary.active} />
            <Statistic title="Закрыто" value={summary.resolved} />
            <Statistic title="SLA риск" value={summary.breached} valueStyle={{ color: summary.breached ? '#cf1322' : undefined }} />
          </Space>
        </Space>
      </Card>

      <Layout style={{ minHeight: 'calc(100vh - 240px)', background: 'transparent' }}>
        <Sider
          width={isMobile ? '100%' : 360}
          breakpoint="lg"
          collapsedWidth={0}
          theme="light"
          style={{
            background: bg,
            borderRight: isMobile ? 'none' : `1px solid ${border}`,
            paddingRight: isMobile ? 0 : 12,
            marginBottom: isMobile ? 16 : 0,
          }}
        >
          <Card variant="borderless" style={{ background: bgSecondary }} styles={{ body: { padding: 12 } }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Search
                placeholder="Поиск по диалогу, каналу или участнику"
                allowClear
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                size="small"
              />
              <Segmented
                block
                options={SEGMENT_OPTIONS}
                value={segment}
                onChange={setSegment}
              />
              <Segmented
                block
                options={BUCKET_OPTIONS}
                value={bucket}
                onChange={setBucket}
              />
              <Segmented
                block
                options={channelOptions}
                value={channel}
                onChange={setChannel}
              />

              {filteredConversations.length === 0 ? (
                <Empty
                  description="Нет диалогов под выбранные фильтры"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: 32 }}
                />
              ) : (
                <List
                  dataSource={filteredConversations}
                  split={false}
                  renderItem={(conversation) => {
                    const meta = channelMeta(conversation.channelType);
                    const isActive = conversation.key === activeConversationKey;
                    const queueMeta = queueStateMeta(
                      conversation.latestQueueState,
                      conversation.latestStatus,
                      conversation.latestSlaStatus
                    );
                    const responseLabel = respondedAtLabel(conversation.latestRespondedAt);
                    return (
                      <List.Item style={{ paddingInline: 0, border: 'none' }}>
                        <Button
                          type="text"
                          onClick={() => setActiveConversationKey(conversation.key)}
                          style={{
                            width: '100%',
                            height: 'auto',
                            padding: 12,
                            textAlign: 'left',
                            borderRadius: 12,
                            background: isActive ? activeBg : 'transparent',
                            border: `1px solid ${isActive ? border : 'transparent'}`,
                          }}
                        >
                          <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Space size={8}>
                                <Badge color={meta.color} />
                                <Text strong>{conversation.title}</Text>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {conversation.lastActivityAt ? dayjs(conversation.lastActivityAt).fromNow() : ''}
                              </Text>
                            </Space>
                            <Text type="secondary" ellipsis>
                              {conversation.preview}
                            </Text>
                            <Space wrap size={6}>
                              <Tag color={meta.color}>{meta.label}</Tag>
                              <Tag>{SEGMENT_LABELS[conversation.segment] || 'Клиенты'}</Tag>
                              {queueMeta && <Tag color={queueMeta.color}>{queueMeta.label}</Tag>}
                              <Tag>{conversation.messages.length} msg</Tag>
                              {responseLabel && <Text type="secondary">{responseLabel}</Text>}
                            </Space>
                          </Space>
                        </Button>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Space>
          </Card>
        </Sider>

        <Content style={{ paddingLeft: isMobile ? 0 : 16 }}>
          {!activeConversation ? (
            <Card variant="borderless" style={{ background: bgSecondary }}>
              <Empty
                description="Выберите диалог, чтобы открыть conversation pane"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card variant="borderless" style={{ background: bg }}>
                {(() => {
                  const activeQueueMeta = queueStateMeta(
                    activeConversation.latestQueueState,
                    activeConversation.latestStatus,
                    activeConversation.latestSlaStatus
                  );
                  const activeResponseLabel = respondedAtLabel(activeConversation.latestRespondedAt);
                  return (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {activeConversation.title}
                      </Title>
                      <Text type="secondary">
                        {channelMeta(activeConversation.channelType).label} • {activeConversation.participantId || 'participant n/a'}
                      </Text>
                    </div>
                    <Space wrap size={8}>
                      <Tag color={channelMeta(activeConversation.channelType).color}>
                        {channelMeta(activeConversation.channelType).label}
                      </Tag>
                      {activeQueueMeta && <Tag color={activeQueueMeta.color}>{activeQueueMeta.label}</Tag>}
                      {activeResponseLabel && <Tag icon={<ClockCircleOutlined />}>{activeResponseLabel}</Tag>}
                    </Space>
                  </Space>
                  <Alert
                    type="info"
                    showIcon
                    message="Conversation pane"
                    description="Диалог собран по omnichannel timeline. Composer работает для Meta/Telegram-каналов с существующим outbound API."
                  />
                  {activeConversationCompliance.channelRequiresWindow ? (
                    activeConversationCompliance.restricted ? (
                      <Alert
                        type="warning"
                        showIcon
                        message="24h compliance window истекло"
                        description={
                          activeConversationCompliance.lastInboundAt
                            ? `С последнего входящего прошло ${Math.round(activeConversationCompliance.hoursSinceInbound || 0)} ч. Обычная отправка заблокирована, используйте approved template.`
                            : 'В треде нет входящего сообщения от клиента. Обычная отправка заблокирована, используйте approved template.'
                        }
                      />
                    ) : (
                      <Alert
                        type="success"
                        showIcon
                        message="24h window активно"
                        description="Обычная отправка в Meta-канал доступна до истечения 24h окна."
                      />
                    )
                  ) : null}
                </Space>
                  );
                })()}
              </Card>

              <Layout style={{ background: 'transparent' }}>
                <Content style={{ paddingRight: isMobile ? 0 : 16 }}>
                  <Card variant="borderless" style={{ background: bgSecondary }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {activeConversation.messages.map((item) => {
                        const inbound = item.direction === 'in';
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: inbound ? 'flex-start' : 'flex-end',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '82%',
                                padding: '10px 12px',
                                borderRadius: 14,
                                background: inbound ? bg : '#1677ff',
                                color: inbound ? 'inherit' : '#fff',
                                border: inbound ? `1px solid ${border}` : 'none',
                              }}
                            >
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Space wrap size={6}>
                                  <Tag color={channelMeta(item.channel_type).color}>{channelMeta(item.channel_type).label}</Tag>
                                  <Tag>{inbound ? 'Входящее' : 'Исходящее'}</Tag>
                                  <Tag color={item.sla_status === 'breached' ? 'red' : 'default'}>
                                    {item.sla_status === 'breached' ? 'SLA breached' : 'SLA ok'}
                                  </Tag>
                                </Space>
                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {item.text || 'Без текста'}
                                </div>
                                <Text style={{ fontSize: 12, color: inbound ? undefined : 'rgba(255,255,255,0.75)' }}>
                                  {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')} • {item.status || 'unknown'}
                                </Text>
                              </Space>
                            </div>
                          </div>
                        );
                      })}

                      {hasOutboundAdapter ? (
                        <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
                          <TextArea
                            rows={4}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Ответить в диалоге..."
                            maxLength={2000}
                            disabled={activeConversationCompliance.restricted}
                          />
                          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Text type="secondary">
                              Отправка в {channelMeta(activeConversation.channelType).label}
                              {activeConversationCompliance.restricted ? ' (ограничено policy 24h)' : ''}
                            </Text>
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              loading={sending}
                              disabled={activeConversationCompliance.restricted || !draft.trim()}
                              onClick={handleSend}
                            >
                              Отправить
                            </Button>
                          </Space>
                        </Space>
                      ) : (
                        <Alert
                          type="warning"
                          showIcon
                          message="Composer пока недоступен"
                          description="Для этого канала в текущем API нет прямого outbound adapter через unified inbox."
                        />
                      )}
                    </Space>
                  </Card>
                </Content>

                <Sider
                  width={isMobile ? '100%' : 300}
                  theme="light"
                  style={{ background: 'transparent', marginTop: isMobile ? 16 : 0 }}
                >
                  <Card variant="borderless" style={{ background: bg }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Title level={5} style={{ margin: 0 }}>
                          Context Sidebar
                        </Title>
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={contextLoading}
                          onClick={() => loadConversationContext(activeConversation)}
                        />
                      </Space>

                      <Statistic title="Входящих" value={contextMetrics?.inbound ?? activeConversation.inboundCount} />
                      <Statistic title="Исходящих" value={contextMetrics?.outbound ?? activeConversation.outboundCount} />
                      <Statistic title="Всего сообщений" value={contextMetrics?.messages_total ?? activeConversation.messages.length} />

                      <div>
                        <Text type="secondary">Статус диалога</Text>
                        <Select
                          style={{ width: '100%', marginTop: 6 }}
                          value={contextState?.status || 'open'}
                          options={[
                            { label: 'Открыт', value: 'open' },
                            { label: 'В работе', value: 'in_progress' },
                            { label: 'Snoozed', value: 'snoozed' },
                            { label: 'Закрыт', value: 'resolved' },
                          ]}
                          onChange={(value) => patchConversationContext({ status: value })}
                        />
                      </div>

                      <div>
                        <Text type="secondary">Следующее действие</Text>
                        <Input
                          style={{ marginTop: 6 }}
                          value={contextState?.next_action || ''}
                          placeholder="Например: перезвонить клиенту"
                          onChange={(event) => setContextState((prev) => ({ ...(prev || {}), next_action: event.target.value }))}
                          onBlur={(event) => patchConversationContext({ next_action: event.target.value.trim() })}
                        />
                      </div>

                      <div>
                        <Text type="secondary">Дата следующего действия</Text>
                        <DatePicker
                          showTime
                          style={{ width: '100%', marginTop: 6 }}
                          value={contextState?.next_action_at ? dayjs(contextState.next_action_at) : null}
                          onChange={(value) => patchConversationContext({ next_action_at: value ? value.toISOString() : null })}
                        />
                      </div>

                      <Space wrap size={8}>
                        {QUICK_ACTIONS.map((item) => (
                          <Button
                            key={item.action}
                            loading={contextSaving}
                            onClick={() => runQuickAction(item.action, item.extra || {})}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </Space>

                      <Space.Compact style={{ width: '100%' }}>
                        <InputNumber
                          style={{ width: '50%' }}
                          value={linkSubjectContentType}
                          min={1}
                          placeholder="content_type id"
                          onChange={(value) => setLinkSubjectContentType(value ?? null)}
                        />
                        <InputNumber
                          style={{ width: '50%' }}
                          value={linkSubjectObjectId}
                          min={1}
                          placeholder="object id"
                          onChange={(value) => setLinkSubjectObjectId(value ?? null)}
                        />
                        <Button
                          loading={contextSaving}
                          onClick={() =>
                            linkSubjectContentType
                            && linkSubjectObjectId
                            && runQuickAction('link_entity', {
                              subject_content_type: linkSubjectContentType,
                              subject_object_id: linkSubjectObjectId,
                            })
                          }
                        >
                          Link entity
                        </Button>
                      </Space.Compact>

                      <Space.Compact style={{ width: '100%' }}>
                        <InputNumber
                          style={{ width: '100%' }}
                          value={ownerUserId}
                          min={1}
                          placeholder="Owner user id"
                          onChange={(value) => setOwnerUserId(value ?? null)}
                        />
                        <Button
                          loading={contextSaving}
                          onClick={() => ownerUserId && runQuickAction('assign_owner', { owner_user_id: ownerUserId })}
                        >
                          Assign owner
                        </Button>
                      </Space.Compact>

                      <div>
                        <Text type="secondary">Внутренняя заметка</Text>
                        <TextArea
                          rows={3}
                          style={{ marginTop: 6 }}
                          value={internalNoteDraft}
                          placeholder="Комментарий для команды"
                          onChange={(event) => setInternalNoteDraft(event.target.value)}
                        />
                        <Button
                          style={{ marginTop: 8 }}
                          loading={contextSaving}
                          onClick={() => runQuickAction('add_internal_note', { note: internalNoteDraft })}
                        >
                          Добавить заметку
                        </Button>
                      </div>

                      <div>
                        <Text type="secondary">Последние заметки</Text>
                        {(contextState?.internal_notes || []).length > 0 ? (
                          <List
                            size="small"
                            dataSource={[...(contextState.internal_notes || [])].slice(-3).reverse()}
                            renderItem={(note) => (
                              <List.Item style={{ paddingInline: 0 }}>
                                <Space direction="vertical" size={0}>
                                  <Text>{note?.text || ''}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {note?.author_username || 'system'} • {note?.created_at ? dayjs(note.created_at).format('DD.MM.YYYY HH:mm') : ''}
                                  </Text>
                                </Space>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Text type="secondary">Пока нет заметок</Text>
                        )}
                      </div>

                      <div>
                        <Text type="secondary">Канал</Text>
                        <div>
                          <Tag color={channelMeta(activeConversation.channelType).color}>
                            {channelMeta(activeConversation.channelType).label}
                          </Tag>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">Участник</Text>
                        <div>
                          <Text copyable>{activeConversation.participantId || 'n/a'}</Text>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">Связанная сущность</Text>
                        <div>
                          {(contextState?.subject_object_id || activeConversation.subjectObjectId) ? (
                            <Tag>
                              {contextState?.subject_content_type || activeConversation.subjectContentType || 'subject'} #{contextState?.subject_object_id || activeConversation.subjectObjectId}
                            </Tag>
                          ) : (
                            <Text type="secondary">Не привязано</Text>
                          )}
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Sider>
              </Layout>
            </Space>
          )}
        </Content>
      </Layout>
    </Space>
  );

  return (
    <Tabs
      defaultActiveKey="inbox"
      items={[
        { key: 'inbox', label: 'Omnichannel Inbox', children: inboxLayout },
        { key: 'dispatch', label: 'Outbound / Broadcast', children: <CommunicationsHub defaultTab="omnichannel" /> },
      ]}
    />
  );
}

export default ChatPage;
