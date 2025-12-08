/**
 * Mass Mail API
 * 
 * Управление массовыми email рассылками:
 * - Email аккаунты для отправки
 * - Рассылки (mailings)
 * - Сообщения
 * - Подписи
 */

import { api } from './client.js';

// ============================================================================
// Email Accounts (почтовые аккаунты для отправки)
// ============================================================================

/**
 * Get all email accounts
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailAccounts(params = {}) {
  return api.get('/api/massmail/email-accounts/', { params });
}

/**
 * Get single email account by ID
 * @param {number} id - Email account ID
 * @returns {Promise<Object>}
 */
export async function getEmailAccount(id) {
  return api.get(`/api/massmail/email-accounts/${id}/`);
}

/**
 * Create new email account
 * @param {Object} data - Email account data
 * @param {string} data.email - Email address (required)
 * @param {string} data.name - Display name
 * @param {string} data.smtp_host - SMTP host (required)
 * @param {number} data.smtp_port - SMTP port (required)
 * @param {string} data.smtp_username - SMTP username
 * @param {string} data.smtp_password - SMTP password
 * @param {boolean} data.use_tls - Use TLS
 * @param {boolean} data.use_ssl - Use SSL
 * @param {boolean} data.is_active - Is active
 * @returns {Promise<Object>}
 */
export async function createEmailAccount(data) {
  return api.post('/api/massmail/email-accounts/', data);
}

/**
 * Update email account (full update)
 * @param {number} id - Email account ID
 * @param {Object} data - Email account data
 * @returns {Promise<Object>}
 */
export async function updateEmailAccount(id, data) {
  return api.put(`/api/massmail/email-accounts/${id}/`, data);
}

/**
 * Partially update email account
 * @param {number} id - Email account ID
 * @param {Object} data - Partial email account data
 * @returns {Promise<Object>}
 */
export async function patchEmailAccount(id, data) {
  return api.patch(`/api/massmail/email-accounts/${id}/`, data);
}

/**
 * Delete email account
 * @param {number} id - Email account ID
 * @returns {Promise<void>}
 */
export async function deleteEmailAccount(id) {
  return api.delete(`/api/massmail/email-accounts/${id}/`);
}

// ============================================================================
// Mailings (рассылки)
// ============================================================================

/**
 * Get all mailings
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getMailings(params = {}) {
  return api.get('/api/massmail/mailings/', { params });
}

/**
 * Get single mailing by ID
 * @param {number} id - Mailing ID
 * @returns {Promise<Object>}
 */
export async function getMailing(id) {
  return api.get(`/api/massmail/mailings/${id}/`);
}

// Note: Mailings are read-only in the API (created/managed through backend)
// POST/PUT/DELETE endpoints not available for mailings

// ============================================================================
// Messages (сообщения рассылки)
// ============================================================================

/**
 * Get all messages
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {number} params.mailing - Filter by mailing ID
 * @param {string} params.status - Filter by status
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getMessages(params = {}) {
  return api.get('/api/massmail/messages/', { params });
}

/**
 * Get single message by ID
 * @param {number} id - Message ID
 * @returns {Promise<Object>}
 */
export async function getMessage(id) {
  return api.get(`/api/massmail/messages/${id}/`);
}

/**
 * Create new message
 * @param {Object} data - Message data
 * @param {number} data.mailing - Mailing ID (required)
 * @param {string} data.recipient_email - Recipient email (required)
 * @param {string} data.subject - Email subject (required)
 * @param {string} data.body_html - HTML body
 * @param {string} data.body_text - Plain text body
 * @param {number} data.signature - Signature ID
 * @returns {Promise<Object>}
 */
export async function createMessage(data) {
  return api.post('/api/massmail/messages/', data);
}

/**
 * Update message (full update)
 * @param {number} id - Message ID
 * @param {Object} data - Message data
 * @returns {Promise<Object>}
 */
export async function updateMessage(id, data) {
  return api.put(`/api/massmail/messages/${id}/`, data);
}

/**
 * Partially update message
 * @param {number} id - Message ID
 * @param {Object} data - Partial message data
 * @returns {Promise<Object>}
 */
export async function patchMessage(id, data) {
  return api.patch(`/api/massmail/messages/${id}/`, data);
}

