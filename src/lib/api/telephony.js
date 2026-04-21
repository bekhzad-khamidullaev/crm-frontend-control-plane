/**
 * Telephony API
 * Phone calls, dialer, and telephony integration
 */

import { api } from './client';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
      continue;
    }
    return value;
  }
  return null;
}

function toOptionalNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePhoneNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function extractTechnicalPayload(call) {
  return asObject(call?.technical_payload);
}

export function normalizeTelephonyCallPayload(rawCall = {}) {
  const call = asObject(rawCall);
  const technicalPayload = extractTechnicalPayload(call);

  const sessionId = firstNonEmpty(
    call.sessionId,
    call.session_id,
    call.call_session_id,
    call.callId,
    call.call_id,
    call.id,
    call.uniqueid,
    call.linkedid,
    technicalPayload.session_id,
    technicalPayload.call_id,
    technicalPayload.uniqueid,
    technicalPayload.linkedid,
  );

  const callId = firstNonEmpty(
    call.callId,
    call.call_id,
    call.id,
    sessionId,
    technicalPayload.call_id,
  );

  const direction = String(
    firstNonEmpty(
      call.direction,
      technicalPayload.direction,
      'inbound',
    ) || 'inbound',
  ).toLowerCase();

  const phoneNumber = firstNonEmpty(
    call.phoneNumber,
    call.phone_number,
    call.number,
    direction === 'inbound' ? call.caller_id : null,
    direction === 'outbound' ? call.called_number : null,
    call.called_number,
    call.caller_id,
    technicalPayload.phone_number,
    technicalPayload.number,
    technicalPayload.called_number,
    technicalPayload.caller_id,
  );

  const agentExtension = firstNonEmpty(
    call.agentExtension,
    call.agent_extension,
    call.extension,
    call.target_extension,
    technicalPayload.agent_extension,
    technicalPayload.extension,
    technicalPayload.target_extension,
    technicalPayload.DestExten,
    technicalPayload.Exten,
  );

  const queue = firstNonEmpty(
    call.queue,
    call.queue_name,
    call.queueNumber,
    technicalPayload.queue,
    technicalPayload.queue_name,
    technicalPayload.queue_number,
    technicalPayload.Queue,
    technicalPayload.QueueName,
  );

  const queuePosition = toOptionalNumber(
    firstNonEmpty(
      call.queuePosition,
      call.queue_position,
      technicalPayload.queue_position,
      technicalPayload.position,
    ),
  );

  const waitTime = toOptionalNumber(
    firstNonEmpty(
      call.waitTime,
      call.wait_time,
      technicalPayload.wait_time,
      technicalPayload.queue_wait_time,
    ),
  );

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber || '');
  const normalizedCallerId = normalizePhoneNumber(
    firstNonEmpty(call.caller_id, technicalPayload.caller_id) || '',
  );
  const normalizedCalledNumber = normalizePhoneNumber(
    firstNonEmpty(call.called_number, technicalPayload.called_number) || '',
  );

  const recordingUrl = firstNonEmpty(
    call.recordingUrl,
    call.recording_url,
    call.recording_file,
    technicalPayload.recording_url,
    technicalPayload.recording_file,
  ) || '';

  const status = firstNonEmpty(
    call.status,
    call.state,
    call.call_status,
    technicalPayload.status,
    technicalPayload.state,
  );

  return {
    ...call,
    technical_payload: technicalPayload,
    callId,
    call_id: call.call_id ?? callId,
    sessionId,
    session_id: call.session_id ?? sessionId,
    phoneNumber,
    phone_number: call.phone_number ?? phoneNumber,
    callerName: firstNonEmpty(
      call.callerName,
      call.caller_name,
      call.client_name,
      call.contact_name,
      technicalPayload.caller_name,
      technicalPayload.client_name,
    ),
    status,
    duration: toOptionalNumber(
      firstNonEmpty(call.duration, call.billsec, technicalPayload.duration, technicalPayload.billsec),
      0,
    ),
    direction,
    agentExtension,
    agent_extension: call.agent_extension ?? agentExtension,
    extension: call.extension ?? agentExtension,
    queue,
    queuePosition,
    queue_position: call.queue_position ?? queuePosition,
    waitTime,
    wait_time: call.wait_time ?? waitTime,
    recordingUrl,
    recording_url: call.recording_url ?? recordingUrl,
    recordingReady: Boolean(
      recordingUrl ||
      firstNonEmpty(call.recording_ready, call.recordingReady, call.recording_ready_at, technicalPayload.recording_ready_at),
    ),
    routeTargetType: queue ? 'queue' : agentExtension ? 'extension' : 'external',
    routeTargetLabel: queue || agentExtension || firstNonEmpty(call.called_number, technicalPayload.called_number),
    linkedId: firstNonEmpty(call.linkedId, call.linkedid, technicalPayload.linkedid, technicalPayload.Linkedid),
    uniqueId: firstNonEmpty(call.uniqueId, call.uniqueid, technicalPayload.uniqueid, technicalPayload.Uniqueid),
    normalizedPhoneNumber,
    normalizedCallerId,
    normalizedCalledNumber,
    startedAt: firstNonEmpty(call.startedAt, call.started_at, call.start_time, technicalPayload.started_at),
    answeredAt: firstNonEmpty(call.answeredAt, call.answered_at, call.answer_time, technicalPayload.answered_at),
    endedAt: firstNonEmpty(call.endedAt, call.ended_at, call.end_time, technicalPayload.ended_at),
  };
}

