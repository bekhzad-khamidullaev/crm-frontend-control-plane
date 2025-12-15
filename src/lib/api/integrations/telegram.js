/**
 * Telegram Integration API (not part of Django-CRM API.yaml)
 * Disabled to prevent unsupported calls.
 */

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml (integrations/* endpoints missing).`));

/**
 * Connect Telegram bot
 * @param {Object} data
 * @param {string} data.bot_token - Telegram bot token from @BotFather
 * @returns {Promise<Object>}
 */
export const connectTelegramBot = () => notSupported('Telegram connect');

/**
 * Disconnect Telegram bot
 * @returns {Promise<void>}
 */
export const disconnectTelegramBot = () => notSupported('Telegram disconnect');

/**
 * Get Telegram bot status
 * @returns {Promise<Object>}
 */
export const getTelegramStatus = () => notSupported('Telegram status');

/**
 * Get Telegram updates/messages
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export const getTelegramUpdates = () => notSupported('Telegram updates');

/**
 * Send Telegram message
 * @param {Object} data
 * @param {string} data.chat_id - Telegram chat ID
 * @param {string} data.message - Message text
 * @returns {Promise<Object>}
 */
export const sendTelegramMessage = () => notSupported('Telegram send message');

/**
 * Set Telegram webhook
 * @param {Object} data
 * @param {string} data.webhook_url - Webhook URL
 * @returns {Promise<Object>}
 */
export const setTelegramWebhook = () => notSupported('Telegram set webhook');

/**
 * Get Telegram webhook info
 * @returns {Promise<Object>}
 */
export const getTelegramWebhookInfo = () => notSupported('Telegram webhook info');

/**
 * Get Telegram statistics
 * @returns {Promise<Object>}
 */
export const getTelegramStats = () => notSupported('Telegram statistics');
