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
 * Mark messages as read
 * Note: Bulk mark-read endpoint doesn't exist in API.yaml
 * Falls back to individual updates
 * @param {Array<string|number>} messageIds - Array of message IDs
 * @returns {Promise<Object>}
 */
export async function markMessagesAsRead(messageIds) {
  // Bulk endpoint doesn't exist in API.yaml, use individual updates
  console.warn('Bulk mark-read endpoint not available in API, using individual PATCH requests');
  return Promise.all(
    messageIds.map(id => updateChatMessage(id, { is_read: true }))
  );
}

/**
 * Upload attachment for a chat message
 * Note: This endpoint doesn't exist in API.yaml
 * @param {File} file - File to upload
 * @param {string|number} messageId - Message ID (optional)
 * @returns {Promise<Object>}
 */
export async function uploadAttachment(file, messageId = null) {
  console.warn('Chat attachment upload endpoint not available in API');
  throw new Error('Chat message attachments are not supported by API');
}

/**
 * Delete attachment
 * Note: This endpoint doesn't exist in API.yaml
 * @param {string|number} attachmentId - Attachment ID
 * @returns {Promise<void>}
 */
export async function deleteAttachment(attachmentId) {
  console.warn('Chat attachment deletion endpoint not available in API');
  throw new Error('Chat message attachments are not supported by API');
}

/**
 * Get chat statistics
 * Note: This endpoint doesn't exist in API.yaml
 * Calculates statistics from fetched messages
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getChatStatistics(params = {}) {
  // Statistics endpoint doesn't exist in API.yaml
  console.warn('Chat statistics endpoint not available in API, calculating from messages');
    try {
      const messages = await getChatMessages({ ...params, page_size: 1000 });
      
      const stats = {
        total: messages?.data?.count || 0,
        unread: 0,
        by_entity_type: {
          lead: 0,
          contact: 0,
          deal: 0,
        },
        today: 0,
        this_week: 0,
      };

      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - 7));

      messages?.data?.results?.forEach(msg => {
        if (!msg.is_read) stats.unread++;
        
        const createdAt = new Date(msg.created_at);
        if (createdAt >= todayStart) stats.today++;
        if (createdAt >= weekStart) stats.this_week++;
        
        if (msg.related_lead) stats.by_entity_type.lead++;
        if (msg.related_contact) stats.by_entity_type.contact++;
        if (msg.related_deal) stats.by_entity_type.deal++;
      });

      return { data: stats };
    } catch (innerError) {
      console.error('Error calculating statistics from messages:', innerError);
      return {
        data: {
          total: 0,
          unread: 0,
          by_entity_type: { lead: 0, contact: 0, deal: 0 },
          today: 0,
          this_week: 0,
        }
      };
    }
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
  try {
    const response = await getChatMessages({
      ...params,
      is_read: false,
      page_size: 1,
    });
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Get messages for a company (through related contacts)
 * @param {string|number} companyId - Company ID
 * @param {Object} params - Additional parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCompanyChatMessages(companyId, params = {}) {
  return getChatMessages({
    ...params,
    company: companyId,
    ordering: '-created_at',
  });
}
