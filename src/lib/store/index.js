// Simple enterprise-grade store (lightweight)
// Features: modules, subscribe/notify, persisted slices, selectors

const listeners = new Set();
const persistedKeys = new Set(['auth']);

function normalizeCallIdentity(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function getCallIdentifiers(call = {}) {
  const sessionId = normalizeCallIdentity(
    call.sessionId
    ?? call.session_id
    ?? call.call_session_id
    ?? call.callId
    ?? call.call_id
    ?? null
  );
  const callId = normalizeCallIdentity(call.callId ?? call.call_id ?? call.id ?? sessionId);
  return { callId, sessionId };
}

function getCallDedupKey(call = {}) {
  const { callId, sessionId } = getCallIdentifiers(call);
  if (sessionId) return `session:${sessionId}`;
  if (callId) return `call:${callId}`;
  return null;
}

function mergeCallCollection(collection = [], call, mergeExisting = true) {
  const dedupKey = getCallDedupKey(call);
  if (!dedupKey) {
    return [...collection, call];
  }

  const index = collection.findIndex((item) => getCallDedupKey(item) === dedupKey);
  if (index === -1) {
    return [...collection, call];
  }

  const next = [...collection];
  next[index] = mergeExisting ? { ...next[index], ...call } : call;
  return next;
}

function dedupeCallCollection(collection = []) {
  return collection.reduce((acc, call) => mergeCallCollection(acc, call, true), []);
}

function dropCallFromCollection(collection = [], identifier) {
  const value = normalizeCallIdentity(identifier);
  if (!value) return collection;
  return collection.filter((call) => {
    const { callId, sessionId } = getCallIdentifiers(call);
    return callId !== value && sessionId !== value;
  });
}

function normalizeLocale(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.startsWith('uz')) return 'uz';
  if (value.startsWith('en')) return 'en';
  return 'ru';
}

function readStoredLocale() {
  try {
    return normalizeLocale(
      localStorage.getItem('enterprise_crm_locale')
      || localStorage.getItem('locale')
      || 'ru',
    );
  } catch {
    return 'ru';
  }
}

const initialState = {
  auth: {
    user: null,
    token: null,
    roles: [],
  },
  ui: {
    locale: readStoredLocale(),
    theme: 'light',
    density: 'comfortable',
  },
  cache: {
    // entity caches by id
  },
  telephony: {
    isRegistered: false,
    activeCall: null,
    activeCalls: [],
    callHistory: [],
    sipConfig: {
      realm: null,
      username: null,
      server: null,
    },
    status: 'disconnected', // disconnected, connecting, connected, error
    lastError: null,
    wsConnected: false,
    wsReconnecting: false,
    incomingCalls: [], // Queue of incoming calls
  },
  chat: {
    messages: [], // Recent messages cache
    activeChats: {}, // Active chat sessions by entity
    unreadCount: 0,
    typingUsers: {}, // Users currently typing by entity
    chatWsConnected: false,
    chatWsReconnecting: false,
  }
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('app_state') || '{}');
    return { ...initialState, ...saved };
  } catch {
    return { ...initialState };
  }
}

function persist() {
  const snapshot = {};
  for (const k of persistedKeys) snapshot[k] = state[k];
  try { localStorage.setItem('app_state', JSON.stringify(snapshot)); } catch {}
}

export function getState() {
  return state;
}

export function select(selector) {
  return selector(state);
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  for (const l of listeners) l(state);
}

export function setLocale(locale) {
  const nextLocale = normalizeLocale(locale);
  state = { ...state, ui: { ...state.ui, locale: nextLocale } };
  localStorage.setItem('locale', nextLocale);
  localStorage.setItem('enterprise_crm_locale', nextLocale);
  notify();
}

export function setAuth({ user, token, roles = [] }) {
  state = { ...state, auth: { user, token, roles } };
  persist();
  notify();
}

export function clearAuth() {
  state = { ...state, auth: { user: null, token: null, roles: [] } };
  persist();
  notify();
}

export function cacheEntities(entity, items) {
  state = {
    ...state,
    cache: {
      ...state.cache,
      [entity]: items.reduce((acc, it) => { acc[it.id] = it; return acc; }, {})
    }
  };
  notify();
}

// Guards
export function hasRole(role) {
  return state.auth.roles?.includes(role);
}

// Telephony actions
export function setSipRegistered(isRegistered) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      isRegistered,
      status: isRegistered ? 'connected' : 'disconnected',
    }
  };
  notify();
}

export function setActiveCall(call) {
  const activeCalls = call
    ? mergeCallCollection(state.telephony.activeCalls, call, true)
    : state.telephony.activeCalls;
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCall: call,
      activeCalls,
    }
  };
  notify();
}

export function addCallToHistory(call) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      callHistory: [call, ...state.telephony.callHistory].slice(0, 100), // Keep last 100 calls
    }
  };
  notify();
}

export function updateCallInHistory(callId, updates) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      callHistory: state.telephony.callHistory.map(call =>
        call.id === callId ? { ...call, ...updates } : call
      ),
    }
  };
  notify();
}

export function setSipConfig(config) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      sipConfig: { ...state.telephony.sipConfig, ...config },
    }
  };
  notify();
}

export function setTelephonyStatus(status, error = null) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      status,
      lastError: error,
    }
  };
  notify();
}

export function clearActiveCall() {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCall: null,
    }
  };
  notify();
}

export function setActiveCalls(calls = []) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCalls: dedupeCallCollection(Array.isArray(calls) ? calls : []),
    }
  };
  notify();
}

export function upsertActiveCall(call) {
  if (!call || typeof call !== 'object') return;
  const activeCalls = mergeCallCollection(state.telephony.activeCalls, call, true);

  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCall: { ...(state.telephony.activeCall || {}), ...call },
      activeCalls,
    }
  };
  notify();
}

