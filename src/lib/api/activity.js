import { api } from './client';

/**
 * Activity Log API
 * Handles audit trail and activity tracking
 */

/**
 * Get activity log with pagination and filters
 * @param {Object} params
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @param {string} [params.action] - Action type filter
 * @param {string} [params.user] - User ID filter
 * @param {string} [params.start_date] - Date range start
 * @param {string} [params.end_date] - Date range end
 * @returns {Promise<Object>}
 */
export async function getActivityLog(params = {}) {
  try {
    return await api.get('/api/activity/', { params });
  } catch (error) {
    console.warn('Activity log not available, using mock data');
    // Return mock data
    return {
      results: [],
      count: 0,
    };
  }
}

/**
 * Get activity log for specific entity
 * @param {string} contentType - Entity type (lead, deal, contact, etc.)
 * @param {number} objectId - Entity ID
 * @param {Object} [params] - Additional query params
 * @returns {Promise<Object>}
 */
export async function getEntityActivity(contentType, objectId, params = {}) {
  try {
    return await api.get(`/api/activity/${contentType}/${objectId}/`, { params });
  } catch (error) {
    console.warn('Entity activity not available, using mock data');
    // Return mock data for development
    return {
      results: generateMockActivity(contentType, objectId),
      count: 5,
    };
  }
}

/**
 * Generate mock activity data for development
 */
function generateMockActivity(contentType, objectId) {
  const actions = ['created', 'updated', 'status_changed', 'assigned', 'commented'];
  const users = ['john.doe', 'jane.smith', 'admin'];
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    action: actions[i % actions.length],
    user: {
      id: i + 1,
      username: users[i % users.length],
      email: `${users[i % users.length]}@example.com`,
    },
    content_type: contentType,
    object_id: objectId,
    changes: {
      status: { old: 'new', new: 'in_progress' },
      amount: { old: 1000, new: 1500 },
    },
    description: `${actions[i % actions.length].replace('_', ' ')} the ${contentType}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

/**
 * Get activity statistics
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getActivityStats(params = {}) {
  try {
    return await api.get('/api/activity/stats/', { params });
  } catch (error) {
    console.warn('Activity stats not available');
    return {
      total: 0,
      by_action: {},
      by_user: {},
    };
  }
}
