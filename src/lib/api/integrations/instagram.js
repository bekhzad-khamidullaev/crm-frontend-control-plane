/**
 * Instagram Integration API (not part of Django-CRM API.yaml)
 * Disabled to prevent unsupported calls.
 */

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml (integrations/* endpoints missing).`));

/**
 * Connect Instagram account
 * @param {Object} data
 * @param {string} data.access_token - Instagram access token
 * @param {string} data.instagram_business_account_id - Business account ID
 * @returns {Promise<Object>}
 */
export const connectInstagram = () => notSupported('Instagram connect');

/**
 * Disconnect Instagram account
 * @returns {Promise<void>}
 */
export const disconnectInstagram = () => notSupported('Instagram disconnect');

/**
 * Get Instagram connection status
 * @returns {Promise<Object>}
 */
export const getInstagramStatus = () => notSupported('Instagram status');

/**
 * Get Instagram messages/comments
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<Object>}
 */
export const getInstagramMessages = () => notSupported('Instagram messages');

/**
 * Send Instagram direct message
 * @param {Object} data
 * @param {string} data.recipient_id - Instagram user ID
 * @param {string} data.message - Message text
 * @returns {Promise<Object>}
 */
export const sendInstagramMessage = () => notSupported('Instagram send message');

/**
 * Reply to Instagram comment
 * @param {Object} data
 * @param {string} data.comment_id - Comment ID
 * @param {string} data.message - Reply text
 * @returns {Promise<Object>}
 */
export const replyToInstagramComment = () => notSupported('Instagram reply comment');

/**
 * Sync Instagram contacts
 * @returns {Promise<Object>}
 */
export const syncInstagramContacts = () => notSupported('Instagram sync contacts');

/**
 * Get Instagram statistics
 * @returns {Promise<Object>}
 */
export const getInstagramStats = () => notSupported('Instagram statistics');
