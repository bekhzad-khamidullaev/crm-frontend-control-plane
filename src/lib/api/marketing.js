/**
 * Marketing API
 * 
 * Управление маркетинговыми кампаниями, сегментами и шаблонами
 */

import { api } from './client.js';

// ============================================================================
// Campaigns (маркетинговые кампании)
// ============================================================================

/**
 * Get all marketing campaigns
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {boolean} params.is_active - Filter by active status
 * @param {number} params.segment - Filter by segment ID
 * @param {number} params.template - Filter by template ID
 * @returns {Promise<Object>}
 */
export async function getCampaigns(params = {}) {
  return api.get('/api/marketing/campaigns/', { params });
}

/**
 * Get single campaign by ID
 * @param {number} id - Campaign ID
 * @returns {Promise<Object>}
 */
export async function getCampaign(id) {
  return api.get(`/api/marketing/campaigns/${id}/`);
}

/**
 * Create new campaign
 * @param {Object} data - Campaign data
 * @param {string} data.name - Campaign name (required)
 * @param {string} data.type - Campaign type (email, sms, social, etc.)
 * @param {string} data.status - Status (draft, active, paused, completed)
 * @param {string} data.description - Campaign description
 * @param {string} data.start_date - Start date (YYYY-MM-DD)
 * @param {string} data.end_date - End date (YYYY-MM-DD)
 * @param {number} data.budget - Campaign budget
 * @param {number} data.segment - Target segment ID
 * @returns {Promise<Object>}
 */
export async function createCampaign(data) {
  return api.post('/api/marketing/campaigns/', { body: data });
}

/**
 * Update campaign (full update)
 * @param {number} id - Campaign ID
 * @param {Object} data - Campaign data
 * @returns {Promise<Object>}
 */
export async function updateCampaign(id, data) {
  return api.put(`/api/marketing/campaigns/${id}/`, { body: data });
}

/**
 * Partially update campaign
 * @param {number} id - Campaign ID
 * @param {Object} data - Partial campaign data
 * @returns {Promise<Object>}
 */
export async function patchCampaign(id, data) {
  return api.patch(`/api/marketing/campaigns/${id}/`, { body: data });
}

/**
 * Delete campaign
 * @param {number} id - Campaign ID
 * @returns {Promise<void>}
 */
export async function deleteCampaign(id) {
  return api.delete(`/api/marketing/campaigns/${id}/`);
}

// ============================================================================
// Segments (сегменты аудитории)
// ============================================================================

/**
 * Get all segments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getSegments(params = {}) {
  return api.get('/api/marketing/segments/', { params });
}

/**
 * Get single segment by ID
 * @param {number} id - Segment ID
 * @returns {Promise<Object>}
 */
export async function getSegment(id) {
  return api.get(`/api/marketing/segments/${id}/`);
}

/**
 * Create new segment
 * @param {Object} data - Segment data
 * @param {string} data.name - Segment name (required)
 * @param {string} data.description - Segment description
 * @param {Object} data.filters - Segment filters (JSON)
 * @param {boolean} data.is_dynamic - Is dynamic segment
 * @returns {Promise<Object>}
 */
export async function createSegment(data) {
  return api.post('/api/marketing/segments/', { body: data });
}

/**
 * Update segment (full update)
 * @param {number} id - Segment ID
 * @param {Object} data - Segment data
 * @returns {Promise<Object>}
 */
export async function updateSegment(id, data) {
  return api.put(`/api/marketing/segments/${id}/`, { body: data });
}

/**
 * Partially update segment
 * @param {number} id - Segment ID
 * @param {Object} data - Partial segment data
 * @returns {Promise<Object>}
 */
export async function patchSegment(id, data) {
  return api.patch(`/api/marketing/segments/${id}/`, { body: data });
}

/**
 * Delete segment
 * @param {number} id - Segment ID
 * @returns {Promise<void>}
 */
export async function deleteSegment(id) {
  return api.delete(`/api/marketing/segments/${id}/`);
}

