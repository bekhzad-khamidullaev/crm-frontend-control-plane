/**
 * Facebook Messenger Integration API
 */

import { api } from '../client';

/**
 * Connect Facebook page
 * @param {Object} data
 * @param {string} data.access_token - Facebook page access token
 * @param {string} data.page_id - Facebook page ID
 * @returns {Promise<Object>}
 */
export async function connectFacebook(data) {
  return api.post('/api/integrations/facebook/connect/', data);
}

/**
 * Disconnect Facebook page
 * @returns {Promise<void>}
 */
export async function disconnectFacebook() {
  return api.post('/api/integrations/facebook/disconnect/');
}

/**
 * Get Facebook connection status
 * @returns {Promise<Object>}
 */
export async function getFacebookStatus() {
  return api.get('/api/integrations/facebook/status/');
}

/**
 * Get Facebook Messenger conversations
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getFacebookConversations(params = {}) {
  return api.get('/api/integrations/facebook/conversations/', { params });
}

/**
 * Get messages from conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getFacebookMessages(conversationId, params = {}) {
  return api.get(`/api/integrations/facebook/conversations/${conversationId}/messages/`, { params });
}

/**
 * Send Facebook message
 * @param {Object} data
 * @param {string} data.recipient_id - Recipient PSID
 * @param {string} data.message - Message text
 * @returns {Promise<Object>}
 */
export async function sendFacebookMessage(data) {
  return api.post('/api/integrations/facebook/send-message/', data);
}

/**
 * Get Facebook statistics
 * @returns {Promise<Object>}
 */
export async function getFacebookStats() {
  return api.get('/api/integrations/facebook/statistics/');
}
