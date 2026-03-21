/**
 * Facebook Messenger Integration API
 * Backed by /api/settings/facebook/pages/ endpoints.
 */

import { api } from '../client.js';

const normalizePayload = (data = {}) => {
  const payload = { ...data };
  if (payload.page_id && !payload.facebook_page_id) {
    payload.facebook_page_id = payload.page_id;
  }
  delete payload.page_id;
  return payload;
};

export const getFacebookPages = (params = {}) => api.get('/api/settings/facebook/pages/', { params });
export const getFacebookPage = (id) => api.get(`/api/settings/facebook/pages/${id}/`);

export const connectFacebook = (data) =>
  api.post('/api/settings/facebook/pages/', { body: normalizePayload(data) });

export const discoverFacebookPages = (accessToken) =>
  api.post('/api/settings/facebook/pages/discover/', {
    body: { access_token: accessToken },
  });

export const updateFacebookPage = (id, data) =>
  api.patch(`/api/settings/facebook/pages/${id}/`, { body: data });

export const testFacebookPage = (id, payload = {}) =>
  api.post(`/api/settings/facebook/pages/${id}/test/`, { body: payload });

export const disconnectFacebook = async (id) => {
  try {
    return await api.post(`/api/settings/facebook/pages/${id}/disconnect/`, { body: {} });
  } catch {
    return api.delete(`/api/settings/facebook/pages/${id}/`);
  }
};

export const getFacebookStatus = async () => {
  const response = await getFacebookPages();
  const items = response?.results || response || [];
  return {
    connected: items.length > 0,
    count: items.length,
    pages: items,
  };
};

export const getFacebookConversations = (params = {}) =>
  api.get('/api/settings/omnichannel/timeline/', {
    params: { ...params, channel: 'facebook' },
  });

export const getFacebookMessages = getFacebookConversations;

export const sendFacebookMessage = ({ channel_id, recipient_id, text }) =>
  api.post('/api/settings/omnichannel/send/', {
    body: {
      channel: 'facebook',
      channel_id,
      recipient_id,
      text,
    },
  });

export const getFacebookStats = async () => {
  const response = await getFacebookConversations({ limit: 200 });
  const items = response?.results || [];
  const inbound = items.filter((item) => item.direction === 'in').length;
  const outbound = items.filter((item) => item.direction === 'out').length;
  return {
    total: items.length,
    inbound,
    outbound,
  };
};
