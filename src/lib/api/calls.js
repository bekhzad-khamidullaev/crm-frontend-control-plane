/**
 * Calls API client
 * Handles all call-logs operations according to Django-CRM API.yaml
 */

import { api as apiClient } from './client.js';

/**
 * Get list of call logs with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.related_lead] - Filter by lead ID
 * @param {string} [params.related_contact] - Filter by contact ID
 * @param {string} [params.direction] - Filter by direction (inbound/outbound)
 * @param {string} [params.status] - Filter by status (completed/missed/busy/etc.)
 * @param {string} [params.user] - Filter by user ID
 * @param {string} [params.search] - Search in phone numbers or notes
 * @param {string} [params.ordering] - Ordering field (e.g., '-started_at')
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCallLogs(params = {}) {
  return apiClient.get('/api/call-logs/', { params });
}

/**
 * Get a single call log by ID
 * @param {string|number} id - Call log ID
 * @returns {Promise<Object>}
 */
export async function getCallLog(id) {
  return apiClient.get(`/api/call-logs/${id}/`);
}

/**
 * Create a new call log
 * @param {Object} data - Call log data
 * @param {string} data.phone_number - Phone number (required)
 * @param {string} data.direction - Call direction: 'inbound' or 'outbound' (required)
 * @param {string} [data.status] - Call status (completed, missed, busy, failed)
 * @param {string} [data.started_at] - ISO datetime when call started
 * @param {string} [data.ended_at] - ISO datetime when call ended
 * @param {number} [data.duration] - Call duration in seconds
 * @param {string} [data.related_lead] - Related lead ID
 * @param {string} [data.related_contact] - Related contact ID
 * @param {string} [data.notes] - Call notes
 * @param {string} [data.recording_url] - URL to call recording
 * @returns {Promise<Object>}
 */
export async function createCallLog(data) {
  return apiClient.post('/api/call-logs/', data);
}

/**
 * Update a call log
 * @param {string|number} id - Call log ID
 * @param {Object} data - Updated call log data
 * @returns {Promise<Object>}
 */
export async function updateCallLog(id, data) {
  return apiClient.patch(`/api/call-logs/${id}/`, data);
}

/**
 * Delete a call log
 * @param {string|number} id - Call log ID
 * @returns {Promise<void>}
 */
export async function deleteCallLog(id) {
  return apiClient.delete(`/api/call-logs/${id}/`);
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
 * @param {string|number} callLogId - Call log ID
 * @param {Blob} audioBlob - Audio recording blob
 * @returns {Promise<Object>}
 */
export async function uploadRecording(callLogId, audioBlob) {
  const formData = new FormData();
  formData.append('recording', audioBlob, `call_${callLogId}_${Date.now()}.webm`);
  
  return apiClient.post(`/api/call-logs/${callLogId}/upload-recording/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
