/**
 * ChatThread Component
 * Displays a conversation thread with messages and input
 */

import { getEntityChatMessages, getMessageThread, createChatMessage, deleteChatMessage } from '../../lib/api/chat.js';
import ChatMessage from '../../components/ui-ChatMessage.jsx';
import ChatInput from '../../components/ui-ChatInput.jsx';
import { Spinner, Toast } from '../../components/index.js';

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
  messagesContainer.appendChild(Spinner());

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
  loadMessages(messagesContainer, entityType, entityId, threadId);

  // Auto-refresh messages every 10 seconds
  const refreshInterval = setInterval(() => {
    loadMessages(messagesContainer, entityType, entityId, threadId, true);
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
      await loadMessages(container, entityType, entityId, threadId, true);
      
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
async function loadMessages(container, entityType, entityId, threadId, silent = false) {
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
      const empty = document.createElement('div');
      empty.className = 'chat-thread__empty';
      empty.innerHTML = `
        <i class="material-icons">chat_bubble_outline</i>
        <p>No messages yet. Start the conversation!</p>
      `;
      container.appendChild(empty);
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
          replyingTo = message;
          // Scroll to input
          container.parentElement.querySelector('.chat-thread__input-container').scrollIntoView({ behavior: 'smooth' });
        },
        onDelete: async (message) => {
          if (confirm('Delete this message?')) {
            try {
              await deleteChatMessage(message.id);
              await loadMessages(container, entityType, entityId, threadId, true);
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
    Toast.error(error.message || 'Failed to load messages');
    
    if (!silent) {
      container.innerHTML = `
        <div class="chat-thread__error">
          <i class="material-icons">error_outline</i>
          <p>Failed to load messages</p>
          <button class="mdc-button mdc-button--raised" onclick="location.reload()">Retry</button>
        </div>
      `;
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
  
  return `${titles[entityType] || 'Entity'} #${entityId}`;
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
