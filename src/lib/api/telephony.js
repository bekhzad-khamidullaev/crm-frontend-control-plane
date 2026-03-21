/**
 * Telephony API
 * Phone calls, dialer, and telephony integration
 */

import { api } from './client';

/**
 * Initiate outgoing call
 * Note: This should use VoIP integration endpoints like /api/voip/cold-call/initiate/
 * @param {Object} data
 * @param {string} data.phone_number - Phone number to call
 * @param {string} [data.contact_name] - Contact name
 * @param {string} [data.entity_type] - Entity type (contact, lead, etc.)
 * @param {number} [data.entity_id] - Entity ID
 * @returns {Promise<Object>}
 */
export async function initiateCall(data) {
  return api.post('/api/voip/cold-call/initiate/', {
    body: {
      to_number: data.to_number || data.phone_number || data.phone,
      from_number: data.from_number,
      lead_id: data.lead_id,
      contact_id: data.contact_id,
      campaign_id: data.campaign_id,
      provider: data.provider,
    },
  });
}

/**
 * Reject active incoming call
 * Falls back to backend call-control when local SIP session is unavailable.
 * @param {string} sessionId - Session or call identifier
 * @returns {Promise<Object>}
 */
export async function rejectActiveCall(sessionId) {
  return api.post('/api/voip/call-control/reject/', {
    body: { session_id: sessionId },
  });
}

/**
 * End active call
 * Note: These call control endpoints are only available via backend VoIP control.
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */

/**
 * Get call history (uses VoIP call logs endpoint)
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Items per page
 * @param {string} [params.direction] - Filter by direction (inbound/outbound)
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.date_from] - Filter from date
 * @param {string} [params.date_to] - Filter to date
 * @returns {Promise<Object>}
 */
export async function getCallHistory(params = {}) {
  return api.get('/api/voip/call-logs/', { params });
}

/**
 * Add note to call log
 * @param {string|number} logId - Call log ID
 * @param {string} note - Note text
 * @returns {Promise<Object>}
 */
export async function addCallNote(logId, note) {
  return api.post(`/api/voip/call-logs/${logId}/add-note/`, { body: { note } });
}

/**
 * Get telephony statistics (uses VoIP call statistics endpoint)
 * @param {Object} [params]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @returns {Promise<Object>}
 */
export async function getTelephonyStats(params = {}) {
  return api.get('/api/voip/call-statistics/', { params });
}

/**
 * Get SIP configuration for WebRTC
 * @returns {Promise<Object>}
 */
export async function getSIPConfig() {
  return api.get('/api/voip/my-connections/');
}

/**
 * Save SIP configuration
 * @param {Object} data
 * @param {string} data.provider - Provider (Asterisk only)
 * @param {string} data.type - Connection type (sip, pbx)
 * @param {string} data.number - Phone number
 * @param {string} data.callerid - Caller ID
 * @returns {Promise<Object>}
 */
export async function saveSIPConfig(data) {
  return api.post('/api/voip/connections/', { body: data });
}

/**
 * Update SIP configuration
 * @param {string} id - Connection ID
 * @param {Object} data - Configuration data
 * @returns {Promise<Object>}
 */
export async function updateSIPConfig(id, data) {
  return api.patch(`/api/voip/connections/${id}/`, { body: data });
}

/**
 * Delete SIP configuration
 * @param {string} id - Connection ID
 * @returns {Promise<void>}
 */
export async function deleteSIPConfig(id) {
  return api.delete(`/api/voip/connections/${id}/`);
}

/**
 * Get SIP status
 * Uses voip/connections to determine status
 * @returns {Promise<Object>}
 */
export async function getSIPStatus() {
  const connections = await api.get('/api/voip/my-connections/');
  const activeConnection = connections.results?.find(c => c.active);

  return {
    connected: !!activeConnection,
    status: activeConnection ? 'online' : 'offline',
    connection: activeConnection || null,
  };
}

/**
 * Update telephony settings
 * Updates the active VoIP connection
 * @param {Object} settings
 * @returns {Promise<Object>}
 */
export async function updateTelephonySettings(settings) {
  const connections = await api.get('/api/voip/my-connections/');
  const activeConnection = connections.results?.find(c => c.active);

  if (activeConnection) {
    return api.patch(`/api/voip/connections/${activeConnection.id}/`, { body: settings });
  }
  return api.post('/api/voip/connections/', { body: { ...settings, active: true } });
}

/**
 * Get telephony settings
 * Gets the active VoIP connection settings
 * @returns {Promise<Object>}
 */
export async function getTelephonySettings() {
  const connections = await api.get('/api/voip/my-connections/');
  const activeConnection = connections.results?.find(c => c.active);

  return activeConnection || { active: false };
}

