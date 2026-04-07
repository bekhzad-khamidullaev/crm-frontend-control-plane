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
  const [userRes, profileRes] = await Promise.allSettled([
    api.get('/api/users/me/'),
    api.get('/api/profiles/me/'),
  ]);

  const user = userRes.status === 'fulfilled' ? userRes.value : {};
  const profile = profileRes.status === 'fulfilled' ? profileRes.value : {};

  if (userRes.status === 'rejected' && profileRes.status === 'rejected') {
    throw userRes.reason || profileRes.reason || new Error('Failed to load profile');
  }

  // Merge: user data provides auth fields (permissions, is_staff, system_version);
  // profile data overrides personal fields (avatar, position, language_code, etc.).
  // User fields that must not be overwritten by profile: id, username, is_staff, is_superuser, permissions.
  const { id, username, is_staff, is_superuser, permissions, system_version, ...userRest } = user;
  return {
    ...userRest,
    ...profile,
    // Always preserve identity & auth fields from /api/users/me/
    id: id ?? profile.id,
    username: username ?? profile.username,
    is_staff: is_staff ?? profile.is_staff,
    is_superuser: is_superuser ?? profile.is_superuser,
    permissions: permissions ?? profile.permissions,
    system_version: system_version ?? profile.system_version,
  };
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

export async function getTelephonyCredentials() {
  return api.get('/api/profiles/me/telephony-credentials/');
}

