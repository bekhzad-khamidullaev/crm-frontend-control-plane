/**
 * Calls API client
 * Handles CRM call-logs operations according to Django-CRM API.yaml
 */

import { api as apiClient, getContacts, getDeal } from './client.js';

/**
 * Get list of call logs with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.direction] - Filter by direction (inbound/outbound)
 * @param {string} [params.status] - Filter by status (completed/missed/busy/etc.)
 * @param {number} [params.limit] - Limit results
 * @param {string} [params.date_from] - Filter by date from
 * @param {string} [params.date_to] - Filter by date to
 * @param {string} [params.ordering] - Ordering field
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCallLogs(params = {}) {
  return apiClient.get('/api/voip/call-logs/', { params });
}

/**
 * Get a single call log by ID
 * @param {string|number} logId - Call log ID
 * @returns {Promise<Object>}
 */
export async function getCallLog(logId) {
  return apiClient.get(`/api/voip/call-logs/${logId}/`);
}

/** @deprecated Use getCallLog instead */
export const getVoipCallLog = getCallLog;

/** @deprecated Use getCallLogs instead */
export const getVoipCallLogs = getCallLogs;

function normalizeCallLogPayload(data = {}) {
  const payload = { ...data };
  if (!payload.number && payload.phone_number) {
    payload.number = payload.phone_number;
  }
  delete payload.phone_number;
  delete payload.status;
  delete payload.started_at;
  delete payload.ended_at;
  delete payload.timestamp;
  return payload;
}

/**
 * Create a new CRM call log
 * @param {Object} data - Call log data
 * @returns {Promise<Object>}
 */
export async function createCallLog(data) {
  return apiClient.post('/api/voip/call-logs/', { body: normalizeCallLogPayload(data) });
}

/**
 * Update a CRM call log (add note or patch metadata)
 * @param {string|number} logId - Call log ID
 * @param {Object} data - Call log updates
 * @returns {Promise<Object>}
 */
export async function updateCallLog(logId, data) {
  return apiClient.patch(`/api/voip/call-logs/${logId}/`, { body: normalizeCallLogPayload(data) });
}

/**
 * Delete a CRM call log
 * @param {string|number} logId - Call log ID
 * @returns {Promise<void>}
 */
export async function deleteCallLog(logId) {
  return apiClient.delete(`/api/voip/call-logs/${logId}/`);
}

/**
 * Create a new call log
 * Note: POST method not available in API.yaml for /api/voip/call-logs/
 * This is a read-only endpoint. Call logs are created by VoIP system.
 * @param {Object} data - Call log data
 * @returns {Promise<Object>}
 */
export async function addCallNote(logId, data) {
  return apiClient.post(`/api/voip/call-logs/${logId}/add-note/`, { body: data });
}

/**
 * Get call logs for a specific entity (lead or contact)
 * @param {string} entityType - Entity type ('lead' or 'contact')
 * @param {string|number} entityId - Entity ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getEntityCallLogs(entityType, entityId, params = {}) {
  const response = await getCallLogs({ ...params, ordering: '-timestamp', page_size: params.page_size || 200 });
  const results = response?.results || response || [];

  if (entityType === 'contact' && entityId) {
    const filtered = results.filter((call) => Number(call.contact) === Number(entityId));
    return { count: filtered.length, results: filtered };
  }

  return {
    count: response?.count ?? results.length,
    results,
  };
}

/**
 * Get call logs for a company (through related contacts)
 * @param {string|number} companyId - Company ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCompanyCallLogs(companyId, params = {}) {
  const contactsResponse = await getContacts({ company: companyId, page_size: 500 });
  const contacts = contactsResponse?.results || contactsResponse || [];
  const contactIds = contacts.map((contact) => Number(contact.id)).filter(Boolean);

  if (contactIds.length === 0) {
    return { count: 0, results: [] };
  }

  const response = await getCallLogs({ ...params, ordering: '-timestamp', page_size: params.page_size || 1000 });
  const results = response?.results || response || [];
  const filtered = results.filter((call) => contactIds.includes(Number(call.contact)));
  return { count: filtered.length, results: filtered };
}

/**
 * Get call logs for a deal (through related contact)
 * @param {string|number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getDealCallLogs(dealId, params = {}) {
  const deal = await getDeal(dealId);
  if (!deal?.contact) {
    return { count: 0, results: [] };
  }
  return getEntityCallLogs('contact', deal.contact, params);
}

/**
 * Get call statistics
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Statistics object
 */
