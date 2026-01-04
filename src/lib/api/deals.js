/**
 * Deals API
 * 
 * Управление продажными сделками и воронкой продаж
 */

import { api } from './client.js';

// ============================================================================
// Deals (сделки)
// ============================================================================

/**
 * Get all deals
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {boolean} params.active - Filter by active status
 * @param {number} params.co_owner - Filter by co-owner ID
 * @param {number} params.company - Filter by company ID
 * @param {number} params.contact - Filter by contact ID
 * @param {number} params.department - Filter by department ID
 * @param {number} params.lead - Filter by lead ID
 * @param {number} params.owner - Filter by owner ID
 * @param {number} params.stage - Filter by stage ID
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getDeals(params = {}) {
  return api.get('/api/deals/', { params });
}

/**
 * Get single deal by ID
 * @param {number} id - Deal ID
 * @returns {Promise<Object>}
 */
export async function getDeal(id) {
  return api.get(`/api/deals/${id}/`);
}

/**
 * Create new deal
 * @param {Object} data - Deal data
 * @param {string} data.name - Deal name (required)
 * @param {number} data.amount - Deal amount
 * @param {string} data.currency - Currency code
 * @param {number} data.company - Related company ID
 * @param {number} data.contact - Related contact ID
 * @param {number} data.stage - Deal stage ID
 * @param {string} data.status - Deal status
 * @param {number} data.probability - Win probability (0-100)
 * @param {string} data.expected_close_date - Expected close date (YYYY-MM-DD)
 * @param {string} data.description - Deal description
 * @returns {Promise<Object>}
 */
export async function createDeal(data) {
  return api.post('/api/deals/', { body: data });
}

/**
 * Update deal (full update)
 * @param {number} id - Deal ID
 * @param {Object} data - Deal data
 * @returns {Promise<Object>}
 */
export async function updateDeal(id, data) {
  return api.put(`/api/deals/${id}/`, { body: data });
}

/**
 * Partially update deal
 * @param {number} id - Deal ID
 * @param {Object} data - Partial deal data
 * @returns {Promise<Object>}
 */
export async function patchDeal(id, data) {
  return api.patch(`/api/deals/${id}/`, { body: data });
}

/**
 * Delete deal
 * @param {number} id - Deal ID
 * @returns {Promise<void>}
 */
export async function deleteDeal(id) {
  return api.delete(`/api/deals/${id}/`);
}

/**
 * Get deal stages (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getDealStages(params = {}) {
  return api.get('/api/stages/', { params });
}

/**
 * Bulk tag deals
 * @param {Object} data - Bulk action data
 * @param {number[]} data.ids - Deal IDs
 * @param {number[]} data.tags - Tag IDs
 * @param {string} data.action - Action type (add, remove, set)
 * @returns {Promise<Object>}
 */
export async function bulkTagDeals(data) {
  return api.post('/api/deals/bulk_tag/', { body: data });
}

/**
 * Move deal to another stage
 * @param {number} id - Deal ID
 * @param {number} stageId - Target stage ID
 * @returns {Promise<Object>}
 */
export async function moveDealToStage(id, stageId) {
  return patchDeal(id, { stage: stageId });
}

/**
 * Assign deal to user
 * @param {number} id - Deal ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function assignDeal(id, userId) {
  return patchDeal(id, { owner: userId });
}

/**
 * Close deal as won
 * @param {number} id - Deal ID
 * @param {string} closedDate - Closing date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function closeDealAsWon(id, closedDate) {
  return patchDeal(id, { status: 'won', closed_date: closedDate });
}

/**
 * Close deal as lost
 * @param {number} id - Deal ID
 * @param {string} reason - Reason for losing
 * @param {string} closedDate - Closing date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function closeDealAsLost(id, reason, closedDate) {
  return patchDeal(id, { status: 'lost', lost_reason: reason, closed_date: closedDate });
}
