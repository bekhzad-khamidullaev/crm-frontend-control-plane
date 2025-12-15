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
    
    // Call metadata tracking
    this.currentCall = null;
    
    // Recording
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    
    // Event listeners
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
  async call(destination, audioElement, metadata = {}) {
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
        
        // Initialize call metadata
        this.currentCall = {
          id: null, // Will be set after API call
          phoneNumber: destination,
          direction: 'outbound',
          status: 'initiated',
          startedAt: new Date().toISOString(),
          answeredAt: null,
          endedAt: null,
          duration: 0,
          ...metadata
        };
        
        const result = this.callSession.call(destination);
        
        if (result !== 0) {
          this.currentCall = null;
          reject(new Error('Failed to initiate call'));
        } else {
          // Emit call started event
          this.emit('callStarted', { ...this.currentCall });
          resolve(this.callSession);
        }
      } catch (error) {
        console.error('[SIPClient] Call error:', error);
        this.currentCall = null;
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
    
    // Initialize call metadata for incoming call
    this.currentCall = {
      id: null,
      phoneNumber: from,
      direction: 'inbound',
      status: 'ringing',
      startedAt: new Date().toISOString(),
      answeredAt: null,
      endedAt: null,
      duration: 0
    };
    
    this.emit('incomingCall', {
      from,
      displayName,
      session: this.callSession,
      callMetadata: { ...this.currentCall }
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
        if (this.currentCall) {
          this.currentCall.status = 'connecting';
        }
        break;
      case 'connected':
        state.status = 'connected';
        if (this.currentCall) {
          this.currentCall.status = 'connected';
          this.currentCall.answeredAt = new Date().toISOString();
          // Emit call answered event
          this.emit('callAnswered', { ...this.currentCall });
        }
        break;
      case 'terminating':
      case 'terminated':
        state.status = 'terminated';
        if (this.currentCall) {
          this.currentCall.status = 'completed';
          this.currentCall.endedAt = new Date().toISOString();
          
          // Calculate duration
          const startTime = new Date(this.currentCall.answeredAt || this.currentCall.startedAt);
          const endTime = new Date(this.currentCall.endedAt);
          this.currentCall.duration = Math.floor((endTime - startTime) / 1000);
          
          // Emit call ended event
          this.emit('callEnded', { ...this.currentCall });
          this.currentCall = null;
        }
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
        if (this.currentCall) {
          this.currentCall.status = 'held';
        }
        break;
      case 'm_local_resume_ok':
        state.status = 'resumed';
        if (this.currentCall) {
          this.currentCall.status = 'connected';
        }
        break;
    }

    this.emit('callStateChange', state);
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners) {
      console.warn('[SIPClient] Listeners not initialized, initializing now');
      this.listeners = {};
    }
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners || !this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners || !this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[SIPClient] Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isRegistered: this.isRegistered,
      hasActiveCall: !!this.callSession,
      username: this.config.impi,
      currentCall: this.currentCall ? { ...this.currentCall } : null
    };
  }

  /**
   * Get current call metadata
   */
  getCurrentCallMetadata() {
    return this.currentCall ? { ...this.currentCall } : null;
  }

  /**
   * Update current call metadata
   */
  updateCurrentCallMetadata(updates) {
    if (this.currentCall) {
      this.currentCall = { ...this.currentCall, ...updates };
    }
  }

  /**
   * Start recording the call
   */
  startRecording() {
    if (this.isRecording || !this.callSession) {
      console.warn('[SIPClient] Cannot start recording');
      return false;
    }

    try {
      // Get the audio stream from the call session
      const stream = this.callSession.getLocalStreams()[0];
      
      if (!stream) {
        console.error('[SIPClient] No audio stream available');
        return false;
      }

      // Create MediaRecorder
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('[SIPClient] Recording stopped');
        this.isRecording = false;
        this.emit('recordingStopped', {
          chunks: this.recordedChunks.length,
          blob: this.getRecordingBlob()
        });
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      console.log('[SIPClient] Recording started');
      this.emit('recordingStarted');
      
      return true;
    } catch (error) {
      console.error('[SIPClient] Error starting recording:', error);
      this.emit('error', { type: 'recording', error });
      return false;
    }
  }

  /**
   * Stop recording the call
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('[SIPClient] No active recording');
      return false;
    }

    try {
      this.mediaRecorder.stop();
      return true;
    } catch (error) {
      console.error('[SIPClient] Error stopping recording:', error);
      return false;
    }
  }

  /**
   * Get the recording as a Blob
   */
  getRecordingBlob() {
    if (this.recordedChunks.length === 0) {
      return null;
    }

    return new Blob(this.recordedChunks, {
      type: 'audio/webm;codecs=opus'
    });
  }

  /**
   * Clear recording data
   */
  clearRecording() {
    this.recordedChunks = [];
    this.mediaRecorder = null;
    this.isRecording = false;
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
      // Import api from client to use centralized error handling
      const { api } = await import('../api/client.js');
      const response = await api.post('/api/voip/call-logs/', { body: callData });
      
      console.log('[SIPClient] Call logged to API:', response);
      return response.id;
    } catch (error) {
      console.error('[SIPClient] Error logging call to API:', error);
      // Don't throw - graceful degradation for logging errors
      return null;
    }
  }

  /**
   * Update call log in backend API
   */
  async updateCallLogInAPI(callLogId, updates) {
    try {
      // Import api from client to use centralized error handling
      const { api } = await import('../api/client.js');
      const response = await api.patch(`/api/voip/call-logs/${callLogId}/`, { body: updates });
      
      console.log('[SIPClient] Call log updated in API:', response);
      return true;
    } catch (error) {
      console.error('[SIPClient] Error updating call log in API:', error);
      // Don't throw - graceful degradation for logging errors
      return false;
    }
  }
}

// Singleton instance
export const sipClient = new SIPClient();
export default sipClient;
