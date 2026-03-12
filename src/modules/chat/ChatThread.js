/**
 * ChatThread Component
 * Displays a conversation thread with messages and input
 */

import { getEntityChatMessages, getMessageThread, createChatMessage, deleteChatMessage } from '../../lib/api/chat.js';
import ChatMessage from '../../components/chat/ChatMessageLegacy.js';
import ChatInput from '../../components/chat/ChatInputLegacy.js';
import { Spinner, Toast } from '../../components/index.js';

function createThreadState(type, title, description, actionLabel, onAction) {
  const state = document.createElement('div');
  state.className = `chat-thread__state chat-thread__state--${type}`;

  const icon = document.createElement('i');
  icon.className = 'material-icons';
  icon.textContent =
    type === 'error' ? 'error_outline' : type === 'loading' ? 'hourglass_empty' : 'chat_bubble_outline';

  const heading = document.createElement('p');
  heading.className = 'chat-thread__state-title';
  heading.textContent = title;

  const text = document.createElement('p');
  text.className = 'chat-thread__state-description';
  text.textContent = description;

  state.appendChild(icon);
  state.appendChild(heading);
  state.appendChild(text);

  if (actionLabel && onAction) {
    const button = document.createElement('button');
    button.className = 'mdc-button mdc-button--raised';
    button.textContent = actionLabel;
    button.onclick = onAction;
    state.appendChild(button);
  }

  return state;
}

/**
 * Create chat thread view
 * @param {Object} options
 * @param {string} options.entityType - Entity type (lead, contact, deal)
 * @param {string} options.entityId - Entity ID
 * @param {string} [options.threadId] - Parent message ID for thread
 * @returns {HTMLElement}
 */
export function ChatThread({ entityType, entityId, threadId } = {}) {
  const container = document.createElement('div');
  container.className = 'chat-thread';

  // Header
  const header = document.createElement('div');
  header.className = 'chat-thread__header';
  header.innerHTML = `
    <button class="chat-thread__back mdc-icon-button" onclick="history.back()">
      <i class="material-icons">arrow_back</i>
    </button>
    <div class="chat-thread__title">
      <h3>${getEntityTitle(entityType, entityId)}</h3>
      <span class="chat-thread__subtitle">Chat</span>
    </div>
  `;

  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'chat-thread__messages';
  messagesContainer.appendChild(
    createThreadState('loading', 'Загрузка переписки', 'Подгружаем сообщения и ответы.')
  );

  // Input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'chat-thread__input-container';

  let replyingTo = null;

  const chatInput = ChatInput({
    onSend: async (data) => {
      await sendMessage(data, messagesContainer);
      replyingTo = null;
    },
    replyingTo,
    onCancelReply: () => {
      replyingTo = null;
      updateChatInput();
    },
  });

  inputContainer.appendChild(chatInput);

  container.appendChild(header);
  container.appendChild(messagesContainer);
  container.appendChild(inputContainer);

  // Load messages
  loadMessages(messagesContainer, entityType, entityId, threadId, false, (msg) => { replyingTo = msg; });

  // Auto-refresh messages every 10 seconds
  const refreshInterval = setInterval(() => {
    loadMessages(messagesContainer, entityType, entityId, threadId, true, (msg) => { replyingTo = msg; });
  }, 10000);

  // Cleanup on unmount
  container.addEventListener('disconnected', () => {
    clearInterval(refreshInterval);
  });

  // Update chat input when replying
  function updateChatInput() {
    inputContainer.innerHTML = '';
    const newInput = ChatInput({
      onSend: async (data) => {
        await sendMessage(data, messagesContainer);
        replyingTo = null;
        updateChatInput();
      },
      replyingTo,
      onCancelReply: () => {
        replyingTo = null;
        updateChatInput();
      },
    });
    inputContainer.appendChild(newInput);
  }

  // Send message handler
  async function sendMessage(data, container) {
    try {
      const messageData = {
        content: data.content,
        answer_to: data.answer_to || threadId || null,
        content_type: entityType,
        object_id: entityId,
      };

      await createChatMessage(messageData);
      
      // Reload messages
      await loadMessages(container, entityType, entityId, threadId, true, (msg) => { replyingTo = msg; });
      
      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
      
    } catch (error) {
      console.error('Error sending message:', error);
      Toast.error(error.message || 'Failed to send message');
    }
  }

  return container;
}

/**
 * Load and display messages
 */
async function loadMessages(container, entityType, entityId, threadId, silent = false, replyingToSetter = null) {
  try {
    let data;

    if (threadId) {
      // Load thread messages
      data = await getMessageThread(threadId);
    } else if (entityType && entityId) {
      // Load entity messages
      data = await getEntityChatMessages(entityType, entityId, {
        page_size: 100,
      });
    } else {
      throw new Error('No thread or entity specified');
    }

    if (!silent) {
      container.innerHTML = '';
    }

    if (data.results.length === 0) {
      container.appendChild(
        createThreadState(
          'empty',
          'Сообщений пока нет',
          'Начните разговор, чтобы история переписки появилась здесь.'
        )
      );
      return;
    }

    // Clear only if we have new messages
    if (silent) {
      const currentCount = container.querySelectorAll('.chat-message').length;
      if (currentCount === data.results.length) {
        return; // No new messages
      }
      container.innerHTML = '';
    }

    // Get current user ID (from localStorage or API)
    const currentUserId = getCurrentUserId();

    // Display messages
    data.results.forEach(msg => {
      const isOwn = msg.owner === currentUserId || msg.sender?.id === currentUserId;
      
      const messageEl = ChatMessage(msg, {
        isOwn,
        onReply: (message) => {
          // Set replying state
          if (replyingToSetter) {
            replyingToSetter(message);
          }
          // Scroll to input
          container.parentElement.querySelector('.chat-thread__input-container').scrollIntoView({ behavior: 'smooth' });
        },
        onDelete: async (message) => {
          if (confirm('Delete this message?')) {
            try {
              await deleteChatMessage(message.id);
              await loadMessages(container, entityType, entityId, threadId, true, replyingToSetter);
              Toast.success('Message deleted');
            } catch (error) {
              console.error('Error deleting message:', error);
              Toast.error(error.message || 'Failed to delete message');
            }
          }
        },
      });

      container.appendChild(messageEl);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

  } catch (error) {
    console.error('Error loading messages:', error);
    Toast.error(error.message || 'Не удалось загрузить сообщения');
    
    if (!silent) {
      container.innerHTML = '';
      container.appendChild(
        createThreadState(
          'error',
          'Не удалось загрузить переписку',
          'Попробуйте повторить запрос и проверьте доступность чата.',
          'Повторить',
          () => loadMessages(container, entityType, entityId, threadId, false, replyingToSetter)
        )
      );
    }
  }
}

/**
 * Get entity title
 */
function getEntityTitle(entityType, entityId) {
  if (!entityType || !entityId) return 'Chat';
  
  const titles = {
    lead: 'Lead',
    contact: 'Contact',
    deal: 'Deal',
  };
  
  return titles[entityType] || 'Entity';
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  // This should come from auth state or API
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

export default ChatThread;
