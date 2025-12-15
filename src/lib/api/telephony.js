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
  // Use VoIP cold-call initiate endpoint from API.yaml (line 7346)
  return api.post('/api/voip/cold-call/initiate/', { 
    phone: data.phone_number,
    contact_name: data.contact_name 
  });
}

/**
 * End active call
 * Note: These call control endpoints don't exist in API.yaml
 * Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function endCall(callId) {
  console.warn('Call control endpoints not available in API. Use WebRTC client (JsSIP) for call control.');
  throw new Error('Call control should be handled by WebRTC/SIP client.');
}

/**
 * Answer incoming call
 * Note: Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function answerCall(callId) {
  console.warn('Call control should be handled by WebRTC/SIP client.');
  throw new Error('Use WebRTC/SIP client (JsSIP) to answer calls.');
}

/**
 * Reject incoming call
 * Note: Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function rejectCall(callId) {
  console.warn('Call control should be handled by WebRTC/SIP client.');
  throw new Error('Use WebRTC/SIP client (JsSIP) to reject calls.');
}

/**
 * Hold/Unhold call
 * Note: Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @param {boolean} hold - True to hold, false to unhold
 * @returns {Promise<Object>}
 */
export async function holdCall(callId, hold = true) {
  console.warn('Call control should be handled by WebRTC/SIP client.');
  throw new Error('Use WebRTC/SIP client (JsSIP) for hold/unhold.');
}

/**
 * Mute/Unmute call
 * Note: Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @param {boolean} mute - True to mute, false to unmute
 * @returns {Promise<Object>}
 */
export async function muteCall(callId, mute = true) {
  console.warn('Call control should be handled by WebRTC/SIP client.');
  throw new Error('Use WebRTC/SIP client (JsSIP) for mute/unmute.');
}

/**
 * Transfer call
 * Note: Call control should be handled by WebRTC/SIP client (JsSIP)
 * @param {string} callId - Call ID
 * @param {string} targetNumber - Target phone number
 * @returns {Promise<Object>}
 */
export async function transferCall(callId, targetNumber) {
  console.warn('Call control should be handled by WebRTC/SIP client.');
  throw new Error('Use WebRTC/SIP client (JsSIP) for call transfer.');
}

/**
 * Get active call status
 * Note: This endpoint doesn't exist in API.yaml
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function getCallStatus(callId) {
  console.warn('Call status endpoint not available. Use call queue instead.');
  // Could use /api/voip/call-queue/ instead
  throw new Error('Call status endpoint not available.');
}

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
  try {
    return await api.get('/api/voip/call-logs/', { params });
  } catch (error) {
    // Call logs endpoint may not be available
    return { results: [], count: 0 };
  }
}

/**
 * Get call recording
 * Note: This endpoint doesn't exist in API.yaml
 * Recordings might be stored in call logs
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function getCallRecording(callId) {
  console.warn('Call recording endpoint not available. Check call log recording_url field.');
  throw new Error('Call recording endpoint not available. Use call log recording_url.');
}

/**
 * Add note to call log
 * @param {string|number} logId - Call log ID
 * @param {string} note - Note text
 * @returns {Promise<Object>}
 */
export async function addCallNote(logId, note) {
  return api.post(`/api/voip/call-logs/${logId}/add-note/`, { note });
}

/**
 * Get telephony statistics (uses VoIP call statistics endpoint)
 * @param {Object} [params]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @returns {Promise<Object>}
 */
export async function getTelephonyStats(params = {}) {
  try {
    return await api.get('/api/voip/call-statistics/', { params });
  } catch (error) {
    console.warn('Telephony stats endpoint not available:', error.message);
    // Return fallback data for graceful degradation
    return {
      total_calls: 0,
      incoming_calls: 0,
      outgoing_calls: 0,
      missed_calls: 0,
      average_duration: 0,
    };
  }
}

/**
 * Get SIP configuration for WebRTC
 * @returns {Promise<Object>}
 */
export async function getSIPConfig() {
  return api.get('/api/voip/connections/');
}

/**
 * Save SIP configuration
 * @param {Object} data
 * @param {string} data.provider - Provider (Zadarma, OnlinePBX, etc.)
 * @param {string} data.type - Connection type (sip, pbx, voip)
 * @param {string} data.number - Phone number
 * @param {string} data.callerid - Caller ID
 * @returns {Promise<Object>}
 */
