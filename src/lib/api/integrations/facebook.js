/**
 * Facebook Messenger Integration API (not part of Django-CRM API.yaml)
 * These endpoints are intentionally disabled to avoid 404s against the official backend.
 */

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml (integrations/* endpoints missing).`));

export const connectFacebook = () => notSupported('Facebook connect');
export const disconnectFacebook = () => notSupported('Facebook disconnect');
export const getFacebookStatus = () => notSupported('Facebook status');
export const getFacebookConversations = () => notSupported('Facebook conversations');
export const getFacebookMessages = () => notSupported('Facebook messages');
export const sendFacebookMessage = () => notSupported('Facebook send message');
export const getFacebookStats = () => notSupported('Facebook stats');
