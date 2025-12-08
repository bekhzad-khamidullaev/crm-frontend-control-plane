/**
 * SMS API
 * SMS sending and management
 */

import { api } from './client';

/**
 * Send single SMS
 * @param {Object} data
 * @param {string} data.phone_number - Phone number
 * @param {string} data.message - SMS text
 * @param {string} [data.entity_type] - Entity type (contact, lead, etc.)
 * @param {number} [data.entity_id] - Entity ID
 * @returns {Promise<Object>}
 */
export async function sendSMS(data) {
  return api.post('/api/sms/send/', data);
}

/**
 * Send bulk SMS
 * @param {Object} data
 * @param {Array<string>} data.phone_numbers - Array of phone numbers
 * @param {string} data.message - SMS text
 * @param {string} [data.template_id] - Template ID (optional)
 * @returns {Promise<Object>}
 */
export async function sendBulkSMS(data) {
  return api.post('/api/sms/send-bulk/', data);
}

/**
 * Get SMS history
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @param {string} [params.status] - Filter by status (sent, failed, pending)
 * @returns {Promise<Object>}
 */
export async function getSMSHistory(params = {}) {
  return api.get('/api/sms/history/', { params });
}

/**
 * Get SMS templates
 * @returns {Promise<Array>}
 */
export async function getSMSTemplates() {
  return api.get('/api/sms/templates/');
}

/**
 * Create SMS template
 * @param {Object} data
 * @param {string} data.name - Template name
 * @param {string} data.content - Template content
 * @returns {Promise<Object>}
 */
export async function createSMSTemplate(data) {
  return api.post('/api/sms/templates/', data);
}

/**
 * Update SMS template
 * @param {string} id - Template ID
 * @param {Object} data - Template data
 * @returns {Promise<Object>}
 */
export async function updateSMSTemplate(id, data) {
  return api.patch(`/api/sms/templates/${id}/`, data);
}

/**
 * Delete SMS template
 * @param {string} id - Template ID
 * @returns {Promise<void>}
 */
export async function deleteSMSTemplate(id) {
  return api.delete(`/api/sms/templates/${id}/`);
}

/**
 * Get SMS statistics
 * @param {Object} [params]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @returns {Promise<Object>}
 */
export async function getSMSStats(params = {}) {
  return api.get('/api/sms/statistics/', { params });
}

/**
 * Get SMS balance (provider dependent)
 * @returns {Promise<Object>}
 */
export async function getSMSBalance() {
  return api.get('/api/sms/balance/');
}

/**
 * Get SMS provider configuration
 * @returns {Promise<Object>}
 */
export async function getSMSProviderConfig() {
  return api.get('/api/sms/provider-config/');
}

/**
 * Update SMS provider configuration
 * @param {Object} data
 * @param {string} data.provider - Provider (twilio, vonage, smsc, etc.)
 * @param {string} data.api_key - API key
 * @param {string} data.api_secret - API secret
 * @param {string} data.sender - Sender name/number
 * @returns {Promise<Object>}
 */
export async function updateSMSProviderConfig(data) {
  return api.post('/api/sms/provider-config/', data);
}

/**
 * Test SMS connection
 * @param {Object} data
 * @param {string} data.phone_number - Test phone number
 * @returns {Promise<Object>}
 */
export async function testSMSConnection(data) {
  return api.post('/api/sms/test/', data);
}
