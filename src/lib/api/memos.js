/**
 * Memos API
 * 
 * Управление внутренними заметками/мемо
 */

import { api } from './client.js';

// ============================================================================
// Memos (заметки)
// ============================================================================

/**
 * Get all memos
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status (active, postponed, reviewed)
 * @param {string} params.priority - Filter by priority (low, medium, high, urgent)
 * @param {number} params.assigned_to - Filter by assigned user ID
 * @param {number} params.created_by - Filter by creator user ID
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getMemos(params = {}) {
  return api.get('/api/memos/', { params });
}

/**
 * Get single memo by ID
 * @param {number} id - Memo ID
 * @returns {Promise<Object>}
 */
export async function getMemo(id) {
  return api.get(`/api/memos/${id}/`);
}

/**
 * Create new memo
 * @param {Object} data - Memo data
 * @param {string} data.title - Memo title (required)
 * @param {string} data.content - Memo content (required)
 * @param {string} data.priority - Priority (low, medium, high, urgent)
 * @param {string} data.status - Status (active, postponed, reviewed)
 * @param {number} data.assigned_to - Assigned user ID
 * @param {string} data.due_date - Due date (YYYY-MM-DD)
 * @param {number} data.related_lead - Related lead ID
 * @param {number} data.related_contact - Related contact ID
 * @param {number} data.related_deal - Related deal ID
 * @returns {Promise<Object>}
 */
export async function createMemo(data) {
  return api.post('/api/memos/', data);
}

/**
 * Update memo (full update)
 * @param {number} id - Memo ID
 * @param {Object} data - Memo data
 * @returns {Promise<Object>}
 */
export async function updateMemo(id, data) {
  return api.put(`/api/memos/${id}/`, data);
}

/**
 * Partially update memo
 * @param {number} id - Memo ID
 * @param {Object} data - Partial memo data
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
// Memo Actions (действия с мемо)
// ============================================================================

/**
 * Mark memo as postponed
 * @param {number} id - Memo ID
 * @param {Object} data - Optional data (e.g., new due_date)
 * @returns {Promise<Object>}
 */
export async function markMemoPostponed(id, data = {}) {
  return api.post(`/api/memos/${id}/mark_postponed/`, data);
}

/**
 * Mark memo as reviewed
 * @param {number} id - Memo ID
 * @param {Object} data - Optional review data
 * @returns {Promise<Object>}
 */
export async function markMemoReviewed(id, data = {}) {
  return api.post(`/api/memos/${id}/mark_reviewed/`, data);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get active memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getActiveMemos(params = {}) {
  return getMemos({ ...params, status: 'active' });
}

/**
 * Get postponed memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPostponedMemos(params = {}) {
  return getMemos({ ...params, status: 'postponed' });
}

/**
 * Get reviewed memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getReviewedMemos(params = {}) {
  return getMemos({ ...params, status: 'reviewed' });
}

/**
 * Get memos by priority
 * @param {string} priority - Priority (low, medium, high, urgent)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByPriority(priority, params = {}) {
  return getMemos({ ...params, priority });
}

/**
 * Get urgent memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getUrgentMemos(params = {}) {
  return getMemosByPriority('urgent', params);
}

/**
 * Get high priority memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getHighPriorityMemos(params = {}) {
  return getMemosByPriority('high', params);
}

/**
 * Get memos assigned to user
 * @param {number} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosAssignedTo(userId, params = {}) {
  return getMemos({ ...params, assigned_to: userId });
}

/**
 * Get memos created by user
 * @param {number} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosCreatedBy(userId, params = {}) {
  return getMemos({ ...params, created_by: userId });
}

/**
 * Get my memos (assigned to current user)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMyMemos(params = {}) {
  // Note: Backend должен определить текущего пользователя
  return getMemos({ ...params, assigned_to: 'me' });
}

/**
 * Get overdue memos
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOverdueMemos(params = {}) {
  const today = new Date().toISOString().split('T')[0];
  return getMemos({ 
    ...params, 
    status: 'active',
    date_to: today,
  });
}

/**
 * Get memos due today
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosDueToday(params = {}) {
  const today = new Date().toISOString().split('T')[0];
  return getMemos({ 
    ...params, 
    status: 'active',
    date_from: today,
    date_to: today,
  });
}

/**
 * Get memos by date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByDateRange(dateFrom, dateTo, params = {}) {
  return getMemos({ ...params, date_from: dateFrom, date_to: dateTo });
}

/**
 * Get memos related to lead
 * @param {number} leadId - Lead ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByLead(leadId, params = {}) {
  return getMemos({ ...params, related_lead: leadId });
}

/**
 * Get memos related to contact
 * @param {number} contactId - Contact ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByContact(contactId, params = {}) {
  return getMemos({ ...params, related_contact: contactId });
}

/**
 * Get memos related to deal
 * @param {number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMemosByDeal(dealId, params = {}) {
  return getMemos({ ...params, related_deal: dealId });
}

/**
 * Search memos by query
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function searchMemos(query, params = {}) {
  return getMemos({ ...params, search: query });
}

/**
 * Postpone memo with new due date
 * @param {number} id - Memo ID
 * @param {string} newDueDate - New due date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function postponeMemo(id, newDueDate) {
  return markMemoPostponed(id, { due_date: newDueDate });
}

/**
 * Complete memo (mark as reviewed)
 * @param {number} id - Memo ID
 * @returns {Promise<Object>}
 */
export async function completeMemo(id) {
  return markMemoReviewed(id);
}

/**
 * Reactivate memo (change status back to active)
 * @param {number} id - Memo ID
 * @returns {Promise<Object>}
 */
export async function reactivateMemo(id) {
  return patchMemo(id, { status: 'active' });
}

/**
 * Assign memo to user
 * @param {number} id - Memo ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function assignMemo(id, userId) {
  return patchMemo(id, { assigned_to: userId });
}

/**
 * Change memo priority
 * @param {number} id - Memo ID
 * @param {string} priority - New priority
 * @returns {Promise<Object>}
 */
export async function changMemoPriority(id, priority) {
  return patchMemo(id, { priority });
}

/**
 * Update memo due date
 * @param {number} id - Memo ID
 * @param {string} dueDate - New due date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function updateMemoDueDate(id, dueDate) {
  return patchMemo(id, { due_date: dueDate });
}
