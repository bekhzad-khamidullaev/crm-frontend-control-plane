/**
 * User Profile API
 * Methods for user profile management
 */

import { api } from './client';

/**
 * Get current user profile
 * Uses both /api/users/me/ and /api/profiles/me/ for complete data
 * @returns {Promise<Object>}
 */
export async function getProfile() {
  const [user, profile] = await Promise.all([
    api.get('/api/users/me/'),
    api.get('/api/profiles/me/'),
  ]);
  return { ...user, ...profile };
}

/**
 * Update user profile
 * Uses /api/profiles/me/ for profile data
 * @param {Object} data - Profile data
 * @param {string} [data.first_name] - First name
 * @param {string} [data.last_name] - Last name
 * @param {string} [data.email] - Email
 * @param {string} [data.phone] - Phone number
 * @param {string} [data.position] - Job position
 * @param {string} [data.department] - Department
 * @param {string} [data.bio] - Biography
 * @returns {Promise<Object>}
 */
export async function updateProfile(data) {
  return api.patch('/api/profiles/me/', { body: data });
}

/**
 * Upload user avatar
 * Uses /api/profiles/me/ with avatar field
 * @param {File} file - Avatar image file
 * @returns {Promise<Object>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  return api.post('/api/profiles/me/avatar/', { body: formData });
}

/**
 * Delete user avatar
 * Uses /api/profiles/me/avatar/ endpoint
 * @returns {Promise<Object>}
 */
export async function deleteAvatar() {
  return api.delete('/api/profiles/me/avatar/');
}

/**
 * Change user password
 * Note: This endpoint may not exist in base Django-CRM API
 * @param {Object} data
 * @param {string} data.old_password - Current password
 * @param {string} data.new_password - New password
 * @param {string} data.confirm_password - Confirm new password
 * @returns {Promise<Object>}
 */
export async function changePassword(data) {
  return api.post('/api/users/me/change-password/', { body: data });
}

/**
 * Get user preferences
 * Uses /api/profiles/me/ for preferences
 * @returns {Promise<Object>}
 */
export async function getPreferences() {
  const profile = await api.get('/api/profiles/me/');
  return {
    language_code: profile.language_code,
    utc_timezone: profile.utc_timezone,
    activate_timezone: profile.activate_timezone,
  };
}

/**
 * Update user preferences
 * Uses /api/profiles/me/ for preferences
 * @param {Object} preferences
 * @param {boolean} [preferences.email_notifications] - Enable email notifications
 * @param {boolean} [preferences.sms_notifications] - Enable SMS notifications
 * @param {boolean} [preferences.push_notifications] - Enable push notifications
 * @param {string} [preferences.language] - Preferred language
 * @param {string} [preferences.timezone] - Timezone
 * @returns {Promise<Object>}
 */
export async function updatePreferences(preferences) {
  return api.patch('/api/profiles/me/', { body: preferences });
}

/**
 * Get user statistics
 * Calculates from various endpoints
 * @returns {Promise<Object>}
 */
export async function getUserStats() {
  return api.get('/api/analytics/overview/');
}

/**
 * Get user activity log
 * Uses /api/dashboard/activity/ for user activity
 * @param {Object} [params]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @returns {Promise<Object>}
 */
export async function getUserActivity(params = {}) {
  return api.get('/api/dashboard/activity/', { params });
}

/**
 * Get list of users
 * Uses /api/users/ endpoint
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @param {string} [params.search]
 * @returns {Promise<Object>}
 */
export async function getUsers(params = {}) {
  return api.get('/api/users/', { params });
}

/**
 * Get profiles list
 * Uses /api/profiles/ endpoint
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getProfiles(params = {}) {
  return api.get('/api/profiles/', { params });
}

/**
 * Get profile by user ID
 * @param {number|string} userId
 * @returns {Promise<Object>}
 */
export async function getProfileByUser(userId) {
  return api.get(`/api/profiles/${userId}/`);
}

/**
 * Get user sessions
 * Uses /api/users/me/sessions/ endpoint
 * @returns {Promise<Array>}
 */
export async function getUserSessions() {
  return api.get('/api/users/me/sessions/');
}

/**
 * Revoke all user sessions
 * Uses /api/users/me/sessions/revoke-all/ endpoint
 * @returns {Promise<Object>}
 */
export async function revokeAllSessions() {
  return api.post('/api/users/me/sessions/revoke-all/');
}

/**
 * Get 2FA status
 * Uses /api/users/me/2fa/status/ endpoint
 * @returns {Promise<Object>}
 */
export async function get2FAStatus() {
  return api.get('/api/users/me/2fa/status/');
}