export async function updateTelephonyCredentials(data) {
  return api.patch('/api/profiles/me/telephony-credentials/', { body: data });
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
  const data = await api.get('/api/dashboard/activity/', { params });

  const normalizeItem = (item = {}) => ({
    ...item,
    action: item.action || item.message || item.type || 'activity',
    timestamp: item.timestamp || item.created_at || item.updated_at || null,
  });

  if (Array.isArray(data)) {
    return { results: data.map(normalizeItem) };
  }

  if (Array.isArray(data?.results)) {
    return { ...data, results: data.results.map(normalizeItem) };
  }

  return { results: [] };
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
 * Uses /api/settings/security/sessions/ as canonical source (richer data: IP, device, location).
 * Falls back to /api/users/me/sessions/ if security endpoint is unavailable.
 * @returns {Promise<Array>}
 */
export async function getUserSessions() {
  try {
    return await api.get('/api/settings/security/sessions/');
  } catch (err) {
    if (err?.status === 404 || err?.status === 403) {
      return api.get('/api/users/me/sessions/');
    }
    throw err;
  }
}

/**
 * Revoke all user sessions
 * Uses /api/settings/security/sessions/revoke-all/ as canonical source.
 * Falls back to /api/users/me/sessions/revoke-all/ if security endpoint is unavailable.
 * @returns {Promise<Object>}
 */
export async function revokeAllSessions() {
  try {
    return await api.post('/api/settings/security/sessions/revoke-all/', { body: {} });
  } catch (err) {
    if (err?.status === 404 || err?.status === 403) {
      return api.post('/api/users/me/sessions/revoke-all/');
    }
    throw err;
  }
}

/**
 * Get 2FA status
 * Uses /api/users/me/2fa/status/ endpoint
 * @returns {Promise<Object>}
 */
export async function get2FAStatus() {
  return api.get('/api/users/me/2fa/status/');
}

export async function update2FAStatus(data) {
  return api.patch('/api/users/me/2fa/status/', { body: data });
}

const USER_BASE_CANDIDATES = ['/api/users/', '/api/auth/users/'];

function isUnsupportedEndpoint(error) {
  return [404, 405, 501].includes(Number(error?.status || 0));
}

function normalizeMultiValueList(items) {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(
      items
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
}

async function requestUserWriteWithFallback(makeRequest) {
  let lastError = null;
  for (const basePath of USER_BASE_CANDIDATES) {
    try {
      return await makeRequest(basePath);
    } catch (error) {
      lastError = error;
      if (!isUnsupportedEndpoint(error)) {
        throw error;
      }
    }
  }
  throw lastError || new Error('No writable users endpoint is available');
}

export async function detectUserWriteCapability() {
  let hasIntrospectableEndpoint = false;
  for (const basePath of USER_BASE_CANDIDATES) {
    try {
      const response = await api.options(basePath);
      hasIntrospectableEndpoint = true;
      const allowRaw =
        response?.allow ||
        response?.ALLOW ||
        response?.headers?.allow ||
        response?.detail?.allow ||
        '';
      const allow = String(allowRaw || '')
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      const supportsPost = allow.includes('POST');
      const supportsActionsPost = Boolean(response?.actions?.POST);
      if (supportsPost || supportsActionsPost) {
        return 'writable';
      }
    } catch (error) {
      if (!isUnsupportedEndpoint(error)) {
        return 'unknown';
      }
    }
  }
  return hasIntrospectableEndpoint ? 'readonly' : 'unknown';
}

/**
 * Create CRM user account
 * Tries /api/users/ first, then /api/auth/users/ for compatibility.
 */
export async function createUser(payload) {
  return requestUserWriteWithFallback((basePath) => api.post(basePath, { body: payload }));
}

/**
 * Update CRM user account by ID
 * @param {number|string} userId
 * @param {Object} payload
 * @param {Object} [options]
 * @param {boolean} [options.partial=true]
 */
export async function updateUser(userId, payload, { partial = true } = {}) {
  return requestUserWriteWithFallback((basePath) =>
    partial
      ? api.patch(`${basePath}${userId}/`, { body: payload })
      : api.put(`${basePath}${userId}/`, { body: payload })
  );
}

/**
 * Delete CRM user account by ID
 * @param {number|string} userId
 */
export async function deleteUser(userId) {
  return requestUserWriteWithFallback((basePath) => api.delete(`${basePath}${userId}/`));
}

/**
 * Fetch departments/groups for user assignment forms.
 */
export async function getDepartmentsAsGroups(params = {}) {
  return api.get('/api/departments/', {
    params: {
      page_size: 200,
      ...params,
    },
  });
}

/**
 * Update user access (roles/groups/permissions).
 * Tries direct user PATCH first, then specialized endpoints when available.
 *
 * @param {number|string} userId
 * @param {Object} access
 * @param {string[]} [access.roles]
 * @param {string[]} [access.groups]
 * @param {string[]} [access.permissions]
 * @param {boolean} [access.is_staff]
 * @param {boolean} [access.is_superuser]
 */
export async function updateUserAccess(userId, access = {}) {
  const roles = normalizeMultiValueList(access.roles);
  const groups = normalizeMultiValueList(access.groups);
  const permissions = normalizeMultiValueList(access.permissions);
  const isSuperuser = Boolean(access.is_superuser) || roles.includes('admin');
  const isStaff = Boolean(access.is_staff) || isSuperuser || roles.includes('manager');

  const primaryPayload = {
    roles,
    is_staff: isStaff,
    is_superuser: isSuperuser,
    groups,
    permissions,
  };

  try {
    return await updateUser(userId, primaryPayload, { partial: true });
  } catch (error) {
    if (!isUnsupportedEndpoint(error)) {
      throw error;
    }
  }

  let groupsUpdated = false;
  if (groups.length || roles.length) {
    const groupPayload = { groups };
    try {
      await requestUserWriteWithFallback((basePath) =>
        api.put(`${basePath}${userId}/groups/`, { body: groupPayload })
      );
      groupsUpdated = true;
    } catch (error) {
      if (!isUnsupportedEndpoint(error)) {
        throw error;
      }
    }
  }

  let permissionsUpdated = false;
  if (permissions.length) {
    const permissionPayload = { permissions };
    try {
      await requestUserWriteWithFallback((basePath) =>
        api.put(`${basePath}${userId}/permissions/`, { body: permissionPayload })
      );
      permissionsUpdated = true;
    } catch (error) {
      if (!isUnsupportedEndpoint(error)) {
        throw error;
      }
    }
  }

  if (!groupsUpdated && !permissionsUpdated) {
    throw new Error('User access update endpoint is unavailable');
  }

  return { groupsUpdated, permissionsUpdated };
}
