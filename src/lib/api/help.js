/**
 * Help API
 * 
 * Справочная система и документация
 */

import { api } from './client.js';

// ============================================================================
// Help Pages (страницы справки)
// ============================================================================

/**
 * Get all help pages
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search query
 * @param {string} params.category - Filter by category
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getHelpPages(params = {}) {
  return api.get('/api/help/pages/', { params });
}

/**
 * Get single help page by ID
 * @param {number} id - Page ID
 * @returns {Promise<Object>}
 */
export async function getHelpPage(id) {
  return api.get(`/api/help/pages/${id}/`);
}

// ============================================================================
// Help Paragraphs (параграфы справки)
// ============================================================================

/**
 * Get all help paragraphs
 * @param {Object} params - Query parameters
 * @param {number} params.page - Filter by page ID
 * @param {string} params.search - Search query
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getHelpParagraphs(params = {}) {
  return api.get('/api/help/paragraphs/', { params });
}

/**
 * Get single help paragraph by ID
 * @param {number} id - Paragraph ID
 * @returns {Promise<Object>}
 */
export async function getHelpParagraph(id) {
  return api.get(`/api/help/paragraphs/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get paragraphs by page
 * @param {number} pageId - Page ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getParagraphsByPage(pageId, params = {}) {
  return getHelpParagraphs({ ...params, page: pageId });
}

/**
 * Search help content
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function searchHelp(query, params = {}) {
  return getHelpPages({ ...params, search: query });
}

/**
 * Get help pages by category
 * @param {string} category - Category name
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getHelpPagesByCategory(category, params = {}) {
  return getHelpPages({ ...params, category });
}
