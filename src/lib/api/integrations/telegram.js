/**
 * Telegram Integration API
 * Telegram Bot API integration
 */

import { api } from '../client';

/**
 * Connect Telegram bot
 * @param {Object} data
 * @param {string} data.bot_token - Telegram bot token from @BotFather
 * @returns {Promise<Object>}
 */
export async function connectTelegramBot(data) {
  return api.post('/api/integrations/telegram/connect/', data);
}

/**
 * Disconnect Telegram bot
 * @returns {Promise<void>}
 */
export async function disconnectTelegramBot() {
  return api.post('/api/integrations/telegram/disconnect/');
}

/**
 * Get Telegram bot status
 * @returns {Promise<Object>}
 */
export async function getTelegramStatus() {
  return api.get('/api/integrations/telegram/status/');
}

/**
 * Get Telegram updates/messages
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getTelegramUpdates(params = {}) {
  return api.get('/api/integrations/telegram/updates/', { params });
}

/**
 * Send Telegram message
 * @param {Object} data
 * @param {string} data.chat_id - Telegram chat ID
 * @param {string} data.message - Message text
 * @returns {Promise<Object>}
 */
export async function sendTelegramMessage(data) {
  return api.post('/api/integrations/telegram/send-message/', data);
}

/**
 * Set Telegram webhook
 * @param {Object} data
 * @param {string} data.webhook_url - Webhook URL
 * @returns {Promise<Object>}
 */
export async function setTelegramWebhook(data) {
  return api.post('/api/integrations/telegram/set-webhook/', data);
}

/**
 * Get Telegram webhook info
 * @returns {Promise<Object>}
 */
export async function getTelegramWebhookInfo() {
  return api.get('/api/integrations/telegram/webhook-info/');
}

/**
 * Get Telegram statistics
 * @returns {Promise<Object>}
 */
export async function getTelegramStats() {
  return api.get('/api/integrations/telegram/statistics/');
}
