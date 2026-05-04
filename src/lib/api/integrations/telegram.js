/**
 * Telegram Integration API
 * Backed by /api/settings/telegram/bots/ endpoints.
 */

import { api } from '../client.js';

const normalizeBotPayload = (data = {}) => {
  const payload = { ...data };
  if (!payload.webhook_url) {
    delete payload.webhook_url;
  }
  return payload;
};

export const getTelegramBots = (params = {}) =>
  api.get('/api/settings/telegram/bots/', { params });

export const getTelegramUserAccounts = (params = {}) =>
  api.get('/api/settings/telegram/users/', { params });

export const getTelegramBot = (id) =>
  api.get(`/api/settings/telegram/bots/${id}/`);

export const getTelegramUserAccount = (id) =>
  api.get(`/api/settings/telegram/users/${id}/`);

/**
 * Connect Telegram bot
 * @param {Object} data
 * @param {string} data.bot_token - Telegram bot token from @BotFather
 * @returns {Promise<Object>}
 */
export const connectTelegramBot = (data) =>
  api.post('/api/settings/telegram/bots/', { body: normalizeBotPayload(data) });

export const connectTelegramUserAccount = (data) =>
  api.post('/api/settings/telegram/users/', { body: data });

/**
 * Update Telegram bot settings
 * @param {string|number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateTelegramBot = (id, data) =>
  api.patch(`/api/settings/telegram/bots/${id}/`, { body: data });

export const updateTelegramUserAccount = (id, data) =>
  api.patch(`/api/settings/telegram/users/${id}/`, { body: data });

/**
 * Disconnect Telegram bot
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const disconnectTelegramBot = async (id) => {
  try {
    return await api.post(`/api/settings/telegram/bots/${id}/disconnect/`, { body: {} });
  } catch {
    return api.delete(`/api/settings/telegram/bots/${id}/`);
  }
};

export const disconnectTelegramUserAccount = async (id) => {
  try {
    return await api.post(`/api/settings/telegram/users/${id}/disconnect/`, { body: {} });
  } catch {
    return api.delete(`/api/settings/telegram/users/${id}/`);
  }
};

/**
 * Test Telegram bot connection
 * @param {string|number} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const testTelegramBot = (id, payload = {}) =>
  api.post(`/api/settings/telegram/bots/${id}/test/`, { body: payload });

export const testTelegramUserAccount = (id, payload = {}) =>
  api.post(`/api/settings/telegram/users/${id}/test/`, { body: payload });

export const requestTelegramUserCode = (id, payload = {}) =>
  api.post(`/api/settings/telegram/users/${id}/request_code/`, { body: payload });

export const confirmTelegramUserCode = (id, payload = {}) =>
  api.post(`/api/settings/telegram/users/${id}/confirm_code/`, { body: payload });

export const confirmTelegramUserPassword = (id, payload = {}) =>
  api.post(`/api/settings/telegram/users/${id}/confirm_2fa/`, { body: payload });

export const syncTelegramUserInbox = (id, payload = {}) =>
  api.post(`/api/settings/telegram/users/${id}/sync_inbox/`, { body: payload });

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
  const [botsResponse, usersResponse] = await Promise.all([
    getTelegramBots(),
    getTelegramUserAccounts().catch(() => []),
  ]);
  const items = botsResponse?.results || botsResponse || [];
  const users = usersResponse?.results || usersResponse || [];
  return {
    connected: items.length > 0 || users.length > 0,
    count: items.length,
    userCount: users.length,
    bots: items,
    users,
  };
};

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml.`));

export const getTelegramUpdates = () => notSupported('Telegram updates');
export const sendTelegramMessage = () => notSupported('Telegram send message');
export const getTelegramWebhookInfo = () => notSupported('Telegram webhook info');
export const getTelegramStats = () => notSupported('Telegram statistics');
