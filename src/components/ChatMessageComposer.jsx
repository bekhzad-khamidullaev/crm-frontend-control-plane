/**
 * ChatMessageComposer Component
 * Message composer with emoji support and reply context
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Popover, Space, Tooltip, Typography, theme as antdTheme } from 'antd';
import { CloseOutlined, SendOutlined, SmileOutlined } from '@ant-design/icons';
import { useMessage } from '../lib/hooks/useMessage';
import { useTheme } from '../lib/hooks/useTheme';

const { TextArea } = Input;
const { Text } = Typography;

// Simple emoji picker data
const EMOJI_CATEGORIES = {
  Смайлики: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
  ],
  Жесты: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾'],
  Объекты: [
    '📱',
    '💻',
    '⌨️',
    '📧',
    '📨',
    '📩',
    '📤',
    '📥',
    '📦',
    '📋',
    '📁',
    '📂',
    '📅',
    '📆',
    '📊',
  ],
};

function ChatMessageComposer({
  onSend,
  onTyping,
  placeholder = 'Напишите сообщение...',
  sending = false,
  entityType,
  entityId,
  replyTo = null,
  onCancelReply,
}) {
  const { theme } = useTheme();
  const { token } = antdTheme.useToken();
  const messageApi = useMessage();
  const [message, setMessage] = useState('');
  const [emojiVisible, setEmojiVisible] = useState(false);
  const textAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus on textarea when replyTo changes
    if (replyTo && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [replyTo]);

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Send typing indicator
    if (onTyping && value.length > 0) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const handleSend = async () => {
    if (sending) return;
    if (!message.trim()) {
      messageApi.warning('Введите сообщение');
      return;
    }

    const nextMessage = message.trim();
    const messageData = {
      content: nextMessage,
      answer_to: replyTo?.id,
      entityType,
      entityId,
    };

    await onSend(messageData);
    setMessage('');

    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const cursorPos =
      textAreaRef.current?.resizableTextArea?.textArea?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
    setMessage(newMessage);
    setEmojiVisible(false);

    // Focus back on textarea
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const emojiPicker = (
    <div style={{ width: 300, maxHeight: 320, overflow: 'auto' }}>
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} style={{ marginBottom: 14 }}>
          <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
            {category}
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                type="text"
                size="small"
                style={{ fontSize: 20, padding: '6px 10px', borderRadius: 10 }}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        padding: 16,
        borderTop: `1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : token.colorBorderSecondary}`,
        background: theme === 'dark'
          ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.92) 100%)'
          : token.colorBgContainer,
      }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div
          style={{
            padding: '10px 12px',
            marginBottom: 12,
            backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.94)' : token.colorFillAlter,
            borderRadius: 14,
            border: `1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Ответ на сообщение
            </div>
            <div
              style={{
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: token.colorText,
                lineHeight: 1.5,
              }}
            >
              {replyTo.content}
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            aria-label="Отменить ответ"
            onClick={onCancelReply}
          />
        </div>
      )}

      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary}`,
          background: theme === 'dark' ? 'rgba(17, 24, 39, 0.98)' : token.colorBgContainer,
          boxShadow:
            theme === 'dark'
              ? '0 10px 28px rgba(0, 0, 0, 0.24)'
              : '0 8px 24px rgba(15, 23, 42, 0.06)',
          padding: 12,
        }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={textAreaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={sending}
            autoSize={{ minRows: 1, maxRows: 6 }}
            style={{
              flex: 1,
              borderRadius: 14,
              resize: 'none',
              paddingTop: 10,
              paddingBottom: 10,
              background: theme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : token.colorFillAlter,
            }}
          />

          <Space.Compact>
            <Popover
              content={emojiPicker}
              trigger="click"
              open={emojiVisible}
              onOpenChange={setEmojiVisible}
              placement="topRight"
            >
              <Tooltip title="Добавить эмодзи">
                <Button icon={<SmileOutlined />} aria-label="Открыть выбор эмодзи" />
              </Tooltip>
            </Popover>

            <Tooltip title="Отправить (Enter)">
              <Button
                type="primary"
                icon={<SendOutlined />}
                aria-label="Отправить сообщение"
                onClick={() => void handleSend()}
                disabled={!message.trim() || sending}
                loading={sending}
              />
            </Tooltip>
          </Space.Compact>
        </Space.Compact>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 10,
            color: token.colorTextSecondary,
            fontSize: 12,
          }}
        >
          <span>Enter отправляет сообщение, Shift+Enter добавляет новую строку</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              background: theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : token.colorFillAlter,
              border: `1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : token.colorBorderSecondary}`,
              fontWeight: 600,
              minWidth: 36,
              textAlign: 'center',
            }}
          >
            {message.length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatMessageComposer;
