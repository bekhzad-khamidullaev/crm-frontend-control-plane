/**
 * Outputs API
 * 
 * Управление расходами и затратами
 */

import { api } from './client.js';

// ============================================================================
// Outputs (расходы)
// ============================================================================

/**
 * Get all outputs
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.category - Filter by category
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getOutputs(params = {}) {
  return api.get('/api/outputs/', { params });
}

/**
 * Get single output by ID
 * @param {number} id - Output ID
 * @returns {Promise<Object>}
 */
export async function getOutput(id) {
  return api.get(`/api/outputs/${id}/`);
}

/**
 * Create new output
 * @param {Object} data - Output data
 * @param {string} data.title - Output title (required)
 * @param {string} data.description - Output description
 * @param {number} data.amount - Amount (required)
 * @param {string} data.currency - Currency code
 * @param {string} data.category - Category
 * @param {string} data.date - Output date (YYYY-MM-DD)
 * @param {string} data.receipt_number - Receipt/invoice number
 * @returns {Promise<Object>}
 */
export async function createOutput(data) {
  return api.post('/api/outputs/', { body: data });
}

/**
 * Update output (full update)
 * @param {number} id - Output ID
 * @param {Object} data - Output data
 * @returns {Promise<Object>}
 */
export async function updateOutput(id, data) {
  return api.put(`/api/outputs/${id}/`, { body: data });
}

/**
 * Partially update output
 * @param {number} id - Output ID
 * @param {Object} data - Partial output data
 * @returns {Promise<Object>}
 */
export async function patchOutput(id, data) {
  return api.patch(`/api/outputs/${id}/`, { body: data });
}

/**
 * Delete output
 * @param {number} id - Output ID
 * @returns {Promise<void>}
 */
export async function deleteOutput(id) {
  return api.delete(`/api/outputs/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get outputs by category
 * @param {string} category - Category name
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOutputsByCategory(category, params = {}) {
  return getOutputs({ ...params, category });
}

/**
 * Get outputs by date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOutputsByDateRange(dateFrom, dateTo, params = {}) {
  return getOutputs({ ...params, date_from: dateFrom, date_to: dateTo });
}

/**
 * Get outputs for current month
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOutputsThisMonth(params = {}) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return getOutputsByDateRange(firstDay, lastDay, params);
}

/**
 * Get total outputs for period
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Promise<number>}
 */
export async function getTotalOutputs(dateFrom, dateTo) {
  const response = await getOutputsByDateRange(dateFrom, dateTo);
  const outputs = response.results || response;
  return outputs.reduce((sum, output) => sum + (output.amount || 0), 0);
}
