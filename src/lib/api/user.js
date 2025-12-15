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
  try {
    const [user, profile] = await Promise.all([
      api.get('/api/users/me/'),
      api.get('/api/profiles/me/').catch(() => ({}))
    ]);
    return { ...user, ...profile };
  } catch (error) {
    return api.get('/api/users/me/');
  }
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
  try {
    return await api.patch('/api/profiles/me/', data);
  } catch (error) {
    console.warn('Profiles endpoint not available, using users endpoint');
    return api.patch('/api/users/me/', data);
  }
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

  return api.post('/api/profiles/me/avatar/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
  try {
    return await api.post('/api/users/me/change-password/', data);
  } catch (error) {
    console.warn('Change password endpoint not available');
    throw new Error('Password change functionality requires backend implementation');
  }
}

/**
 * Get user preferences
 * Uses /api/profiles/me/ for preferences
 * @returns {Promise<Object>}
 */
export async function getPreferences() {
  try {
    const profile = await api.get('/api/profiles/me/');
    return {
      email_notifications: profile.email_notifications,
      sms_notifications: profile.sms_notifications,
      push_notifications: profile.push_notifications,
      language: profile.language,
      timezone: profile.timezone,
    };
  } catch (error) {
    console.warn('Preferences not available, returning defaults');
    return {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      language: 'ru',
      timezone: 'Europe/Moscow',
    };
  }
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
  try {
    return await api.patch('/api/profiles/me/', preferences);
  } catch (error) {
    console.warn('Preferences update failed');
    throw error;
  }
}

/**
 * Get user statistics
 * Calculates from various endpoints
 * @returns {Promise<Object>}
 */
export async function getUserStats() {
  try {
    // Try dashboard analytics endpoint
    const analytics = await api.get('/api/dashboard/analytics/');
    return analytics;
  } catch (error) {
    console.warn('Stats not available, returning mock data');
    return {
      leads_count: 0,
      deals_count: 0,
      tasks_count: 0,
      calls_count: 0,
      lead_conversion_rate: 0,
    };
  }
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
  try {
    return await api.get('/api/dashboard/activity/', { params });
  } catch (error) {
    console.warn('User activity not available');
    return { results: [], count: 0 };
  }
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
  try {
    return await api.get('/api/users/', { params });
  } catch (error) {
    console.warn('Users list not available');
    return { results: [], count: 0 };
  }
}

/**
 * Get user sessions
 * Uses /api/users/me/sessions/ endpoint
 * @returns {Promise<Array>}
 */
export async function getUserSessions() {
  try {
    return await api.get('/api/users/me/sessions/');
  } catch (error) {
    console.warn('Sessions endpoint not available');
    return [];
  }
}

/**
 * Revoke all user sessions
 * Uses /api/users/me/sessions/revoke-all/ endpoint
 * @returns {Promise<Object>}
 */
export async function revokeAllSessions() {
  try {
    return await api.post('/api/users/me/sessions/revoke-all/');
  } catch (error) {
    console.warn('Revoke sessions endpoint not available');
    throw new Error('Session revocation functionality requires backend implementation');
  }
}

/**
 * Get 2FA status
 * Uses /api/users/me/2fa/status/ endpoint
 * @returns {Promise<Object>}
 */
export async function get2FAStatus() {
  try {
    return await api.get('/api/users/me/2fa/status/');
  } catch (error) {
    console.warn('2FA status endpoint not available');
    return { enabled: false, method: null };
  }
}
