/**
 * Requests API
 * 
 * Управление заявками/запросами
 */

import { api } from './client.js';

// ============================================================================
// Requests (заявки)
// ============================================================================

/**
 * Get all requests
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status
 * @param {string} params.type - Filter by type
 * @param {number} params.assigned_to - Filter by assigned user ID
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getRequests(params = {}) {
  return api.get('/api/requests/', { params });
}

/**
 * Get single request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>}
 */
export async function getRequest(id) {
  return api.get(`/api/requests/${id}/`);
}

/**
 * Create new request
 * @param {Object} data - Request data
 * @param {string} data.title - Request title (required)
 * @param {string} data.description - Request description
 * @param {string} data.type - Request type
 * @param {string} data.status - Status (new, in_progress, completed, cancelled)
 * @param {string} data.priority - Priority (low, medium, high, urgent)
 * @param {number} data.assigned_to - Assigned user ID
 * @param {number} data.contact - Related contact ID
 * @param {number} data.company - Related company ID
 * @returns {Promise<Object>}
 */
export async function createRequest(data) {
  return api.post('/api/requests/', { body: data });
}

/**
 * Update request (full update)
 * @param {number} id - Request ID
 * @param {Object} data - Request data
 * @returns {Promise<Object>}
 */
export async function updateRequest(id, data) {
  return api.put(`/api/requests/${id}/`, { body: data });
}

/**
 * Partially update request
 * @param {number} id - Request ID
 * @param {Object} data - Partial request data
 * @returns {Promise<Object>}
 */
export async function patchRequest(id, data) {
  return api.patch(`/api/requests/${id}/`, { body: data });
}

/**
 * Delete request
 * @param {number} id - Request ID
 * @returns {Promise<void>}
 */
export async function deleteRequest(id) {
  return api.delete(`/api/requests/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get requests by status
 * @param {string} status - Request status
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRequestsByStatus(status, params = {}) {
  return getRequests({ ...params, status });
}

/**
 * Get new requests
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getNewRequests(params = {}) {
  return getRequestsByStatus('new', params);
}

/**
 * Get requests in progress
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getInProgressRequests(params = {}) {
  return getRequestsByStatus('in_progress', params);
}

/**
 * Get completed requests
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getCompletedRequests(params = {}) {
  return getRequestsByStatus('completed', params);
}

/**
 * Get requests assigned to user
 * @param {number} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRequestsAssignedTo(userId, params = {}) {
  return getRequests({ ...params, assigned_to: userId });
}

/**
 * Assign request to user
 * @param {number} id - Request ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function assignRequest(id, userId) {
  return patchRequest(id, { assigned_to: userId });
}

/**
 * Mark request as in progress
 * @param {number} id - Request ID
 * @returns {Promise<Object>}
 */
export async function markRequestInProgress(id) {
  return patchRequest(id, { status: 'in_progress' });
}

/**
 * Mark request as completed
 * @param {number} id - Request ID
 * @returns {Promise<Object>}
 */
export async function markRequestCompleted(id) {
  return patchRequest(id, { status: 'completed' });
}

/**
 * Cancel request
 * @param {number} id - Request ID
 * @returns {Promise<Object>}
 */
export async function cancelRequest(id) {
  return patchRequest(id, { status: 'cancelled' });
}
