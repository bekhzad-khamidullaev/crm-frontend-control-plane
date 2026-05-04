/**
 * TelephonyManager — centralized telephony state manager.
 *
 * Merges two independent event sources (JsSIP SIP events and Django Channels
 * WebSocket events) into a single, consistent state machine so that all UI
 * components (DialerModal, IncomingCallModal) can consume
 * one authoritative state instead of each building their own local picture.
 *
 * Key guarantees:
 *  - Only ONE incoming-call popup fires per unique call (de-dup by phone number)
 *  - DND and Auto-Answer are enforced globally before any UI sees the event
 *  - SIP registration state is tracked in one place
 */

const STORAGE_PREFIX = 'crm:telephony:';

const LEGACY_STORAGE_KEYS = {
  dnd: ['crm:dialer:dnd'],
  'auto-answer': ['crm:dialer:auto-answer'],
};

function readFlag(key, fallback = false, legacyKeys = []) {
  if (typeof window === 'undefined') return fallback;
  const primary = String(window.localStorage.getItem(`${STORAGE_PREFIX}${key}`) || '').trim().toLowerCase();
  if (primary) return ['1', 'true', 'yes', 'on'].includes(primary);

  for (const legacyKey of legacyKeys) {
    const raw = String(window.localStorage.getItem(legacyKey) || '').trim().toLowerCase();
    if (!raw) continue;
    return ['1', 'true', 'yes', 'on'].includes(raw);
  }

  return fallback;
}

function writeFlag(key, value, legacyKeys = []) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, value ? 'true' : 'false');
  legacyKeys.forEach((legacyKey) => {
    window.localStorage.setItem(legacyKey, value ? 'true' : 'false');
  });
}

function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function normalizeCallIdentity(callData = {}) {
  const value = callData?.sessionId
    ?? callData?.session_id
    ?? callData?.callId
    ?? callData?.call_id
    ?? callData?.id
    ?? '';
  const normalized = String(value || '').trim();
  return normalized || '';
}

class TelephonyManager {
  constructor() {
    // ---- SIP state ----
    this.sipStatus = 'offline'; // offline | connecting | registered | error
    this.sipStatusReason = '';
    this.transportStatus = 'disconnected'; // disconnected | connecting | connected

    // ---- Call state ----
    this.activeCallState = 'idle'; // idle | ringing-in | ringing-out | connected | ended | failed
    this.activeCallData = null;       // normalized call metadata
    this.activeCallDirection = null;   // 'inbound' | 'outbound'
    this.callDuration = 0;
    this._callTimerInterval = null;

    // ---- User preferences (persisted) ----
    this.dndEnabled = readFlag('dnd', false, LEGACY_STORAGE_KEYS.dnd);
    this.autoAnswerEnabled = readFlag('auto-answer', false, LEGACY_STORAGE_KEYS['auto-answer']);

    // ---- Dedup ----
    this._lastIncomingPhone = '';
    this._lastIncomingId = '';
    this._lastIncomingTs = 0;

    // ---- Listeners ----
    this._listeners = {
      // State changes
      sipStatusChange: [],
      transportStatusChange: [],
      callStateChange: [],
      // Call events (for UI to open modals)
      incomingCall: [],
      outgoingCallStarted: [],
      callAnswered: [],
      callEnded: [],
      callFailed: [],
      // preferences
      dndChange: [],
      autoAnswerChange: [],
    };

    // Bound handlers for sipClient subscription
    this._onSipRegistered = this._handleSipRegistered.bind(this);
    this._onSipUnregistered = this._handleSipUnregistered.bind(this);
    this._onSipError = this._handleSipError.bind(this);
    this._onSipTransport = this._handleSipTransport.bind(this);
    this._onSipIncoming = this._handleSipIncomingCall.bind(this);
    this._onSipCallStarted = this._handleSipCallStarted.bind(this);
    this._onSipCallAnswered = this._handleSipCallAnswered.bind(this);
    this._onSipCallEnded = this._handleSipCallEnded.bind(this);
    this._onSipCallFailed = this._handleSipCallFailed.bind(this);

    this._sipClient = null;
    this._boundToSip = false;
  }

