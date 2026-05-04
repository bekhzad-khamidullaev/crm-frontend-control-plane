import {
  Alert,
  App,
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  Layout,
  List,
  Modal,
  Result,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  EllipsisOutlined,
  FilterOutlined,
  InboxOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import './chat-page-omni.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useMemo, useState } from 'react';
import {
  getOmnichannelWhatsAppTemplates,
  getOmnichannelConversationContext,
  getOmnichannelTimeline,
  runOmnichannelConversationAction,
  sendOmnichannelMessage,
  updateOmnichannelConversationContext,
} from '../lib/api/compliance.js';
import { getChatMessages } from '../lib/api/chat.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { navigate } from '../router.js';
import CommunicationsHub from '../modules/communications/CommunicationsHub.jsx';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: 'green', icon: <ChannelBrandIcon channel="whatsapp" /> },
  telegram: { label: 'Telegram', color: 'blue', icon: <ChannelBrandIcon channel="telegram" /> },
  instagram: {
    label: 'Instagram',
    color: 'magenta',
    icon: <ChannelBrandIcon channel="instagram" />,
  },
  facebook: { label: 'Facebook', color: 'geekblue', icon: <ChannelBrandIcon channel="facebook" /> },
  playmobile: { label: 'SMS', color: 'gold', icon: <ChannelBrandIcon channel="sms" /> },
  eskiz: { label: 'SMS', color: 'gold', icon: <ChannelBrandIcon channel="sms" /> },
  crm_chat: { label: 'CRM Chat', color: 'default', icon: <ChannelBrandIcon channel="chat" /> },
};

