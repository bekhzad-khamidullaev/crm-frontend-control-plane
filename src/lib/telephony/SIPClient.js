/**
 * SIPClient - WebRTC VoIP client wrapper based on JsSIP
 * Handles SIP registration, calls (incoming/outgoing), and call management
 */

class SIPClient {
  constructor() {
    this.ua = null;
    this.callSession = null;
    this.isRegistered = false;
    this.isInitialized = false;
    this.currentCall = null;
    this.remoteAudioElement = null;
    this.JsSIP = null;
    this._registerPromise = null;

    this.listeners = {
      registered: [],
      unregistered: [],
      incomingCall: [],
      callStateChange: [],
      callStarted: [],
      callAnswered: [],
      callEnded: [],
      callFailed: [],
      recordingStarted: [],
      recordingStopped: [],
      error: [],
    };

    this.config = {
      realm: import.meta.env.VITE_SIP_REALM || 'pbx.evos.uz',
      impi: import.meta.env.VITE_SIP_USERNAME || '',
      impu: null,
      password: import.meta.env.VITE_SIP_PASSWORD || '',
      display_name: import.meta.env.VITE_SIP_DISPLAY_NAME || 'CRM User',
      websocket_proxy_url: import.meta.env.VITE_SIP_SERVER || '',
      ice_servers: [{ urls: import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302' }],
    };
  }

  configure(partialConfig = {}) {
    if (!partialConfig || typeof partialConfig !== 'object') return;
    this.config = {
      ...this.config,
      ...partialConfig,
    };
  }

  async init() {
    if (this.isInitialized && this.JsSIP) return;

    const mod = await import('jssip');
    this.JsSIP = mod?.default || mod;

    if (!this.JsSIP?.UA || !this.JsSIP?.WebSocketInterface) {
      throw new Error('JsSIP library not loaded');
    }

    if (typeof window !== 'undefined' && !window.RTCPeerConnection) {
      throw new Error('WebRTC is not supported in this browser');
    }

    this.isInitialized = true;
  }

  async register(username, password) {
    if (this.isRegistered && this.ua) return true;
    if (this._registerPromise) return this._registerPromise;

    await this.init();

    if (username) this.config.impi = username;
    if (password) this.config.password = password;

    const realm = String(this.config.realm || '').trim();
    const impi = String(this.config.impi || '').trim();
    const pass = String(this.config.password || '').trim();
    const ws = String(this.config.websocket_proxy_url || '').trim();

    if (!realm || !impi || !pass || !ws) {
      throw new Error('SIP credentials are not configured');
    }

    const impu = this.config.impu || `sip:${impi}@${realm}`;

    if (this.ua) {
      try {
        this.ua.stop();
      } catch {
        // ignore
      }
      this.ua = null;
      this.isRegistered = false;
    }

    this._registerPromise = new Promise((resolve, reject) => {
      try {
        const socket = new this.JsSIP.WebSocketInterface(ws);
        this.ua = new this.JsSIP.UA({
          sockets: [socket],
          uri: impu,
          authorization_user: impi,
          password: pass,
          realm,
          display_name: this.config.display_name || 'CRM User',
          register: true,
          register_expires: 600,
          session_timers: false,
          user_agent: 'CRM-WebRTC-Client/2.0',
        });

        let settled = false;
        const finalizeResolve = () => {
          if (settled) return;
          settled = true;
          this._registerPromise = null;
          resolve(true);
        };
        const finalizeReject = (error) => {
          if (settled) return;
          settled = true;
          this._registerPromise = null;
          reject(error);
        };

        this.ua.on('registered', () => {
          this.isRegistered = true;
          this.emit('registered', { username: impi });
          finalizeResolve();
        });

        this.ua.on('unregistered', () => {
          this.isRegistered = false;
          this.emit('unregistered');
        });

        this.ua.on('registrationFailed', (event) => {
          this.isRegistered = false;
          const reason = event?.cause || 'SIP registration failed';
          this.emit('error', { type: 'registration', event, reason });
          finalizeReject(new Error(reason));
        });

        this.ua.on('disconnected', () => {
          this.isRegistered = false;
          this.emit('unregistered');
        });

        this.ua.on('newRTCSession', (event) => {
          const session = event?.session;
          if (!session) return;

          const originator = event.originator;
          if (originator === 'remote') {
            this.callSession = session;

            const fromUri = session?.remote_identity?.uri?.toString?.() || '';
            const from = String(fromUri || '').replace(/^sip:/, '').replace(/@.*$/, '');
            const displayName = session?.remote_identity?.display_name || from;

            this.currentCall = {
              id: null,
              phoneNumber: from,
              direction: 'inbound',
              status: 'ringing',
              startedAt: new Date().toISOString(),
              answeredAt: null,
              endedAt: null,
              duration: 0,
            };

            this._bindSessionEvents(session, this.remoteAudioElement);

            this.emit('incomingCall', {
              from,
              displayName,
              session,
              callMetadata: { ...this.currentCall },
            });
          }
        });

        this.ua.start();

        setTimeout(() => {
          if (!settled && !this.isRegistered) {
            finalizeReject(new Error('SIP registration timeout'));
          }
        }, 12000);
      } catch (error) {
        this._registerPromise = null;
        reject(error);
      }
    });

    return this._registerPromise;
  }

  async unregister() {
    if (!this.ua) return;
    try {
      this.ua.unregister();
      this.ua.stop();
    } finally {
      this.isRegistered = false;
      this.emit('unregistered');
    }
  }

  _buildDialCandidates(rawDestination, realm) {
    const input = String(rawDestination || '').trim();
    const compact = input.replace(/[^\d+]/g, '');
    const digitsOnly = compact.replace(/\D/g, '');
    const compactNoPlus = compact.startsWith('+') ? compact.slice(1) : compact;
    const list = [];

    const add = (value) => {
      const v = String(value || '').trim();
      if (!v) return;
      if (!list.includes(v)) list.push(v);
    };

    add(input);
    add(compact);
    add(compactNoPlus);
    add(digitsOnly);

    if (realm) {
      [input, compact, compactNoPlus, digitsOnly]
        .filter(Boolean)
        .forEach((candidate) => {
          if (candidate.startsWith('sip:')) {
            add(candidate);
            return;
          }
          add(`sip:${candidate}@${realm}`);
        });
    }

    return list.filter(Boolean);
  }

  _attachRemoteAudio(session, audioElement) {
    const target = audioElement || this.remoteAudioElement;
    if (!target) return;

    session.on('peerconnection', (event) => {
      const pc = event?.peerconnection;
      if (!pc) return;

      pc.ontrack = (trackEvent) => {
        const [stream] = trackEvent.streams || [];
        if (stream) {
          target.srcObject = stream;
          target.play?.().catch(() => {});
        }
      };

      pc.onaddstream = (streamEvent) => {
        const stream = streamEvent?.stream;
        if (stream) {
          target.srcObject = stream;
          target.play?.().catch(() => {});
        }
      };
    });
  }

  _bindSessionEvents(session, audioElement) {
    this._attachRemoteAudio(session, audioElement);

    session.on('progress', () => {
      this.emit('callStateChange', { type: 'progress', status: 'connecting' });
      if (this.currentCall) this.currentCall.status = 'connecting';
    });

    const markAnswered = () => {
      if (!this.currentCall) return;
      if (!this.currentCall.answeredAt) {
        this.currentCall.status = 'connected';
        this.currentCall.answeredAt = new Date().toISOString();
        this.emit('callAnswered', { ...this.currentCall });
      }
      this.emit('callStateChange', { type: 'accepted', status: 'connected' });
    };

    session.on('accepted', markAnswered);
    session.on('confirmed', markAnswered);

    session.on('ended', (event) => {
      this._finishCall('completed', event?.cause || 'ended');
    });

    session.on('failed', (event) => {
      const reason = event?.cause || 'failed';
      this.emit('callFailed', { reason, event, currentCall: this.currentCall ? { ...this.currentCall } : null });
      this._finishCall('failed', reason);
    });
  }

  _finishCall(finalStatus, reason) {
    if (this.currentCall) {
      this.currentCall.status = finalStatus;
      this.currentCall.endedAt = new Date().toISOString();

      const started = new Date(this.currentCall.answeredAt || this.currentCall.startedAt).getTime();
      const ended = new Date(this.currentCall.endedAt).getTime();
      this.currentCall.duration = Math.max(0, Math.floor((ended - started) / 1000));

      this.emit('callEnded', { ...this.currentCall, reason });
    }

    this.emit('callStateChange', { type: finalStatus, status: 'terminated', reason });
    this.currentCall = null;
    this.callSession = null;
  }

  async call(destination, audioElement, metadata = {}) {
    if (!this.isRegistered || !this.ua) {
      throw new Error('Not registered to SIP server');
    }

    const candidates = this._buildDialCandidates(destination, this.config.realm);
    if (!candidates.length) {
      throw new Error('Dial destination is empty');
    }

    let lastError = null;
    for (const target of candidates) {
      try {
        const session = this.ua.call(target, {
          mediaConstraints: { audio: true, video: false },
          pcConfig: { iceServers: this.config.ice_servers || [] },
        });

        this.callSession = session;
        this.remoteAudioElement = audioElement || this.remoteAudioElement;
        this.currentCall = {
          id: null,
          phoneNumber: destination,
          dialTarget: target,
          direction: 'outbound',
          status: 'initiated',
          startedAt: new Date().toISOString(),
          answeredAt: null,
          endedAt: null,
          duration: 0,
          ...metadata,
        };

        this._bindSessionEvents(session, this.remoteAudioElement);
        this.emit('callStarted', { ...this.currentCall });
        return session;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to initiate call');
  }

  answerCall(audioElement) {
    if (!this.callSession) return;

    if (audioElement) {
      this.remoteAudioElement = audioElement;
      this._attachRemoteAudio(this.callSession, audioElement);
    }

    this.callSession.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: this.config.ice_servers || [] },
    });
  }

  rejectCall() {
    if (!this.callSession) return;
    this.callSession.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    this.callSession = null;
  }

  hangup() {
    if (!this.callSession) return;
    this.callSession.terminate();
  }

  toggleHold() {
    if (!this.callSession) return false;
    const held = this.callSession.isOnHold?.().local === true;
    if (held) {
      this.callSession.unhold();
      return false;
    }
    this.callSession.hold();
    return true;
  }

  toggleMute() {
    if (!this.callSession) return false;
    const muted = this.callSession.isMuted?.().audio === true;
    if (muted) {
      this.callSession.unmute({ audio: true });
      return false;
    }
    this.callSession.mute({ audio: true });
    return true;
  }

  sendDTMF(digit) {
    if (!this.callSession) return;
    this.callSession.sendDTMF(String(digit));
  }

  transferCall(destination) {
    if (!this.callSession || !destination) return false;
    if (typeof this.callSession.refer !== 'function') return false;

    try {
      this.callSession.refer(destination);
      return true;
    } catch {
      return false;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[SIPClient] Error in event handler for ${event}:`, error);
      }
    });
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
      isRegistered: this.isRegistered,
      hasActiveCall: !!this.callSession,
      username: this.config.impi,
      currentCall: this.currentCall ? { ...this.currentCall } : null,
    };
  }

  getCurrentCallMetadata() {
    return this.currentCall ? { ...this.currentCall } : null;
  }

  updateCurrentCallMetadata(updates) {
    if (!this.currentCall) return;
    this.currentCall = { ...this.currentCall, ...updates };
  }

  startRecording() {
    // Recording not supported in this implementation
    this.emit('recordingStarted');
    return false;
  }

  stopRecording() {
    this.emit('recordingStopped');
    return null;
  }

  async reconnect() {
    const username = this.config.impi;
    const password = this.config.password;
    await this.stop();
    await this.register(username, password);
  }

  async stop() {
    try {
      if (this.callSession) {
        this.callSession.terminate();
      }
      this.callSession = null;
      this.currentCall = null;

      if (this.ua) {
        this.ua.stop();
      }
      this.ua = null;
      this.isRegistered = false;
      this._registerPromise = null;
    } catch (error) {
      console.error('[SIPClient] Stop error:', error);
    }
  }
}

const sipClient = new SIPClient();

export default sipClient;