// ============================================================================
// Templates (шаблоны сообщений)
// ============================================================================

/**
 * Get all message templates
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.type - Filter by type (email, sms, push)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getTemplates(params = {}) {
  return api.get('/api/marketing/templates/', { params });
}

/**
 * Get single template by ID
 * @param {number} id - Template ID
 * @returns {Promise<Object>}
 */
export async function getTemplate(id) {
  return api.get(`/api/marketing/templates/${id}/`);
}

/**
 * Create new template
 * @param {Object} data - Template data
 * @param {string} data.name - Template name (required)
 * @param {string} data.type - Template type (email, sms, push)
 * @param {string} data.subject - Message subject (for email)
 * @param {string} data.content - Message content (required)
 * @param {Object} data.variables - Available variables (JSON)
 * @returns {Promise<Object>}
 */
export async function createTemplate(data) {
  return api.post('/api/marketing/templates/', { body: data });
}

/**
 * Update template (full update)
 * @param {number} id - Template ID
 * @param {Object} data - Template data
 * @returns {Promise<Object>}
 */
export async function updateTemplate(id, data) {
  return api.put(`/api/marketing/templates/${id}/`, { body: data });
}

/**
 * Partially update template
 * @param {number} id - Template ID
 * @param {Object} data - Partial template data
 * @returns {Promise<Object>}
 */
export async function patchTemplate(id, data) {
  return api.patch(`/api/marketing/templates/${id}/`, { body: data });
}

/**
 * Delete template
 * @param {number} id - Template ID
 * @returns {Promise<void>}
 */
export async function deleteTemplate(id) {
  return api.delete(`/api/marketing/templates/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get active campaigns
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getActiveCampaigns(params = {}) {
  return getCampaigns({ ...params, status: 'active' });
}

/**
 * Get campaigns by type
 * @param {string} type - Campaign type
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getCampaignsByType(type, params = {}) {
  return getCampaigns({ ...params, type });
}

/**
 * Get email templates
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailTemplates(params = {}) {
  return getTemplates({ ...params, type: 'email' });
}

/**
 * Get SMS templates
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getSMSTemplates(params = {}) {
  return getTemplates({ ...params, type: 'sms' });
}

/**
 * Activate campaign
 * @param {number} id - Campaign ID
 * @returns {Promise<Object>}
 */
export async function activateCampaign(id) {
  return patchCampaign(id, { status: 'active' });
}

/**
 * Pause campaign
 * @param {number} id - Campaign ID
 * @returns {Promise<Object>}
 */
export async function pauseCampaign(id) {
  return patchCampaign(id, { status: 'paused' });
}

/**
 * Complete campaign
 * @param {number} id - Campaign ID
 * @returns {Promise<Object>}
 */
export async function completeCampaign(id) {
  return patchCampaign(id, { status: 'completed' });
}

/**
 * Clone campaign
 * @param {number} id - Campaign ID to clone
 * @param {string} newName - New campaign name
 * @returns {Promise<Object>}
 */
export async function cloneCampaign(id, newName) {
  const campaign = await getCampaign(id);
  const { id: _, created_at: _created_at, updated_at: _updated_at, ...campaignData } = campaign;
  
  return createCampaign({
    ...campaignData,
    name: newName || `${campaign.name} (копия)`,
    status: 'draft',
  });
}

/**
 * Clone template
 * @param {number} id - Template ID to clone
 * @param {string} newName - New template name
 * @returns {Promise<Object>}
 */
export async function cloneTemplate(id, newName) {
  const template = await getTemplate(id);
  const { id: _, created_at: _created_at, updated_at: _updated_at, ...templateData } = template;
  
  return createTemplate({
    ...templateData,
    name: newName || `${template.name} (копия)`,
  });
}

/**
 * Get dynamic segments only
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getDynamicSegments(params = {}) {
  return getSegments({ ...params, is_dynamic: true });
}

/**
 * Get static segments only
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getStaticSegments(params = {}) {
  return getSegments({ ...params, is_dynamic: false });
}
