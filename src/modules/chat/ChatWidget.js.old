/**
 * ChatWidget Component
 * Embeddable chat widget for leads, contacts, and deals
 */

import { getEntityChatMessages, createChatMessage } from '../../lib/api/chat.js';
import ChatMessage from '../../components/ui-ChatMessage.js';
import ChatInput from '../../components/ui-ChatInput.js';
import { showToast } from '../../components/ui-Toast.js';

/**
 * Create chat widget
 * @param {Object} options
 * @param {string} options.entityType - Entity type (lead, contact, deal)
 * @param {string} options.entityId - Entity ID
 * @param {boolean} [options.collapsed] - Start collapsed
 * @returns {HTMLElement}
 */
export function ChatWidget({ entityType, entityId, collapsed = true } = {}) {
  const container = document.createElement('div');
  container.className = `chat-widget ${collapsed ? 'chat-widget--collapsed' : ''}`;

  // Header
  const header = document.createElement('div');
  header.className = 'chat-widget__header';
  header.innerHTML = `
    <div class="chat-widget__title">
      <i class="material-icons">chat</i>
      <span>Messages</span>
      <span class="chat-widget__badge" style="display: none;">0</span>
    </div>
    <button class="chat-widget__toggle mdc-icon-button">
      <i class="material-icons">${collapsed ? 'expand_less' : 'expand_more'}</i>
    </button>
  `;

  // Body
  const body = document.createElement('div');
  body.className = 'chat-widget__body';
  body.style.display = collapsed ? 'none' : 'block';

  // Messages
  const messages = document.createElement('div');
  messages.className = 'chat-widget__messages';

  // Input
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'chat-widget__input';

  const chatInput = ChatInput({
    onSend: async (data) => {
      await sendMessage(data);
    },
  });

  inputWrapper.appendChild(chatInput);

  body.appendChild(messages);
  body.appendChild(inputWrapper);

  container.appendChild(header);
  container.appendChild(body);

  // Toggle widget
  const toggleBtn = header.querySelector('.chat-widget__toggle');
  toggleBtn.onclick = () => {
    const isCollapsed = container.classList.toggle('chat-widget--collapsed');
    body.style.display = isCollapsed ? 'none' : 'block';
    toggleBtn.querySelector('.material-icons').textContent = isCollapsed ? 'expand_less' : 'expand_more';
    
    if (!isCollapsed) {
      loadMessages();
      markAsRead();
    }
  };

  // Load messages
  async function loadMessages() {
    try {
      const data = await getEntityChatMessages(entityType, entityId, {
        page_size: 50,
      });

      messages.innerHTML = '';

      if (data.results.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'chat-widget__empty';
        empty.innerHTML = `
          <i class="material-icons">chat_bubble_outline</i>
          <p>No messages</p>
        `;
        messages.appendChild(empty);
        return;
      }

      const currentUserId = getCurrentUserId();

      data.results.forEach(msg => {
        const isOwn = msg.sender?.id === currentUserId;
        const messageEl = ChatMessage(msg, { isOwn });
        messages.appendChild(messageEl);
      });

      messages.scrollTop = messages.scrollHeight;

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Send message
  async function sendMessage(data) {
    try {
      const messageData = {
        content: data.content,
        [`related_${entityType}`]: entityId,
      };

      await createChatMessage(messageData);
      await loadMessages();
      messages.scrollTop = messages.scrollHeight;

    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  }

  // Mark messages as read
  function markAsRead() {
    const badge = header.querySelector('.chat-widget__badge');
    badge.style.display = 'none';
    badge.textContent = '0';
  }

  // Poll for new messages
  const pollInterval = setInterval(async () => {
    try {
      const data = await getEntityChatMessages(entityType, entityId, {
        page_size: 1,
      });

      const currentCount = messages.querySelectorAll('.chat-message').length;
      const totalCount = data.count || 0;

      if (totalCount > currentCount) {
        const badge = header.querySelector('.chat-widget__badge');
        badge.textContent = totalCount - currentCount;
        badge.style.display = 'inline-block';

        if (!container.classList.contains('chat-widget--collapsed')) {
          loadMessages();
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, 30000); // Poll every 30 seconds

  // Cleanup
  container.addEventListener('disconnected', () => {
    clearInterval(pollInterval);
  });

  // Initial load if not collapsed
  if (!collapsed) {
    loadMessages();
  }

  return container;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }
  return null;
}

export default ChatWidget;
