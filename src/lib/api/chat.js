/**
 * Chat API client
 * Handles all chat-messages operations according to Django-CRM API.yaml
 */

import { api as apiClient } from './client.js';

/**
 * Get list of chat messages with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.related_lead] - Filter by lead ID
 * @param {string} [params.related_contact] - Filter by contact ID
 * @param {string} [params.related_deal] - Filter by deal ID
 * @param {string} [params.sender] - Filter by sender user ID
 * @param {string} [params.parent] - Filter by parent message ID (for threads)
 * @param {string} [params.search] - Search in message content
 * @param {string} [params.ordering] - Ordering field (e.g., '-created_at')
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getChatMessages(params = {}) {
  return apiClient.get('/api/chat-messages/', { params });
}

/**
 * Get a single chat message by ID
 * @param {string|number} id - Message ID
 * @returns {Promise<Object>}
 */
export async function getChatMessage(id) {
  return apiClient.get(`/api/chat-messages/${id}/`);
}

/**
 * Create a new chat message
 * @param {Object} data - Message data
 * @param {string} data.content - Message content (required)
 * @param {string} [data.related_lead] - Related lead ID
 * @param {string} [data.related_contact] - Related contact ID
 * @param {string} [data.related_deal] - Related deal ID
 * @param {string} [data.parent] - Parent message ID (for replies/threads)
 * @returns {Promise<Object>}
 */
export async function createChatMessage(data) {
  return apiClient.post('/api/chat-messages/', data);
}

/**
 * Update a chat message
 * @param {string|number} id - Message ID
 * @param {Object} data - Updated message data
 * @returns {Promise<Object>}
 */
export async function updateChatMessage(id, data) {
  return apiClient.patch(`/api/chat-messages/${id}/`, data);
}

/**
 * Delete a chat message
 * @param {string|number} id - Message ID
 * @returns {Promise<void>}
 */
export async function deleteChatMessage(id) {
  return apiClient.delete(`/api/chat-messages/${id}/`);
}

/**
 * Get thread (replies) for a message
 * @param {string|number} parentId - Parent message ID
 * @param {Object} params - Query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getMessageThread(parentId, params = {}) {
  return getChatMessages({ ...params, parent: parentId, ordering: 'created_at' });
}

/**
 * Get chat messages for a specific entity (lead, contact, or deal)
 * @param {string} entityType - Entity type ('lead', 'contact', 'deal')
 * @param {string|number} entityId - Entity ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getEntityChatMessages(entityType, entityId, params = {}) {
  const filterKey = `related_${entityType}`;
  return getChatMessages({ ...params, [filterKey]: entityId, ordering: '-created_at' });
}

/**
 * Mark messages as read (custom action if available in API)
 * @param {Array<string|number>} messageIds - Array of message IDs
 * @returns {Promise<Object>}
 */
export async function markMessagesAsRead(messageIds) {
  // This would require a custom endpoint in the backend
  // For now, we can update each message individually if needed
  return Promise.all(
    messageIds.map(id => updateChatMessage(id, { is_read: true }))
  );
}