export function removeActiveCall(identifier) {
  const activeCalls = dropCallFromCollection(state.telephony.activeCalls, identifier);
  const activeCall = (() => {
    const value = normalizeCallIdentity(identifier);
    if (!value || !state.telephony.activeCall) return state.telephony.activeCall;
    const ids = getCallIdentifiers(state.telephony.activeCall);
    if (ids.callId === value || ids.sessionId === value) return null;
    return state.telephony.activeCall;
  })();

  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCall,
      activeCalls,
    }
  };
  notify();
}

export function clearActiveCalls() {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      activeCalls: [],
      activeCall: null,
    }
  };
  notify();
}

// Telephony selectors
export function getTelephonyState() {
  return state.telephony;
}

export function getActiveCall() {
  return state.telephony.activeCall;
}

export function getActiveCalls() {
  return state.telephony.activeCalls;
}

export function getCallHistory() {
  return state.telephony.callHistory;
}

export function isSipRegistered() {
  return state.telephony.isRegistered;
}

// WebSocket actions
export function setWsConnected(connected) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      wsConnected: connected,
      wsReconnecting: false,
    }
  };
  notify();
}

export function setWsReconnecting(reconnecting) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      wsReconnecting: reconnecting,
    }
  };
  notify();
}

export function addIncomingCall(call) {
  if (!call || typeof call !== 'object') return;
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      incomingCalls: mergeCallCollection(state.telephony.incomingCalls, call, true),
    }
  };
  notify();
}

export function removeIncomingCall(identifier) {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      incomingCalls: dropCallFromCollection(state.telephony.incomingCalls, identifier),
    }
  };
  notify();
}

export function clearIncomingCalls() {
  state = {
    ...state,
    telephony: {
      ...state.telephony,
      incomingCalls: [],
    }
  };
  notify();
}

// WebSocket selectors
export function isWsConnected() {
  return state.telephony.wsConnected;
}

export function getIncomingCalls() {
  return state.telephony.incomingCalls;
}

// Chat actions
export function setChatWsConnected(connected) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      chatWsConnected: connected,
      chatWsReconnecting: false,
    }
  };
  notify();
}

export function setChatWsReconnecting(reconnecting) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      chatWsReconnecting: reconnecting,
    }
  };
  notify();
}

export function addChatMessage(message) {
  const messages = [message, ...state.chat.messages].slice(0, 100); // Keep last 100 messages
  state = {
    ...state,
    chat: {
      ...state.chat,
      messages,
    }
  };
  notify();
}

export function updateChatMessage(messageId, updates) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      messages: state.chat.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }
  };
  notify();
}

export function deleteChatMessage(messageId) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      messages: state.chat.messages.filter(msg => msg.id !== messageId),
    }
  };
  notify();
}

export function setUnreadCount(count) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      unreadCount: count,
    }
  };
  notify();
}

export function setTypingUser(entityKey, userId, userName) {
  state = {
    ...state,
    chat: {
      ...state.chat,
      typingUsers: {
        ...state.chat.typingUsers,
        [entityKey]: { userId, userName, timestamp: Date.now() },
      },
    }
  };
  notify();
}

export function removeTypingUser(entityKey) {
  const typingUsers = { ...state.chat.typingUsers };
  delete typingUsers[entityKey];
  
  state = {
    ...state,
    chat: {
      ...state.chat,
      typingUsers,
    }
  };
  notify();
}

export function setActiveChat(entityType, entityId, data) {
  const key = `${entityType}_${entityId}`;
  state = {
    ...state,
    chat: {
      ...state.chat,
      activeChats: {
        ...state.chat.activeChats,
        [key]: {
          entityType,
          entityId,
          ...data,
          lastAccessed: Date.now(),
        },
      },
    }
  };
  notify();
}

export function removeActiveChat(entityType, entityId) {
  const key = `${entityType}_${entityId}`;
  const activeChats = { ...state.chat.activeChats };
  delete activeChats[key];
  
  state = {
    ...state,
    chat: {
      ...state.chat,
      activeChats,
    }
  };
  notify();
}

export function clearChatMessages() {
  state = {
    ...state,
    chat: {
      ...state.chat,
      messages: [],
    }
  };
  notify();
}

// Chat selectors
export function getChatState() {
  return state.chat;
}

export function getUnreadCount() {
  return state.chat.unreadCount;
}

export function getChatMessages() {
  return state.chat.messages;
}

export function getActiveChats() {
  return state.chat.activeChats;
}

export function getTypingUsers() {
  return state.chat.typingUsers;
}

export function isChatWsConnected() {
  return state.chat.chatWsConnected;
}

export default {
  getState, select, subscribe,
  setLocale, setAuth, clearAuth,
  cacheEntities, hasRole,
  // Telephony
  setSipRegistered, setActiveCall, addCallToHistory,
  updateCallInHistory, setSipConfig, setTelephonyStatus,
  clearActiveCall, setActiveCalls, upsertActiveCall,
  removeActiveCall, clearActiveCalls, getTelephonyState, getActiveCall,
  getActiveCalls,
  getCallHistory, isSipRegistered,
  // WebSocket
  setWsConnected, setWsReconnecting, addIncomingCall,
  removeIncomingCall, clearIncomingCalls, isWsConnected,
  getIncomingCalls,
  // Chat
  setChatWsConnected, setChatWsReconnecting, addChatMessage,
  updateChatMessage, deleteChatMessage, setUnreadCount,
  setTypingUser, removeTypingUser, setActiveChat,
  removeActiveChat, clearChatMessages, getChatState,
  getUnreadCount, getChatMessages, getActiveChats,
  getTypingUsers, isChatWsConnected,
};