/**
 * Get call queue
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCallQueue(params = {}) {
  return api.get('/api/voip/call-queue/', { params });
}

/**
 * Get incoming calls
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getIncomingCalls(params = {}) {
  return api.get('/api/voip/incoming-calls/', { params });
}

/**
 * Get incoming call by ID
 * @param {number} id - Incoming call ID
 * @returns {Promise<Object>}
 */
export async function getIncomingCall(id) {
  return api.get(`/api/voip/incoming-calls/${id}/`);
}

/**
 * Schedule a cold call
 * @param {Object} data - Payload
 * @returns {Promise<Object>}
 */
export async function scheduleColdCall(data) {
  return api.post('/api/voip/cold-call/schedule/', { body: data });
}

/**
 * Bulk cold call
 * @param {Object} data - Payload
 * @returns {Promise<Object>}
 */
export async function bulkColdCall(data) {
  return api.post('/api/voip/cold-call/bulk/', { body: data });
}

// ============================================================================
// VoIP Connections (полный CRUD)
// ============================================================================

/**
 * Get all VoIP connections
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getVoIPConnections(params = {}) {
  return api.get('/api/voip/connections/', { params });
}

/**
 * Get single VoIP connection by ID
 * @param {number} id - Connection ID
 * @returns {Promise<Object>}
 */
export async function getVoIPConnection(id) {
  return api.get(`/api/voip/connections/${id}/`);
}

/**
 * Create new VoIP connection
 * @param {Object} data - Connection data
 * @param {string} data.name - Connection name
 * @param {string} data.provider - Provider name
 * @param {string} data.type - Connection type
 * @param {string} data.server - SIP server
 * @param {string} data.username - SIP username
 * @param {string} data.password - SIP password
 * @param {boolean} data.active - Is active
 * @returns {Promise<Object>}
 */
export async function createVoIPConnection(data) {
  return api.post('/api/voip/connections/', { body: data });
}

/**
 * Update VoIP connection (full update)
 * @param {number} id - Connection ID
 * @param {Object} data - Connection data
 * @returns {Promise<Object>}
 */
export async function updateVoIPConnection(id, data) {
  return api.put(`/api/voip/connections/${id}/`, { body: data });
}

/**
 * Partially update VoIP connection
 * @param {number} id - Connection ID
 * @param {Object} data - Partial connection data
 * @returns {Promise<Object>}
 */
export async function patchVoIPConnection(id, data) {
  return api.patch(`/api/voip/connections/${id}/`, { body: data });
}

// ============================================================================
// Call Routing Rules
// ============================================================================

export async function getRoutingRules(params = {}) {
  return api.get('/api/voip/routing-rules/', { params });
}

export async function createRoutingRule(data) {
  return api.post('/api/voip/routing-rules/', { body: data });
}

export async function updateRoutingRule(id, data) {
  return api.put(`/api/voip/routing-rules/${id}/`, { body: data });
}

export async function patchRoutingRule(id, data) {
  return api.patch(`/api/voip/routing-rules/${id}/`, { body: data });
}

export async function deleteRoutingRule(id) {
  return api.delete(`/api/voip/routing-rules/${id}/`);
}

export async function getInternalNumbers(params = {}) {
  return api.get('/api/voip/internal-numbers/', { params });
}

export async function getNumberGroups(params = {}) {
  return api.get('/api/voip/number-groups/', { params });
}

export async function getVoipSystemSettings() {
  try {
    return await api.get('/api/voip/system-settings/current/');
  } catch {
    return api.get('/api/voip/system-settings/');
  }
}

export async function updateVoipSystemSettings(data) {
  try {
    return await api.patch('/api/voip/system-settings/current/', { body: data });
  } catch {
    return api.patch('/api/voip/system-settings/1/', { body: data });
  }
}

/**
 * Delete VoIP connection
 * @param {number} id - Connection ID
 * @returns {Promise<void>}
 */
export async function deleteVoIPConnection(id) {
  return api.delete(`/api/voip/connections/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get active VoIP connection
 * @returns {Promise<Object|null>}
 */
export async function getActiveVoIPConnection() {
  const connections = await getVoIPConnections();
  const results = connections.results || connections;
  return results.find(c => c.active) || null;
}

/**
 * Set VoIP connection as active
 * @param {number} id - Connection ID
 * @returns {Promise<Object>}
 */
export async function activateVoIPConnection(id) {
  return patchVoIPConnection(id, { active: true });
}

/**
 * Deactivate VoIP connection
 * @param {number} id - Connection ID
 * @returns {Promise<Object>}
 */
export async function deactivateVoIPConnection(id) {
  return patchVoIPConnection(id, { active: false });
}

/**
 * Get recent incoming calls
 * @param {number} limit - Number of calls to retrieve
 * @returns {Promise<Object>}
 */
export async function getRecentIncomingCalls(limit = 10) {
  return getIncomingCalls({ limit });
}

/**
 * Get missed calls
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMissedCalls(params = {}) {
  return getIncomingCalls({ ...params, status: 'missed' });
}
