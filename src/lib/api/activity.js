import { api } from './client';

/**
 * Activity Log API
 * Uses dashboard activity endpoint from Django-CRM API.yaml
 */

/**
 * Get activity log (uses dashboard activity endpoint)
 * @param {Object} params
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<Object>}
 */
export async function getActivityLog(params = {}) {
  try {
    // Use dashboard activity endpoint from API.yaml (line 1568)
    return await api.get('/api/dashboard/activity/', { params });
  } catch (error) {
    console.warn('Activity log not available');
    return {
      results: [],
      count: 0,
    };
  }
}

/**
 * Get activity log for specific entity
 * Note: This endpoint doesn't exist in API.yaml, using mock data
 * @param {string} contentType - Entity type (lead, deal, contact, etc.)
 * @param {number} objectId - Entity ID
 * @param {Object} [params] - Additional query params
 * @returns {Promise<Object>}
 */
export async function getEntityActivity(contentType, objectId, params = {}) {
  // This endpoint doesn't exist in Django-CRM API.yaml
  // Using mock data until backend implements it
  console.warn('Entity activity endpoint not available in API, using mock data');
  return {
    results: generateMockActivity(contentType, objectId),
    count: 5,
  };
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
 * Note: This endpoint doesn't exist in API.yaml, returns mock data
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getActivityStats(params = {}) {
  // This endpoint doesn't exist in Django-CRM API.yaml
  // Consider using /api/dashboard/analytics/ instead
  console.warn('Activity stats endpoint not available in API');
  return {
    total: 0,
    by_action: {},
    by_user: {},
  };
}
