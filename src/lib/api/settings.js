/**
 * Settings API
 * System settings and configuration
 */

import { api } from './client';

/**
 * Get system settings
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  return api.get('/api/settings/');
}

/**
 * Update system settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>}
 */
export async function updateSettings(settings) {
  return api.patch('/api/settings/', settings);
}

/**
 * Get integration settings
 * @param {string} integration - Integration name (instagram, facebook, telegram, etc.)
 * @returns {Promise<Object>}
 */
export async function getIntegrationSettings(integration) {
  return api.get(`/api/settings/integrations/${integration}/`);
}

/**
 * Update integration settings
 * @param {string} integration - Integration name
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>}
 */
export async function updateIntegrationSettings(integration, settings) {
  return api.patch(`/api/settings/integrations/${integration}/`, settings);
}

/**
 * Get API keys
 * @returns {Promise<Array>}
 */
export async function getAPIKeys() {
  return api.get('/api/settings/api-keys/');
}

/**
 * Create new API key
 * @param {Object} data
 * @param {string} data.name - Key name
 * @param {Array<string>} [data.permissions] - Permissions
 * @returns {Promise<Object>}
 */
export async function createAPIKey(data) {
  return api.post('/api/settings/api-keys/', data);
}

/**
 * Revoke API key
 * @param {string} keyId - Key ID
 * @returns {Promise<void>}
 */
export async function revokeAPIKey(keyId) {
  return api.delete(`/api/settings/api-keys/${keyId}/`);
}

/**
 * Get webhooks
 * @returns {Promise<Array>}
 */
export async function getWebhooks() {
  return api.get('/api/settings/webhooks/');
}

/**
 * Create webhook
 * @param {Object} data
 * @param {string} data.url - Webhook URL
 * @param {string} data.event - Event type
 * @param {boolean} [data.active] - Is active
 * @returns {Promise<Object>}
 */
export async function createWebhook(data) {
  return api.post('/api/settings/webhooks/', data);
}

/**
 * Delete webhook
 * @param {string} webhookId - Webhook ID
 * @returns {Promise<void>}
 */
export async function deleteWebhook(webhookId) {
  return api.delete(`/api/settings/webhooks/${webhookId}/`);
}

/**
 * Test webhook
 * @param {string} webhookId - Webhook ID
 * @returns {Promise<Object>}
 */
export async function testWebhook(webhookId) {
  return api.post(`/api/settings/webhooks/${webhookId}/test/`);
}

/**
 * Get integration logs
 * @param {Object} [params]
 * @param {string} [params.integration] - Filter by integration
 * @param {number} [params.page]
 * @returns {Promise<Object>}
 */
export async function getIntegrationLogs(params = {}) {
  return api.get('/api/settings/integration-logs/', { params });
}

/**
 * Get security settings
 * @returns {Promise<Object>}
 */
export async function getSecuritySettings() {
  return api.get('/api/settings/security/');
}

/**
 * Update security settings
 * @param {Object} settings
 * @param {Array<string>} [settings.ip_whitelist] - IP whitelist
 * @param {number} [settings.rate_limit] - Rate limit
 * @param {boolean} [settings.require_2fa] - Require 2FA
 * @returns {Promise<Object>}
 */
export async function updateSecuritySettings(settings) {
  return api.patch('/api/settings/security/', settings);
}
