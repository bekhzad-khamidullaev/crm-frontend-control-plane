/**
 * Instagram Integration API
 * Instagram Business API integration
 */

import { api } from '../client';

/**
 * Connect Instagram account
 * @param {Object} data
 * @param {string} data.access_token - Instagram access token
 * @param {string} data.instagram_business_account_id - Business account ID
 * @returns {Promise<Object>}
 */
export async function connectInstagram(data) {
  return api.post('/api/integrations/instagram/connect/', data);
}

/**
 * Disconnect Instagram account
 * @returns {Promise<void>}
 */
export async function disconnectInstagram() {
  return api.post('/api/integrations/instagram/disconnect/');
}

/**
 * Get Instagram connection status
 * @returns {Promise<Object>}
 */
export async function getInstagramStatus() {
  return api.get('/api/integrations/instagram/status/');
}

/**
 * Get Instagram messages/comments
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<Object>}
 */
export async function getInstagramMessages(params = {}) {
  return api.get('/api/integrations/instagram/messages/', { params });
}

/**
 * Send Instagram direct message
 * @param {Object} data
 * @param {string} data.recipient_id - Instagram user ID
 * @param {string} data.message - Message text
 * @returns {Promise<Object>}
 */
export async function sendInstagramMessage(data) {
  return api.post('/api/integrations/instagram/send-message/', data);
}

/**
 * Reply to Instagram comment
 * @param {Object} data
 * @param {string} data.comment_id - Comment ID
 * @param {string} data.message - Reply text
 * @returns {Promise<Object>}
 */
export async function replyToInstagramComment(data) {
  return api.post('/api/integrations/instagram/reply-comment/', data);
}

/**
 * Sync Instagram contacts
 * @returns {Promise<Object>}
 */
export async function syncInstagramContacts() {
  return api.post('/api/integrations/instagram/sync-contacts/');
}

/**
 * Get Instagram statistics
 * @returns {Promise<Object>}
 */
export async function getInstagramStats() {
  return api.get('/api/integrations/instagram/statistics/');
}
