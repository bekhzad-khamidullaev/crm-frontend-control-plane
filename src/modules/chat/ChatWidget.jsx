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
  Typography,
  Tag,
  message as antMessage,
  Button,
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
  markMessagesAsRead,
} from '../../lib/api/chat.js';
import chatWebSocket from '../../lib/websocket/ChatWebSocket.js';
import { subscribe, addChatMessage, updateChatMessage as updateStoreMessage, deleteChatMessage as deleteStoreMessage } from '../../lib/store/index.js';
import ChatMessageItem from '../../components/ChatMessageItem.jsx';
import ChatMessageComposer from '../../components/ChatMessageComposer.jsx';
import CallButton from '../../components/CallButton.jsx';

const { Title, Text } = Typography;

function ChatWidget({ entityType, entityId, entityName, entityPhone }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const currentUserId = 1; // TODO: Get from auth context

  useEffect(() => {
    loadMessages();
    
    // Setup WebSocket listeners
    const handleNewMessage = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        const newMessage = {
          id: data.id,
          message: data.message,
          sender: data.sender,
          created_at: data.timestamp,
          is_read: false,
          attachments: data.attachments || [],
          parent: data.parentId,
        };
        
        setMessages(prev => [...prev, newMessage]);
        addChatMessage(newMessage);
        scrollToBottom();
        
        // Mark as read if not from current user
        if (data.sender?.id !== currentUserId) {
          markMessagesAsRead([data.id]).catch(console.error);
        }
      }
    };

    const handleMessageUpdated = (data) => {
      setMessages(prev =>
        prev.map(msg => (msg.id === data.id ? { ...msg, ...data } : msg))
      );
      updateStoreMessage(data.id, data);
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.id));
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
    try {
      const response = await getEntityChatMessages(entityType, entityId, {
        page_size: 50,
      });
      
      const msgs = response.data.results || [];
      setMessages(msgs);
      
      // Mark unread messages as read
      const unreadIds = msgs.filter(m => !m.is_read && m.sender?.id !== currentUserId).map(m => m.id);
      if (unreadIds.length > 0) {
        markMessagesAsRead(unreadIds).catch(console.error);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // Mock data for demo
      setMessages([
        {
          id: 1,
          message: 'Здравствуйте! Интересует ваше предложение.',
          sender: { id: 2, name: entityName, avatar: null },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_read: true,
          attachments: [],
        },
        {
          id: 2,
          message: 'Добрый день! С удовольствием расскажу подробнее.',
          sender: { id: currentUserId, name: 'Вы', avatar: null },
          created_at: new Date(Date.now() - 3000000).toISOString(),
          is_read: true,
          attachments: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (messageData) => {
    try {
      const payload = {
        message: messageData.message,
        content_type: entityType,
        object_id: entityId,
        parent: messageData.parent,
        // attachments will be handled separately
      };

      const response = await createChatMessage(payload);
      
      const newMessage = {
        id: response.data.id,
        message: messageData.message,
        sender: { id: currentUserId, name: 'Вы' },
        created_at: new Date().toISOString(),
        is_read: false,
        attachments: [],
        parent: messageData.parent ? messages.find(m => m.id === messageData.parent) : null,
      };

      setMessages(prev => [...prev, newMessage]);
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

  const handleEdit = async (message) => {
    // TODO: Implement edit functionality
    antMessage.info('Редактирование в разработке');
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
      style={{ height: 600, display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      title={
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
          padding: 16,
          backgroundColor: '#fafafa',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <Empty
            description="Пока нет сообщений"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={msg.sender?.id === currentUserId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
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
    </Card>
  );
}

export default ChatWidget;