  // ============================================================
  //  Public API — preferences
  // ============================================================

  setDnd(enabled) {
    this.dndEnabled = Boolean(enabled);
    writeFlag('dnd', this.dndEnabled, LEGACY_STORAGE_KEYS.dnd);
    this._emit('dndChange', { enabled: this.dndEnabled });
  }

  setAutoAnswer(enabled) {
    this.autoAnswerEnabled = Boolean(enabled);
    writeFlag('auto-answer', this.autoAnswerEnabled, LEGACY_STORAGE_KEYS['auto-answer']);
    this._emit('autoAnswerChange', { enabled: this.autoAnswerEnabled });
  }

  // ============================================================
  //  Public API — SIP binding
  // ============================================================

  /** Bind to the JsSIP SIPClient singleton. Call once during bootstrap. */
  bindSipClient(sipClient) {
    if (this._boundToSip && this._sipClient === sipClient) return;
    this.unbindSipClient();

    this._sipClient = sipClient;
    sipClient.on('registered', this._onSipRegistered);
    sipClient.on('unregistered', this._onSipUnregistered);
    sipClient.on('error', this._onSipError);
    sipClient.on('transportStateChange', this._onSipTransport);
    sipClient.on('incomingCall', this._onSipIncoming);
    sipClient.on('callStarted', this._onSipCallStarted);
    sipClient.on('callAnswered', this._onSipCallAnswered);
    sipClient.on('callEnded', this._onSipCallEnded);
    sipClient.on('callFailed', this._onSipCallFailed);
    this._boundToSip = true;
  }

  unbindSipClient() {
    if (!this._sipClient || !this._boundToSip) return;
    const sc = this._sipClient;
    sc.off('registered', this._onSipRegistered);
    sc.off('unregistered', this._onSipUnregistered);
    sc.off('error', this._onSipError);
    sc.off('transportStateChange', this._onSipTransport);
    sc.off('incomingCall', this._onSipIncoming);
    sc.off('callStarted', this._onSipCallStarted);
    sc.off('callAnswered', this._onSipCallAnswered);
    sc.off('callEnded', this._onSipCallEnded);
    sc.off('callFailed', this._onSipCallFailed);
    this._boundToSip = false;
    this._sipClient = null;
  }

  // ============================================================
  //  Public API — WebSocket incoming call (called from App.jsx)
  // ============================================================

  /**
   * Handle an incoming call event originating from the Django WebSocket.
   * The TelephonyManager de-duplicates against any SIP INVITE that may
   * have already been received for the same call.
   */
  handleWsIncomingCall(callData) {
    if (!callData) return;

    // DND check — global, before any UI
    if (this.dndEnabled) {
      if (this._sipClient?.callSession) {
        this._sipClient.rejectCall();
      }
      return false; // swallow — no popup
    }

    const phone = normalizePhone(callData.phoneNumber);
    const incomingId = normalizeCallIdentity(callData);

    // Dedup: if SIP already delivered this call within the last 5s, skip WS popup
    if (this._isDuplicate(phone, incomingId)) return false;

    this._recordIncoming(phone, incomingId);

    // Auto-answer
    if (this.autoAnswerEnabled && this._sipClient?.callSession) {
      const alreadyAnswered =
        this._sipClient?.currentCall?.status === 'connected'
        || Boolean(this._sipClient?.currentCall?.answeredAt);
      if (!alreadyAnswered) {
        this._scheduleAutoAnswer();
      }
      // Don't show the ringing modal — go straight to "answered"
      this._setCallState('connected', callData, 'inbound');
      this._emit('callAnswered', { ...callData, source: 'ws-auto-answer' });
      return false;
    }

    this._setCallState('ringing-in', callData, 'inbound');
    this._emit('incomingCall', { ...callData, source: 'ws' });
    return true;
  }

