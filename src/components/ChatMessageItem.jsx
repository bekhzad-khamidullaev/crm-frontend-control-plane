/**
 * ChatMessageItem Component
 * Displays a single chat message with actions and metadata
 */

import React, { useState } from 'react';
import {
  Avatar,
  Space,
  Typography,
  Dropdown,
  Button,
  Tooltip,
  message as antMessage,
} from 'antd';
import {
  UserOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EnterOutlined,
  CopyOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { canWrite } from '../lib/rbac.js';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Text, Paragraph } = Typography;

function ChatMessageItem({
  message,
  isCurrentUser = false,
  onReply,
  onViewThread,
  onEdit,
  onDelete,
  onCopy,
  showAvatar = true,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const canManageOwnMessage = canWrite('chat.change_chatmessage');

  const menuItems = [
    {
      key: 'reply',
      icon: <EnterOutlined />,
      label: 'Ответить',
      onClick: () => onReply && onReply(message),
    },
    onViewThread && {
      key: 'thread',
      icon: <CommentOutlined />,
      label: 'Ответы',
      onClick: () => onViewThread(message),
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Копировать',
      onClick: () => {
        navigator.clipboard.writeText(message.content || '');
        antMessage.success('Скопировано в буфер обмена');
        onCopy && onCopy(message);
      },
    },
  ].filter(Boolean);

  if (isCurrentUser && canManageOwnMessage) {
    menuItems.push(
      {
        type: 'divider',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Редактировать',
        onClick: () => onEdit && onEdit(message),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Удалить',
        danger: true,
        onClick: () => onDelete && onDelete(message),
      }
    );
  }

  const messageStyle = {
    padding: '8px 12px',
    borderRadius: 12,
    maxWidth: 400,
    backgroundColor: isCurrentUser ? '#1890ff' : '#f0f0f0',
    color: isCurrentUser ? '#fff' : 'rgba(0, 0, 0, 0.85)',
    wordBreak: 'break-word',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showAvatar && !isCurrentUser && (
        <Avatar
          icon={<UserOutlined />}
          src={message.sender?.avatar}
          size={32}
        >
          {message.sender?.name?.[0]?.toUpperCase()}
        </Avatar>
      )}

      <div style={{ maxWidth: '70%' }}>
        {!isCurrentUser && (message.owner_name || message.sender?.name) && (
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              marginBottom: 4,
              display: 'block',
              marginLeft: 4,
            }}
          >
            {message.owner_name || message.sender?.name}
          </Text>
        )}

        {/* Parent message preview (if reply) */}
        {message.parent && (
          <div
            style={{
              padding: '4px 8px',
              marginBottom: 4,
              borderLeft: '3px solid #1890ff',
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <Space size={4}>
              <EnterOutlined style={{ fontSize: 10 }} />
              <Text type="secondary" ellipsis style={{ maxWidth: 300 }}>
                {message.parent.content}
              </Text>
            </Space>
          </div>
        )}
        {!message.parent && message.answer_to && (
          <div
            style={{
              padding: '4px 8px',
              marginBottom: 4,
              borderLeft: '3px solid #1890ff',
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <Space size={4}>
              <EnterOutlined style={{ fontSize: 10 }} />
              <Text type="secondary">Ответ на сообщение</Text>
            </Space>
          </div>
        )}

        <div style={messageStyle}>
          <Paragraph
            style={{
              margin: 0,
              color: isCurrentUser ? '#fff' : 'inherit',
            }}
          >
            {message.content}
          </Paragraph>
        </div>

        <Space
          size={4}
          style={{
            marginTop: 4,
            fontSize: 11,
            color: '#999',
            marginLeft: isCurrentUser ? 0 : 4,
            marginRight: isCurrentUser ? 4 : 0,
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
            display: 'flex',
          }}
        >
          <Tooltip title={dayjs(message.creation_date || message.created_at).format('DD.MM.YYYY HH:mm')}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(message.creation_date || message.created_at).fromNow()}
            </Text>
          </Tooltip>
        </Space>
      </div>

      {/* Actions menu */}
      {isHovered && (
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement={isCurrentUser ? 'bottomRight' : 'bottomLeft'}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{
              opacity: 0.6,
              marginTop: showAvatar && !isCurrentUser ? 32 : 0,
            }}
          />
        </Dropdown>
      )}

      {showAvatar && isCurrentUser && <div style={{ width: 32 }} />}
    </div>
  );
}

export default ChatMessageItem;
