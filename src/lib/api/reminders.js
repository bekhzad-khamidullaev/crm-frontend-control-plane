/**
 * Reminders API
 *
 * CRUD for reminders aligned with Contora API.yaml.
 */

import { api } from './client.js';

// ============================================================================
// Reminders (напоминания)
// ============================================================================

/**
 * Get reminders list
 * @param {Object} params - Query parameters
 * @param {boolean} [params.active] - Filter by active
 * @param {number} [params.content_type] - Content type ID
 * @param {number} [params.owner] - Owner user ID
 * @param {string} [params.search] - Search query
 * @param {string} [params.ordering] - Ordering field
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<Object>}
 */
export async function getReminders(params = {}) {
  return api.get('/api/reminders/', { params });
}

/**
 * Get reminder by ID
 * @param {number} id - Reminder ID
 * @returns {Promise<Object>}
 */
export async function getReminder(id) {
  return api.get(`/api/reminders/${id}/`);
}

/**
 * Create reminder
 * @param {Object} data - Reminder payload
 * @param {string} data.subject - Briefly, what is this reminder about?
 * @param {string} [data.description] - Description
 * @param {string} data.reminder_date - ISO datetime
 * @param {boolean} [data.send_notification_email] - Send notification email
 * @param {boolean} [data.active] - Active flag
 * @param {number} data.content_type - Django content type ID
 * @param {number} data.object_id - Related object ID
 * @param {number} [data.owner] - Owner user ID
 * @returns {Promise<Object>}
 */
export async function createReminder(data) {
  return api.post('/api/reminders/', { body: data });
}

/**
 * Update reminder (full update)
 * @param {number} id - Reminder ID
 * @param {Object} data - Reminder payload
 * @returns {Promise<Object>}
 */
export async function updateReminder(id, data) {
  return api.put(`/api/reminders/${id}/`, { body: data });
}

/**
 * Patch reminder
 * @param {number} id - Reminder ID
 * @param {Object} data - Partial payload
 * @returns {Promise<Object>}
 */
export async function patchReminder(id, data) {
  return api.patch(`/api/reminders/${id}/`, { body: data });
}

/**
 * Delete reminder
 * @param {number} id - Reminder ID
 * @returns {Promise<void>}
 */
export async function deleteReminder(id) {
  return api.delete(`/api/reminders/${id}/`);
}

// ============================================================================
// Upcoming reminders
// ============================================================================

/**
 * Get upcoming reminders
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getUpcomingReminders(params = {}) {
  return api.get('/api/reminders/upcoming/', { params });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Set reminder active flag
 * @param {number} id - Reminder ID
 * @param {boolean} active - New active state
 * @returns {Promise<Object>}
 */
export async function setReminderActive(id, active) {
  return patchReminder(id, { active });
}

/**
 * Mark reminder as completed (inactive)
 * @param {number} id - Reminder ID
 * @returns {Promise<Object>}
 */
export async function markReminderCompleted(id) {
  return setReminderActive(id, false);
}

/**
 * Snooze reminder by N minutes
 * @param {number} id - Reminder ID
 * @param {number} minutes - Minutes to postpone
 * @returns {Promise<Object>}
 */
export async function snoozeReminder(id, minutes = 30) {
  const reminder = await getReminder(id);
  const base = reminder?.reminder_date ? new Date(reminder.reminder_date) : new Date();
  const next = new Date(base.getTime() + minutes * 60000);
  return patchReminder(id, { reminder_date: next.toISOString() });
}

/**
 * Get reminders by owner
 * @param {number} ownerId - Owner user ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByOwner(ownerId, params = {}) {
  return getReminders({ ...params, owner: ownerId });
}

/**
 * Get reminders by content type + object ID
 * @param {number} contentType - Content type ID
 * @param {number} objectId - Object ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByContent(contentType, objectId, params = {}) {
  return getReminders({ ...params, content_type: contentType, object_id: objectId });
}
