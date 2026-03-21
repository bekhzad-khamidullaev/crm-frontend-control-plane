/**
 * WhatsApp Integration API
 * Backed by /api/settings/whatsapp/accounts/ endpoints.
 */

import { api } from '../client.js';

export const getWhatsAppAccounts = (params = {}) =>
  api.get('/api/settings/whatsapp/accounts/', { params });

export const getWhatsAppAccount = (id) =>
  api.get(`/api/settings/whatsapp/accounts/${id}/`);

export const connectWhatsAppAccount = (data) =>
  api.post('/api/settings/whatsapp/accounts/', { body: data });

export const discoverWhatsAppAssets = (accessToken) =>
  api.post('/api/settings/whatsapp/accounts/discover/', {
    body: { access_token: accessToken },
  });

export const updateWhatsAppAccount = (id, data) =>
  api.patch(`/api/settings/whatsapp/accounts/${id}/`, { body: data });

export const testWhatsAppAccount = (id, payload = {}) =>
  api.post(`/api/settings/whatsapp/accounts/${id}/test/`, { body: payload });

export const disconnectWhatsAppAccount = async (id) => {
  try {
    return await api.post(`/api/settings/whatsapp/accounts/${id}/disconnect/`, { body: {} });
  } catch {
    return api.delete(`/api/settings/whatsapp/accounts/${id}/`);
  }
};

export const getWhatsAppConversations = (params = {}) =>
  api.get('/api/settings/omnichannel/timeline/', {
    params: { ...params, channel: 'whatsapp' },
  });

export const getWhatsAppMessages = getWhatsAppConversations;

export const sendWhatsAppMessage = ({ channel_id, to, recipient_id, text }) =>
  api.post('/api/settings/omnichannel/send/', {
    body: {
      channel: 'whatsapp',
      channel_id,
      to: to || recipient_id,
      text,
    },
  });

export const getWhatsAppStats = async () => {
  const response = await getWhatsAppConversations({ limit: 200 });
  const items = response?.results || [];
  return {
    total: items.length,
    inbound: items.filter((item) => item.direction === 'in').length,
    outbound: items.filter((item) => item.direction === 'out').length,
  };
};
