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

const notSupported = (feature) =>
  Promise.reject(new Error(`${feature} is not available in Django-CRM API.yaml.`));

export const getFacebookConversations = () => notSupported('Facebook conversations');
export const getFacebookMessages = () => notSupported('Facebook messages');
export const sendFacebookMessage = () => notSupported('Facebook send message');
export const getFacebookStats = () => notSupported('Facebook stats');
