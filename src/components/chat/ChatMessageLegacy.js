/**
 * ChatMessage Component
 * Displays a single chat message with avatar, timestamp, and reply functionality
 */

/**
 * Render a chat message
 * @param {Object} message - Message data
 * @param {string} message.id - Message ID
 * @param {Object} message.sender - Sender user object (optional)
 * @param {string} message.content - Message content
 * @param {string} message.creation_date - ISO datetime string
 * @param {Object} [message.parent] - Parent message if this is a reply
 * @param {Function} onReply - Callback when reply button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 * @param {boolean} isOwn - Whether this message is from current user
 * @returns {HTMLElement}
 */
export function ChatMessage(message, { onReply, onDelete, isOwn = false } = {}) {
  const container = document.createElement('div');
  container.className = `chat-message ${isOwn ? 'chat-message--own' : 'chat-message--other'}`;
  container.dataset.messageId = message.id;

  const avatar = document.createElement('div');
  avatar.className = 'chat-message__avatar';
  
  if (message.sender?.avatar) {
    const img = document.createElement('img');
    img.src = message.sender.avatar;
    img.alt = message.owner_name || message.sender.full_name || 'User';
    avatar.appendChild(img);
  } else {
    // Default avatar with initials
    const initials = getInitials(message.owner_name || message.sender?.full_name || 'User');
    avatar.textContent = initials;
    avatar.style.backgroundColor = getColorForUser(message.owner || message.sender?.id || 0);
  }

  const content = document.createElement('div');
  content.className = 'chat-message__content';

  const header = document.createElement('div');
  header.className = 'chat-message__header';

  const senderName = document.createElement('span');
  senderName.className = 'chat-message__sender';
  senderName.textContent = message.owner_name || message.sender?.full_name || 'Unknown User';

  const timestamp = document.createElement('span');
  timestamp.className = 'chat-message__timestamp';
  timestamp.textContent = formatTimestamp(message.creation_date || message.created_at);

  header.appendChild(senderName);
  header.appendChild(timestamp);

  // Show parent message if this is a reply
  if (message.parent) {
    const replyTo = document.createElement('div');
    replyTo.className = 'chat-message__reply-to';
    replyTo.innerHTML = `
      <i class="material-icons">reply</i>
      <span>Reply to ${message.parent.sender?.full_name || 'Unknown'}</span>
    `;
    content.appendChild(replyTo);
  }

  const body = document.createElement('div');
  body.className = 'chat-message__body';
  body.textContent = message.content;

  const actions = document.createElement('div');
  actions.className = 'chat-message__actions';

  if (onReply) {
    const replyBtn = document.createElement('button');
    replyBtn.className = 'chat-message__action-btn';
    replyBtn.innerHTML = '<i class="material-icons">reply</i>';
    replyBtn.title = 'Reply';
    replyBtn.onclick = () => onReply(message);
    actions.appendChild(replyBtn);
  }

  if (isOwn && onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'chat-message__action-btn';
    deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = () => onDelete(message);
    actions.appendChild(deleteBtn);
  }

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(actions);

  if (!isOwn) {
    container.appendChild(avatar);
  }
  container.appendChild(content);
  if (isOwn) {
    container.appendChild(avatar);
  }

  return container;
}

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get consistent color for user
 */
function getColorForUser(userId) {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',
    '#f57c00', '#0097a7', '#5d4037', '#455a64'
  ];
  return colors[userId % colors.length];
}

/**
 * Format timestamp
 */
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  // Different year
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default ChatMessage;
