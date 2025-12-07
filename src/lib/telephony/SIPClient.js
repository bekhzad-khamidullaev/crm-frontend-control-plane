/**
 * SIPClient - WebRTC VoIP client wrapper for SIPml5
 * Handles SIP registration, calls (incoming/outgoing), and call management
 */

class SIPClient {
  constructor() {
    if (typeof SIPml === 'undefined') {
      this.isInitialized = false;
      this.isRegistered = false;
      this.emit = () => {};
      this.init = async () => Promise.resolve();
      this.register = async () => Promise.resolve();
      this.call = async () => { throw new Error('SIP disabled in demo/offline mode'); };
      return;
    }
    this.stack = null;
    this.session = null;
    this.callSession = null;
    this.isRegistered = false;
    this.isInitialized = false;
    
    // Event listeners
    this.listeners = {
      registered: [],
      unregistered: [],
      incomingCall: [],
      callStateChange: [],
      error: []
    };

    // Configuration
    this.config = {
      realm: import.meta.env.VITE_SIP_REALM || '109.94.172.194',
      impi: import.meta.env.VITE_SIP_USERNAME || '1200',
      impu: null, // Will be set from impi
      password: import.meta.env.VITE_SIP_PASSWORD || '56789qwe',
      display_name: import.meta.env.VITE_SIP_DISPLAY_NAME || 'CRM User',
      websocket_proxy_url: import.meta.env.VITE_SIP_SERVER || 'wss://109.94.172.194:5060',
      enable_rtcweb_breaker: false,
      ice_servers: [
        { urls: import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302' }
      ],
      enable_early_ims: true,
      enable_media_stream_cache: false,
      bandwidth: { audio: 64, video: 0 },
      video_size: null,
      events_listener: { events: '*', listener: this.handleSIPEvent.bind(this) },
      sip_headers: [
        { name: 'User-Agent', value: 'CRM-WebRTC-Client/1.0' }
      ]
    };
  }

  /**
   * Initialize SIPml5 engine
   */
  async init() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (typeof SIPml === 'undefined') {
        reject(new Error('SIPml5 library not loaded'));
        return;
      }

      SIPml.init(() => {
        this.isInitialized = true;
        console.log('[SIPClient] SIPml5 engine initialized');
        resolve();
      }, (error) => {
        console.error('[SIPClient] Failed to initialize SIPml5:', error);
        reject(error);
      });
    });
  }

  /**
   * Register to SIP server
   */
  async register(username, password) {
    if (!this.isInitialized) {
      await this.init();
    }

    // Update credentials if provided
    if (username) this.config.impi = username;
    if (password) this.config.password = password;
    
    // Set IMPU from IMPI
    this.config.impu = `sip:${this.config.impi}@${this.config.realm}`;

    return new Promise((resolve, reject) => {
      try {
        // Create SIP stack
        this.stack = new SIPml.Stack(this.config);
        
        this.stack.start();
        
        // Wait for stack to start, then create registration session
        setTimeout(() => {
          this.session = this.stack.newSession('register', {
            events_listener: { events: '*', listener: this.handleSessionEvent.bind(this) }
          });
          
          this.session.register();
          
          // Resolve will be called by event handler
          this._registerResolve = resolve;
          this._registerReject = reject;
        }, 500);
      } catch (error) {
        console.error('[SIPClient] Registration error:', error);
        this.emit('error', { type: 'registration', error });
        reject(error);
      }
    });
  }

  /**
   * Unregister from SIP server
   */
  async unregister() {
    if (this.session) {
      this.session.unregister();
      return new Promise((resolve) => {
        this._unregisterResolve = resolve;
      });
    }
    return Promise.resolve();
  }

  /**
   * Make an outgoing call
   */
  async call(destination, audioElement) {
    if (!this.isRegistered) {
      throw new Error('Not registered to SIP server');
    }

    return new Promise((resolve, reject) => {
      try {
        const callConfig = {
          audio_remote: audioElement,
          events_listener: { events: '*', listener: this.handleCallEvent.bind(this) }
        };

        this.callSession = this.stack.newSession('call-audio', callConfig);
        
        const result = this.callSession.call(destination);
        
        if (result !== 0) {
          reject(new Error('Failed to initiate call'));
        } else {
          resolve(this.callSession);
        }
      } catch (error) {
        console.error('[SIPClient] Call error:', error);
        this.emit('error', { type: 'call', error });
        reject(error);
      }
    });
  }

  /**
   * Answer incoming call
   */
  answerCall(audioElement) {
    if (this.callSession && audioElement) {
      this.callSession.accept({
        audio_remote: audioElement
      });
    }
  }

  /**
   * Reject incoming call
   */
  rejectCall() {
    if (this.callSession) {
      this.callSession.reject();
      this.callSession = null;
    }
  }

  /**
   * Hangup active call
   */
  hangup() {
    if (this.callSession) {
      this.callSession.hangup();
    }
  }

  /**
   * Hold/unhold call
   */
  toggleHold() {
    if (this.callSession) {
      const isOnHold = this.callSession.bHeld;
      if (isOnHold) {
        this.callSession.resume();
      } else {
        this.callSession.hold();
      }
      return !isOnHold;
    }
    return false;
  }

  /**
   * Mute/unmute microphone
   */
  toggleMute() {
    if (this.callSession) {
      const isMuted = this.callSession.bMute;
      if (isMuted) {
        this.callSession.unmute();
      } else {
        this.callSession.mute();
      }
      return !isMuted;
    }
    return false;
  }

  /**
   * Send DTMF tones
   */
  sendDTMF(digit) {
    if (this.callSession) {
      this.callSession.dtmf(digit);
    }
  }

  /**
   * Transfer call
   */
  transferCall(destination) {
    if (this.callSession) {
      return this.callSession.transfer(destination);
    }
    return false;
  }

  /**
   * Handle SIP stack events
   */
  handleSIPEvent(event) {
    console.log('[SIPClient] SIP Event:', event.type);
    
    switch (event.type) {
      case 'started':
        console.log('[SIPClient] Stack started');
        break;
      case 'stopping':
      case 'stopped':
        this.isRegistered = false;
        console.log('[SIPClient] Stack stopped');
        break;
      case 'failed_to_start':
      case 'failed_to_stop':
        this.emit('error', { type: 'stack', event });
        break;
      case 'i_new_call':
        // Incoming call
        this.handleIncomingCall(event);
        break;
    }
  }

  /**
   * Handle registration session events
   */
  handleSessionEvent(event) {
    console.log('[SIPClient] Session Event:', event.type);
    
    switch (event.type) {
      case 'connected':
        this.isRegistered = true;
        console.log('[SIPClient] Registered successfully');
        this.emit('registered', { username: this.config.impi });
        if (this._registerResolve) {
          this._registerResolve();
          this._registerResolve = null;
        }
        break;
      case 'terminated':
        this.isRegistered = false;
        console.log('[SIPClient] Unregistered');
        this.emit('unregistered');
        if (this._unregisterResolve) {
          this._unregisterResolve();
          this._unregisterResolve = null;
        }
        break;
      case 'i_new_message':
        // Handle incoming SIP message
        this.emit('message', e);
        break;
    }
  }

  /**
   * Handle incoming call
   */
  handleIncomingCall(event) {
    console.log('[SIPClient] Incoming call from:', event.getSipMessage().getFrom().getUri());
    
    this.callSession = event.newSession;
    
    // Add event listener to incoming call
    this.callSession.setConfiguration({
      events_listener: { events: '*', listener: this.handleCallEvent.bind(this) }
    });

    const from = event.getSipMessage().getFrom().getUri().replace(/^sip:/, '').replace(/@.*$/, '');
    const displayName = event.getSipMessage().getFrom().getDisplayName();
    
    this.emit('incomingCall', {
      from,
      displayName,
      session: this.callSession
    });
  }

  /**
   * Handle call session events
   */
  handleCallEvent(event) {
    console.log('[SIPClient] Call Event:', event.type);
    
    const state = {
      type: event.type,
      description: event.description
    };

    switch (event.type) {
      case 'connecting':
        state.status = 'connecting';
        break;
      case 'connected':
        state.status = 'connected';
        break;
      case 'terminating':
      case 'terminated':
        state.status = 'terminated';
        this.callSession = null;
        break;
      case 'i_ao_request':
        // DTMF or other in-call request
        break;
      case 'm_early_media':
        state.status = 'early_media';
        break;
      case 'm_local_hold_ok':
        state.status = 'held';
        break;
      case 'm_local_resume_ok':
        state.status = 'resumed';
        break;
    }

    this.emit('callStateChange', state);
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isRegistered: this.isRegistered,
      hasActiveCall: !!this.callSession,
      username: this.config.impi
    };
  }

  /**
   * Cleanup and stop SIP stack
   */
  stop() {
    if (this.stack) {
      this.stack.stop();
    }
  }

  /**
   * Auto-reconnect logic
   */
  async reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    
    const maxAttempts = 5;
    let attempt = 0;
    
    while (attempt < maxAttempts && !this.isRegistered) {
      attempt++;
      console.log(`[SIPClient] Reconnection attempt ${attempt}/${maxAttempts}`);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        await this.register();
        break;
      } catch (error) {
        console.error(`[SIPClient] Reconnection attempt ${attempt} failed:`, error);
      }
    }
    
    this.reconnecting = false;
    
    if (!this.isRegistered) {
      this.emit('reconnect_failed');
    }
  }

  /**
   * Log call to backend API
   */
  async logCallToAPI(callData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/call-logs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(callData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to log call: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[SIPClient] Error logging call to API:', error);
      throw error;
    }
  }

  /**
   * Update call log in backend API
   */
  async updateCallLogInAPI(callLogId, updates) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/call-logs/${callLogId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update call log: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[SIPClient] Error updating call log in API:', error);
      throw error;
    }
  }
}

// Singleton instance
export const sipClient = new SIPClient();
export default sipClient;