const BUCKET_OPTIONS = [
  { label: 'Все', value: 'all' },
  { label: 'Новые', value: 'new' },
  { label: 'Ожидают', value: 'waiting' },
  { label: 'В работе', value: 'active' },
  { label: 'Закрыто', value: 'resolved' },
  { label: 'Спам', value: 'spam' },
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
const ALL_CHANNELS_LABEL = 'Все каналы';

const META_24H_CHANNELS = new Set(['whatsapp']);
const DISPATCH_TABS = ['omnichannel', 'crm-emails', 'massmail'];

function channelMeta(channelType) {
  return (
    CHANNEL_META[channelType] || {
      label: channelType || 'Канал',
      color: 'default',
      icon: <ChannelBrandIcon channel={channelType || 'chat'} />,
    }
  );
}

function isAllChannelOption(channelType) {
  const normalized = String(channelType || '')
    .trim()
    .toLowerCase();
  return !normalized || normalized === 'all';
}

function getChannelLabel(channelType, fallbackLabel = 'Канал') {
  if (isAllChannelOption(channelType)) {
    return fallbackLabel;
  }
  return channelMeta(channelType).label;
}

function channelLabelNode(channelType, fallbackLabel = 'Канал') {
  const label = getChannelLabel(channelType, fallbackLabel);
  if (isAllChannelOption(channelType)) {
    return <span>{label}</span>;
  }
  return (
    <Space size={6} align="center">
      <ChannelBrandIcon channel={channelType || 'omnichannel'} size={14} />
      <span>{label}</span>
    </Space>
  );
}

function normalizeQueueState(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function queueStateMeta(queueState, status, slaStatus) {
  if (slaStatus === 'breached') return { label: 'SLA risk', color: 'red' };
  const normalized = normalizeQueueState(queueState) || normalizeQueueState(status);
  if (!normalized) return null;
  if (['new', 'incoming', 'created'].includes(normalized)) {
    return { label: 'Новый', color: 'cyan' };
  }
  if (['waiting', 'queued', 'pending', 'accepted', 'on_hold'].includes(normalized)) {
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
  if (['spam', 'junk'].includes(normalized)) {
    return { label: 'Спам', color: 'default' };
  }
  return { label: normalized, color: 'default' };
}

function resolveConversationBucket(latest, hasBreached = false) {
  if (hasBreached) return 'breached';
  const bucket = normalizeQueueState(latest?.queue_bucket);
  const status = normalizeQueueState(latest?.status);
  const state = normalizeQueueState(latest?.queue_state);
  const token = bucket || status || state;
  if (['new', 'incoming', 'created'].includes(token)) return 'new';
  if (['waiting', 'queued', 'pending', 'accepted', 'on_hold'].includes(token)) return 'waiting';
  if (['in_progress', 'processing', 'active'].includes(token)) return 'active';
  if (['resolved', 'closed', 'sent', 'delivered', 'done'].includes(token)) return 'resolved';
  if (['spam', 'junk'].includes(token)) return 'spam';
  return 'other';
}

function respondedAtLabel(value) {
  return value ? `Ответ ${dayjs(value).fromNow()}` : '';
}

function normalizeList(response) {
  return Array.isArray(response?.results) ? response.results : [];
}

function buildContactDisplayName(contact) {
  return (
    String(contact?.name || '').trim() ||
    String(contact?.full_name || '').trim() ||
    [contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim() ||
    String(contact?.email || '').trim() ||
    `#${contact?.id || 'contact'}`
  );
}

function buildContactSecondary(contact) {
  return (
    String(contact?.secondary || '').trim() ||
    String(contact?.mobile_e164 || '').trim() ||
    String(contact?.phone_e164 || '').trim() ||
    String(contact?.mobile || '').trim() ||
    String(contact?.phone || '').trim() ||
    String(contact?.telegram_username || '').trim() ||
    String(contact?.email || '').trim() ||
    ''
  );
}

function normalizeParticipantContact(contact) {
  if (!contact || typeof contact !== 'object') return null;
  const name = buildContactDisplayName(contact);
  const secondary = buildContactSecondary(contact);
  return {
    ...contact,
    name,
    secondary,
  };
}

function buildParticipantFieldRows(contact) {
  if (!contact || typeof contact !== 'object') return [];
  const telegramValue = contact.telegram_username
    ? `@${String(contact.telegram_username).replace(/^@/, '')}`
    : contact.telegram_chat_id;
  const instagramValue = contact.instagram_username
    ? `@${String(contact.instagram_username).replace(/^@/, '')}`
    : contact.instagram_recipient_id;
  const phoneValue =
    contact.mobile_e164 ||
    contact.phone_e164 ||
    contact.mobile ||
    contact.phone ||
    contact.other_phone ||
    '';

  return [
    { key: 'phone', label: 'Телефон', value: phoneValue },
    { key: 'email', label: 'Email', value: contact.email },
    { key: 'telegram', label: 'Telegram', value: telegramValue },
    { key: 'instagram', label: 'Instagram', value: instagramValue },
    { key: 'facebook', label: 'Facebook PSID', value: contact.facebook_psid },
  ].filter((item) => String(item.value || '').trim());
}

function displayConversationTitle(conversation) {
  const contactName = conversation?.participantContact?.name;
  const base = String(conversation?.title || '').trim();
  const participantId = String(conversation?.participantId || '').trim();
  if (
    contactName &&
    (!base || base === 'Диалог' || base === 'Сущность' || base === participantId)
  ) {
    return contactName;
  }
  return base || contactName || 'Диалог';
}

function formatRelativeChatTime(value) {
  if (!value) return '';
  const now = dayjs();
  const at = dayjs(value);
  if (!at.isValid()) return '';
  const diffMinutes = Math.max(1, now.diff(at, 'minute'));
  if (diffMinutes < 60) return `${diffMinutes} mins`;
  const diffHours = now.diff(at, 'hour');
  if (diffHours < 24) return `${diffHours} hrs`;
  if (diffHours < 48) return 'Yesterday';
  return at.locale('en').format('MMM D');
}

function formatTaskDueDate(value) {
  if (!value) return '';
  const at = dayjs(value);
  if (!at.isValid()) return '';
  return at.locale('en').format('MMM D, YYYY');
}

function normalizeSummary(response, items) {
  const fallback = {
    total: items.length,
    new: items.filter((item) => resolveConversationBucket(item) === 'new').length,
    waiting: items.filter((item) => resolveConversationBucket(item) === 'waiting').length,
    active: items.filter((item) => resolveConversationBucket(item) === 'active').length,
    resolved: items.filter((item) => resolveConversationBucket(item) === 'resolved').length,
    spam: items.filter((item) => resolveConversationBucket(item) === 'spam').length,
    breached: items.filter((item) => item.sla_status === 'breached').length,
    inbound: items.filter((item) => item.direction === 'in').length,
    outbound: items.filter((item) => item.direction === 'out').length,
  };
  return response?.summary && typeof response.summary === 'object'
    ? { ...fallback, ...response.summary }
    : fallback;
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
  if (item?.legacy_owner) {
    return item.legacy_owner;
  }
  const participantId = resolveParticipantId(item);
  if (item?.subject_object_id) {
    return 'Сущность';
  }
  return participantId || 'Диалог';
}

function toLowerString(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
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
    ['task', 'tasks', 'project', 'projects', 'reminder', 'memo'].some((token) =>
      subjectToken.includes(token)
    ) ||
    /(задач|task|проект|project|reminder|напомин|memo|ticket)/i.test(haystack)
  ) {
    return 'tasks';
  }

  if (
    conversation?.channelType === 'telegram' &&
    !conversation?.subjectObjectId &&
    !subjectToken &&
    /(команд|team|internal|сотрудник|оператор|agent)/i.test(haystack)
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
    const messageContact = normalizeParticipantContact(item?.participant_contact);
    const row = byKey.get(key) || {
      key,
      channelId: item.channel,
      channelType: item.channel_type,
      channelName: item.channel_name,
      participantId: resolveParticipantId(item),
      title: buildConversationTitle(item),
      subjectContentType: item.subject_content_type,
      subjectObjectId: item.subject_object_id,
      participantContact: messageContact,
      isLegacy: Boolean(item.legacy_mode),
      messages: [],
    };
    if (!row.participantContact && messageContact) {
      row.participantContact = messageContact;
    }
    row.messages.push(item);
    byKey.set(key, row);
  });

  return Array.from(byKey.values())
    .map((conversation) => {
      const messages = [...conversation.messages].sort(
        (a, b) => messageTimestamp(a) - messageTimestamp(b)
      );
      const latest = messages[messages.length - 1];
      const isLegacy = Boolean(conversation.isLegacy || messages.some((item) => item.legacy_mode));
      const hasBreached = messages.some((item) => item.sla_status === 'breached');
      const queueBucket = resolveConversationBucket(latest, hasBreached);
      const draft = {
        ...conversation,
        isLegacy,
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
      conversation.participantContact?.name,
      conversation.participantContact?.secondary,
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
  if (conversation?.isLegacy || !conversation?.channelId || !conversation?.participantId)
    return null;
  return {
    channel_id: conversation.channelId,
    participant_id: conversation.participantId,
    conversation_key: conversation.key,
  };
}

function normalizeLegacyList(response) {
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.messages)) return response.messages;
  return [];
}

function mapLegacyRows(messages = []) {
  return messages.map((item) => {
    const ownerName = item?.owner?.full_name || item?.owner?.username || 'Пользователь';
    const contentType = item?.content_type || 'chat';
    const conversationId = item?.object_id || item?.topic || item?.answer_to || item?.id;
    const text = String(item?.content || item?.preview || '').trim();
    return {
      id: `legacy-${item?.id}`,
      channel: `legacy-${contentType}`,
      channel_type: 'crm_chat',
      channel_name: 'CRM Chat',
      conversation_key: `legacy:${contentType}:${conversationId}`,
      participant_id: String(item?.owner?.id || item?.owner?.username || item?.id || '').trim(),
      direction: 'in',
      external_id: `legacy-${item?.id}`,
      sender_id: String(item?.owner?.id || item?.owner?.username || '').trim(),
      recipient_id: '',
      text: text || 'Без текста',
      status: 'legacy',
      queue_state: 'active',
      queue_bucket: 'active',
      sla_status: 'ok',
      subject_content_type: contentType,
      subject_object_id: item?.object_id || null,
      created_at: item?.creation_date || new Date().toISOString(),
      legacy_mode: true,
      legacy_owner: ownerName,
    };
  });
}

const QUICK_ACTIONS = [
  { action: 'create_lead', label: 'Создать лид' },
  { action: 'create_contact', label: 'Создать контакт' },
  { action: 'create_deal', label: 'Создать сделку' },
  { action: 'create_task', label: 'Создать задачу' },
  { action: 'snooze', label: 'Отложить на 30 мин', extra: { minutes: 30 } },
  { action: 'start_call', label: 'Начать звонок' },
];

function resolveDispatchTab(value) {
  return DISPATCH_TABS.includes(value) ? value : 'omnichannel';
}

function ChatPage({ initialWorkspaceTab = null, initialDispatchTab = 'omnichannel' }) {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    new: 0,
    waiting: 0,
    active: 0,
    resolved: 0,
    spam: 0,
    breached: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [inboxSource, setInboxSource] = useState('omnichannel');
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
  const [sendRestriction, setSendRestriction] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSending, setTemplateSending] = useState(false);
  const [templateForm] = Form.useForm();
  const [templateOptions, setTemplateOptions] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(
    initialWorkspaceTab === 'dispatch' ? 'dispatch' : 'inbox'
  );
  const [threadPriority, setThreadPriority] = useState('medium');
  const [checkedTaskKeys, setCheckedTaskKeys] = useState([]);
  const defaultDispatchTab = resolveDispatchTab(initialDispatchTab);

  const bg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const bgSecondary = theme === 'dark' ? '#111827' : '#f7f9fc';
  const border = theme === 'dark' ? 'rgba(148, 163, 184, 0.22)' : '#e5e7eb';
  const activeBg = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#eaf2ff';
  const chatCanvasBg = theme === 'dark' ? '#0b1220' : '#f4f7fb';
  const incomingBubbleBg = theme === 'dark' ? '#111827' : '#ffffff';
  const outgoingBubbleBg = theme === 'dark' ? '#2563eb' : '#2f7bff';

  const loadInbox = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorState(null);

    try {
      const loadLegacyFallback = async () => {
        const legacyResponse = await getChatMessages({
          page_size: 300,
          ordering: '-creation_date',
        });
        const legacyMessages = normalizeLegacyList(legacyResponse);
        return mapLegacyRows(legacyMessages);
      };

      try {
        const response = await getOmnichannelTimeline({ limit: 300 });
        const rows = normalizeList(response);
        if (rows.length > 0) {
          setItems(rows);
          setSummary(normalizeSummary(response, rows));
          setInboxSource('omnichannel');
          return;
        }

        const legacyRows = await loadLegacyFallback();
        if (legacyRows.length > 0) {
          setItems(legacyRows);
          setSummary(normalizeSummary({ summary: { total: legacyRows.length } }, legacyRows));
          setInboxSource('legacy');
          return;
        }

        setItems(rows);
        setSummary(normalizeSummary(response, rows));
        setInboxSource('omnichannel');
      } catch (omnichannelError) {
        const legacyRows = await loadLegacyFallback();
        if (legacyRows.length > 0) {
          setItems(legacyRows);
          setSummary(normalizeSummary({ summary: { total: legacyRows.length } }, legacyRows));
          setInboxSource('legacy');
          return;
        }
        throw omnichannelError;
      }
    } catch (error) {
      setErrorState(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось загрузить inbox.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    setActiveWorkspaceTab(initialWorkspaceTab === 'dispatch' ? 'dispatch' : 'inbox');
  }, [initialWorkspaceTab]);

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

  const activeConversation =
    filteredConversations.find((item) => item.key === activeConversationKey) || null;
  const activeConversationCompliance = useMemo(
    () => resolveConversationCompliance(activeConversation),
    [activeConversation]
  );
  const hasOutboundAdapter = useMemo(
    () => Boolean(buildSendPayload(activeConversation, '__probe__')),
    [activeConversation]
  );
  const activeParticipantFields = useMemo(
    () => buildParticipantFieldRows(activeConversation?.participantContact),
    [activeConversation]
  );
  const channelOptions = useMemo(() => {
    const dynamic = Array.from(
      new Set(conversations.map((item) => item.channelType).filter(Boolean))
    ).map((value) => ({
      label: getChannelLabel(value),
      value,
    }));
    return [{ label: ALL_CHANNELS_LABEL, value: 'all' }, ...dynamic];
  }, [conversations]);
  const nextActionConversation = useMemo(
    () =>
      filteredConversations.find((item) => ['new', 'waiting'].includes(item.queueBucket)) ||
      filteredConversations[0] ||
      null,
    [filteredConversations]
  );
  const sidebarTasks = useMemo(() => {
    if (!activeConversation) return [];
    const rows = [];
    const nextAction = String(contextState?.next_action || '').trim();
    if (nextAction) {
      rows.push({
        key: 'next-action',
        label: nextAction,
        dueAt: contextState?.next_action_at || null,
      });
    }

    (contextState?.internal_notes || [])
      .slice(-5)
      .reverse()
      .forEach((note, index) => {
        const value = String(note?.text || '').trim();
        if (!value) return;
        rows.push({
          key: `note-${note?.id || note?.created_at || index}`,
          label: value,
          dueAt: note?.created_at || null,
        });
      });

    if (rows.length === 0 && activeConversation.latest?.text) {
      rows.push({
        key: 'follow-up',
        label: 'Сделать follow-up по последнему сообщению',
        dueAt: activeConversation.latest?.created_at || null,
      });
    }

    return rows.slice(0, 6);
  }, [activeConversation, contextState]);

  const sidebarTasksForUi = useMemo(() => {
    if (sidebarTasks.length > 0) return sidebarTasks;
    return [
      { key: 'demo-1', label: 'Prepare new quotation', dueAt: '2023-11-21T12:00:00Z' },
      { key: 'demo-2', label: 'Ask to the next event', dueAt: '2023-11-20T12:00:00Z' },
      { key: 'demo-3', label: '6 weekly service call', dueAt: '2023-11-19T12:00:00Z' },
      { key: 'demo-4', label: 'Prepare new quotation', dueAt: '2023-11-10T12:00:00Z' },
      { key: 'demo-5', label: 'Meeting to finalised', dueAt: '2023-11-09T12:00:00Z' },
      { key: 'demo-6', label: 'Follow up call', dueAt: '2023-11-01T12:00:00Z' },
    ];
  }, [sidebarTasks]);

  const chatStatusTabs = useMemo(
    () => [
      { key: 'new', label: 'New', count: summary.new },
      { key: 'active', label: 'In progress', count: summary.active },
      { key: 'waiting', label: 'Waiting', count: summary.waiting },
      { key: 'resolved', label: 'Completed', count: summary.resolved },
    ],
    [summary.active, summary.new, summary.resolved, summary.waiting]
  );
  const selectedChatBucket = ['new', 'active', 'waiting', 'resolved'].includes(bucket)
    ? bucket
    : 'new';
  const hasConversationSelection = Boolean(activeConversation);
  const statusSelectOptions = useMemo(
    () => [
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--status" />
            <span>In progress</span>
          </Space>
        ),
        value: 'in_progress',
      },
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--waiting" />
            <span>Waiting</span>
          </Space>
        ),
        value: 'snoozed',
      },
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--done" />
            <span>Completed</span>
          </Space>
        ),
        value: 'resolved',
      },
      { label: 'Open', value: 'open' },
    ],
    []
  );
  const prioritySelectOptions = useMemo(
    () => [
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--low" />
            <span>Low</span>
          </Space>
        ),
        value: 'low',
      },
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--medium" />
            <span>Medium</span>
          </Space>
        ),
        value: 'medium',
      },
      {
        label: (
          <Space size={6} align="center">
            <span className="omni-chat-chip-dot omni-chat-chip-dot--high" />
            <span>High</span>
          </Space>
        ),
        value: 'high',
      },
    ],
    []
  );

  const handleTakeNextConversation = () => {
    if (!nextActionConversation) return;
    if (
      nextActionConversation.queueBucket === 'new' ||
      nextActionConversation.queueBucket === 'waiting'
    ) {
      setBucket(nextActionConversation.queueBucket);
    }
    setActiveConversationKey(nextActionConversation.key);
  };

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
      message.error(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось загрузить контекст диалога'
      );
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
      setSendRestriction(null);
      return;
    }
    setSendRestriction(null);
    loadConversationContext(activeConversation);
  }, [activeConversation]);

  useEffect(() => {
    setCheckedTaskKeys([]);
    setThreadPriority('medium');
  }, [activeConversation?.key]);

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
      message.error(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось обновить контекст'
      );
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
      message.error(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось выполнить действие'
      );
    } finally {
      setContextSaving(false);
    }
  };

  const handleSend = async () => {
    if (activeConversationCompliance.restricted) {
      setSendRestriction({
        code: 'WHATSAPP_TEMPLATE_REQUIRED',
        template_required: true,
        reason: activeConversationCompliance.reason,
        hours_since_inbound: Math.round(activeConversationCompliance.hoursSinceInbound || 0),
        last_inbound_at: activeConversationCompliance.lastInboundAt || null,
      });
      message.warning(
        '24h окно ответа истекло. Для продолжения используйте шаблонное сообщение в Meta канале.'
      );
      return;
    }
    const text = draft.trim();
    const payload = buildSendPayload(activeConversation, text);
    if (!text || !payload) return;

    setSending(true);
    try {
      await sendOmnichannelMessage(payload);
      setDraft('');
      setSendRestriction(null);
      message.success('Сообщение отправлено');
      await loadInbox({ silent: true });
    } catch (error) {
      const details = error?.details || {};
      if (details?.code === 'WHATSAPP_TEMPLATE_REQUIRED') {
        setSendRestriction(details);
        message.warning(
          details?.detail || 'Обычный ответ в WhatsApp заблокирован. Используйте шаблон.'
        );
        return;
      }
      message.error(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось отправить сообщение'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async (values) => {
    const basePayload = buildSendPayload(activeConversation, '');
    if (!basePayload) return;
    const name = String(values.template_name || '').trim();
    if (!name) return;
    const languageCode = String(values.language_code || 'en_US').trim() || 'en_US';
    const params = String(values.template_params || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      ...basePayload,
      text: '',
      template: {
        name,
        language: { code: languageCode },
        params,
      },
    };
    setTemplateSending(true);
    try {
      await sendOmnichannelMessage(payload);
      setTemplateModalOpen(false);
      templateForm.resetFields();
      setSendRestriction(null);
      message.success('Шаблон отправлен');
      await loadInbox({ silent: true });
    } catch (error) {
      message.error(
        error?.details?.message ||
          error?.details?.detail ||
          error?.message ||
          'Не удалось отправить шаблон'
      );
    } finally {
      setTemplateSending(false);
    }
  };

  useEffect(() => {
    if (!templateModalOpen) return;
    if (
      !activeConversation ||
      activeConversation.channelType !== 'whatsapp' ||
      !activeConversation.channelId
    ) {
      setTemplateOptions([]);
      return;
    }
    let cancelled = false;
    const loadTemplates = async () => {
      setTemplateLoading(true);
      try {
        const response = await getOmnichannelWhatsAppTemplates({
          channel_id: activeConversation.channelId,
        });
        if (cancelled) return;
        const rows = Array.isArray(response?.results) ? response.results : [];
        setTemplateOptions(rows);
      } catch (error) {
        if (!cancelled) {
          setTemplateOptions([]);
          message.warning(
            error?.details?.message ||
              error?.details?.detail ||
              'Не удалось загрузить список шаблонов'
          );
        }
      } finally {
        if (!cancelled) {
          setTemplateLoading(false);
        }
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [templateModalOpen, activeConversation]);

  if (loading) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <Space
          direction="vertical"
          size={16}
          style={{ width: '100%', padding: 64, textAlign: 'center' }}
        >
          <Spin size="large" />
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              Загружаем Omnichannel Inbox
            </Title>
            <Text type="secondary">
              Загружаются диалоги, SLA-метрики и контекст выбранного треда.
            </Text>
          </div>
        </Space>
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
              <Text type="secondary">
                Повторная попытка заново загрузит omnichannel timeline и пересоберёт список
                диалогов.
              </Text>
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

  const inboxLayout = (
    <div className="omni-chat-page">
      <Card variant="borderless" className="omni-chat-shell" style={{ borderColor: border, background: bg }}>
        <Layout className={`omni-chat-main ${hasConversationSelection ? 'has-active' : 'is-empty'}`}>
          <Sider
            width={isMobile ? '100%' : 300}
            breakpoint="lg"
            collapsedWidth={0}
            theme={theme === 'dark' ? 'dark' : 'light'}
            className="omni-chat-left-col"
          >
            <div className="omni-chat-left-top">
              <div className="omni-chat-search-row">
                <Input
                  className="omni-chat-search-input"
                  value={searchQuery}
                  allowClear
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  prefix={<SearchOutlined style={{ color: '#a3adbb' }} />}
                />
                <Button
                  className="omni-chat-filter-btn"
                  type="text"
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchQuery('');
                    setBucket('all');
                    setChannel('all');
                    setSegment('all');
                  }}
                />
              </div>
              <Button
                type="primary"
                className="omni-chat-new-chat-btn"
                icon={<PlusOutlined />}
                onClick={() => setActiveWorkspaceTab('dispatch')}
              >
                Start new chat
              </Button>

              <div className="omni-chat-status-tabs">
                {chatStatusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`omni-chat-status-tab ${selectedChatBucket === tab.key ? 'is-active' : ''}`}
                    onClick={() => setBucket(tab.key)}
                  >
                    {tab.key === 'new' && <span className="omni-chat-status-badge">{tab.count || 0}</span>}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {inboxSource === 'legacy' && (
              <Alert
                className="omni-chat-legacy-alert"
                type="info"
                showIcon
                message="Включён fallback на CRM Chat"
                description="Omnichannel timeline сейчас пуст или недоступен, поэтому показаны диалоги из классического chat-messages API."
              />
            )}

            {filteredConversations.length === 0 ? (
              <div className="omni-chat-left-empty">
                <Empty
                  description={
                    items.length === 0
                      ? 'Входящих диалогов пока нет'
                      : 'Нет диалогов под выбранные фильтры'
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              <List
                className="omni-chat-thread-list"
                dataSource={filteredConversations}
                split
                renderItem={(conversation) => {
                  const isActive = conversation.key === activeConversationKey;
                  const listContactName = displayConversationTitle(conversation);
                  const participantSecondary =
                    conversation.participantContact?.secondary ||
                    conversation.participantContact?.name ||
                    conversation.participantId ||
                    'клиент не определён';
                  const avatarLetter = String(listContactName || 'C')
                    .trim()
                    .charAt(0)
                    .toUpperCase();
                  const timeLabel = formatRelativeChatTime(
                    conversation.lastActivityAt || conversation.latest?.created_at
                  );
                  return (
                    <List.Item>
                      <button
                        type="button"
                        className={`omni-chat-thread-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => setActiveConversationKey(conversation.key)}
                      >
                        <Avatar
                          size={38}
                          className="omni-chat-thread-avatar"
                          style={{
                            background: isActive ? '#dbeafe' : '#f4f6fa',
                            color: '#111827',
                          }}
                        >
                          {avatarLetter}
                        </Avatar>
                        <span className="omni-chat-thread-avatar-icon">
                          <ChannelBrandIcon channel={conversation.channelType || 'chat'} size={10} />
                        </span>
                        <div className="omni-chat-thread-content">
                          <div className="omni-chat-thread-head">
                            <Text strong ellipsis className="omni-chat-thread-name">
                              {listContactName}
                            </Text>
                            <span className="omni-chat-thread-time">{timeLabel}</span>
                          </div>
                          <Text ellipsis className="omni-chat-thread-preview">
                            {conversation.preview || participantSecondary}
                          </Text>
                        </div>
                      </button>
                    </List.Item>
                  );
                }}
              />
            )}
          </Sider>

          <Content
            className={`omni-chat-center-col ${!isMobile && hasConversationSelection ? 'has-right' : 'no-right'}`}
          >
            {!activeConversation ? (
              <Flex
                vertical
                align="center"
                justify="center"
                gap={8}
                style={{ width: '100%', minHeight: 260, padding: '24px 24px 30px' }}
              >
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Выберите диалог слева" />
                <Button
                  type="primary"
                  className="omni-chat-empty-cta"
                  icon={<PlusOutlined />}
                  onClick={() => setActiveWorkspaceTab('dispatch')}
                >
                  Start new chat
                </Button>
              </Flex>
            ) : (
              <div className="omni-chat-thread">
                <div className="omni-chat-thread-header">
                  <div className="omni-chat-thread-title-wrap">
                    <Text strong className="omni-chat-thread-title">
                      {displayConversationTitle(activeConversation)}
                    </Text>
                    <span className="omni-chat-online-dot" />
                  </div>
                  <Space size={8}>
                    <Select
                      size="small"
                      value={contextState?.status || 'in_progress'}
                      disabled={activeConversation.isLegacy || contextSaving}
                      className="omni-chat-chip-select omni-chat-chip-select--status"
                      options={statusSelectOptions}
                      optionLabelProp="label"
                      onChange={(value) => patchConversationContext({ status: value })}
                    />
                    <Select
                      size="small"
                      value={threadPriority}
                      className="omni-chat-chip-select omni-chat-chip-select--priority"
                      options={prioritySelectOptions}
                      optionLabelProp="label"
                      onChange={setThreadPriority}
                    />
                    <Button className="omni-chat-menu-btn" icon={<EllipsisOutlined />} />
                  </Space>
                </div>

                <div className="omni-chat-thread-canvas">
                  {activeConversation.messages.map((item) => {
                    const inbound = item.direction === 'in';
                    const inboundInitial = String(activeConversation.participantContact?.name || 'C')
                      .trim()
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <div
                        key={item.id}
                        className={`omni-chat-message-row ${inbound ? 'inbound' : 'outbound'}`}
                      >
                        <Avatar
                          size={30}
                          className={`omni-chat-message-avatar ${inbound ? 'inbound' : 'outbound'}`}
                          icon={
                            inbound ? null : (
                              <ChannelBrandIcon channel={activeConversation.channelType || 'chat'} size={14} />
                            )
                          }
                        >
                          {inbound ? inboundInitial : null}
                        </Avatar>
                        <div className="omni-chat-message-content">
                          <div className={`omni-chat-message-bubble ${inbound ? 'inbound' : 'outbound'}`}>
                            {item.text || 'Без текста'}
                          </div>
                          <span className="omni-chat-message-time">
                            {formatRelativeChatTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="omni-chat-composer-wrap">
                  {sendRestriction?.template_required && (
                    <Alert
                      type="warning"
                      showIcon
                      message="Доступна только шаблонная отправка WhatsApp"
                      description={
                        <Space direction="vertical" size={6}>
                          <Text>
                            {sendRestriction?.last_inbound_at
                              ? `С последнего входящего прошло ${sendRestriction?.hours_since_inbound || 0} ч. Обычный ответ заблокирован policy WhatsApp 24h.`
                              : 'Нет подтверждённого входящего сообщения в 24h окне. Обычный ответ заблокирован policy WhatsApp.'}
                          </Text>
                          <Button size="small" onClick={() => setTemplateModalOpen(true)}>
                            Отправить шаблон
                          </Button>
                        </Space>
                      }
                    />
                  )}
                  {hasOutboundAdapter ? (
                    <div className="omni-chat-composer-box">
                      <TextArea
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Type your message here"
                        maxLength={2000}
                        disabled={
                          activeConversationCompliance.restricted ||
                          Boolean(sendRestriction?.template_required)
                        }
                        className="omni-chat-composer-input"
                      />
                      <div className="omni-chat-composer-footer">
                        <Space size={2}>
                          <Button type="text" icon={<PaperClipOutlined />} />
                          <Button type="text" icon={<PictureOutlined />} />
                          <Button type="text" icon={<InboxOutlined />} />
                          <Button type="text" icon={<ReloadOutlined />} />
                          <Button type="text" icon={<SmileOutlined />} />
                        </Space>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={sending}
                          disabled={
                            activeConversationCompliance.restricted ||
                            Boolean(sendRestriction?.template_required) ||
                            !draft.trim()
                          }
                          onClick={handleSend}
                          className="omni-chat-send-button"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      message="Composer пока недоступен"
                      description={
                        activeConversation?.isLegacy
                          ? 'Для legacy CRM Chat отправка выполняется из карточек сущностей. В unified inbox доступен только просмотр.'
                          : 'Для этого канала в текущем API нет прямого outbound adapter через unified inbox.'
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </Content>

          {!isMobile && hasConversationSelection && (
            <Sider width={290} theme={theme === 'dark' ? 'dark' : 'light'} className="omni-chat-right-col">
              {activeConversation ? (
                <>
                  <div className="omni-chat-profile">
                    <div className="omni-chat-right-head">
                      <Title level={5} style={{ margin: 0 }}>
                        Profile
                      </Title>
                      <Button
                        type="link"
                        size="small"
                        disabled={!activeConversation.participantContact?.id}
                        onClick={() =>
                          activeConversation.participantContact?.id &&
                          navigate(`/contacts/${activeConversation.participantContact.id}`)
                        }
                      >
                        View details
                      </Button>
                    </div>
                    <Avatar size={92} className="omni-chat-profile-avatar">
                      {String(activeConversation.participantContact?.name || 'C')
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    <Text strong className="omni-chat-profile-name">
                      {activeConversation.participantContact?.name ||
                        activeConversation.participantId ||
                        'Unknown contact'}
                    </Text>
                    <Text className="omni-chat-profile-role">
                      {activeConversation.participantContact?.secondary ||
                        channelMeta(activeConversation.channelType).label}
                    </Text>
                  </div>

                  <div className="omni-chat-tasks">
                    <div className="omni-chat-right-head">
                      <Text strong className="omni-chat-task-title">
                        Tasks <span className="omni-chat-task-count">{sidebarTasksForUi.length}</span>
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        disabled={activeConversation.isLegacy}
                        onClick={() => runQuickAction('create_task')}
                      >
                        Add task
                      </Button>
                    </div>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {sidebarTasksForUi.map((task) => (
                        <div key={task.key} className="omni-chat-task-item">
                          <Checkbox
                            checked={checkedTaskKeys.includes(task.key)}
                            onChange={(event) =>
                              setCheckedTaskKeys((prev) =>
                                event.target.checked
                                  ? [...new Set([...prev, task.key])]
                                  : prev.filter((value) => value !== task.key)
                              )
                            }
                          >
                            <Text delete={checkedTaskKeys.includes(task.key)} ellipsis>
                              {task.label}
                            </Text>
                          </Checkbox>
                          <span className="omni-chat-task-date">{formatTaskDueDate(task.dueAt)}</span>
                        </div>
                      ))}
                    </Space>
                  </div>
                </>
              ) : (
                <div className="omni-chat-right-empty">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Контакт не выбран" />
                </div>
              )}
            </Sider>
          )}
        </Layout>
      </Card>
    </div>
  );

  const dispatchLayout = (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card
        variant="borderless"
        style={{ background: bg, border: `1px solid ${border}` }}
        styles={{ body: { padding: '14px 16px' } }}
      >
        <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
          <Space direction="vertical" size={2}>
            <Title level={4} style={{ margin: 0 }}>
              Outbound / Broadcast
            </Title>
            <Text type="secondary">Единый composer для исходящих сообщений по всем каналам.</Text>
          </Space>
          <Space>
            <Button
              icon={<InboxOutlined />}
              onClick={() => setActiveWorkspaceTab('inbox')}
              disabled={initialWorkspaceTab === 'dispatch'}
            >
              Open inbox
            </Button>
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadInbox({ silent: true })}>
              Refresh
            </Button>
          </Space>
        </Flex>
      </Card>
      <Card variant="borderless" style={{ background: bg, border: `1px solid ${border}` }}>
        <CommunicationsHub defaultTab={defaultDispatchTab} allowedTabs={DISPATCH_TABS} />
      </Card>
    </Space>
  );

  return (
    <>
      {activeWorkspaceTab === 'dispatch' ? dispatchLayout : inboxLayout}
      <Modal
        title="Отправка WhatsApp шаблона"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        onOk={() => templateForm.submit()}
        confirmLoading={templateSending}
        okText="Отправить шаблон"
      >
        <Form
          form={templateForm}
          layout="vertical"
          initialValues={{ language_code: 'ru', template_params: '' }}
          onFinish={handleSendTemplate}
        >
          <Form.Item
            label="Template name"
            name="template_name"
            extra="Можно выбрать из списка Meta или ввести точное имя шаблона вручную."
            rules={[{ required: true, message: 'Укажите имя approved template' }]}
          >
            <AutoComplete
              showSearch
              placeholder="Выберите шаблон или введите вручную"
              options={templateOptions.map((row) => ({
                value: row.name,
                label: `${row.name} (${row.language || 'n/a'}, ${row.status || 'unknown'})`,
                language: row.language || '',
              }))}
              notFoundContent={templateLoading ? 'Загрузка шаблонов...' : 'Шаблоны не найдены'}
              filterOption={(inputValue, option) =>
                String(option?.value || '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase()) ||
                String(option?.label || '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              onSelect={(value) => {
                const selected = templateOptions.find((row) => row.name === value);
                if (selected?.language) {
                  templateForm.setFieldsValue({ language_code: selected.language });
                }
              }}
            />
          </Form.Item>
          <Form.Item label="Language code" name="language_code">
            <Input placeholder="ru / en_US / ... " />
          </Form.Item>
          <Form.Item
            label="Параметры body"
            name="template_params"
            extra="Если шаблон содержит переменные, укажите значения через запятую в том же порядке."
          >
            <Input placeholder="Например: Али, заказ #1024" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ChatPage;
