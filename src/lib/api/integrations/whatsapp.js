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
