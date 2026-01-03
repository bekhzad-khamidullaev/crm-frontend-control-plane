/**
 * Telegram Integration API
 * Backed by /api/settings/telegram/bots/ endpoints.
 */

import { api } from '../client.js';

export const getTelegramBots = (params = {}) =>
  api.get('/api/settings/telegram/bots/', { params });

export const getTelegramBot = (id) =>
  api.get(`/api/settings/telegram/bots/${id}/`);

/**
 * Connect Telegram bot
 * @param {Object} data
 * @param {string} data.bot_token - Telegram bot token from @BotFather
 * @returns {Promise<Object>}
 */
export const connectTelegramBot = (data) =>
  api.post('/api/settings/telegram/bots/', { body: data });

/**
 * Update Telegram bot settings
 * @param {string|number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateTelegramBot = (id, data) =>
  api.patch(`/api/settings/telegram/bots/${id}/`, { body: data });

/**
 * Disconnect Telegram bot
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const disconnectTelegramBot = (id) =>
  api.delete(`/api/settings/telegram/bots/${id}/`);

/**
 * Test Telegram bot connection
 * @param {string|number} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const testTelegramBot = (id, payload = {}) =>
  api.post(`/api/settings/telegram/bots/${id}/test/`, { body: payload });

/**
 * Set Telegram webhook
 * @param {string|number} id
 * @param {Object} data
 * @param {string} data.webhook_url - Webhook URL
 * @returns {Promise<Object>}
 */
export const setTelegramWebhook = (id, data) =>
  api.post(`/api/settings/telegram/bots/${id}/set_webhook/`, { body: data });

export const getTelegramStatus = async () => {
  const response = await getTelegramBots();
  const items = response?.results || response || [];
  return {
    connected: items.length > 0,
    count: items.length,
    bots: items,
  };
};

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml.`));

export const getTelegramUpdates = () => notSupported('Telegram updates');
export const sendTelegramMessage = () => notSupported('Telegram send message');
export const getTelegramWebhookInfo = () => notSupported('Telegram webhook info');
export const getTelegramStats = () => notSupported('Telegram statistics');