function normalizeTelephonyCollectionResponse(response) {
  if (Array.isArray(response)) {
    return response.map((item) => normalizeTelephonyCallPayload(item));
  }

  if (response && Array.isArray(response.results)) {
    return {
      ...response,
      results: response.results.map((item) => normalizeTelephonyCallPayload(item)),
    };
  }

  return response;
}

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
 * End active call
 * Note: These call control endpoints don't exist in API.yaml
 * Call control should be handled by WebRTC/SIP client (JsSIP)
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
 * @param {string} data.provider - Provider (Asterisk)
 * @param {string} data.type - Connection type (pbx=embedded, sip=external ami)
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
  const response = await api.get('/api/voip/incoming-calls-feed/', { params });
  return normalizeTelephonyCollectionResponse(response);
}

/**
 * Get active calls snapshot (used for resync after WebSocket reconnect)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object|Array>}
 */
export async function getActiveCalls(params = {}) {
  const response = await api.get('/api/voip/active-calls/', { params });
  return normalizeTelephonyCollectionResponse(response);
}

/**
 * Get incoming call by ID
 * @param {number} id - Incoming call ID
 * @returns {Promise<Object>}
 */
export async function getIncomingCall(id) {
  const response = await api.get(`/api/voip/incoming-calls/${id}/`);
  return normalizeTelephonyCallPayload(response);
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

/**
 * Force hangup active call in PBX by session identifier.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function hangupActiveCall(sessionId) {
  return api.post('/api/voip/call-control/hangup/', { body: { session_id: sessionId } });
}

/**
 * Reject ringing call in PBX by session identifier.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function rejectActiveCall(sessionId) {
  return api.post('/api/voip/call-control/reject/', { body: { session_id: sessionId } });
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

export async function createInternalNumber(data) {
  return api.post('/api/voip/internal-numbers/', { body: data });
}

export async function updateInternalNumber(id, data) {
  return api.patch(`/api/voip/internal-numbers/${id}/`, { body: data });
}

export async function deleteInternalNumber(id) {
  return api.delete(`/api/voip/internal-numbers/${id}/`);
}

export async function validateInternalNumber(data) {
  return api.post('/api/voip/internal-numbers/validate/', { body: data });
}

export async function syncInternalNumbers(data = {}) {
  return api.post('/api/voip/internal-numbers/sync/', { body: data });
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
  return api.patch('/api/voip/system-settings/current/', { body: data });
}

export async function getVoipClientSettings() {
  try {
    return await api.get('/api/voip/client-settings/current/');
  } catch {
    return api.get('/api/voip/client-settings/');
  }
}

export async function updateVoipClientSettings(data) {
  return api.patch('/api/voip/client-settings/current/', { body: data });
}

export async function getVoipRealtimeSettings() {
  return api.get('/api/voip/realtime-settings/current/');
}

export async function updateVoipRealtimeSettings(data) {
  return api.patch('/api/voip/realtime-settings/current/', { body: data });
}

export async function testVoipRealtimeSettings(data) {
  return api.post('/api/voip/realtime-settings/test/', { body: data });
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