  /**
   * Handle WS call-updated that should dismiss an incoming popup.
   */
  handleWsCallUpdated(callData) {
    if (!callData) return;
    const status = String(callData.status || '').toLowerCase();
    if (['busy', 'no_answer', 'failed', 'abandoned', 'ended', 'rejected'].includes(status)) {
      if (this.activeCallState === 'ringing-in' || this.activeCallState === 'ringing-out') {
        this._setCallState('ended', callData);
        this._emit('callEnded', { ...callData, source: 'ws' });
      }
    }
    if (status === 'answered' && this.activeCallState === 'ringing-in') {
      this._setCallState('connected', callData, 'inbound');
      this._emit('callAnswered', { ...callData, source: 'ws' });
    }
  }

  handleWsCallEnded(callData) {
    if (!callData) return;
    if (this.activeCallState !== 'idle' && this.activeCallState !== 'ended') {
      this._setCallState('ended', callData);
      this._emit('callEnded', { ...callData, source: 'ws' });
    }
  }

  // ============================================================
  //  Public API — outgoing call tracking
  // ============================================================

  notifyOutgoingCallStarted(callData) {
    this._setCallState('ringing-out', callData, 'outbound');
    this._emit('outgoingCallStarted', { ...callData });
  }

  notifyCallConnected(callData) {
    this._setCallState('connected', callData);
    this._emit('callAnswered', { ...callData });
  }

  notifyCallEnded(callData) {
    this._setCallState('ended', callData);
    this._emit('callEnded', { ...callData });
  }

  resetCallState() {
    this._stopCallTimer();
    this.activeCallState = 'idle';
    this.activeCallData = null;
    this.activeCallDirection = null;
    this.callDuration = 0;
    this._lastIncomingPhone = '';
    this._lastIncomingId = '';
    this._lastIncomingTs = 0;
    this._emit('callStateChange', this.getCallSnapshot());
  }

  // ============================================================
  //  Public API — state getters
  // ============================================================

  getCallSnapshot() {
    return {
      state: this.activeCallState,
      data: this.activeCallData ? { ...this.activeCallData } : null,
      direction: this.activeCallDirection,
      duration: this.callDuration,
      dndEnabled: this.dndEnabled,
      autoAnswerEnabled: this.autoAnswerEnabled,
      sipStatus: this.sipStatus,
      sipStatusReason: this.sipStatusReason,
      transportStatus: this.transportStatus,
    };
  }