export async function saveSIPConfig(data) {
  return api.post('/api/voip/connections/', data);
}

/**
 * Update SIP configuration
 * @param {string} id - Connection ID
 * @param {Object} data - Configuration data
 * @returns {Promise<Object>}
 */
export async function updateSIPConfig(id, data) {
  return api.patch(`/api/voip/connections/${id}/`, data);
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
 * Test SIP connection
 * Note: This endpoint doesn't exist in Django-CRM API.yaml
 * Returns mock success for demo purposes
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function testSIPConnection() {
  throw new Error('SIP connection test endpoint is not defined in Django-CRM API.yaml');
}

/**
 * Get SIP status
 * Uses voip/connections to determine status
 * @returns {Promise<Object>}
 */
export async function getSIPStatus() {
  try {
    const connections = await api.get('/api/voip/connections/');
    const activeConnection = connections.results?.find(c => c.active);
    
    return {
      connected: !!activeConnection,
      status: activeConnection ? 'online' : 'offline',
      connection: activeConnection || null,
    };
  } catch (error) {
    console.warn('Error getting SIP status:', error);
    return { connected: false, status: 'offline', connection: null };
  }
}

/**
 * Update telephony settings
 * Updates the active VoIP connection
 * @param {Object} settings
 * @returns {Promise<Object>}
 */
export async function updateTelephonySettings(settings) {
  try {
    // Get current connections
    const connections = await api.get('/api/voip/connections/');
    const activeConnection = connections.results?.find(c => c.active);
    
    if (activeConnection) {
      // Update existing connection
      return await api.patch(`/api/voip/connections/${activeConnection.id}/`, settings);
    } else {
      // Create new connection if none exists
      return await api.post('/api/voip/connections/', { ...settings, active: true });
    }
  } catch (error) {
    console.warn('Error updating telephony settings:', error);
    throw error;
  }
}

/**
 * Get telephony settings
 * Gets the active VoIP connection settings
 * @returns {Promise<Object>}
 */
export async function getTelephonySettings() {
  try {
    const connections = await api.get('/api/voip/connections/');
    const activeConnection = connections.results?.find(c => c.active);
    
    return activeConnection || { active: false };
  } catch (error) {
    console.warn('Error getting telephony settings:', error);
    return { active: false };
  }
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
  return api.post('/api/voip/connections/', data);
}

/**
 * Update VoIP connection (full update)
 * @param {number} id - Connection ID
 * @param {Object} data - Connection data
 * @returns {Promise<Object>}
 */
export async function updateVoIPConnection(id, data) {
  return api.put(`/api/voip/connections/${id}/`, data);
}

/**
 * Partially update VoIP connection
 * @param {number} id - Connection ID
 * @param {Object} data - Partial connection data
 * @returns {Promise<Object>}
 */
export async function patchVoIPConnection(id, data) {
  return api.patch(`/api/voip/connections/${id}/`, data);
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
// Incoming Calls (входящие звонки)
// ============================================================================

/**
 * Get all incoming calls
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.status - Filter by status
 * @param {string} params.date_from - Filter from date
 * @param {string} params.date_to - Filter to date
 * @returns {Promise<Object>}
 */
export async function getIncomingCalls(params = {}) {
  return api.get('/api/voip/incoming-calls/', { params });
}

/**
 * Get single incoming call by ID
 * @param {number} id - Incoming call ID
 * @returns {Promise<Object>}
 */
export async function getIncomingCall(id) {
  return api.get(`/api/voip/incoming-calls/${id}/`);
}

/**
 * Get current call queue
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getCallQueue(params = {}) {
  return api.get('/api/voip/call-queue/', { params });
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
  return getIncomingCalls({ page_size: limit, ordering: '-timestamp' });
}

/**
 * Get missed calls
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getMissedCalls(params = {}) {
  return getIncomingCalls({ ...params, status: 'missed' });
}
// Cold Call Bulk and Schedule endpoints

/**
 * Bulk create cold calls
 * @param {Object} data - Bulk cold call data
 * @returns {Promise<Object>}
 */
export async function bulkCreateColdCalls(data) {
  return api.post('/api/voip/cold-call/bulk/', data);
}

/**
 * Schedule cold calls
 * @param {Object} data - Schedule data
 * @returns {Promise<Object>}
 */
export async function scheduleColdCalls(data) {
  return api.post('/api/voip/cold-call/schedule/', data);
}
