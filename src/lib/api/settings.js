/**
 * Settings API - Application settings
 */

import { api } from './client.js';

const resolveSettingsPath = (basePath, payload = {}, id) => {
  const resolvedId = id ?? payload?.id ?? payload?.pk ?? payload?.key ?? null;
  if (resolvedId) return `${basePath}${resolvedId}/`;
  return basePath;
};

export const settingsApi = {
  // Massmail settings
  massmail: () => api.get('/api/settings/massmail/'),
  updateMassmail: (payload) => api.patch('/api/settings/massmail/', { body: payload }),

  // Reminders settings
  reminders: () => api.get('/api/settings/reminders/'),
  updateReminders: (payload) => api.patch('/api/settings/reminders/', { body: payload }),

  // Public email domains
  publicEmailDomains: () => api.get('/api/settings/public_email_domains/'),

  // General settings
  general: () => api.get('/api/settings/general/'),
  updateGeneral: (payload = {}, id) =>
    api.patch(resolveSettingsPath('/api/settings/general/', payload, id), { body: payload }),

  // Notifications settings
  notifications: () => api.get('/api/settings/notifications/'),
  updateNotifications: (payload = {}, id) =>
    api.patch(resolveSettingsPath('/api/settings/notifications/', payload, id), { body: payload }),
  testNotifications: (payload = {}) => api.post('/api/settings/notifications/test/', { body: payload }),
  userNotifications: () => api.get('/api/settings/notifications/user/'),
  updateUserNotifications: (payload = {}) =>
    api.patch('/api/settings/notifications/user/', { body: payload }),

  // Security settings
  security: () => api.get('/api/settings/security/'),
  updateSecurity: (payload = {}, id) =>
    api.patch(resolveSettingsPath('/api/settings/security/', payload, id), { body: payload }),
  securityAuditLog: (params = {}) => api.get('/api/settings/security/audit-log/', { params }),
  securitySessions: (params = {}) => api.get('/api/settings/security/sessions/', { params }),
  revokeSecuritySession: (sessionId) =>
    api.delete(`/api/settings/security/sessions/${sessionId}/`),
  revokeAllSecuritySessions: () => api.post('/api/settings/security/sessions/revoke-all/', { body: {} }),

  // Authentication status
  authStatus: () => api.get('/api/auth/status/'),

  // API keys
  apiKeys: {
    list: (params = {}) => api.get('/api/settings/api-keys/', { params }),
    retrieve: (id) => api.get(`/api/settings/api-keys/${id}/`),
    create: (payload) => api.post('/api/settings/api-keys/', { body: payload }),
    update: (id, payload) => api.put(`/api/settings/api-keys/${id}/`, { body: payload }),
    patch: (id, payload) => api.patch(`/api/settings/api-keys/${id}/`, { body: payload }),
    remove: (id) => api.delete(`/api/settings/api-keys/${id}/`),
    revoke: (id) => api.post(`/api/settings/api-keys/${id}/revoke/`, { body: {} }),
    usage: (id, params = {}) => api.get(`/api/settings/api-keys/${id}/usage/`, { params }),
  },

  // Webhooks
  webhooks: {
    list: (params = {}) => api.get('/api/settings/webhooks/', { params }),
    retrieve: (id) => api.get(`/api/settings/webhooks/${id}/`),
    create: (payload) => api.post('/api/settings/webhooks/', { body: payload }),
    update: (id, payload) => api.put(`/api/settings/webhooks/${id}/`, { body: payload }),
    patch: (id, payload) => api.patch(`/api/settings/webhooks/${id}/`, { body: payload }),
    remove: (id) => api.delete(`/api/settings/webhooks/${id}/`),
    deliveries: (id, params = {}) => api.get(`/api/settings/webhooks/${id}/deliveries/`, { params }),
    retryDelivery: (id, deliveryId, payload = {}) =>
      api.post(`/api/settings/webhooks/${id}/deliveries/${deliveryId}/retry/`, { body: payload }),
    test: (id, payload = {}) => api.post(`/api/settings/webhooks/${id}/test/`, { body: payload }),
  },

  // Integration logs
  integrationLogs: {
    list: (params = {}) => api.get('/api/settings/integration-logs/', { params }),
    retrieve: (id) => api.get(`/api/settings/integration-logs/${id}/`),
    exportCsv: (params = {}) => api.get('/api/settings/integration-logs/export/', { params, responseType: 'blob' }),
    cleanup: () => api.delete('/api/settings/integration-logs/cleanup/'),
    stats: () => api.get('/api/settings/integration-logs/stats/'),
  },

  // Lead assignment rules
  leadRules: {
    list: (params = {}) => api.get('/api/settings/lead-assignment-rules/', { params }),
    retrieve: (id) => api.get(`/api/settings/lead-assignment-rules/${id}/`),
    create: (payload = {}) => api.post('/api/settings/lead-assignment-rules/', { body: payload }),
    update: (id, payload = {}) => api.put(`/api/settings/lead-assignment-rules/${id}/`, { body: payload }),
    patch: (id, payload = {}) => api.patch(`/api/settings/lead-assignment-rules/${id}/`, { body: payload }),
    remove: (id) => api.delete(`/api/settings/lead-assignment-rules/${id}/`),
    toggle: (id, payload = {}) => api.post(`/api/settings/lead-assignment-rules/${id}/toggle/`, { body: payload }),
    templates: () => api.get('/api/settings/lead-assignment-rules/templates/'),
    simulate: (payload = {}) => api.post('/api/settings/lead-assignment-rules/simulate/', { body: payload }),
  },
};

export default settingsApi;
