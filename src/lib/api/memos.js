/**
 * Memos API
 *
 * CRUD for internal memos aligned with Django-CRM API.yaml.
 */

import { api } from './client.js';

// ============================================================================
// Memos
// ============================================================================

/**
 * Get memos list
 * @param {Object} params - Query parameters
 * @param {number} [params.deal] - Deal ID
 * @param {boolean} [params.draft] - Draft flag
 * @param {number} [params.project] - Project ID
 * @param {number} [params.task] - Task ID
 * @param {number} [params.to] - Recipient user ID
 * @param {string} [params.stage] - Stage (pen|pos|rev)
 * @param {string} [params.search] - Search query
 * @param {string} [params.ordering] - Ordering field
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<Object>}
 */
export async function getMemos(params = {}) {
  return api.get('/api/memos/', { params });
}

/**
 * Get memo by ID
 * @param {number} id - Memo ID
 * @returns {Promise<Object>}
 */
export async function getMemo(id) {
  return api.get(`/api/memos/${id}/`);
}

/**
 * Create memo
 * @param {Object} data - Memo payload
 * @returns {Promise<Object>}
 */
export async function createMemo(data) {
  return api.post('/api/memos/', data);
}

/**
 * Update memo (full)
 * @param {number} id - Memo ID
 * @param {Object} data - Memo payload
 * @returns {Promise<Object>}
 */
export async function updateMemo(id, data) {
  return api.put(`/api/memos/${id}/`, data);
}

/**
 * Patch memo
 * @param {number} id - Memo ID
 * @param {Object} data - Partial payload
 * @returns {Promise<Object>}
 */
export async function patchMemo(id, data) {
  return api.patch(`/api/memos/${id}/`, data);
}

/**
 * Delete memo
 * @param {number} id - Memo ID
 * @returns {Promise<void>}
 */
export async function deleteMemo(id) {
  return api.delete(`/api/memos/${id}/`);
}

// ============================================================================
// Memo actions
// ============================================================================

/**
 * Mark memo as postponed
 * @param {number} id - Memo ID
 * @param {Object} data - Optional payload
 * @returns {Promise<Object>}
 */
export async function markMemoPostponed(id, data = {}) {
  return api.post(`/api/memos/${id}/mark_postponed/`, data);
}

/**
 * Mark memo as reviewed
 * @param {number} id - Memo ID
 * @param {Object} data - Optional payload
 * @returns {Promise<Object>}
 */
export async function markMemoReviewed(id, data = {}) {
  return api.post(`/api/memos/${id}/mark_reviewed/`, data);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get memos by stage
 * @param {string} stage - Stage (pen|pos|rev)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByStage(stage, params = {}) {
  return getMemos({ ...params, stage });
}

/**
 * Get memos for recipient
 * @param {number} userId - Recipient user ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByRecipient(userId, params = {}) {
  return getMemos({ ...params, to: userId });
}
