/**
 * Chat API client
 * Handles all chat-messages operations according to Django-CRM API.yaml
 */

import { api as apiClient } from './client.js';

/**
 * Get list of chat messages with optional filters
 * @param {Object} params - Query parameters
 * @param {number} [params.content_type] - Filter by content type ID
 * @param {number} [params.object_id] - Filter by related object ID
 * @param {string} [params.owner] - Filter by owner user ID
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
  const payload = {
    ...data,
    content: data.content ?? data.message,
  };
  delete payload.message;
  return apiClient.post('/api/chat-messages/', { body: payload });
}

/**
 * Update a chat message
 * @param {string|number} id - Message ID
 * @param {Object} data - Updated message data
 * @returns {Promise<Object>}
 */
export async function updateChatMessage(id, data) {
  const payload = {
    ...data,
    content: data.content ?? data.message,
  };
  delete payload.message;
  return apiClient.patch(`/api/chat-messages/${id}/`, { body: payload });
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
  try {
    return await apiClient.get(`/api/chat-messages/${parentId}/thread/`, { params });
  } catch {
    return getChatMessages({ ...params, answer_to: parentId, ordering: 'creation_date' });
  }
}

/**
 * Get direct replies for a message
 * @param {string|number} parentId - Parent message ID
 * @param {Object} params - Query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getMessageReplies(parentId, params = {}) {
  try {
    return await apiClient.get(`/api/chat-messages/${parentId}/replies/`, { params });
  } catch {
    return getChatMessages({ ...params, answer_to: parentId, ordering: 'creation_date' });
  }
}

/**
 * Get chat messages for a specific entity (lead, contact, or deal)
 * @param {string} entityType - Entity type ('lead', 'contact', 'deal')
 * @param {string|number} entityId - Entity ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getEntityChatMessages(entityType, entityId, params = {}) {
  const response = await getChatMessages({ ...params, ordering: '-creation_date' });
  const results = response?.results || response || [];
  const normalizedType = typeof entityType === 'string' ? entityType.toLowerCase() : entityType;

  const filtered = results.filter((msg) => {
    const msgType = (msg.content_type_name || msg.content_type || '').toString().toLowerCase();
    const typeMatches = normalizedType
      ? msgType.includes(normalizedType) || Number(msg.content_type) === Number(normalizedType)
      : true;
    const idMatches = entityId ? Number(msg.object_id) === Number(entityId) : true;
    return typeMatches && idMatches;
  });

  return { count: filtered.length, results: filtered };
}

/**
 * Mark messages as read
 * Note: Bulk mark-read endpoint doesn't exist in API.yaml
 * Falls back to individual updates
 * @param {Array<string|number>} messageIds - Array of message IDs
 * @returns {Promise<Object>}
 */
export async function markMessagesAsRead(messageIds) {
  return Promise.all(messageIds.map((id) => updateChatMessage(id, { is_read: true })));
}

/**
 * Get chat statistics
 * Note: This endpoint doesn't exist in API.yaml
 * Calculates statistics from fetched messages
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getChatStatistics(params = {}) {
  const messages = await getChatMessages({ ...params, page_size: 1000 });
  const results = messages?.results || messages || [];

  const stats = {
    total: Array.isArray(results) ? results.length : 0,
    unread: 0,
    by_entity_type: {},
    today: 0,
    this_week: 0,
  };

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  results.forEach((msg) => {
    const createdAt = new Date(msg.creation_date || msg.created_at || msg.timestamp || Date.now());
    if (createdAt >= todayStart) stats.today++;
    if (createdAt >= weekStart) stats.this_week++;

    const typeName = (msg.content_type_name || msg.content_type || 'unknown').toString().toLowerCase();
    stats.by_entity_type[typeName] = (stats.by_entity_type[typeName] || 0) + 1;
  });

  return { data: stats };
}

/**
 * Search messages
 * @param {string} query - Search query
 * @param {Object} params - Additional parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function searchMessages(query, params = {}) {
  return getChatMessages({
    ...params,
    search: query,
    ordering: '-created_at',
  });
}

/**
 * Reply to a message (creates a message with parent reference)
 * @param {string|number} parentId - Parent message ID
 * @param {Object} data - Reply data
 * @returns {Promise<Object>}
 */
export async function replyToMessage(parentId, data) {
  return createChatMessage({
    ...data,
    parent: parentId,
  });
}

/**
 * Get unread message count
 * @param {Object} params - Query parameters
 * @returns {Promise<number>}
 */
export async function getUnreadCount(params = {}) {
  const response = await getChatMessages({ ...params, page_size: 1 });
  return response?.count || 0;
}

/**
 * Get messages for a company (through related contacts)
 * @param {string|number} companyId - Company ID
 * @param {Object} params - Additional parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCompanyChatMessages(companyId, params = {}) {
  const response = await getChatMessages({ ...params, ordering: '-creation_date' });
  const results = response?.results || response || [];
  const filtered = results.filter((msg) => Number(msg.company_id || msg.company) === Number(companyId));
  return { count: filtered.length, results: filtered };
}
