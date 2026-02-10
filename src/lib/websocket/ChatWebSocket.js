/**
 * ChatWebSocket - WebSocket client for real-time chat updates
 * Handles new messages, typing indicators, and message updates
 */

class ChatWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.shouldReconnect = true;
    this.token = null;
    this.typingTimers = new Map(); // Track typing indicators
    
    // Event listeners
    this.listeners = {
      connected: [],
      disconnected: [],
      newMessage: [],
      messageUpdated: [],
      messageDeleted: [],
      typingStarted: [],
      typingStopped: [],
      error: [],
      reconnecting: [],
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[ChatWebSocket] Already connected');
      return;
    }

    if (token) {
      this.token = token;
    }
    const authToken = token || this.token;
    if (!authToken) {
      console.warn('[ChatWebSocket] Missing auth token. Skipping connection.');
      return;
    }

    try {
      const baseUrl = resolveWebSocketUrl(
        import.meta.env.VITE_CHAT_WS_URL || import.meta.env.VITE_WS_URL,
        '/ws/chat/'
      );
      if (!baseUrl) {
        console.warn('[ChatWebSocket] WebSocket URL not configured. Skipping connection.');
        return;
      }

      const separator = baseUrl.includes('?') ? '&' : '?';
      const url = `${baseUrl}${separator}token=${encodeURIComponent(authToken)}`;

      console.log('[ChatWebSocket] Connecting to:', stripSensitiveParams(url));
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[ChatWebSocket] Connection error:', error);
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
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.typingTimers.clear();
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('[ChatWebSocket] Connected');
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
      console.log('[ChatWebSocket] Message received:', data);

      switch (data.type) {
        case 'new_message':
          this.handleNewMessage(data.payload);
          break;
        case 'message_updated':
          this.handleMessageUpdated(data.payload);
          break;
        case 'message_deleted':
          this.handleMessageDeleted(data.payload);
          break;
        case 'typing_started':
          this.handleTypingStarted(data.payload);
          break;
        case 'typing_stopped':
          this.handleTypingStopped(data.payload);
          break;
        case 'connection_established':
          // Optional server handshake message
          this.emit('connected', { handshake: true, payload: data.payload });
          break;
        case 'ping':
          // Respond to ping to keep connection alive
          this.send({ type: 'pong' });
          break;
        default:
          console.warn('[ChatWebSocket] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[ChatWebSocket] Error parsing message:', error);
      this.emit('error', { type: 'parse', error });
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('[ChatWebSocket] Connection error:', error);
    // Don't throw - graceful degradation for optional WebSocket
    this.emit('error', { 
      type: 'connection_error',
      message: 'WebSocket connection failed. Real-time chat updates disabled.',
      error 
    });
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log('[ChatWebSocket] Disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.typingTimers.clear();
    this.emit('disconnected', { code: event.code, reason: event.reason });

    // Don't reconnect if server is unavailable (code 1006 = abnormal closure)
    if (event.code === 1006 && this.reconnectAttempts === 0) {
      console.warn('[ChatWebSocket] Server unavailable, disabling auto-reconnect');
      this.shouldReconnect = false;
      this.emit('error', {
        type: 'server_unavailable',
        message: 'WebSocket server is not available. Real-time chat updates disabled.'
      });
      return;
    }

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle new message
   */
  handleNewMessage(payload) {
    console.log('[ChatWebSocket] New message:', payload);
    this.emit('newMessage', {
      id: payload.id,
      message: payload.message,
      sender: payload.sender,
      entityType: payload.entity_type,
      entityId: payload.entity_id,
      timestamp: payload.timestamp,
      attachments: payload.attachments,
      parentId: payload.parent_id,
    });
  }

  /**
   * Handle message updated
   */
  handleMessageUpdated(payload) {
    console.log('[ChatWebSocket] Message updated:', payload);
    this.emit('messageUpdated', {
      id: payload.id,
      message: payload.message,
      isRead: payload.is_read,
      updatedAt: payload.updated_at,
    });
  }

  /**
   * Handle message deleted
   */
  handleMessageDeleted(payload) {
    console.log('[ChatWebSocket] Message deleted:', payload);
    this.emit('messageDeleted', {
      id: payload.id,
    });
  }

  /**
   * Handle typing started
   */
  handleTypingStarted(payload) {
    console.log('[ChatWebSocket] Typing started:', payload);
    
    // Clear existing timer for this user
    const existingTimer = this.typingTimers.get(payload.user_id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer to auto-stop after 5 seconds
    const timer = setTimeout(() => {
      this.handleTypingStopped(payload);
    }, 5000);
    
    this.typingTimers.set(payload.user_id, timer);

    this.emit('typingStarted', {
      userId: payload.user_id,
      userName: payload.user_name,
      entityType: payload.entity_type,
      entityId: payload.entity_id,
    });
  }

  /**
   * Handle typing stopped
   */
  handleTypingStopped(payload) {
    console.log('[ChatWebSocket] Typing stopped:', payload);
    
    // Clear timer
    const timer = this.typingTimers.get(payload.user_id);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(payload.user_id);
    }

    this.emit('typingStopped', {
      userId: payload.user_id,
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(entityType, entityId, isTyping = true) {
    this.send({
      type: isTyping ? 'typing_started' : 'typing_stopped',
      entity_type: entityType,
      entity_id: entityId,
    });
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[ChatWebSocket] Cannot send, not connected');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ChatWebSocket] Max reconnection attempts reached');
      this.emit('error', { type: 'max_reconnects', attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[ChatWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
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
    if (!this.listeners[event]) {
      console.warn(`[ChatWebSocket] Unknown event type: ${event}`);
      return;
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[ChatWebSocket] Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Get connection state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      activeTypingUsers: Array.from(this.typingTimers.keys()),
    };
  }
}

// Singleton instance
export const chatWebSocket = new ChatWebSocket();
export default chatWebSocket;
import { resolveWebSocketUrl, stripSensitiveParams } from './resolveWsUrl.js';
