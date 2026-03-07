/**
 * ChatList Component
 * Displays list of chat conversations with filtering
 */

import { getChatMessages } from '../../lib/api/chat.js';
import { Spinner, Toast } from '../../components/index.js';

function createStateBlock(type, title, description, actionLabel, onAction) {
  const state = document.createElement('div');
  state.className = `chat-list__state chat-list__state--${type}`;

  const icon = document.createElement('i');
  icon.className = 'material-icons';
  icon.textContent =
    type === 'error' ? 'error_outline' : type === 'loading' ? 'hourglass_empty' : 'chat_bubble_outline';

  const heading = document.createElement('p');
  heading.className = 'chat-list__state-title';
  heading.textContent = title;

  const text = document.createElement('p');
  text.className = 'chat-list__state-description';
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
 * Create chat list view
 * @returns {HTMLElement}
 */
export function ChatList() {
  const container = document.createElement('div');
  container.className = 'chat-list';

  // Header
  const header = document.createElement('div');
  header.className = 'chat-list__header';
  header.innerHTML = `
    <h2 class="chat-list__title">Messages</h2>
    <div class="chat-list__filters">
      <select class="chat-list__filter" id="entityTypeFilter">
        <option value="">All Messages</option>
        <option value="lead">Leads</option>
        <option value="contact">Contacts</option>
        <option value="deal">Deals</option>
      </select>
      <input type="search" class="chat-list__search" placeholder="Search messages..." id="chatSearch" />
    </div>
  `;

  // Messages list
  const list = document.createElement('div');
  list.className = 'chat-list__messages';
  list.appendChild(
    createStateBlock('loading', 'Загрузка сообщений', 'Подготавливаем список диалогов.')
  );

  container.appendChild(header);
  container.appendChild(list);

  // Load messages
  loadMessages(list);

  // Setup filters
  const entityTypeFilter = header.querySelector('#entityTypeFilter');
  const searchInput = header.querySelector('#chatSearch');

  entityTypeFilter.onchange = () => {
    list.innerHTML = '';
    list.appendChild(
      createStateBlock('loading', 'Обновляем список', 'Применяем выбранный фильтр.')
    );
    loadMessages(list, {
      entityType: entityTypeFilter.value,
      search: searchInput.value,
    });
  };

  let searchTimeout;
  searchInput.oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      list.innerHTML = '';
      list.appendChild(
        createStateBlock('loading', 'Ищем сообщения', 'Подбираем диалоги по вашему запросу.')
      );
      loadMessages(list, {
        entityType: entityTypeFilter.value,
        search: searchInput.value,
      });
    }, 500);
  };

  return container;
}

/**
 * Load and display messages
 */
async function loadMessages(container, filters = {}) {
  try {
    const params = {
      ordering: '-created_at',
      page_size: 50,
    };

    if (filters.entityType) {
      params[`related_${filters.entityType}`] = 'not_null'; // Would need backend support
    }

    if (filters.search) {
      params.search = filters.search;
    }

    const data = await getChatMessages(params) || {};
    const results = data.results || [];
    
    container.innerHTML = '';

    if (results.length === 0) {
      container.appendChild(
        createStateBlock(
          'empty',
          'Диалоги не найдены',
          filters.search || filters.entityType
            ? 'Измените поиск или фильтр, чтобы увидеть подходящие сообщения.'
            : 'Первые сообщения появятся здесь, когда пользователи начнут переписку.'
        )
      );
      return;
    }

    // Group messages by conversation
    const conversations = groupMessagesByConversation(results);

    conversations.forEach(conv => {
      const item = createConversationItem(conv);
      container.appendChild(item);
    });

  } catch (error) {
    console.error('Error loading messages:', error);
    Toast.error(error.message || 'Не удалось загрузить сообщения');

    container.innerHTML = '';
    container.appendChild(
      createStateBlock(
        'error',
        'Не удалось загрузить диалоги',
        'Попробуйте повторить запрос или обновите фильтры.',
        'Повторить',
        () => loadMessages(container, filters)
      )
    );
  }
}

/**
 * Group messages by conversation (entity or thread)
 */
function groupMessagesByConversation(messages) {
  const conversations = new Map();

  messages.forEach(msg => {
    // Determine conversation key
    let key, title, entityType, entityId;

    if (msg.related_lead) {
      key = `lead-${msg.related_lead}`;
      title = `Lead: ${msg.related_lead_name || msg.related_lead}`;
      entityType = 'lead';
      entityId = msg.related_lead;
    } else if (msg.related_contact) {
      key = `contact-${msg.related_contact}`;
      title = `Contact: ${msg.related_contact_name || msg.related_contact}`;
      entityType = 'contact';
      entityId = msg.related_contact;
    } else if (msg.related_deal) {
      key = `deal-${msg.related_deal}`;
      title = `Deal: ${msg.related_deal_name || msg.related_deal}`;
      entityType = 'deal';
      entityId = msg.related_deal;
    } else {
      key = 'general';
      title = 'General Messages';
      entityType = null;
      entityId = null;
    }

    if (!conversations.has(key)) {
      conversations.set(key, {
        key,
        title,
        entityType,
        entityId,
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    const conv = conversations.get(key);
    conv.messages.push(msg);
    if (msg.created_at > conv.lastMessage.created_at) {
      conv.lastMessage = msg;
    }
  });

  return Array.from(conversations.values()).sort((a, b) => 
    new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
  );
}

/**
 * Create conversation list item
 */
function createConversationItem(conversation) {
  const item = document.createElement('div');
  item.className = 'chat-list__item';
  
  const lastMsg = conversation.lastMessage;
  const timeAgo = formatTimeAgo(lastMsg.created_at);

  item.innerHTML = `
    <div class="chat-list__item-avatar">
      ${getConversationIcon(conversation.entityType)}
    </div>
    <div class="chat-list__item-content">
      <div class="chat-list__item-header">
        <span class="chat-list__item-title">${conversation.title}</span>
        <span class="chat-list__item-time">${timeAgo}</span>
      </div>
      <div class="chat-list__item-preview">
        <strong>${lastMsg.sender?.full_name || 'Unknown'}:</strong>
        ${truncate(lastMsg.content, 60)}
      </div>
      ${conversation.unreadCount > 0 ? `<span class="chat-list__item-badge">${conversation.unreadCount}</span>` : ''}
    </div>
  `;

  item.onclick = () => {
    // Navigate to thread
    if (conversation.entityType && conversation.entityId) {
      window.location.hash = `#/chat/${conversation.entityType}/${conversation.entityId}`;
    }
  };

  return item;
}

/**
 * Get icon for entity type
 */
function getConversationIcon(entityType) {
  const icons = {
    lead: 'person',
    contact: 'contacts',
    deal: 'handshake',
  };
  const icon = icons[entityType] || 'chat';
  return `<i class="material-icons">${icon}</i>`;
}

/**
 * Format time ago
 */
function formatTimeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Truncate text
 */
function truncate(text, length) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export default ChatList;
