/**
 * Reminders API
 * 
 * Управление напоминаниями и уведомлениями
 */

import { api } from './client.js';

// ============================================================================
// Reminders (напоминания)
// ============================================================================

/**
 * Get all reminders
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status (pending, completed, cancelled)
 * @param {number} params.user - Filter by user ID
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.reminder_type - Filter by type
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getReminders(params = {}) {
  return api.get('/api/reminders/', { params });
}

/**
 * Get single reminder by ID
 * @param {number} id - Reminder ID
 * @returns {Promise<Object>}
 */
export async function getReminder(id) {
  return api.get(`/api/reminders/${id}/`);
}

/**
 * Create new reminder
 * @param {Object} data - Reminder data
 * @param {string} data.title - Reminder title (required)
 * @param {string} data.description - Reminder description
 * @param {string} data.remind_at - Reminder date and time (ISO format) (required)
 * @param {number} data.user - User ID to remind (required)
 * @param {string} data.reminder_type - Type (email, push, in_app)
 * @param {string} data.status - Status (pending, completed, cancelled)
 * @param {number} data.related_lead - Related lead ID
 * @param {number} data.related_contact - Related contact ID
 * @param {number} data.related_deal - Related deal ID
 * @param {number} data.related_task - Related task ID
 * @returns {Promise<Object>}
 */
export async function createReminder(data) {
  return api.post('/api/reminders/', data);
}

/**
 * Update reminder (full update)
 * @param {number} id - Reminder ID
 * @param {Object} data - Reminder data
 * @returns {Promise<Object>}
 */
export async function updateReminder(id, data) {
  return api.put(`/api/reminders/${id}/`, data);
}

/**
 * Partially update reminder
 * @param {number} id - Reminder ID
 * @param {Object} data - Partial reminder data
 * @returns {Promise<Object>}
 */
