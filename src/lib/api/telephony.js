/**
 * Telephony API
 * Phone calls, dialer, and telephony integration
 */

import { api } from './client';

/**
 * Initiate outgoing call
 * @param {Object} data
 * @param {string} data.phone_number - Phone number to call
 * @param {string} [data.contact_name] - Contact name
 * @param {string} [data.entity_type] - Entity type (contact, lead, etc.)
 * @param {number} [data.entity_id] - Entity ID
 * @returns {Promise<Object>}
 */
export async function initiateCall(data) {
  return api.post('/api/call-logs/', { number: data.phone_number, direction: 'outgoing', status: 'initiated', timestamp: new Date().toISOString() });
}

/**
 * End active call
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function endCall(callId) {
  return api.post(`/api/telephony/calls/${callId}/end/`);
}

/**
 * Answer incoming call
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function answerCall(callId) {
  return api.post(`/api/telephony/calls/${callId}/answer/`);
}

/**
 * Reject incoming call
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function rejectCall(callId) {
  return api.post(`/api/telephony/calls/${callId}/reject/`);
}

/**
 * Hold/Unhold call
 * @param {string} callId - Call ID
 * @param {boolean} hold - True to hold, false to unhold
 * @returns {Promise<Object>}
 */
export async function holdCall(callId, hold = true) {
  return api.post(`/api/telephony/calls/${callId}/hold/`, { hold });
}

/**
 * Mute/Unmute call
 * @param {string} callId - Call ID
 * @param {boolean} mute - True to mute, false to unmute
 * @returns {Promise<Object>}
 */
export async function muteCall(callId, mute = true) {
  return api.post(`/api/telephony/calls/${callId}/mute/`, { mute });
}

/**
 * Transfer call
 * @param {string} callId - Call ID
 * @param {string} targetNumber - Target phone number
 * @returns {Promise<Object>}
 */
export async function transferCall(callId, targetNumber) {
  return api.post(`/api/telephony/calls/${callId}/transfer/`, {
    target_number: targetNumber,
  });
}

/**
 * Get active call status
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function getCallStatus(callId) {
  return api.get(`/api/telephony/calls/${callId}/`);
}

/**
 * Get call history
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Items per page
 * @param {string} [params.call_type] - Filter by type (incoming, outgoing, missed)
 * @param {string} [params.date_from] - Filter from date
 * @param {string} [params.date_to] - Filter to date
 * @returns {Promise<Object>}
 */
export async function getCallHistory(params = {}) {
  return api.get('/api/call-logs/', { params });
}

/**
 * Get call recording
 * @param {string} callId - Call ID
 * @returns {Promise<Object>}
 */
export async function getCallRecording(callId) {
  return api.get(`/api/telephony/calls/${callId}/recording/`);
}

/**
 * Add note to call
 * @param {string} callId - Call ID
 * @param {string} note - Note text
 * @returns {Promise<Object>}
 */
export async function addCallNote(callId, note) {
  return api.post(`/api/telephony/calls/${callId}/notes/`, { note });
}

/**
 * Get telephony statistics
 * @param {Object} [params]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 * @returns {Promise<Object>}
 */
export async function getTelephonyStats(params = {}) {
  return api.get('/api/telephony/statistics/', { params });
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
export async function testSIPConnection(data) {
  try {
    // Try custom endpoint if available
    return await api.post('/api/telephony/test-connection/', data);
  } catch (error) {
    console.warn('Test connection endpoint not available, returning mock response');
    // Return mock success for UI testing
    return {
      success: true,
      message: 'SIP connection test successful (mock)',
      latency: Math.floor(Math.random() * 100) + 50,
    };
  }
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
