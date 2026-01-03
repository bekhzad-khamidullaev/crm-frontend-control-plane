/**
 * ChatPage Component
 * Full-featured messenger-style chat page
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  List,
  Avatar,
  Badge,
  Input,
  Space,
  Typography,
  Button,
  Tag,
  Empty,
  Spin,
  Tabs,
  Card,
  message,
} from 'antd';
import {
  MessageOutlined,
  SearchOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  RiseOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { getChatMessages, getChatStatistics } from '../lib/api/chat.js';
import { subscribe, getUnreadCount as getStoreUnreadCount } from '../lib/store/index.js';
import ChatWidget from '../modules/chat/ChatWidget.jsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

function ChatPage() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadChats();
    loadStatistics();

    // Subscribe to store updates
    const unsubscribe = subscribe((state) => {
      // Update unread count badge
      if (statistics) {
        setStatistics({
          ...statistics,
          unread: state.chat.unreadCount,
        });
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    filterChats();
  }, [chats, searchQuery, filter]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await getChatMessages({
        page_size: 100,
        ordering: '-creation_date',
      });

      // Group messages by entity
      const chatMap = new Map();
      
      // Safely access results
      const results = response?.results || response || [];
      
      results.forEach(msg => {
        const entityType = msg.content_type_name || msg.content_type || 'chat';
        const entityId = msg.object_id || msg.id;
        const key = `${entityType}_${entityId}`;

        if (!chatMap.has(key)) {
          chatMap.set(key, {
            id: key,
            entityType,
            entityId,
            entityName: msg.content_type_name ? `${msg.content_type_name} #${entityId}` : `Чат #${entityId}`,
            entityPhone: msg.related_phone,
            lastMessage: msg.content || msg.message || '',
            lastMessageTime: msg.creation_date || msg.created_at,
            unreadCount: msg.is_read === false ? 1 : 0,
            sender: msg.owner_name,
          });
        } else {
          const chat = chatMap.get(key);
          if (msg.is_read === false) {
            chat.unreadCount++;
          }
        }
      });

      const chatList = Array.from(chatMap.values()).sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setChats(chatList);
    } catch (error) {
      console.error('Error loading chats:', error);
      message.error('Не удалось загрузить чаты');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getChatStatistics();
      const data = stats?.data || stats || {};
      setStatistics({
        total: data.total || 0,
        unread: data.unread || 0,
        today: data.today || 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStatistics({
        total: 0,
        unread: 0,
        today: 0,
      });
    }
  };

  const filterChats = () => {
    let filtered = [...chats];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        chat =>
          chat.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filter === 'unread') {
      filtered = filtered.filter(chat => chat.unreadCount > 0);
    }

    setFilteredChats(filtered);
  };

  const getEntityIcon = (entityType) => {
    const normalized = entityType?.toString().toLowerCase();
    switch (normalized) {
      case 'contact':
        return <UserOutlined />;
      case 'lead':
        return <RiseOutlined />;
      case 'deal':
        return <DollarOutlined />;
      case 'company':
        return <ShopOutlined />;
      default:
        return <MessageOutlined />;
    }
  };

  const getEntityColor = (entityType) => {
    const normalized = entityType?.toString().toLowerCase();
    switch (normalized) {
      case 'contact':
        return 'blue';
      case 'lead':
        return 'green';
      case 'deal':
        return 'orange';
      case 'company':
        return 'purple';
      default:
        return 'default';
    }
  };

  const filterTabs = [
    { key: 'all', label: `Все (${chats.length})` },
    { key: 'unread', label: `Непрочитанные (${chats.filter(c => c.unreadCount > 0).length})` },
  ];

  return (
    <Layout style={{ height: 'calc(100vh - 64px)', backgroundColor: '#fff' }}>
      {/* Sidebar with chat list */}
      <Sider
        width={350}
        style={{
          backgroundColor: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
            <MessageOutlined /> Чаты
          </Title>
          
          <Search
            placeholder="Поиск чатов..."
            allowClear
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          <Tabs
            activeKey={filter}
            onChange={setFilter}
            items={filterTabs}
            size="small"
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : filteredChats.length === 0 ? (
            <Empty
              description="Нет чатов"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 60 }}
            />
          ) : (
            <List
              dataSource={filteredChats}
              renderItem={(chat) => (
                <List.Item
                  onClick={() => setActiveChat(chat)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor:
                      activeChat?.id === chat.id ? '#e6f7ff' : 'transparent',
                    padding: '12px 16px',
                    borderLeft:
                      activeChat?.id === chat.id ? '3px solid #1890ff' : 'none',
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={chat.unreadCount} offset={[-5, 5]}>
                        <Avatar icon={getEntityIcon(chat.entityType)} />
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong={chat.unreadCount > 0}>
                          {chat.entityName}
                        </Text>
                        <Tag
                          color={getEntityColor(chat.entityType)}
                          style={{ fontSize: 10, padding: '0 4px' }}
                        >
                          {chat.entityType}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          ellipsis
                          type="secondary"
                          style={{
                            fontSize: 13,
                            fontWeight: chat.unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {chat.lastMessage}
                        </Text>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          {dayjs(chat.lastMessageTime).fromNow()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      {/* Main chat area */}
      <Content style={{ backgroundColor: '#fff' }}>
        {activeChat ? (
          <ChatWidget
            entityType={activeChat.entityType}
            entityId={activeChat.entityId}
            entityName={activeChat.entityName}
            entityPhone={activeChat.entityPhone}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty
              description="Выберите чат для начала общения"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Content>
    </Layout>
  );
}

export default ChatPage;
