/**
 * ChatMessageComposer Component
 * Message composer with emoji support and reply context
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Input,
  Button,
  Space,
  Tooltip,
  message as antMessage,
  Popover,
} from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

// Simple emoji picker data
const EMOJI_CATEGORIES = {
  'Смайлики': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  'Жесты': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾'],
  'Объекты': ['📱', '💻', '⌨️', '📧', '📨', '📩', '📤', '📥', '📦', '📋', '📁', '📂', '📅', '📆', '📊'],
};

function ChatMessageComposer({
  onSend,
  onTyping,
  placeholder = 'Напишите сообщение...',
  entityType,
  entityId,
  replyTo = null,
  onCancelReply,
}) {
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

  const handleSend = () => {
    if (!message.trim()) {
      antMessage.warning('Введите сообщение');
      return;
    }

    const messageData = {
      content: message.trim(),
      answer_to: replyTo?.id,
      entityType,
      entityId,
    };

    onSend(messageData);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const cursorPos = textAreaRef.current?.resizableTextArea?.textArea?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
    setMessage(newMessage);
    setEmojiVisible(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const emojiPicker = (
    <div style={{ width: 280, maxHeight: 300, overflow: 'auto' }}>
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{category}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {emojis.map(emoji => (
              <Button
                key={emoji}
                type="text"
                size="small"
                style={{ fontSize: 20, padding: '4px 8px' }}
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
    <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
      {/* Reply preview */}
      {replyTo && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#999' }}>Ответ на сообщение:</div>
            <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {replyTo.content}
          </div>
        </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onCancelReply}
          />
        </div>
      )}

      {/* Message input */}
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          ref={textAreaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ flex: 1 }}
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
              <Button icon={<SmileOutlined />} />
            </Tooltip>
          </Popover>

          <Tooltip title="Отправить (Enter)">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!message.trim()}
            />
          </Tooltip>
        </Space.Compact>
      </Space.Compact>
    </div>
  );
}

export default ChatMessageComposer;