export async function patchReminder(id, data) {
  return api.patch(`/api/reminders/${id}/`, data);
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
// Upcoming Reminders (ближайшие напоминания)
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
// Utility Functions
// ============================================================================

/**
 * Get pending reminders
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPendingReminders(params = {}) {
  return getReminders({ ...params, status: 'pending' });
}

/**
 * Get completed reminders
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getCompletedReminders(params = {}) {
  return getReminders({ ...params, status: 'completed' });
}

/**
 * Get reminders for user
 * @param {number} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByUser(userId, params = {}) {
  return getReminders({ ...params, user: userId });
}

/**
 * Get my reminders (for current user)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMyReminders(params = {}) {
  // Note: Backend должен определить текущего пользователя
  return getReminders({ ...params, user: 'me' });
}

/**
 * Get reminders by date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByDateRange(dateFrom, dateTo, params = {}) {
  return getReminders({ ...params, date_from: dateFrom, date_to: dateTo });
}

/**
 * Get reminders for today
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersToday(params = {}) {
  const today = new Date().toISOString().split('T')[0];
  return getRemindersByDateRange(today, today, params);
}

/**
 * Get reminders for this week
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersThisWeek(params = {}) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return getRemindersByDateRange(
    startOfWeek.toISOString().split('T')[0],
    endOfWeek.toISOString().split('T')[0],
    params
  );
}

/**
 * Get overdue reminders
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOverdueReminders(params = {}) {
  const now = new Date().toISOString();
  return getReminders({
    ...params,
    status: 'pending',
    date_to: now,
  });
}

/**
 * Get reminders by type
 * @param {string} type - Reminder type (email, push, in_app)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByType(type, params = {}) {
  return getReminders({ ...params, reminder_type: type });
}

/**
 * Get reminders related to lead
 * @param {number} leadId - Lead ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByLead(leadId, params = {}) {
  return getReminders({ ...params, related_lead: leadId });
}

/**
 * Get reminders related to contact
 * @param {number} contactId - Contact ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByContact(contactId, params = {}) {
  return getReminders({ ...params, related_contact: contactId });
}

/**
 * Get reminders related to deal
 * @param {number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByDeal(dealId, params = {}) {
  return getReminders({ ...params, related_deal: dealId });
}

/**
 * Get reminders related to task
 * @param {number} taskId - Task ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getRemindersByTask(taskId, params = {}) {
  return getReminders({ ...params, related_task: taskId });
}

/**
 * Search reminders by query
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function searchReminders(query, params = {}) {
  return getReminders({ ...params, search: query });
}

/**
 * Mark reminder as completed
 * @param {number} id - Reminder ID
 * @returns {Promise<Object>}
 */
export async function markReminderCompleted(id) {
  return patchReminder(id, { status: 'completed' });
}

/**
 * Mark reminder as cancelled
 * @param {number} id - Reminder ID
 * @returns {Promise<Object>}
 */
export async function markReminderCancelled(id) {
  return patchReminder(id, { status: 'cancelled' });
}

/**
 * Snooze reminder (postpone for later)
 * @param {number} id - Reminder ID
 * @param {number} minutes - Minutes to snooze
 * @returns {Promise<Object>}
 */
export async function snoozeReminder(id, minutes = 30) {
  const reminder = await getReminder(id);
  const currentTime = new Date(reminder.remind_at);
  const newTime = new Date(currentTime.getTime() + minutes * 60000);

  return patchReminder(id, {
    remind_at: newTime.toISOString(),
  });
}

/**
 * Reschedule reminder
 * @param {number} id - Reminder ID
 * @param {string} newDateTime - New date and time (ISO format)
 * @returns {Promise<Object>}
 */
export async function rescheduleReminder(id, newDateTime) {
  return patchReminder(id, { remind_at: newDateTime });
}

/**
 * Create reminder for lead
 * @param {number} leadId - Lead ID
 * @param {string} title - Reminder title
 * @param {string} remindAt - Reminder date and time (ISO format)
 * @param {number} userId - User ID
 * @param {Object} additionalData - Additional reminder data
 * @returns {Promise<Object>}
 */
export async function createReminderForLead(leadId, title, remindAt, userId, additionalData = {}) {
  return createReminder({
    title,
    remind_at: remindAt,
    user: userId,
    related_lead: leadId,
    ...additionalData,
  });
}

/**
 * Create reminder for deal
 * @param {number} dealId - Deal ID
 * @param {string} title - Reminder title
 * @param {string} remindAt - Reminder date and time (ISO format)
 * @param {number} userId - User ID
 * @param {Object} additionalData - Additional reminder data
 * @returns {Promise<Object>}
 */
export async function createReminderForDeal(dealId, title, remindAt, userId, additionalData = {}) {
  return createReminder({
    title,
    remind_at: remindAt,
    user: userId,
    related_deal: dealId,
    ...additionalData,
  });
}

/**
 * Create reminder for task
 * @param {number} taskId - Task ID
 * @param {string} title - Reminder title
 * @param {string} remindAt - Reminder date and time (ISO format)
 * @param {number} userId - User ID
 * @param {Object} additionalData - Additional reminder data
 * @returns {Promise<Object>}
 */
export async function createReminderForTask(taskId, title, remindAt, userId, additionalData = {}) {
  return createReminder({
    title,
    remind_at: remindAt,
    user: userId,
    related_task: taskId,
    ...additionalData,
  });
}

/**
 * Bulk complete reminders
 * @param {Array<number>} ids - Array of reminder IDs
 * @returns {Promise<Array>}
 */
export async function bulkCompleteReminders(ids) {
  return Promise.all(ids.map(id => markReminderCompleted(id)));
}

/**
 * Get reminder count by status
 * @param {string} status - Status to count
 * @returns {Promise<number>}
 */
export async function getReminderCount(status) {
  const response = await getReminders({ status, page_size: 1 });
  return response.count || 0;
}
