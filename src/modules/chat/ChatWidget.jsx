/**
 * ChatWidget Component
 * Real-time chat widget for entity pages (contacts, leads, deals, companies)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Spin,
  Empty,
  Space,
  List,
  Typography,
  Tag,
  message as antMessage,
  Button,
  Modal,
  Input,
  Tabs,
} from 'antd';
import {
  MessageOutlined,
  PhoneOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  getEntityChatMessages,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  getMessageThread,
  getMessageReplies,
} from '../../lib/api/chat.js';
import chatWebSocket from '../../lib/websocket/ChatWebSocket.js';
import { subscribe, addChatMessage, updateChatMessage as updateStoreMessage, deleteChatMessage as deleteStoreMessage } from '../../lib/store/index.js';
import ChatMessageItem from '../../components/ChatMessageItem.jsx';
import ChatMessageComposer from '../../components/ChatMessageComposer.jsx';
import CallButton from '../../components/CallButton.jsx';
import { getUserFromToken } from '../../lib/api/auth.js';
import { useTheme } from '../../lib/hooks/useTheme.js';

const { Text } = Typography;

function ChatWidget({ entityType, entityId, entityName, entityPhone }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
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

        setMessages((prev) => [...prev, newMessage]);
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
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleTypingStopped = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
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
  }, [entityType, entityId]);

  const loadMessages = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getEntityChatMessages(entityType, entityId, { page_size: 50 });
      const msgs = response?.results || [];
      setMessages(msgs);

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
        <Empty
          description="В этой ветке пока нет сообщений"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <List
        dataSource={items}
        renderItem={(msg) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{msg.owner_name || msg.sender?.name || '-'}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {msg.creation_date || msg.created_at
                      ? new Date(msg.creation_date || msg.created_at).toLocaleString('ru-RU')
                      : ''}
                  </Text>
                </Space>
              }
              description={<div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>}
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
    try {
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

      setMessages((prev) => [...prev, newMessage]);
      addChatMessage(newMessage);
      setReplyTo(null);
      scrollToBottom();
      
      antMessage.success('Сообщение отправлено');
    } catch (error) {
      console.error('Error sending message:', error);
      antMessage.error('Ошибка отправки сообщения');
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
      setMessages(prev => prev.filter(m => m.id !== message.id));
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
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        overflow: 'hidden',
      }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      title={
        <Space direction="vertical" size={2}>
          <Space>
            <MessageOutlined />
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
          <Text type="secondary">
            {entityName ? `История общения по "${entityName}"` : 'История общения по текущей сущности'}
          </Text>
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
          background: isDark
            ? 'linear-gradient(180deg, rgba(17,21,28,0.95) 0%, rgba(22,27,34,1) 100%)'
            : 'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,1) 100%)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Space direction="vertical" size={12}>
              <Spin />
              <Text type="secondary">Загружаем сообщения чата...</Text>
            </Space>
          </div>
        ) : loadError ? (
          <Empty
            description="Не удалось загрузить сообщения"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button icon={<ReloadOutlined />} onClick={loadMessages}>
              Повторить
            </Button>
          </Empty>
        ) : messages.length === 0 ? (
          <Empty
            description={entityName ? `Для ${entityName} пока нет сообщений` : 'Пока нет сообщений'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">Начните диалог, чтобы история общения появилась здесь.</Text>
          </Empty>
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={msg.owner === currentUserId || msg.sender?.id === currentUserId}
                onReply={handleReply}
                onViewThread={openThreadModal}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  color: isDark ? '#cbd5e1' : '#64748b',
                  fontSize: 12,
                  background: isDark ? '#1e232e' : '#f8fafc',
                  border: `1px solid ${isDark ? '#2d3343' : '#e2e8f0'}`,
                  borderRadius: 999,
                  display: 'inline-flex',
                  padding: '6px 10px',
                }}
              >
                <Space size={4}>
                  <span>{typingUsers.map(u => u.userName).join(', ')}</span>
                  <span>печатает...</span>
                </Space>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message composer */}
      <ChatMessageComposer
        onSend={handleSend}
        onTyping={handleTyping}
        entityType={entityType}
        entityId={entityId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
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
          <div style={{ textAlign: 'center', padding: 24 }}>
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
