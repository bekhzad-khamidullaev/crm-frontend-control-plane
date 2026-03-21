/**
 * Instagram Integration API
 * Backed by /api/settings/instagram/accounts/ endpoints.
 */

import { api } from '../client.js';

const normalizePayload = (data = {}) => {
  const payload = { ...data };
  if (payload.instagram_business_account_id && !payload.instagram_user_id) {
    payload.instagram_user_id = payload.instagram_business_account_id;
  }
  if (payload.instagram_username && !payload.username) {
    payload.username = payload.instagram_username;
  }
  delete payload.instagram_business_account_id;
  delete payload.instagram_username;
  return payload;
};

export const getInstagramAccounts = (params = {}) =>
  api.get('/api/settings/instagram/accounts/', { params });

export const getInstagramAccount = (id) =>
  api.get(`/api/settings/instagram/accounts/${id}/`);

/**
 * Connect Instagram account
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const connectInstagram = (data) =>
  api.post('/api/settings/instagram/accounts/', { body: normalizePayload(data) });

export const discoverInstagramAccounts = (accessToken) =>
  api.post('/api/settings/instagram/accounts/discover/', {
    body: { access_token: accessToken },
  });

/**
 * Update Instagram account settings
 * @param {string|number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateInstagramAccount = (id, data) =>
  api.patch(`/api/settings/instagram/accounts/${id}/`, { body: data });

/**
 * Disconnect Instagram account
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const disconnectInstagram = async (id) => {
  try {
    return await api.post(`/api/settings/instagram/accounts/${id}/disconnect/`, { body: {} });
  } catch {
    return api.delete(`/api/settings/instagram/accounts/${id}/`);
  }
};

export const testInstagramAccount = (id, payload = {}) =>
  api.post(`/api/settings/instagram/accounts/${id}/test/`, { body: payload });

export const getInstagramStatus = async () => {
  const response = await getInstagramAccounts();
  const items = response?.results || response || [];
  return {
    connected: items.length > 0,
    count: items.length,
    accounts: items,
  };
};

export const getInstagramMessages = (params = {}) =>
  api.get('/api/settings/omnichannel/timeline/', {
    params: { ...params, channel: 'instagram' },
  });

export const sendInstagramMessage = ({ channel_id, recipient_id, handle, text }) =>
  api.post('/api/settings/omnichannel/send/', {
    body: {
      channel: 'instagram',
      channel_id,
      recipient_id,
      handle,
      text,
    },
  });

export const replyToInstagramComment = ({ channel_id, recipient_id, text }) =>
  sendInstagramMessage({ channel_id, recipient_id, text });

export const syncInstagramContacts = () =>
  Promise.resolve({ success: true, detail: 'Auto-sync is handled by webhook pipeline.' });

export const getInstagramStats = async () => {
  const response = await getInstagramMessages({ limit: 200 });
  const items = response?.results || [];
  return {
    total: items.length,
    inbound: items.filter((item) => item.direction === 'in').length,
    outbound: items.filter((item) => item.direction === 'out').length,
  };
};