/**
 * Delete message
 * @param {number} id - Message ID
 * @returns {Promise<void>}
 */
export async function deleteMessage(id) {
  return api.delete(`/api/massmail/messages/${id}/`);
}

// ============================================================================
// Signatures (подписи для писем)
// ============================================================================

/**
 * Get all signatures
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getSignatures(params = {}) {
  return api.get('/api/massmail/signatures/', { params });
}

/**
 * Get single signature by ID
 * @param {number} id - Signature ID
 * @returns {Promise<Object>}
 */
export async function getSignature(id) {
  return api.get(`/api/massmail/signatures/${id}/`);
}

/**
 * Create new signature
 * @param {Object} data - Signature data
 * @param {string} data.name - Signature name (required)
 * @param {string} data.content - Signature content HTML (required)
 * @param {boolean} data.is_default - Is default signature
 * @returns {Promise<Object>}
 */
export async function createSignature(data) {
  return api.post('/api/massmail/signatures/', data);
}

/**
 * Update signature (full update)
 * @param {number} id - Signature ID
 * @param {Object} data - Signature data
 * @returns {Promise<Object>}
 */
export async function updateSignature(id, data) {
  return api.put(`/api/massmail/signatures/${id}/`, data);
}

/**
 * Partially update signature
 * @param {number} id - Signature ID
 * @param {Object} data - Partial signature data
 * @returns {Promise<Object>}
 */
export async function patchSignature(id, data) {
  return api.patch(`/api/massmail/signatures/${id}/`, data);
}

/**
 * Delete signature
 * @param {number} id - Signature ID
 * @returns {Promise<void>}
 */
export async function deleteSignature(id) {
  return api.delete(`/api/massmail/signatures/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get active email accounts
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getActiveEmailAccounts(params = {}) {
  return getEmailAccounts({ ...params, is_active: true });
}

/**
 * Test email account connection
 * @param {number} id - Email account ID
 * @returns {Promise<Object>}
 */
export async function testEmailAccountConnection(id) {
  // Note: This endpoint may need to be implemented on backend
  // For now, this is a placeholder
  return patchEmailAccount(id, { test_connection: true });
}

/**
 * Get messages by mailing
 * @param {number} mailingId - Mailing ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMessagesByMailing(mailingId, params = {}) {
  return getMessages({ ...params, mailing: mailingId });
}

/**
 * Get messages by status
 * @param {string} status - Message status (pending, sent, failed, bounced)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMessagesByStatus(status, params = {}) {
  return getMessages({ ...params, status });
}

/**
 * Get sent messages
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getSentMessages(params = {}) {
  return getMessagesByStatus('sent', params);
}

/**
 * Get failed messages
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getFailedMessages(params = {}) {
  return getMessagesByStatus('failed', params);
}

/**
 * Get pending messages
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPendingMessages(params = {}) {
  return getMessagesByStatus('pending', params);
}

/**
 * Get default signature
 * @returns {Promise<Object|null>}
 */
export async function getDefaultSignature() {
  const response = await getSignatures({ is_default: true, page_size: 1 });
  const signatures = response.results || response;
  return signatures.length > 0 ? signatures[0] : null;
}

/**
 * Set signature as default
 * @param {number} id - Signature ID
 * @returns {Promise<Object>}
 */
export async function setDefaultSignature(id) {
  return patchSignature(id, { is_default: true });
}

/**
 * Toggle email account status
 * @param {number} id - Email account ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>}
 */
export async function toggleEmailAccountStatus(id, isActive) {
  return patchEmailAccount(id, { is_active: isActive });
}

/**
 * Get mailings by status
 * @param {string} status - Mailing status
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMailingsByStatus(status, params = {}) {
  return getMailings({ ...params, status });
}

/**
 * Clone signature
 * @param {number} id - Signature ID to clone
 * @param {string} newName - New signature name
 * @returns {Promise<Object>}
 */
export async function cloneSignature(id, newName) {
  const signature = await getSignature(id);
  const { id: _, created_at, updated_at, is_default, ...signatureData } = signature;
  
  return createSignature({
    ...signatureData,
    name: newName || `${signature.name} (копия)`,
    is_default: false,
  });
}
