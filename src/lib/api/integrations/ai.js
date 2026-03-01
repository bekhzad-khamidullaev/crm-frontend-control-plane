/**
 * AI Providers Integration API
 * Backed by /api/settings/ai/providers/ endpoints.
 */

import { api } from '../client.js';

export const getAIProviders = (params = {}) =>
  api.get('/api/settings/ai/providers/', { params });

export const getAIProvider = (id) =>
  api.get(`/api/settings/ai/providers/${id}/`);

export const createAIProvider = (data) =>
  api.post('/api/settings/ai/providers/', { body: data });

export const updateAIProvider = (id, data) =>
  api.patch(`/api/settings/ai/providers/${id}/`, { body: data });

export const deleteAIProvider = (id) =>
  api.delete(`/api/settings/ai/providers/${id}/`);

export const testAIProviderConnection = (id, payload = {}) =>
  api.post(`/api/settings/ai/providers/${id}/test_connection/`, { body: payload });
