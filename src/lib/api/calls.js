/**
 * Calls API client
 * Handles VoIP call-logs operations according to Django-CRM API.yaml (lines 7221-7288)
 */

import { api as apiClient } from './client.js';

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

/**
 * Create a new call log
 * Note: POST method not available in API.yaml for /api/voip/call-logs/
 * This is a read-only endpoint. Call logs are created by VoIP system.
 * @param {Object} data - Call log data
 * @returns {Promise<Object>}
 */
export async function createCallLog(data) {
  console.warn('Creating call logs is not supported by API. Call logs are created by VoIP system.');
  throw new Error('Creating call logs is not supported. Use VoIP system to initiate calls.');
}

/**
 * Add note to a call log
 * @param {string|number} logId - Call log ID
 * @param {Object} data - Note data
 * @param {string} data.note - Note text
 * @returns {Promise<Object>}
 */
export async function addCallNote(logId, data) {
  return apiClient.post(`/api/voip/call-logs/${logId}/add-note/`, data);
}

/**
 * Update a call log (deprecated - use addCallNote instead)
 * @deprecated Use addCallNote for adding notes to call logs
 * @param {string|number} id - Call log ID
 * @param {Object} data - Updated call log data
 * @returns {Promise<Object>}
 */
export async function updateCallLog(id, data) {
  console.warn('updateCallLog is deprecated. Use addCallNote instead.');
  if (data.notes || data.note) {
    return addCallNote(id, { note: data.notes || data.note });
  }
  throw new Error('Call log updates not supported. Use addCallNote to add notes.');
}

/**
 * Delete a call log
 * Note: DELETE method not available in API.yaml for /api/voip/call-logs/
 * @param {string|number} id - Call log ID
 * @returns {Promise<void>}
 */
export async function deleteCallLog(id) {
  console.warn('Deleting call logs is not supported by API.');
  throw new Error('Deleting call logs is not supported.');
}

/**
 * Get call logs for a specific entity (lead or contact)
 * @param {string} entityType - Entity type ('lead' or 'contact')
 * @param {string|number} entityId - Entity ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getEntityCallLogs(entityType, entityId, params = {}) {
  const filterKey = `related_${entityType}`;
  return getCallLogs({ ...params, [filterKey]: entityId, ordering: '-started_at' });
}

/**
 * Get call logs for a company (through related contacts)
 * @param {string|number} companyId - Company ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCompanyCallLogs(companyId, params = {}) {
  // In real implementation, backend should filter by company's contacts
  // For now, we'll use a search parameter or custom endpoint
  return getCallLogs({ ...params, company: companyId, ordering: '-started_at' });
}

/**
 * Get call logs for a deal (through related contact)
 * @param {string|number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getDealCallLogs(dealId, params = {}) {
  // Backend should filter by deal's primary contact
  return getCallLogs({ ...params, deal: dealId, ordering: '-started_at' });
}

/**
 * Get call statistics
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Statistics object
 */
export async function getCallStatistics(params = {}) {
  // This would require a custom endpoint in the backend
  // For now, we fetch all calls and calculate stats on the client
  const { results } = await getCallLogs({ ...params, page_size: 1000 });
  
  return {
    total: results.length,
    inbound: results.filter(c => c.direction === 'inbound').length,
    outbound: results.filter(c => c.direction === 'outbound').length,
    completed: results.filter(c => c.status === 'completed').length,
    missed: results.filter(c => c.status === 'missed').length,
    totalDuration: results.reduce((sum, c) => sum + (c.duration || 0), 0),
    averageDuration: results.length > 0 
      ? results.reduce((sum, c) => sum + (c.duration || 0), 0) / results.length 
      : 0,
  };
}

/**
 * Upload call recording
 * Note: This endpoint doesn't exist in API.yaml
 * @param {string|number} callLogId - Call log ID
 * @param {Blob} audioBlob - Audio recording blob
 * @returns {Promise<Object>}
 */
export async function uploadRecording(callLogId, audioBlob) {
  console.warn('Call recording upload endpoint not available in API.');
  throw new Error('Call recording upload is not supported by API.');
}