export async function getCallStatistics(params = {}) {
  const stats = await apiClient.get('/api/voip/call-statistics/', { params });
  if (!stats || typeof stats !== 'object') {
    return stats;
  }

  return {
    ...stats,
    total: stats.total ?? stats.total_calls ?? stats.calls_total ?? stats.count ?? 0,
    inbound: stats.inbound ?? stats.incoming ?? stats.incoming_calls ?? 0,
    outbound: stats.outbound ?? stats.outgoing ?? stats.outgoing_calls ?? 0,
    completed: stats.completed ?? stats.answered ?? stats.connected ?? 0,
    missed: stats.missed ?? stats.missed_calls ?? stats.no_answer ?? 0,
    totalDuration: stats.totalDuration ?? stats.total_duration ?? stats.duration_total ?? 0,
    averageDuration: stats.averageDuration ?? stats.average_duration ?? stats.avg_duration ?? 0,
  };
}

/**
 * Get contact center KPI economics
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getContactCenterKpi(params = {}) {
  return apiClient.get('/api/voip/contact-center-kpi/', { params });
}

/**
 * Get contact center drilldown by teams and agents
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getContactCenterDrilldown(params = {}) {
  return apiClient.get('/api/voip/contact-center-drilldown/', { params });
}

/**
 * List QA scores for calls
 * @param {Object} params
 * @returns {Promise<{results: Array, count: number}>}
 */
export async function getCallQaScores(params = {}) {
  return apiClient.get('/api/voip/qa-scores/', { params });
}

/**
 * Create/update current reviewer QA score for a call
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function upsertCallQaScore(data) {
  return apiClient.post('/api/voip/qa-scores/', { body: data });
}

/**
 * Get QA summary
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getCallQaSummary(params = {}) {
  return apiClient.get('/api/voip/qa-summary/', { params });
}

/**
 * Generate weekly pilot board report
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function generatePilotWeeklyReport(data = {}) {
  return apiClient.post('/api/voip/pilot-weekly-reports/generate/', { body: data });
}

/**
 * List pilot weekly reports
 * @param {Object} params
 * @returns {Promise<{results: Array, count: number}>}
 */
export async function getPilotWeeklyReports(params = {}) {
  return apiClient.get('/api/voip/pilot-weekly-reports/', { params });
}

/**
 * Export pilot weekly report
 * @param {number|string} reportId
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function exportPilotWeeklyReport(reportId, params = { export_format: 'md' }) {
  return apiClient.get(`/api/voip/pilot-weekly-reports/${reportId}/export/`, { params });
}

/**
 * Get report automation health and runs
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getPilotReportAutomationHealth(params = {}) {
  return apiClient.get('/api/voip/pilot-weekly-reports/automation-health/', { params });
}

/**
 * Trigger report automation now
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function runPilotReportAutomationNow(data = { async: false }) {
  return apiClient.post('/api/voip/pilot-weekly-reports/run-automation-now/', { body: data });
}

/**
 * Get CRM call statistics (client-side aggregation)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCrmCallStatistics(params = {}) {
  const response = await getCallLogs({ ...params, page_size: params.page_size || 1000 });
  const results = response?.results || response || [];
  const totalDuration = results.reduce((sum, c) => sum + (c.duration || 0), 0);
  return {
    total: results.length,
    inbound: results.filter((c) => c.direction === 'inbound').length,
    outbound: results.filter((c) => c.direction === 'outbound').length,
    totalDuration,
    averageDuration: results.length > 0 ? totalDuration / results.length : 0,
  };
}
