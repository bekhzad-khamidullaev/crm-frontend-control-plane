/**
 * Projects API
 * 
 * Управление проектами и этапами выполнения
 */

import { api } from './client.js';

// ============================================================================
// Projects (проекты)
// ============================================================================

/**
 * Get all projects
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {boolean} params.active - Filter by active status
 * @param {number} params.co_owner - Filter by co-owner ID
 * @param {number} params.owner - Filter by owner user ID
 * @param {number} params.stage - Filter by stage ID
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getProjects(params = {}) {
  return api.get('/api/projects/', { params });
}

/**
 * Get single project by ID
 * @param {number} id - Project ID
 * @returns {Promise<Object>}
 */
export async function getProject(id) {
  return api.get(`/api/projects/${id}/`);
}

/**
 * Create new project
 * @param {Object} data - Project data
 * @param {string} data.name - Project name (required)
 * @param {string} data.description - Project description
 * @param {number} data.company - Related company ID
 * @param {number} data.owner - Owner user ID
 * @param {string} data.status - Project status (draft, active, completed, cancelled)
 * @param {string} data.start_date - Start date (YYYY-MM-DD)
 * @param {string} data.end_date - End date (YYYY-MM-DD)
 * @param {number} data.budget - Project budget
 * @param {string} data.currency - Currency code
 * @returns {Promise<Object>}
 */
export async function createProject(data) {
  return api.post('/api/projects/', { body: data });
}

/**
 * Update project (full update)
 * @param {number} id - Project ID
 * @param {Object} data - Project data
 * @returns {Promise<Object>}
 */
export async function updateProject(id, data) {
  return api.put(`/api/projects/${id}/`, { body: data });
}

/**
 * Partially update project
 * @param {number} id - Project ID
 * @param {Object} data - Partial project data
 * @returns {Promise<Object>}
 */
export async function patchProject(id, data) {
  return api.patch(`/api/projects/${id}/`, { body: data });
}

/**
 * Delete project
 * @param {number} id - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
  return api.delete(`/api/projects/${id}/`);
}

/**
 * Get project stages (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getProjectStages(params = {}) {
  return api.get('/api/project-stages/', { params });
}

/**
 * Assign project to user
 * @param {number} id - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function assignProject(id, userId) {
  return api.post(`/api/projects/${id}/assign/`, { body: { user: userId } });
}

/**
 * Mark project as complete
 * @param {number} id - Project ID
 * @param {string} completedDate - Completion date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function completeProject(id, completedDate = null) {
  return api.post(`/api/projects/${id}/complete/`, { 
    body: completedDate ? { completed_date: completedDate } : {}
  });
}

/**
 * Reopen completed project
 * @param {number} id - Project ID
 * @returns {Promise<Object>}
 */
export async function reopenProject(id) {
  return api.post(`/api/projects/${id}/reopen/`, { body: {} });
}

/**
 * Bulk tag projects
 * @param {Object} data - Bulk action data
 * @param {number[]} data.ids - Project IDs
 * @param {number[]} data.tags - Tag IDs
 * @param {string} data.action - Action type (add, remove, set)
 * @returns {Promise<Object>}
 */
export async function bulkTagProjects(data) {
  return api.post('/api/projects/bulk_tag/', { body: data });
}

/**
 * Export projects to CSV
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Blob>}
 */
export async function exportProjects(params = {}) {
  return api.get('/api/projects/export/', { 
    params,
    responseType: 'blob'
  });
}
