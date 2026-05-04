/**
 * ChatMessageItem Component
 * Displays a single chat message with actions and metadata
 */

import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Dropdown,
  theme as antdTheme,
  Space,
  Tooltip,
  Typography,
  message as antMessage,
} from 'antd';
import {
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EnterOutlined,
  MoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { canWrite } from '../lib/rbac.js';
import { useTheme } from '../lib/hooks/useTheme.js';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Text, Paragraph } = Typography;

async function copyToClipboard(text) {
  if (!text) return false;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

function getPillColors(tone, isDark, token) {
  if (tone === 'success') {
    return {
      background: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(34, 197, 94, 0.12)',
      border: isDark ? 'rgba(74, 222, 128, 0.28)' : 'rgba(34, 197, 94, 0.18)',
      color: isDark ? '#bbf7d0' : '#166534',
    };
  }
  if (tone === 'danger') {
    return {
      background: isDark ? 'rgba(248, 113, 113, 0.18)' : 'rgba(248, 113, 113, 0.12)',
      border: isDark ? 'rgba(252, 165, 165, 0.28)' : 'rgba(248, 113, 113, 0.18)',
      color: isDark ? '#fecaca' : '#991b1b',
    };
  }
  if (tone === 'info') {
    return {
      background: isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(59, 130, 246, 0.1)',
      border: isDark ? 'rgba(147, 197, 253, 0.28)' : 'rgba(59, 130, 246, 0.16)',
      color: isDark ? '#bfdbfe' : '#1d4ed8',
    };
  }
  return {
    background: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.12)',
    border: isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.18)',
    color: isDark ? '#cbd5e1' : '#475569',
  };
}

function buildStatusPills(message, isCurrentUser) {
  const pills = [];
  const queueStateMap = {
    new: { label: 'Новое', tone: 'default' },
    waiting: { label: 'В очереди', tone: 'info' },
    queued: { label: 'В очереди', tone: 'info' },
    pending: { label: 'Ожидает', tone: 'info' },
    in_progress: { label: 'В работе', tone: 'info' },
    processing: { label: 'Обработка', tone: 'info' },
    accepted: { label: 'Принято', tone: 'info' },
    resolved: { label: 'Доставлено', tone: 'success' },
    sent: { label: 'Отправлено', tone: 'success' },
    delivered: { label: 'Доставлено', tone: 'success' },
    failed: { label: 'Ошибка', tone: 'danger' },
  };

  if (message.isExternal) {
    pills.push({
      key: 'direction',
      label: message.direction === 'out' ? 'Исходящее' : 'Входящее',
      tone: message.direction === 'out' ? 'info' : 'default',
    });

    const normalizedQueueState = String(message.queue_state || '').trim().toLowerCase();
    const normalizedStatus = String(message.status || '').trim().toLowerCase();
    const queuePill =
      queueStateMap[normalizedQueueState] ||
      (normalizedStatus.includes('fail')
        ? { label: 'Ошибка', tone: 'danger' }
          : normalizedStatus.includes('deliver')
            ? { label: 'Доставлено', tone: 'success' }
            : normalizedStatus === 'ok'
              ? { label: 'Доставлено', tone: 'success' }
          : normalizedStatus.includes('sent')
            ? { label: 'Отправлено', tone: 'success' }
            : normalizedStatus.includes('accept')
              ? { label: 'Принято', tone: 'info' }
              : normalizedStatus.includes('queue') || normalizedStatus.includes('pend')
                ? { label: 'В очереди', tone: 'info' }
                : null);

    if (queuePill) {
      pills.push({
        key: 'delivery',
        ...queuePill,
      });
    }

    return pills;
  }

  const updatedAt = message.updated_at || message.modification_date;
  if (updatedAt && createdAtDifferent(updatedAt, message.creation_date || message.created_at)) {
    pills.push({ key: 'edited', label: 'Изменено', tone: 'default' });
  }

  if (isCurrentUser && message.is_read) {
    pills.push({ key: 'read', label: 'Прочитано', tone: 'success' });
  }

  return pills;
}

