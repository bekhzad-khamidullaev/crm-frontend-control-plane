/**
 * ChatWidget Component
 * Real-time chat widget for entity pages (contacts, leads, deals, companies)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Empty,
  List,
  Modal,
  Spin,
  Space,
  Tabs,
  Typography,
  Button,
  Input,
  Tag,
  theme as antdTheme,
  message as antMessage,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  getEntityChatMessages,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  getMessageThread,
  getMessageReplies,
} from '../../lib/api/chat.js';
import { getOmnichannelTimeline, sendOmnichannelMessage } from '../../lib/api/compliance.js';
import chatWebSocket from '../../lib/websocket/ChatWebSocket.js';
import {
  addChatMessage,
  updateChatMessage as updateStoreMessage,
  deleteChatMessage as deleteStoreMessage,
} from '../../lib/store/index.js';
import ChatMessageItem from '../../components/ChatMessageItem.jsx';
import ChatMessageComposer from '../../components/ChatMessageComposer.jsx';
import CallButton from '../../components/CallButton.jsx';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';
import { getUserFromToken } from '../../lib/api/auth.js';

const { Text } = Typography;

const EXTERNAL_PENDING_STATES = new Set([
  'waiting',
  'queued',
  'pending',
  'accepted',
  'in_progress',
  'processing',
]);

const EXTERNAL_SUCCESS_STATES = new Set(['resolved', 'sent', 'delivered']);

const formatRelativeTimestamp = (value) => {
  const ts = toTs(value);
  if (!ts) return '';
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'только что';
  if (diff < hour) return `${Math.round(diff / minute)} мин назад`;
  if (diff < day) return `${Math.round(diff / hour)} ч назад`;
  return `${Math.round(diff / day)} дн назад`;
};

const formatDurationCompact = (from, to) => {
  const start = toTs(from);
  const end = toTs(to);
  if (!start || !end || end <= start) return '';
  const diff = end - start;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} мин`;
  const hours = Math.floor(diff / hour);
  const minutes = Math.round((diff % hour) / minute);
  if (!minutes) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
};

const getExternalChannelLabel = (channel, sourceLabel) => {
  if (sourceLabel) return sourceLabel;
  if (channel === 'wa' || channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'ig' || channel === 'instagram') return 'Instagram';
  if (channel === 'tg' || channel === 'telegram') return 'Telegram';
  if (channel === 'sms') return 'SMS';
  if (channel === 'email') return 'Email';
  if (channel === 'web') return 'Web';
  return channel || 'Внешний канал';
};

const getNormalizedDeliveryState = (message) => {
  const queueState = String(message?.queue_state || '').trim().toLowerCase();
  if (queueState) return queueState;
  const status = String(message?.status || '').trim().toLowerCase();
  if (status.includes('fail') || status.includes('error')) return 'failed';
  if (status.includes('deliver')) return 'delivered';
  if (status.includes('sent') || status.includes('resolve')) return 'resolved';
  if (
    status.includes('queue') ||
    status.includes('wait') ||
    status.includes('pend') ||
    status.includes('accept')
  ) {
    return 'queued';
  }
  return '';
};

const buildExternalConversationSummary = (
  messages,
  externalChannel,
  externalSourceLabel,
  externalQueueState,
  externalStatus,
  externalRespondedAt
) => {
  const externalMessages = (messages || []).filter((item) => item?.isExternal);
  if (externalMessages.length === 0) return null;

  const latestMessage = [...externalMessages].sort(
    (a, b) => toTs(b.creation_date || b.created_at) - toTs(a.creation_date || a.created_at)
  )[0];
  const outboundMessages = externalMessages.filter((item) => item.direction === 'out');
  const inboundMessages = externalMessages.filter((item) => item.direction === 'in');
  const latestInbound = [...inboundMessages].sort(
    (a, b) => toTs(b.creation_date || b.created_at) - toTs(a.creation_date || a.created_at)
  )[0];
  const latestRespondedAt =
    externalMessages
      .map((item) => item.responded_at)
      .filter(Boolean)
      .sort((a, b) => toTs(b) - toTs(a))[0] || externalRespondedAt;

  const pendingCount = outboundMessages.filter((item) =>
    EXTERNAL_PENDING_STATES.has(getNormalizedDeliveryState(item))
  ).length;
  const failedCount = outboundMessages.filter(
    (item) => getNormalizedDeliveryState(item) === 'failed'
  ).length;
  const latestOutbound = [...outboundMessages].sort(
    (a, b) => toTs(b.creation_date || b.created_at) - toTs(a.creation_date || a.created_at)
  )[0];
  const latestOutboundState =
    getNormalizedDeliveryState(latestOutbound) ||
    getNormalizedDeliveryState({ queue_state: externalQueueState, status: externalStatus });

  const chips = [
    {
      key: 'channel',
      color: 'default',
      label: getExternalChannelLabel(externalChannel, externalSourceLabel),
    },
  ];

  if (failedCount > 0) {
    chips.push({
      key: 'delivery',
      color: 'error',
      label: failedCount > 1 ? `Ошибки доставки: ${failedCount}` : 'Ошибка доставки',
    });
  } else if (pendingCount > 0) {
    chips.push({
      key: 'delivery',
      color: 'processing',
      label: pendingCount > 1 ? `В очереди: ${pendingCount}` : 'В очереди',
    });
  } else if (latestOutbound && EXTERNAL_SUCCESS_STATES.has(latestOutboundState)) {
    chips.push({
      key: 'delivery',
      color: 'success',
      label: latestOutboundState === 'delivered' ? 'Доставлено' : 'Отправлено',
    });
  }

  let note = '';
  if (latestInbound && latestRespondedAt && toTs(latestRespondedAt) >= toTs(latestInbound.creation_date || latestInbound.created_at)) {
    const responseDuration = formatDurationCompact(
      latestInbound.creation_date || latestInbound.created_at,
      latestRespondedAt
    );
    if (responseDuration) {
      chips.push({
        key: 'response',
        color: 'success',
        label: `Ответ за ${responseDuration}`,
      });
    }
    note = `Последний ответ подтвержден ${formatRelativeTimestamp(latestRespondedAt)}`;
  } else if (latestMessage?.direction === 'in') {
    chips.push({
      key: 'response',
      color: 'warning',
      label: `Ждет ответа ${formatRelativeTimestamp(latestMessage.creation_date || latestMessage.created_at)}`,
    });
    note = 'Последнее сообщение пришло от клиента и еще не закрыто ответом';
  } else if (latestRespondedAt) {
    note = `Ответ в канале отмечен ${formatRelativeTimestamp(latestRespondedAt)}`;
  }

  return { chips, note };
};
const toTs = (value) => {
  const ts = value ? new Date(value).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
};

const dedupeAndSortMessages = (items = []) => {
  const byId = new Map();
  items.forEach((item) => {
    const key = item?.id;
    if (key === undefined || key === null) return;
    const prev = byId.get(key);
    if (!prev) {
      byId.set(key, item);
      return;
    }

    const prevTs = toTs(prev.updated_at || prev.creation_date || prev.created_at);
    const nextTs = toTs(item.updated_at || item.creation_date || item.created_at);
    byId.set(key, nextTs >= prevTs ? { ...prev, ...item } : { ...item, ...prev });
  });

  return Array.from(byId.values()).sort(
    (a, b) => toTs(a.creation_date || a.created_at) - toTs(b.creation_date || b.created_at)
  );
};

const upsertMessage = (prevMessages, incomingMessage) => {
  if (!incomingMessage?.id) return prevMessages;
  const index = prevMessages.findIndex((msg) => msg.id === incomingMessage.id);
  if (index === -1) {
    return dedupeAndSortMessages([...prevMessages, incomingMessage]);
  }
  const next = [...prevMessages];
  next[index] = { ...next[index], ...incomingMessage };
  return dedupeAndSortMessages(next);
};

function ChatWidget({
  entityType,
  entityId,
  entityName,
  entityPhone,
  subjectContentType = null,
  externalChannel = null,
  externalChannelId = null,
  externalLastDirection = null,
  externalSenderId = null,
  externalRecipientId = null,
  externalSourceLabel = null,
  externalQueueState = null,
  externalStatus = null,
  externalRespondedAt = null,
}) {
  const { token } = antdTheme.useToken();
  const isExternalConversation = Boolean(externalChannel);
  const backendExternalChannel = (() => {
    if (externalChannel === 'wa') return 'whatsapp';
    if (externalChannel === 'tg') return 'telegram';
    if (externalChannel === 'ig') return 'instagram';
    return externalChannel;
  })();
  const externalTarget =
    externalLastDirection === 'in'
      ? externalSenderId || externalRecipientId || entityPhone
      : externalRecipientId || externalSenderId || entityPhone;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contentTypeId, setContentTypeId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [threadModal, setThreadModal] = useState({
    open: false,
    loading: false,
    message: null,
    replies: [],
    thread: [],
  });
  const [threadTab, setThreadTab] = useState('replies');
  const messagesEndRef = useRef(null);
  const currentUserId = getUserFromToken()?.id;
  const hasMessages = messages.length > 0;
  const externalSummary = useMemo(
    () =>
      isExternalConversation
        ? buildExternalConversationSummary(
            messages,
            externalChannel,
            externalSourceLabel,
            externalQueueState,
            externalStatus,
            externalRespondedAt
          )
        : null,
    [
      messages,
      isExternalConversation,
      externalChannel,
      externalSourceLabel,
      externalQueueState,
      externalStatus,
      externalRespondedAt,
    ]
  );

  useEffect(() => {
    loadMessages();

    // Setup WebSocket listeners
    const handleNewMessage = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        const newMessage = {
          id: data.id,
          content: data.message,
          owner: data.sender?.id,
          owner_name: data.sender?.name,
          creation_date: data.timestamp,
          answer_to: data.parentId || null,
          content_type: data.entityType,
          object_id: data.entityId,
        };

        setMessages((prev) => upsertMessage(prev, newMessage));
        addChatMessage(newMessage);
        scrollToBottom();
      }
    };

    const handleMessageUpdated = (data) => {
      const updates = {
        content: data.message ?? data.content,
        is_read: data.isRead ?? data.is_read,
        updated_at: data.updatedAt ?? data.updated_at,
      };
      setMessages((prev) => prev.map((msg) => (msg.id === data.id ? { ...msg, ...updates } : msg)));
      updateStoreMessage(data.id, updates);
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
      deleteStoreMessage(data.id);
    };

    const handleTypingStarted = (data) => {
      if (
        data.entityType === entityType &&
        data.entityId === entityId &&
        data.userId !== currentUserId
      ) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleTypingStopped = (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    chatWebSocket.on('newMessage', handleNewMessage);
    chatWebSocket.on('messageUpdated', handleMessageUpdated);
    chatWebSocket.on('messageDeleted', handleMessageDeleted);
    chatWebSocket.on('typingStarted', handleTypingStarted);
    chatWebSocket.on('typingStopped', handleTypingStopped);

    return () => {
      chatWebSocket.off('newMessage', handleNewMessage);
      chatWebSocket.off('messageUpdated', handleMessageUpdated);
      chatWebSocket.off('messageDeleted', handleMessageDeleted);
      chatWebSocket.off('typingStarted', handleTypingStarted);
      chatWebSocket.off('typingStopped', handleTypingStopped);
    };
  }, [
    entityType,
    entityId,
    subjectContentType,
    externalChannel,
    externalChannelId,
    externalLastDirection,
    externalSenderId,
    externalRecipientId,
  ]);

  const mapExternalMessage = (msg) => ({
    id: `external-${msg.id}`,
    externalId: msg.id,
    content: msg.text || '',
    owner_name: msg.direction === 'out' ? 'Вы' : externalSourceLabel || 'Клиент',
    creation_date: msg.created_at,
    created_at: msg.created_at,
    direction: msg.direction,
    sender_id: msg.sender_id,
    recipient_id: msg.recipient_id,
    channel_id: msg.channel,
    status: msg.status || '',
    queue_state: msg.queue_state || '',
    responded_at: msg.responded_at || null,
    raw: msg.raw || {},
    isExternal: true,
  });

  const loadMessages = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      if (isExternalConversation && subjectContentType && entityId) {
        const response = await getOmnichannelTimeline({
          subject_content_type: subjectContentType,
          subject_object_id: entityId,
          limit: 100,
        });
        const rows = response?.results || response || [];
        const normalizedRows = rows.filter((row) => {
          if (externalChannelId && Number(row.channel) !== Number(externalChannelId)) return false;
          if (externalSenderId || externalRecipientId) {
            return (
              [row.sender_id, row.recipient_id].some(
                (value) =>
                  String(value || '') === String(externalSenderId || externalRecipientId || '')
              ) ||
              [row.sender_id, row.recipient_id].some(
                (value) =>
                  String(value || '') === String(externalRecipientId || externalSenderId || '')
              )
            );
          }
          return true;
        });
        setMessages(dedupeAndSortMessages(normalizedRows.map(mapExternalMessage)));
        scrollToBottom();
        return;
      }

      const response = await getEntityChatMessages(entityType, entityId, { page_size: 50 });
      const msgs = response?.results || [];
      setMessages(dedupeAndSortMessages(msgs));

      const detectedContentType = msgs.find((msg) => msg.content_type)?.content_type;
      if (detectedContentType) {
        setContentTypeId(detectedContentType);
      }

      scrollToBottom();
    } catch (error) {
      setMessages([]);
      setLoadError(true);
      antMessage.error('Не удалось загрузить сообщения');
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openThreadModal = async (message) => {
    setThreadModal({
      open: true,
      loading: true,
      message,
      replies: [],
      thread: [],
    });
    setThreadTab('replies');
    try {
      const [repliesResponse, threadResponse] = await Promise.all([
        getMessageReplies(message.id, { page_size: 50, ordering: 'creation_date' }),
        getMessageThread(message.id),
      ]);
      const replies = repliesResponse?.results || repliesResponse || [];
      const thread = threadResponse?.results || threadResponse || [];
      setThreadModal({
        open: true,
        loading: false,
        message,
        replies,
        thread,
      });
    } catch (error) {
      console.error('Error loading thread:', error);
      setThreadModal({
        open: true,
        loading: false,
        message,
        replies: [],
        thread: [],
      });
    }
  };

  const closeThreadModal = () => {
    setThreadModal({
      open: false,
      loading: false,
      message: null,
      replies: [],
      thread: [],
    });
    setThreadTab('replies');
  };

  const renderThreadList = (items) => {
    if (!items || items.length === 0) {
      return (
        <Empty description="В этой ветке пока нет сообщений" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      );
    }

    return (
      <List
        dataSource={items}
        itemLayout="horizontal"
        renderItem={(msg) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space size={8} wrap>
                  <Text strong>{msg.owner_name || msg.sender?.name || '-'}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {msg.creation_date || msg.created_at
                      ? new Date(msg.creation_date || msg.created_at).toLocaleString('ru-RU')
                      : ''}
                  </Text>
                </Space>
              }
              description={
                <div style={{ whiteSpace: 'pre-wrap', color: token.colorTextSecondary }}>
                  {msg.content}
                </div>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const resolveContentType = () => {
    if (typeof entityType === 'number') return entityType;
    if (typeof entityType === 'string' && /^\d+$/.test(entityType)) return Number(entityType);
    return contentTypeId || entityType;
  };

  const handleSend = async (messageData) => {
    if (sendingMessage) return;
    setSendingMessage(true);
    try {
      if (isExternalConversation) {
        const payload = {
          channel: backendExternalChannel,
          channel_id: externalChannelId,
          text: messageData.content,
        };

        if (backendExternalChannel === 'sms' || backendExternalChannel === 'whatsapp') {
          payload.to = externalTarget;
        }
        if (backendExternalChannel === 'telegram') {
          payload.chat_id = externalTarget;
          payload.recipient_id = externalTarget;
        }
        if (backendExternalChannel === 'instagram') {
          payload.recipient_id = externalTarget;
        }

        const sendResponse = await sendOmnichannelMessage(payload);
        const responseStatus = String(sendResponse?.status || '').trim().toLowerCase();
        const responseQueueState = String(sendResponse?.details?.queue_state || '')
          .trim()
          .toLowerCase();

        const outbound = {
          id: `external-local-${Date.now()}`,
          content: messageData.content,
          owner_name: 'Вы',
          creation_date: new Date().toISOString(),
          direction: 'out',
          isExternal: true,
          sender_id: externalSenderId,
          recipient_id: externalRecipientId,
          channel_id: externalChannelId,
          status: sendResponse?.status || 'accepted',
          queue_state:
            sendResponse?.details?.queue_state ||
            (responseQueueState
              ? responseQueueState
              : responseStatus === 'ok'
                ? 'resolved'
                : responseStatus === 'accepted'
                  ? 'waiting'
                  : ''),
          responded_at: sendResponse?.details?.responded_at || null,
          raw: sendResponse?.details || {},
        };

        setMessages((prev) => upsertMessage(prev, outbound));
        setReplyTo(null);
        scrollToBottom();
        antMessage.success('Сообщение отправлено');
        return;
      }

      const resolvedContentType = resolveContentType();
      if (!resolvedContentType || !entityId) {
        antMessage.error('Не удалось определить тип сущности для чата');
        return;
      }

      const payload = {
        content: messageData.content,
        content_type: resolvedContentType,
        object_id: Number(entityId),
        answer_to: messageData.answer_to || null,
      };

      const response = await createChatMessage(payload);

      const newMessage = {
        ...response,
        content: response.content ?? messageData.content,
        creation_date: response.creation_date || new Date().toISOString(),
        owner: response.owner ?? currentUserId,
        owner_name: response.owner_name || 'Вы',
        content_type: response.content_type ?? resolvedContentType,
        object_id: response.object_id ?? Number(entityId),
        answer_to: response.answer_to ?? messageData.answer_to ?? null,
        parent: messageData.answer_to ? messages.find((m) => m.id === messageData.answer_to) : null,
      };

      setMessages((prev) => upsertMessage(prev, newMessage));
      addChatMessage(newMessage);
      setReplyTo(null);
      scrollToBottom();

      antMessage.success('Сообщение отправлено');
    } catch (error) {
      console.error('Error sending message:', error);
      antMessage.error('Ошибка отправки сообщения');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setEditValue(message.content || '');
  };

  const handleDelete = async (message) => {
    try {
      await deleteChatMessage(message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      deleteStoreMessage(message.id);
      antMessage.success('Сообщение удалено');
    } catch (error) {
      console.error('Error deleting message:', error);
      antMessage.error('Ошибка удаления сообщения');
    }
  };

  const handleTyping = (isTyping) => {
    chatWebSocket.sendTypingIndicator(entityType, entityId, isTyping);
  };

  return (
    <Card
      style={{
        height: 620,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: token.boxShadowSecondary,
      }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      title={
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Space align="center" wrap>
            <ChannelBrandIcon channel="omnichannel" size={16} />
            <span>Сообщения</span>
            {entityPhone && (
              <CallButton
                phone={entityPhone}
                name={entityName}
                entityType={entityType}
                entityId={entityId}
                size="small"
                type="link"
              />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {entityName
              ? `История общения по "${entityName}"`
              : 'История общения по текущей сущности'}
          </Text>
          {externalSummary?.chips?.length > 0 && (
            <Space size={[6, 6]} wrap style={{ marginTop: 6 }}>
              {externalSummary.chips.map((chip) => (
                <Tag
                  key={chip.key}
                  color={chip.color}
                  style={{
                    marginInlineEnd: 0,
                    borderRadius: 999,
                    paddingInline: 10,
                    fontWeight: 700,
                  }}
                >
                  {chip.label}
                </Tag>
              ))}
            </Space>
          )}
          {externalSummary?.note && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {externalSummary.note}
            </Text>
          )}
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={loadMessages}
          loading={loading}
        />
      }
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          background: `linear-gradient(180deg, ${token.colorBgElevated} 0%, ${token.colorBgContainer} 100%)`,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Space direction="vertical" size={14}>
              <Spin />
              <Text type="secondary" style={{ color: token.colorTextSecondary, fontWeight: 600 }}>
                Загружаем сообщения чата…
              </Text>
            </Space>
          </div>
        ) : loadError ? (
          <Empty
            description="Не удалось загрузить сообщения"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ color: token.colorTextSecondary }}
          >
            <Button icon={<ReloadOutlined />} onClick={loadMessages}>
              Повторить
            </Button>
          </Empty>
        ) : !hasMessages ? (
          <Empty
            description={entityName ? `Для ${entityName} пока нет сообщений` : 'Пока нет сообщений'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ color: token.colorTextSecondary }}
          >
            <Text type="secondary" style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
              Начните диалог, чтобы история общения появилась здесь.
            </Text>
          </Empty>
        ) : (
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={
                  msg.direction === 'out' ||
                  msg.owner === currentUserId ||
                  msg.sender?.id === currentUserId
                }
                onReply={isExternalConversation ? undefined : handleReply}
                onViewThread={isExternalConversation ? undefined : openThreadModal}
                onEdit={isExternalConversation ? undefined : handleEdit}
                onDelete={isExternalConversation ? undefined : handleDelete}
              />
            ))}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  color: token.colorTextSecondary,
                  fontSize: 12,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 999,
                  display: 'inline-flex',
                  padding: '6px 12px',
                  fontWeight: 600,
                }}
              >
                <Space size={4}>
                  <span>{typingUsers.map((u) => u.userName).join(', ')}</span>
                  <span>печатает...</span>
                </Space>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message composer */}
      <ChatMessageComposer
        onSend={handleSend}
        onTyping={isExternalConversation ? undefined : handleTyping}
        sending={sendingMessage}
        entityType={entityType}
        entityId={entityId}
        replyTo={isExternalConversation ? null : replyTo}
        onCancelReply={isExternalConversation ? undefined : () => setReplyTo(null)}
        placeholder={
          isExternalConversation
            ? `Сообщение будет отправлено через ${externalSourceLabel || externalChannel}`
            : 'Напишите сообщение...'
        }
      />

      <Modal
        title="Редактировать сообщение"
        open={!!editingMessage}
        onCancel={() => {
          setEditingMessage(null);
          setEditValue('');
        }}
        onOk={async () => {
          if (!editingMessage) return;
          const nextValue = editValue.trim();
          if (!nextValue) {
            antMessage.warning('Сообщение не может быть пустым');
            return;
          }
          setEditSaving(true);
          try {
            const updated = await updateChatMessage(editingMessage.id, { content: nextValue });
            const updatedMessage = {
              ...editingMessage,
              ...updated,
              content: updated.content ?? nextValue,
            };
            setMessages((prev) =>
              prev.map((msg) => (msg.id === editingMessage.id ? updatedMessage : msg))
            );
            updateStoreMessage(editingMessage.id, updatedMessage);
            antMessage.success('Сообщение обновлено');
            setEditingMessage(null);
            setEditValue('');
          } catch (error) {
            console.error('Error updating message:', error);
            antMessage.error('Ошибка редактирования сообщения');
          } finally {
            setEditSaving(false);
          }
        }}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={editSaving}
      >
        <Input.TextArea
          rows={4}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
        />
      </Modal>

      <Modal
        title="Тред сообщения"
        open={threadModal.open}
        onCancel={closeThreadModal}
        footer={null}
        width={720}
      >
        {threadModal.loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Space direction="vertical" size={12}>
              <Spin />
              <Text type="secondary">Загружаем ветку обсуждения...</Text>
            </Space>
          </div>
        ) : (
          <Tabs
            activeKey={threadTab}
            onChange={setThreadTab}
            items={[
              {
                key: 'replies',
                label: `Ответы (${threadModal.replies.length})`,
                children: renderThreadList(threadModal.replies),
              },
              {
                key: 'thread',
                label: `Тред (${threadModal.thread.length})`,
                children: renderThreadList(threadModal.thread),
              },
            ]}
          />
        )}
      </Modal>
    </Card>
  );
}

export default ChatWidget;
