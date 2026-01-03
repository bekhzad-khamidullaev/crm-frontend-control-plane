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
  return api.get('/api/dashboard/activity/', { params });
}

/**
 * Get activity log for specific entity
 * Filters dashboard activity feed by content type and object ID
 * @param {string} contentType - Entity type (lead, deal, contact, etc.)
 * @param {number} objectId - Entity ID
 * @param {Object} [params] - Additional query params
 * @returns {Promise<Object>}
 */
export async function getEntityActivity(contentType, objectId, params = {}) {
  const data = await getActivityLog(params);
  const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  const normalizedType = typeof contentType === 'string' ? contentType.toLowerCase() : contentType;
  const filtered = results.filter((item) => {
    const itemType = (item.content_type_name || item.content_type || item.entity_type || '').toString().toLowerCase();
    const itemObjectId = item.object_id || item.entity_id || item.objectId || item.id;

    const typeMatches = normalizedType ? itemType.includes(normalizedType) : true;
    const idMatches = objectId ? Number(itemObjectId) === Number(objectId) : true;

    return typeMatches && idMatches;
  });

  return {
    results: filtered,
    count: filtered.length,
  };
}

/**
 * Get activity statistics
 * Uses dashboard analytics endpoint for aggregate metrics
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getActivityStats(params = {}) {
  return api.get('/api/dashboard/analytics/', { params });
}
