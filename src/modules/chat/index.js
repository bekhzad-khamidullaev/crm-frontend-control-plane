/**
 * Chat Module
 * Main entry point for chat functionality
 */

import ChatList from './ChatList.js';
import ChatThread from './ChatThread.js';

/**
 * Mount chat module
 * @param {HTMLElement} container - Container element
 * @param {Object} route - Route object
 */
export function mountChat(container, route) {
  container.innerHTML = '';

  // Determine what to show based on route
  switch (route.name) {
    case 'chat-list':
      container.appendChild(ChatList());
      break;
    
    case 'chat-thread': {
      // Show specific thread or entity chat
      const { entityType, entityId, threadId } = route.params;
      container.appendChild(ChatThread({ entityType, entityId, threadId }));
      break;
    }
    
    default:
      // Default to list view
      container.appendChild(ChatList());
  }
}

export default mountChat;
