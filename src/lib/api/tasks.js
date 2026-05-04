/**
 * Tasks API
 * 
 * Управление задачами и планированием работ
 */

import { api } from './client.js';

// ============================================================================
// Tasks (задачи)
// ============================================================================

/**
 * Get all tasks
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {boolean} params.active - Filter by active status
 * @param {number} params.co_owner - Filter by co-owner ID
 * @param {number} params.owner - Filter by owner ID (assigned user)
 * @param {number} params.project - Filter by project ID
 * @param {number} params.stage - Filter by stage ID
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getTasks(params = {}) {
  return api.get('/api/tasks/', { params });
}

/**
 * Get single task by ID
 * @param {number} id - Task ID
 * @returns {Promise<Object>}
 */
export async function getTask(id) {
  return api.get(`/api/tasks/${id}/`);
}

/**
 * Create new task
 * @param {Object} data - Task data
 * @param {string} data.title - Task title (required)
 * @param {string} data.description - Task description
 * @param {number} data.stage - Task stage ID
 * @param {number} data.assigned_to - User ID to assign task
 * @param {string} data.priority - Task priority (low, normal, high, urgent)
 * @param {string} data.status - Task status (open, in_progress, completed, cancelled)
 * @param {string} data.due_date - Due date (YYYY-MM-DD)
 * @param {number} data.project - Related project ID
 * @param {number} data.contact - Related contact ID
 * @param {number} data.company - Related company ID
 * @returns {Promise<Object>}
 */
export async function createTask(data) {
  return api.post('/api/tasks/', { body: data });
}

/**
 * Update task (full update)
 * @param {number} id - Task ID
 * @param {Object} data - Task data
 * @returns {Promise<Object>}
 */
export async function updateTask(id, data) {
  return api.put(`/api/tasks/${id}/`, { body: data });
}

/**
 * Partially update task
 * @param {number} id - Task ID
 * @param {Object} data - Partial task data
 * @returns {Promise<Object>}
 */
export async function patchTask(id, data) {
  return api.patch(`/api/tasks/${id}/`, { body: data });
}

/**
 * Delete task
 * @param {number} id - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  return api.delete(`/api/tasks/${id}/`);
}

/**
 * Get task stages (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getTaskStages(params = {}) {
  return api.get('/api/task-stages/', { params });
}

/**
 * Get task tags (reference data)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getTaskTags(params = {}) {
  return api.get('/api/task-tags/', { params });
}

/**
 * Mark task as completed
 * @param {number} id - Task ID
 * @param {string} completedDate - Completion date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function completeTask(id, completedDate = null) {
  return patchTask(id, { 
    status: 'completed',
    ...(completedDate && { completed_date: completedDate })
  });
}

/**
 * Reassign task to another user
 * @param {number} id - Task ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export async function reassignTask(id, userId) {
  return patchTask(id, { assigned_to: userId });
}

/**
 * Change task priority
 * @param {number} id - Task ID
 * @param {string} priority - New priority (low, normal, high, urgent)
 * @returns {Promise<Object>}
 */
export async function changeTaskPriority(id, priority) {
  return patchTask(id, { priority });
}

/**
 * Move task to another stage
 * @param {number} id - Task ID
 * @param {number} stageId - Target stage ID
 * @returns {Promise<Object>}
 */
export async function moveTaskToStage(id, stageId) {
  return patchTask(id, { stage: stageId });
}

/**
 * Bulk tag tasks
 * @param {Object} data - Bulk action data
 * @param {number[]} data.ids - Task IDs
 * @param {number[]} data.tags - Tag IDs
 * @param {string} data.action - Action type (add, remove, set)
 * @returns {Promise<Object>}
 */
export async function bulkTagTasks(data) {
  return api.post('/api/tasks/bulk_tag/', { body: data });
}
