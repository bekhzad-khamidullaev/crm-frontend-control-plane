/**
 * Compliance API
 * Backed by /api/settings/compliance/* and /api/settings/omnichannel/* endpoints.
 */

import { api } from './client.js';

export const getOmnichannelTimeline = (params = {}) =>
  api.get('/api/settings/omnichannel/timeline/', { params });

export const getOmnichannelDiagnostics = (params = {}) =>
  api.get('/api/settings/omnichannel/diagnostics/', { params });

export const getOmnichannelEventPayload = (id) =>
  api.get(`/api/settings/omnichannel/${id}/payload/`);

export const replayOmnichannelEvent = (id, payload = {}) =>
  api.post(`/api/settings/omnichannel/${id}/replay/`, { body: payload });

export const sendOmnichannelMessage = (payload) =>
  api.post('/api/settings/omnichannel/send/', { body: payload });

export const getConsents = (params = {}) =>
  api.get('/api/settings/compliance/consents/', { params });

export const createConsent = (payload) =>
  api.post('/api/settings/compliance/consents/', { body: payload });

export const revokeConsent = (id) =>
  api.post(`/api/settings/compliance/consents/${id}/revoke/`, { body: {} });

export const getDsrRequests = (params = {}) =>
  api.get('/api/settings/compliance/dsr/', { params });

export const createDsrRequest = (payload) =>
  api.post('/api/settings/compliance/dsr/', { body: payload });

export const executeDsrRequest = (id) =>
  api.post(`/api/settings/compliance/dsr/${id}/execute/`, { body: {} });

export const getRetentionPolicies = (params = {}) =>
  api.get('/api/settings/compliance/retention/', { params });

export const createRetentionPolicy = (payload) =>
  api.post('/api/settings/compliance/retention/', { body: payload });

export const runRetentionPolicies = () =>
  api.post('/api/settings/compliance/retention/run/', { body: {} });

export const getComplianceAudit = (params = {}) =>
  api.get('/api/settings/compliance/audit/', { params });

export const getComplianceReport = () =>
  api.get('/api/settings/compliance/audit/report/');
