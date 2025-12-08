/**
 * CallsWebSocket - WebSocket client for real-time call notifications
 * Handles incoming call notifications and call status updates
 */

class CallsWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.shouldReconnect = true;
    
    // Event listeners
    this.listeners = {
      connected: [],
      disconnected: [],
      incomingCall: [],
      callUpdated: [],
      callEnded: [],
      error: [],
      reconnecting: [],
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[CallsWebSocket] Already connected');
      return;
    }

    // Check if WebSocket server URL is configured
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      console.warn('[CallsWebSocket] WebSocket URL not configured. Skipping connection.');
      return;
    }

    try {
      const url = `${wsUrl}?token=${token}`;
      
      console.log('[CallsWebSocket] Connecting to:', wsUrl);
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[CallsWebSocket] Connection error:', error);
      this.emit('error', { type: 'connection', error });
      this.scheduleReconnect(token);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('[CallsWebSocket] Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connected');
  }

  /**
   * Handle WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[CallsWebSocket] Message received:', data);

      switch (data.type) {
        case 'incoming_call':
          this.handleIncomingCall(data.payload);
          break;
        case 'call_updated':
          this.handleCallUpdated(data.payload);
          break;
        case 'call_ended':
          this.handleCallEnded(data.payload);
          break;
        case 'ping':
          // Respond to ping to keep connection alive
          this.send({ type: 'pong' });
          break;
        default:
          console.warn('[CallsWebSocket] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[CallsWebSocket] Error parsing message:', error);
      this.emit('error', { type: 'parse', error });
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('[CallsWebSocket] Error:', error);
    this.emit('error', { type: 'socket', error });
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log('[CallsWebSocket] Disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.emit('disconnected', { code: event.code, reason: event.reason });

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming call notification
   */
  handleIncomingCall(payload) {
    console.log('[CallsWebSocket] Incoming call:', payload);
    this.emit('incomingCall', {
      callId: payload.call_id,
      phoneNumber: payload.phone_number,
      callerName: payload.caller_name,
      timestamp: payload.timestamp,
      relatedContact: payload.related_contact,
      relatedLead: payload.related_lead,
    });
  }

  /**
   * Handle call updated notification
   */
  handleCallUpdated(payload) {
    console.log('[CallsWebSocket] Call updated:', payload);
    this.emit('callUpdated', {
      callId: payload.call_id,
      status: payload.status,
      duration: payload.duration,
    });
  }

  /**
   * Handle call ended notification
   */
  handleCallEnded(payload) {
    console.log('[CallsWebSocket] Call ended:', payload);
    this.emit('callEnded', {
      callId: payload.call_id,
      duration: payload.duration,
      status: payload.status,
    });
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[CallsWebSocket] Cannot send, not connected');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[CallsWebSocket] Max reconnection attempts reached');
      this.emit('error', { type: 'max_reconnects', attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[CallsWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect(token);
      }
    }, delay);
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
   * Get connection state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
    };
  }
}

// Singleton instance
export const callsWebSocket = new CallsWebSocket();
export default callsWebSocket;