function createdAtDifferent(updatedAt, createdAt) {
  if (!updatedAt || !createdAt) return false;
  return dayjs(updatedAt).valueOf() !== dayjs(createdAt).valueOf();
}

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
  const { theme } = useTheme();
  const { token } = antdTheme.useToken();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const canManageOwnMessage = canWrite('chat.change_chatmessage');

  const createdAt = message.creation_date || message.created_at;
  const authorName = message.owner_name || message.sender?.name || 'Участник чата';
  const statusPills = useMemo(
    () => buildStatusPills(message, isCurrentUser),
    [message, isCurrentUser]
  );
  const bubbleStyles = useMemo(
    () => ({
      background: isCurrentUser
        ? `linear-gradient(180deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 100%)`
        : isDark
          ? 'rgba(16, 24, 39, 0.96)'
          : token.colorBgElevated,
      color: isCurrentUser ? '#fff' : token.colorText,
      border: isCurrentUser
        ? 'none'
        : `1px solid ${isDark ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary}`,
      boxShadow: isCurrentUser
        ? '0 8px 24px rgba(24, 144, 255, 0.18)'
        : isDark
          ? '0 8px 24px rgba(15, 23, 42, 0.32)'
          : '0 1px 2px rgba(15, 23, 42, 0.06)',
    }),
    [isCurrentUser, token, isDark]
  );

  const replyPreview = message.parent?.content || (message.answer_to ? 'Ответ на сообщение' : null);

  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content || '');
      antMessage.success('Скопировано в буфер обмена');
      onCopy?.(message);
    } catch {
      antMessage.error('Не удалось скопировать сообщение');
    }
  };

  const menuItems = [
    onReply && {
      key: 'reply',
      icon: <EnterOutlined />,
      label: 'Ответить',
      onClick: () => onReply(message),
    },
    onViewThread && {
      key: 'thread',
      icon: <CommentOutlined />,
      label: 'Открыть тред',
      onClick: () => onViewThread(message),
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Копировать',
      onClick: handleCopy,
    },
    isCurrentUser &&
      canManageOwnMessage &&
      onEdit &&
      onDelete && {
        type: 'divider',
      },
    isCurrentUser &&
      canManageOwnMessage &&
      onEdit && {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Редактировать',
        onClick: () => onEdit(message),
      },
    isCurrentUser &&
      canManageOwnMessage &&
      onDelete && {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Удалить',
        danger: true,
        onClick: () => onDelete(message),
      },
  ].filter(Boolean);

  const avatarNode =
    showAvatar && !isCurrentUser ? (
      <Avatar
        src={message.sender?.avatar}
        icon={<UserOutlined />}
        size={40}
        style={{
          flexShrink: 0,
          background: isDark ? '#334155' : token.colorFillSecondary,
          color: isDark ? '#e2e8f0' : token.colorTextSecondary,
        }}
      >
        {(authorName || 'U').charAt(0).toUpperCase()}
      </Avatar>
    ) : showAvatar && isCurrentUser ? (
      <div style={{ width: 40, flexShrink: 0 }} />
    ) : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 16,
        position: 'relative',
      }}
    >
      {avatarNode}

      <div
        style={{
          maxWidth: 'min(78%, 720px)',
          minWidth: 0,
          marginLeft: isCurrentUser ? 'auto' : 0,
          marginRight: isCurrentUser ? 0 : 'auto',
        }}
      >
        {!isCurrentUser && authorName && (
          <Text
            type="secondary"
            style={{
              display: 'block',
              fontSize: 12,
              marginBottom: 6,
              paddingLeft: 6,
              color: isDark ? token.colorTextSecondary : token.colorTextSecondary,
              fontWeight: 600,
            }}
          >
            {authorName}
          </Text>
        )}

        {replyPreview && (
          <div
            style={{
              marginBottom: 8,
              padding: '8px 12px',
              borderRadius: 14,
              border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary}`,
              background: isDark ? 'rgba(15, 23, 42, 0.78)' : token.colorFillAlter,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <EnterOutlined style={{ fontSize: 12, color: token.colorPrimary }} />
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: isDark ? token.colorTextSecondary : token.colorTextSecondary,
                fontWeight: 500,
              }}
            >
              {replyPreview}
            </Text>
          </div>
        )}

        <div
          style={{
            ...bubbleStyles,
            borderRadius: 18,
            padding: '12px 14px',
            overflow: 'hidden',
          }}
        >
          <Paragraph
            style={{
              margin: 0,
              color: isCurrentUser ? '#fff' : token.colorText,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.55,
              fontSize: 14,
            }}
          >
            {message.content}
          </Paragraph>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 6,
            paddingLeft: isCurrentUser ? 0 : 6,
            paddingRight: isCurrentUser ? 6 : 0,
            color: token.colorTextSecondary,
          }}
        >
          {statusPills.map((pill) => {
            const pillColors = getPillColors(pill.tone, isDark, token);
            return (
              <span
                key={pill.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 22,
                  padding: '0 8px',
                  borderRadius: 999,
                  border: `1px solid ${pillColors.border}`,
                  background: pillColors.background,
                  color: pillColors.color,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.1,
                }}
              >
                {pill.label}
              </span>
            );
          })}
          <Tooltip title={createdAt ? dayjs(createdAt).format('DD.MM.YYYY HH:mm') : ''}>
            <Text style={{ fontSize: 11, color: 'inherit', fontWeight: 500 }}>
              {createdAt ? dayjs(createdAt).fromNow() : ''}
            </Text>
          </Tooltip>
        </div>
        </div>

      {isHovered && menuItems.length > 0 && (
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
              alignSelf: 'center',
              opacity: 0.86,
              flexShrink: 0,
              borderRadius: 12,
              color: token.colorTextSecondary,
              background: isDark ? 'rgba(15, 23, 42, 0.72)' : token.colorBgContainer,
            }}
          />
        </Dropdown>
      )}
    </div>
  );
}

export default ChatMessageItem;
