/**
 * CallsWebSocket - WebSocket client for real-time call notifications
 * Handles incoming call notifications and call status updates
 */
import { resolveWebSocketUrl, stripSensitiveParams } from './resolveWsUrl.js';
import { normalizeTelephonyCallPayload } from '../api/telephony.js';

class CallsWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.shouldReconnect = true;
    this.token = null;
    
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
    this.shouldReconnect = true;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[CallsWebSocket] Already connected');
      return;
    }

    if (token) {
      this.token = token;
    }
    const authToken = token || this.token;
    if (!authToken) {
      console.warn('[CallsWebSocket] Missing auth token. Skipping connection.');
      return;
    }

    try {
      const appConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
      const wsUrl = appConfig.WS_URL || import.meta.env.VITE_WS_URL || '';
      const baseUrl = resolveWebSocketUrl(wsUrl, '/ws/calls/');
      if (!baseUrl) {
        console.warn('[CallsWebSocket] WebSocket URL not configured. Skipping connection.');
        return;
      }

      const separator = baseUrl.includes('?') ? '&' : '?';
      const url = `${baseUrl}${separator}token=${encodeURIComponent(authToken)}`;

      console.log('[CallsWebSocket] Connecting to:', stripSensitiveParams(url));
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
    this.token = null;
    if (this.ws) {
      // If still CONNECTING (readyState=0), abort on open instead of closing immediately
      // to avoid the 'WebSocket closed before connection established' browser error.
      if (this.ws.readyState === WebSocket.CONNECTING) {
        const wsRef = this.ws;
        wsRef.onopen = () => wsRef.close();
        wsRef.onerror = null;
      } else {
        this.ws.close();
      }
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

      const messageType = data.type || data.event_type || '';

      switch (messageType) {
        case 'incoming_call':
          this.handleIncomingCall(data.payload);
          break;
        case 'call_updated':
          this.handleCallUpdated(data.payload);
          break;
        case 'call_ended':
          this.handleCallEnded(data.payload);
          break;
        case 'recording_ready':
          this.handleCallUpdated({
            ...(data.payload || {}),
            recording_ready: true,
          });
          break;
        case 'ping':
          // Respond to ping to keep connection alive
          this.send({ type: 'pong' });
          break;
        case 'connection_established':
          console.log('[CallsWebSocket] Connection established message received.');
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
    console.error('[CallsWebSocket] Connection error:', error);
    // Don't throw - graceful degradation for optional WebSocket
    this.emit('error', { 
      type: 'connection_error',
      message: 'WebSocket connection failed. Real-time call updates disabled.',
      error 
    });
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log('[CallsWebSocket] Disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.emit('disconnected', { code: event.code, reason: event.reason });

    if (event.code === 1006) {
      this.emit('error', {
        type: 'server_unavailable',
        message: 'WebSocket server is temporarily unavailable. Reconnecting...',
      });
    }

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming call notification
   */
  handleIncomingCall(payload) {
    console.log('[CallsWebSocket] Incoming call:', payload);
    const normalized = normalizeTelephonyCallPayload(payload);

    this.emit('incomingCall', {
      ...normalized,
      callId: normalized.callId || normalized.sessionId,
      sessionId: normalized.sessionId,
      phoneNumber: normalized.phoneNumber,
      callerName: normalized.callerName,
      timestamp: normalized.timestamp || normalized.startedAt || payload?.timestamp,
      relatedContact: normalized.related_contact ?? normalized.relatedContact ?? null,
      relatedLead: normalized.related_lead ?? normalized.relatedLead ?? null,
    });
  }

  /**
   * Handle call updated notification
   */
  handleCallUpdated(payload) {
    console.log('[CallsWebSocket] Call updated:', payload);
    const normalized = normalizeTelephonyCallPayload(payload);

    this.emit('callUpdated', {
      ...normalized,
      callId: normalized.callId || normalized.sessionId,
      sessionId: normalized.sessionId,
      status: normalized.status,
      duration: normalized.duration,
    });
  }

  /**
   * Handle call ended notification
   */
  handleCallEnded(payload) {
    console.log('[CallsWebSocket] Call ended:', payload);
    const normalized = normalizeTelephonyCallPayload(payload);

    this.emit('callEnded', {
      ...normalized,
      callId: normalized.callId || normalized.sessionId,
      sessionId: normalized.sessionId,
      duration: normalized.duration,
      status: normalized.status,
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
        this.connect(token || this.token);
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