  // ============================================================
  //  Event emitter
  // ============================================================

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
  }

  _emit(event, data) {
    const list = this._listeners[event];
    if (!list) return;
    list.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error(`[TelephonyManager] Error in ${event} handler:`, error);
      }
    });
  }

  // ============================================================
  //  Internal — SIP event handlers
  // ============================================================

  _handleSipRegistered() {
    this.sipStatus = 'registered';
    this.sipStatusReason = '';
    this._emit('sipStatusChange', { status: 'registered' });
  }

  _handleSipUnregistered() {
    this.sipStatus = 'offline';
    this.sipStatusReason = '';
    this._emit('sipStatusChange', { status: 'offline' });
  }

  _handleSipError(data) {
    const reason = String(data?.reason || '').trim();
    this.sipStatus = data?.type === 'registration' ? 'error' : 'error';
    this.sipStatusReason = reason;
    this._emit('sipStatusChange', { status: 'error', reason });
  }

  _handleSipTransport(data) {
    const status = String(data?.status || '').toLowerCase();
    if (status === 'connected') this.transportStatus = 'connected';
    else if (status === 'connecting') this.transportStatus = 'connecting';
    else if (status === 'disconnected') this.transportStatus = 'disconnected';
    this._emit('transportStatusChange', { status: this.transportStatus });
  }

  _handleSipIncomingCall(data) {
    if (!data) return;
    this._recordIncoming(normalizePhone(data.from), '');

    // DND — reject at SIP level
    if (this.dndEnabled) {
      this._sipClient?.rejectCall();
      return;
    }

    // Auto-answer
    if (this.autoAnswerEnabled) {
      this._scheduleAutoAnswer();
      const callMeta = {
        phoneNumber: data.from || '',
        callerName: data.displayName || '',
        direction: 'inbound',
        source: 'sip-auto-answer',
      };
      this._setCallState('connected', callMeta, 'inbound');
      this._emit('callAnswered', callMeta);
      return;
    }
    // Canonical popup ownership is backend realtime only.
    // Local SIP INVITE must not open global incoming UI by itself.
  }

  _handleSipCallStarted(data) {
    if (this.activeCallState === 'ringing-out' || this.activeCallState === 'connected') {
      // Already tracked by our outgoing flow — don't double-fire
      return;
    }
    this._setCallState('ringing-out', data, 'outbound');
    this._emit('outgoingCallStarted', { ...(data || {}), source: 'sip' });
  }

  _handleSipCallAnswered(data) {
    const direction = String(data?.direction || this.activeCallDirection || '').toLowerCase();
    if (direction === 'inbound' || direction === 'incoming') {
      return;
    }
    if (this.activeCallState === 'connected') return;
    this._setCallState('connected', data);
    this._emit('callAnswered', { ...(data || {}), source: 'sip' });
  }

  _handleSipCallEnded(data) {
    const direction = String(data?.direction || this.activeCallDirection || '').toLowerCase();
    if (direction === 'inbound' || direction === 'incoming') {
      return;
    }
    this._setCallState('ended', data);
    this._emit('callEnded', { ...(data || {}), source: 'sip' });
  }

  _handleSipCallFailed(data) {
    const direction = String(data?.direction || this.activeCallDirection || '').toLowerCase();
    if (direction === 'inbound' || direction === 'incoming') {
      return;
    }
    this._setCallState('failed', data);
    this._emit('callFailed', { ...(data || {}), source: 'sip' });
  }

  // ============================================================
  //  Internal — helpers
  // ============================================================

  _setCallState(nextState, data, direction) {
    this.activeCallState = nextState;
    if (data) this.activeCallData = { ...(this.activeCallData || {}), ...data };
    if (direction) this.activeCallDirection = direction;

    if (nextState === 'connected') {
      this._startCallTimer();
    } else if (nextState === 'ended' || nextState === 'failed' || nextState === 'idle') {
      this._stopCallTimer();
    }

    this._emit('callStateChange', this.getCallSnapshot());
  }

  _startCallTimer() {
    this._stopCallTimer();
    this.callDuration = 0;
    this._callTimerInterval = setInterval(() => {
      this.callDuration += 1;
      this._emit('callStateChange', this.getCallSnapshot());
    }, 1000);
  }

  _stopCallTimer() {
    if (this._callTimerInterval) {
      clearInterval(this._callTimerInterval);
      this._callTimerInterval = null;
    }
  }

  _isDuplicate(phone, incomingId = '') {
    const now = Date.now();
    const recentEnough = now - this._lastIncomingTs < 5000;
    if (!recentEnough) return false;

    const currentId = String(incomingId || '').trim();
    const lastId = String(this._lastIncomingId || '').trim();
    if (currentId && lastId) {
      return currentId === lastId;
    }

    // Fallback for SIP<->WS pair where one side lacks stable ids.
    const samePhone = Boolean(phone) && phone === this._lastIncomingPhone;
    return samePhone;
  }

  _recordIncoming(phone, incomingId = '') {
    this._lastIncomingPhone = phone;
    this._lastIncomingId = String(incomingId || '').trim();
    this._lastIncomingTs = Date.now();
  }

  _scheduleAutoAnswer() {
    setTimeout(() => {
      try {
        const audioEl =
          document.getElementById('telephony-remote-audio') ||
          document.getElementById('incoming-call-audio');
        this._sipClient?.answerCall(audioEl);
      } catch (error) {
        console.error('[TelephonyManager] Auto-answer failed:', error);
      }
    }, 450);
  }

  destroy() {
    this.unbindSipClient();
    this._stopCallTimer();
    Object.keys(this._listeners).forEach((key) => {
      this._listeners[key] = [];
    });
  }
}

// Singleton
const telephonyManager = new TelephonyManager();
export default telephonyManager;
