/**
 * Companies API
 * 
 * Управление компаниями и организациями
 */

import { api } from './client.js';

// ============================================================================
// Companies (компании)
// ============================================================================

/**
 * Get all companies
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {number} params.country - Filter by country ID
 * @param {number} params.department - Filter by department ID
 * @param {boolean} params.disqualified - Filter by disqualified status
 * @param {number} params.lead_source - Filter by lead source ID
 * @param {number} params.owner - Filter by owner user ID
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getCompanies(params = {}) {
  return api.get('/api/companies/', { params });
}

/**
 * Get single company by ID
 * @param {number} id - Company ID
 * @returns {Promise<Object>}
 */
export async function getCompany(id) {
  return api.get(`/api/companies/${id}/`);
}

/**
 * Create new company
 * @param {Object} data - Company data
 * @param {string} data.name - Company name (required)
 * @param {string} data.website - Website URL
 * @param {string} data.email - Email address
 * @param {string} data.phone - Phone number
 * @param {string} data.address - Physical address
 * @param {number} data.industry - Industry ID
 * @param {number} data.country - Country ID
 * @param {string} data.city - City name
 * @param {number} data.owner - Owner user ID
 * @param {string} data.type - Company type (client, partner, competitor)
 * @param {string} data.description - Company description
 * @returns {Promise<Object>}
 */
export async function createCompany(data) {
  return api.post('/api/companies/', { body: data });
}

/**
 * Update company (full update)
 * @param {number} id - Company ID
 * @param {Object} data - Company data
 * @returns {Promise<Object>}
 */
export async function updateCompany(id, data) {
  return api.put(`/api/companies/${id}/`, { body: data });
}

/**
 * Partially update company
 * @param {number} id - Company ID
 * @param {Object} data - Partial company data
 * @returns {Promise<Object>}
 */
export async function patchCompany(id, data) {
  return api.patch(`/api/companies/${id}/`, { body: data });
}

/**
 * Delete company
 * @param {number} id - Company ID
 * @returns {Promise<void>}
 */
export async function deleteCompany(id) {
  return api.delete(`/api/companies/${id}/`);
}

/**
 * Get industries (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getIndustries(params = {}) {
  return api.get('/api/industries/', { params });
}

/**
 * Get countries (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCountries(params = {}) {
  return api.get('/api/countries/', { params });
}

/**
 * Assign company to user
 * @param {number} id - Company ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function assignCompany(id, userId) {
  return patchCompany(id, { owner: userId });
}

/**
 * Add tag to company
 * @param {number} id - Company ID
 * @param {number} tagId - Tag ID
 * @returns {Promise<Object>}
 */
export async function addTagToCompany(id, tagId) {
  return api.post(`/api/companies/${id}/tags/`, { body: { tag: tagId } });
}

/**
 * Bulk tag companies
 * @param {Object} data - Bulk action data
 * @param {number[]} data.ids - Company IDs
 * @param {number[]} data.tags - Tag IDs
 * @param {string} data.action - Action type (add, remove, set)
 * @returns {Promise<Object>}
 */
export async function bulkTagCompanies(data) {
  return api.post('/api/companies/bulk_tag/', { body: data });
}
