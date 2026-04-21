import {
  CheckCircleFilled,
  CloseOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  PauseCircleFilled,
  PhoneTwoTone,
  MinusOutlined,
  PhoneFilled,
  PhoneOutlined,
  AudioOutlined,
  ArrowsAltOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Input, Modal, Row, Space, Tabs, Tag, Tooltip, theme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getActiveCalls,
  getCallHistory,
  getRecentIncomingCalls,
  hangupActiveCall,
  initiateCall,
  normalizeTelephonyCallPayload,
} from '../shared/api/services/telephony.js';
import { getCompanies, getContacts, getLeads } from '../shared/api/services/client.js';
import sipClient from '../lib/telephony/SIPClient.js';
import telephonyManager from '../lib/telephony/TelephonyManager.js';
import { loadTelephonyRuntimeConfig } from '../lib/telephony/runtimeConfig.js';
import { DEFAULT_TELEPHONY_ROUTE_MODE } from '../lib/telephony/constants.js';
import {
  formatRuntimeDuration,
  getTelephonyRuntimeStatusMeta,
} from '../lib/telephony/runtimeState.js';
import { TELEPHONY_MODAL_PROPS, TELEPHONY_MODAL_STYLES } from '../shared/ui/telephonyModal.js';
import { localizeText } from '../lib/i18n/index.js';
import OutgoingCallCard from '../modules/calls/OutgoingCallCard.jsx';
import '../styles/telephony.css';
const L = (value) => localizeText(value);

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
const PROVIDER_ORIGINATED_WATCHDOG_MS = 35000;
const TELEPHONY_STATUS_REFRESH_MS = 15000;
const DIALER_LOGS_REFRESH_MS = 20000;
const DIALER_CONTACTS_REFRESH_MS = 45000;
const DTMF_HINTS = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};
const DEFAULT_Z_INDEX = 1060;

function readPersistedFlag(key, fallback = false) {
  if (typeof window === 'undefined') return fallback;
  const raw = String(window.localStorage.getItem(key) || '').trim().toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

function normalizeDialForSip(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length >= 12) return digits.slice(-9);
  return digits;
}

function isLikelyInternalExtension(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 0 && digits.length <= 6;
}

function sanitizeDialInput(raw) {
  return String(raw || '').replace(/[^\d+*#()\-\s.]/g, '');
}

function normalizeProviderDial(value) {
  return sanitizeDialInput(value).replace(/[^\d+]/g, '');
}

function normalizeDigitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getRecentCallKey(call = {}) {
  const normalized = normalizeTelephonyCallPayload(call);
  const sessionId = String(normalized.sessionId || normalized.session_id || '').trim();
  if (sessionId) return `session:${sessionId}`;

  const callId = String(normalized.callId || normalized.call_id || '').trim();
  if (callId) return `call:${callId}`;

  const direction = String(normalized.direction || '').trim();
  const number = String(normalized.phoneNumber || normalized.phone_number || '').trim();
  const startedAt = String(normalized.startedAt || normalized.started_at || normalized.created_at || '').trim();
  return `fallback:${direction}:${number}:${startedAt}`;
}

function mergeRecentCalls(localRows = [], remoteRows = [], limit = 40) {
  const merged = [...localRows, ...remoteRows].map((row) => normalizeTelephonyCallPayload(row));
  const map = new Map();

  merged.forEach((row) => {
    const key = getRecentCallKey(row);
    if (!map.has(key)) {
      map.set(key, row);
      return;
    }

    const previous = map.get(key);
    const prevTs = new Date(previous?.endedAt || previous?.startedAt || 0).getTime() || 0;
    const nextTs = new Date(row?.endedAt || row?.startedAt || 0).getTime() || 0;
    if (nextTs >= prevTs) {
      map.set(key, { ...previous, ...row });
    }
  });

  return Array.from(map.values())
    .sort((left, right) => {
      const leftTs = new Date(left?.startedAt || left?.created_at || left?.endedAt || 0).getTime() || 0;
      const rightTs = new Date(right?.startedAt || right?.created_at || right?.endedAt || 0).getTime() || 0;
      return rightTs - leftTs;
    })
    .slice(0, limit);
}

function pickContactNumber(contact = {}) {
  const candidates = [
    contact.phone,
    contact.phone_number,
    contact.mobile,
    contact.mobile_phone,
    contact.work_phone,
    contact.whatsapp,
  ];
  return String(candidates.find((value) => value) || '').trim();
}

function pickContactName(contact = {}) {
  return String(
    contact.full_name ||
    contact.name ||
    contact.title ||
    contact.display_name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
    contact.email ||
    contact.id ||
    '',
  ).trim();
}

function pickCallNumber(call = {}) {
  return String(
    call.phoneNumber ||
    call.phone_number ||
    call.number ||
    call.called_number ||
    call.caller_id ||
    '',
  ).trim();
}

function formatCallTime(call = {}) {
  const value = call.startedAt || call.started_at || call.created_at || call.timestamp;
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeCallDirection(call = {}) {
  const direction = String(call.direction || '').toLowerCase();
  if (direction === 'inbound' || direction === 'incoming') return L('Входящий');
  if (direction === 'outbound' || direction === 'outgoing') return L('Исходящий');
  return L('Звонок');
}

function normalizeCallStatus(call = {}) {
  const status = String(call.status || '').toLowerCase();
  if (['answered', 'completed', 'ended', 'hangup'].includes(status)) return { color: 'success', text: L('Завершён') };
  if (['ringing', 'connecting', 'queued', 'waiting'].includes(status)) return { color: 'processing', text: L('В процессе') };
  if (['busy', 'failed', 'abandoned', 'no_answer'].includes(status)) return { color: 'error', text: L('Ошибка') };
  return { color: 'default', text: status || L('Неизвестно') };
}

function mapPhonebookEntry(entity = {}, entityType = 'contact') {
  return {
    ...entity,
    entityType,
    displayType:
      entityType === 'lead'
        ? L('Лид')
        : entityType === 'company'
          ? L('Компания')
          : L('Контакт'),
    full_name: pickContactName(entity),
    phone: pickContactNumber(entity),
  };
}

function mapSipCallStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['accepted', 'answered', 'confirmed', 'connected'].includes(normalized)) return 'connected';
  if (['progress', 'initiated', 'calling', 'ringing', 'incoming', 'connecting'].includes(normalized)) return 'calling';
  if (['failed', 'busy', 'no_answer', 'abandoned', 'rejected'].includes(normalized)) return 'failed';
  if (['completed', 'ended', 'hangup', 'terminated'].includes(normalized)) return 'ended';
  return 'idle';
}

function getCallOutcomeMeta(status, reason = '') {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  const normalizedReason = String(reason || '').trim().toLowerCase();

  if (normalizedStatus === 'failed') {
    if (normalizedReason.includes('busy')) {
      return { tone: 'warning', title: L('Линия занята'), description: L('Абонент занят.') };
    }
    if (normalizedReason.includes('no answer') || normalizedReason.includes('timeout') || normalizedReason.includes('unavailable')) {
      return { tone: 'warning', title: L('Нет ответа'), description: L('Абонент не ответил.') };
    }
    if (normalizedReason.includes('rejected') || normalizedReason.includes('decline')) {
      return { tone: 'default', title: L('Звонок отклонён'), description: L('Вызов отклонён.') };
    }
    return { tone: 'error', title: L('Ошибка вызова'), description: L('Соединение не установлено.') };
  }

  if (normalizedStatus === 'ended') {
    return { tone: 'success', title: L('Звонок завершён'), description: L('Разговор завершён.') };
  }

  return null;
}

function validateDialInput(rawValue, routeMode) {
  const value = sanitizeDialInput(rawValue).trim();
  const invalidChars = String(rawValue || '').replace(/[\d+*#()\-\s.]/g, '');
  const digits = value.replace(/\D/g, '');
  const plusCount = (value.match(/\+/g) || []).length;
  const hasStarHash = /[*#]/.test(value);

  if (!value) {
    return {
      isValid: false,
      message: L('Введите номер телефона'),
      sipDial: '',
      providerDial: '',
      targetKind: 'empty',
    };
  }

  if (invalidChars) {
    return {
      isValid: false,
      message: L('Недопустимые символы. Разрешены только цифры, +, *, #, пробел, скобки и дефис'),
      sipDial: '',
      providerDial: '',
      targetKind: 'invalid',
    };
  }

  if (plusCount > 1 || (plusCount === 1 && !value.startsWith('+'))) {
    return {
      isValid: false,
      message: L('Символ "+" допустим только в начале номера'),
      sipDial: '',
      providerDial: '',
      targetKind: 'invalid',
    };
  }

  const mode = String(routeMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase();
  const sipDial = normalizeDialForSip(value);
  const providerDial = normalizeProviderDial(value).replace(/^\+/, '');
  const internalLike = isLikelyInternalExtension(value);

  if (hasStarHash) {
    return {
      isValid: false,
      message: L('Символы * и # разрешены только для DTMF во время активного звонка'),
      sipDial,
      providerDial,
      targetKind: 'invalid',
    };
  }

  if (mode === 'embedded') {
    if (digits.length < 2 || digits.length > 15) {
      return {
        isValid: false,
        message: L('Номер для встроенного режима должен содержать от 2 до 15 цифр'),
        sipDial,
        providerDial,
        targetKind: 'invalid',
      };
    }
    return { isValid: true, message: '', sipDial, providerDial, targetKind: internalLike ? 'internal' : 'external' };
  }

  if (internalLike) {
    return {
      isValid: true,
      message: '',
      sipDial,
      providerDial,
      targetKind: 'internal',
    };
  }

  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      message: L('Внешний номер должен содержать от 7 до 15 цифр'),
      sipDial,
      providerDial,
      targetKind: 'invalid',
    };
  }

  return { isValid: true, message: '', sipDial, providerDial, targetKind: 'external' };
}




export default function TelephonyDialerModal({
  visible,
  onClose,
  initialNumber = '',
  autoCallRequestId = '',
}) {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState('dialer');
  const [dialNumber, setDialNumber] = useState(String(initialNumber || ''));
  const [recentCalls, setRecentCalls] = useState([]);
  const [localRecentCalls, setLocalRecentCalls] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [sipStatus, setSipStatus] = useState('checking');
  const [, setSipStatusReason] = useState('');
  const [routeMode, setRouteMode] = useState(DEFAULT_TELEPHONY_ROUTE_MODE);
  const [, setOutboundMode] = useState('browser_sip');
  const [callStatus, setCallStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [, setTransportStatus] = useState('checking');
  const [, setTransportReason] = useState('');
  const [amiRuntimeCall, setAmiRuntimeCall] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [windowPositionReady, setWindowPositionReady] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1366 : window.innerWidth,
  );
  const [dndEnabled, setDndEnabled] = useState(() => readPersistedFlag('crm:dialer:dnd', false));
  const [autoAnswerEnabled, setAutoAnswerEnabled] = useState(() => readPersistedFlag('crm:dialer:auto-answer', false));
  const [isHeld, setIsHeld] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [callActionMode, setCallActionMode] = useState('transfer');
  const [contactsSearch, setContactsSearch] = useState('');
  const [outgoingCallCardVisible, setOutgoingCallCardVisible] = useState(false);
  const [outgoingCallCardPhone, setOutgoingCallCardPhone] = useState('');
  const [outgoingCallCardData, setOutgoingCallCardData] = useState(null);
  const [lastCallOutcome, setLastCallOutcome] = useState(null);
  const [activeDisplayNumber, setActiveDisplayNumber] = useState('');

  const runtimeRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const callTokenRef = useRef(null);
  const autoCallHandledRef = useRef('');
  const dialNumberRef = useRef(String(initialNumber || ''));
  const lastOpenSignatureRef = useRef('');
  const amiCallRef = useRef({
    sessionId: '',
    toNumber: '',
    fromNumber: '',
    detectedOnce: false,
  });
  const dragStateRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });
  const dndEnabledRef = useRef(dndEnabled);
  const autoAnswerEnabledRef = useRef(autoAnswerEnabled);
  const callStatusRef = useRef(callStatus);
  const answeringInProgressRef = useRef(false);
  const activeCallIdentityRef = useRef({
    callId: '',
    sessionId: '',
  });
  const providerOriginatedStartRef = useRef(0);
  const providerOriginatedWatchdogRef = useRef(null);
  const asteriskClickTimeoutRef = useRef(null);
  const usesServerOriginate = String(routeMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase() === 'ami';

  // Timeout for SIP initialization to prevent infinite "checking" state on first load
  useEffect(() => {
    if (sipStatus !== 'checking') return;
    
    const timeout = setTimeout(() => {
      if (sipStatus === 'checking') {
        setSipStatus('missing-config');
        setSipStatusReason('SIP initialization timeout - credentials not available or load delayed. Refresh page to retry.');
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [sipStatus]);

  useEffect(() => {
    const nextNumber = String(initialNumber || '');
    setDialNumber(nextNumber);
    dialNumberRef.current = nextNumber;

    if (!visible) return;

    const openSignature = `${nextNumber}::${String(autoCallRequestId || '')}`;
    if (!openSignature || openSignature === lastOpenSignatureRef.current) return;
    lastOpenSignatureRef.current = openSignature;

    const hasLiveSipCall = Boolean(sipClient.callSession);
    const hasLiveAmiCall = Boolean(amiRuntimeCall?.sessionId || amiCallRef.current.sessionId);
    if (hasLiveSipCall || hasLiveAmiCall) return;

    setCallStatus('idle');
    setMuted(false);
    setIsHeld(false);
    setTransferTarget('');
    setCallDuration(0);
    setOutgoingCallCardVisible(false);
    setOutgoingCallCardPhone('');
    setOutgoingCallCardData(null);
    setLastCallOutcome(null);
    setActiveDisplayNumber(nextNumber);
    activeCallIdentityRef.current = { callId: '', sessionId: '' };
    autoCallHandledRef.current = '';
  }, [autoCallRequestId, amiRuntimeCall?.sessionId, initialNumber, visible]);

  useEffect(() => {
    if (visible) return;
    lastOpenSignatureRef.current = '';
    setActiveTab('dialer');
    setMinimized(false);
    setRecentCalls([]);
    setLocalRecentCalls([]);
    setContacts([]);
    setContactsSearch('');
    setLogsError('');
    setContactsError('');
  }, [visible]);

  useEffect(() => {
    if (!visible || windowPositionReady || typeof window === 'undefined') return;
    setWindowPosition({
      x: Math.max(16, window.innerWidth - 460),
      y: Math.max(16, Math.round(window.innerHeight * 0.08)),
    });
    setWindowPositionReady(true);
  }, [visible, windowPositionReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dialNumberRef.current = String(dialNumber || '');
  }, [dialNumber]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    dndEnabledRef.current = dndEnabled;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('crm:dialer:dnd', dndEnabled ? 'true' : 'false');
      window.dispatchEvent(new window.CustomEvent('crm:dialer:dnd-changed', { detail: { enabled: dndEnabled } }));
    }
    // Sync with TelephonyManager so DND is enforced globally
    telephonyManager.setDnd(dndEnabled);
  }, [dndEnabled]);

  useEffect(() => {
    autoAnswerEnabledRef.current = autoAnswerEnabled;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('crm:dialer:auto-answer', autoAnswerEnabled ? 'true' : 'false');
    }
    // Sync with TelephonyManager so auto-answer works globally
    telephonyManager.setAutoAnswer(autoAnswerEnabled);
  }, [autoAnswerEnabled]);

  useEffect(() => {
    if (callStatus !== 'connected') {
      setIsHeld(false);
      setCallActionMode('transfer');
      setTransferTarget('');
    }
  }, [callStatus]);

  const appendRecentCall = useCallback((entry) => {
    const normalizedEntry = normalizeTelephonyCallPayload(entry);
    setLocalRecentCalls((prev) => mergeRecentCalls([normalizedEntry], prev, 60));
    setRecentCalls((prev) => mergeRecentCalls([normalizedEntry], prev, 60));
  }, []);

  useEffect(() => {
    const onRegistered = () => {
      setSipStatus('registered');
      setSipStatusReason('');
      setTransportReason('');
    };
    const onUnregistered = () => {
      setSipStatus('offline');
      setSipStatusReason('');
    };
    const onSipError = (data) => {
      const reason = String(data?.reason || '').trim();
      setSipStatus(data?.type === 'registration' ? 'registration-failed' : 'error');
      setSipStatusReason(reason);
    };
    const onTransport = (data) => {
      const status = String(data?.status || '').toLowerCase();
      if (!status) return;
      if (status === 'connected') {
        setTransportStatus('connected');
        setTransportReason('');
      }
      if (status === 'disconnected') {
        setTransportStatus('disconnected');
        setTransportReason(String(data?.reason || '').trim());
      }
      if (status === 'connecting') {
        setTransportStatus('connecting');
        setTransportReason('');
      }
    };

    const ownCall = (data) => {
      const sessionId = String(data?.sessionId || '').trim();
      const callId = String(data?.callId || '').trim();
      if (sessionId && sessionId === activeCallIdentityRef.current.sessionId) return true;
      if (callId && callId === activeCallIdentityRef.current.callId) return true;

      const token = data?.uiCallToken;
      if (token) return token === callTokenRef.current;
      if (callTokenRef.current && !token) {
        const localDigits = String(dialNumberRef.current || '').replace(/\D/g, '');
        const remoteDigits = String(data?.phoneNumber || '').replace(/\D/g, '');
        return localDigits && remoteDigits ? localDigits.endsWith(remoteDigits) || remoteDigits.endsWith(localDigits) : false;
      }
      return false;
    };

    const onCallStarted = (data) => {
      if (!ownCall(data)) return;
      answeringInProgressRef.current = false;
      const phoneNumber = String(data?.phoneNumber || dialNumberRef.current || '').trim();
      activeCallIdentityRef.current = {
        callId: String(data?.callId || activeCallIdentityRef.current.callId || '').trim(),
        sessionId: String(data?.sessionId || activeCallIdentityRef.current.sessionId || '').trim(),
      };
      setCallStatus('calling');
      setMuted(false);
      setCallDuration(0);
      setLastCallOutcome(null);
      if (phoneNumber) {
        setActiveDisplayNumber(phoneNumber);
      }
      appendRecentCall({
        ...data,
        phoneNumber,
        direction: 'outbound',
        status: 'ringing',
        startedAt: data?.startedAt || new Date().toISOString(),
      });
      
      // Show outgoing call card for outgoing calls (only if currently idle - meaning it's an outgoing call)
      if (callStatusRef.current === 'idle') {
        if (phoneNumber) {
          setOutgoingCallCardPhone(phoneNumber);
          setOutgoingCallCardData({ callId: data?.uiCallToken || callTokenRef.current || `${Date.now()}` });
          setOutgoingCallCardVisible(true);
        }
      }
    };

    const onCallAnswered = (data) => {
      if (!ownCall(data)) return;
      activeCallIdentityRef.current = {
        callId: String(data?.callId || activeCallIdentityRef.current.callId || '').trim(),
        sessionId: String(data?.sessionId || activeCallIdentityRef.current.sessionId || '').trim(),
      };
      answeringInProgressRef.current = false;
      setCallStatus('connected');
      setLastCallOutcome(null);
    };

    const onCallStateChange = (data) => {
      if (!ownCall(data)) return;

      const status = String(data?.status || '').trim().toLowerCase();
      const mapped = mapSipCallStatus(status);

      if (mapped === 'connected') {
        answeringInProgressRef.current = false;
      }

      if (mapped !== 'idle') {
        setCallStatus(mapped);
        if (mapped === 'failed' && data?.reason && !lastCallOutcome?.reason) {
          setLastCallOutcome({
            status: 'failed',
            reason: String(data.reason || '').trim(),
            duration: Number(data.duration || 0),
          });
        }
      }

      const callMetadata = data?.currentCall || {};
      const callId = String(data?.callId || callMetadata?.callId || '').trim();
      const sessionId = String(data?.sessionId || callMetadata?.sessionId || '').trim();
      if (callId || sessionId) {
        activeCallIdentityRef.current = {
          callId: callId || activeCallIdentityRef.current.callId,
          sessionId: sessionId || activeCallIdentityRef.current.sessionId,
        };
      }
    };

    const onCallEnded = (data) => {
      if (!ownCall(data)) return;
      const nextStatus = data?.status === 'failed' ? 'failed' : mapSipCallStatus(data?.status || 'ended');
      answeringInProgressRef.current = false;
      setCallStatus(nextStatus);
      const duration = Number(data?.duration || 0);
      setCallDuration(duration);
      setMuted(false);
      callTokenRef.current = null;
      // Auto-close OutgoingCallCard when call ends
      setOutgoingCallCardVisible(false);
      setLastCallOutcome({
        status: nextStatus,
        reason: String(data?.reason || '').trim(),
        duration,
      });
      appendRecentCall({
        ...data,
        status: nextStatus,
        duration,
        endedAt: data?.endedAt || new Date().toISOString(),
      });
      activeCallIdentityRef.current = { callId: '', sessionId: '' };
    };

    sipClient.on('registered', onRegistered);
    sipClient.on('unregistered', onUnregistered);
    sipClient.on('error', onSipError);
    sipClient.on('transportStateChange', onTransport);
    sipClient.on('callStarted', onCallStarted);
    sipClient.on('callAnswered', onCallAnswered);
    sipClient.on('callStateChange', onCallStateChange);
    sipClient.on('callEnded', onCallEnded);

    return () => {
      sipClient.off('registered', onRegistered);
      sipClient.off('unregistered', onUnregistered);
      sipClient.off('error', onSipError);
      sipClient.off('transportStateChange', onTransport);
      sipClient.off('callStarted', onCallStarted);
      sipClient.off('callAnswered', onCallAnswered);
      sipClient.off('callStateChange', onCallStateChange);
      sipClient.off('callEnded', onCallEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendRecentCall, message, visible]);

  useEffect(() => {
    if (callStatus !== 'connected') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus]);

  useEffect(() => {
    if (!visible) return;

    const currentSipCall = sipClient.getCurrentCallMetadata?.();
    if (!currentSipCall) return;

    activeCallIdentityRef.current = {
      callId: String(currentSipCall.callId || '').trim(),
      sessionId: String(currentSipCall.sessionId || '').trim(),
    };

    if (currentSipCall.phoneNumber) {
      setDialNumber((prev) => prev || sanitizeDialInput(currentSipCall.phoneNumber));
      setActiveDisplayNumber(String(currentSipCall.phoneNumber || '').trim());
    }

    const nextStatus = mapSipCallStatus(currentSipCall.status);
    if (nextStatus !== 'idle') {
      setCallStatus(nextStatus);
    }
  }, [visible]);

  const loadBackendTelephony = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const runtime = await loadTelephonyRuntimeConfig();
      runtimeRef.current = runtime;
      const nextRouteMode = runtime?.sipConfig?.routeMode || DEFAULT_TELEPHONY_ROUTE_MODE;
      const amiMode = String(nextRouteMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase() === 'ami';
      setRouteMode(nextRouteMode);
      setOutboundMode('browser_sip');

      const activeNumber = String(
        runtime?.sipConfig?.extension ||
        runtime?.sipConfig?.phoneNumber ||
        runtime?.telephonyCredentials?.extension ||
        ''
      ).trim();

      if (amiMode) {
        setSipStatus('not-required');
        setSipStatusReason('');
        setTransportStatus('not-required');
        setTransportReason('');
      } else {
        setSipStatus(sipClient.isRegistered ? 'registered' : runtime?.sipReady ? 'ready' : 'missing-config');
        setSipStatusReason('');
        setTransportStatus(sipClient.ua ? 'connected' : 'disconnected');
        setTransportReason('');
      }
      return runtime;
    } catch (error) {
      runtimeRef.current = null;
      setSipStatus('error');
      setSipStatusReason(String(error?.message || '').trim());
      setTransportStatus('disconnected');
      setTransportReason(String(error?.message || '').trim());
      message.error(L('Не удалось загрузить настройки телефонии из бэкенда'));
      return null;
    } finally {
      setLoadingConfig(false);
    }
  }, [message]);

  useEffect(() => {
    if (!visible) return;
    loadBackendTelephony().then((runtime) => {
      const resolvedRouteMode = String(
        runtime?.sipConfig?.routeMode || DEFAULT_TELEPHONY_ROUTE_MODE,
      ).toLowerCase();
      if (resolvedRouteMode === 'ami') {
        setSipStatus('not-required');
        setSipStatusReason('');
        setTransportStatus('not-required');
        setTransportReason('');
        return;
      }
      if (!runtime?.sipReady) return;
      if (sipClient.isRegistered) return;
      ensureSipReady().catch(() => {
        // Error is surfaced in ensureSipReady via message + status tags.
      });
    });
  }, [visible]);

  const loadRecentCalls = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const response = await getCallHistory({ limit: 30 });
      let normalized = normalizeListResponse(response).map((item) => normalizeTelephonyCallPayload(item));
      if (!normalized.length) {
        const fallback = await getRecentIncomingCalls(20);
        normalized = normalizeListResponse(fallback).map((item) => normalizeTelephonyCallPayload(item));
      }
      setRecentCalls(mergeRecentCalls(localRecentCalls, normalized, 40));
    } catch (error) {
      setLogsError(L('Не удалось загрузить логи звонков'));
      setRecentCalls(mergeRecentCalls(localRecentCalls, [], 40));
    } finally {
      setLoadingLogs(false);
    }
  }, [localRecentCalls]);

  const loadContactsList = useCallback(async () => {
    setLoadingContacts(true);
    setContactsError('');
    try {
      const [contactsResponse, leadsResponse, companiesResponse] = await Promise.allSettled([
        getContacts({ page: 1, page_size: 50, ordering: '-update_date' }),
        getLeads({ page: 1, page_size: 30, ordering: '-update_date' }),
        getCompanies({ page: 1, page_size: 30, ordering: '-update_date' }),
      ]);

      const merged = [
        ...(contactsResponse.status === 'fulfilled' ? normalizeListResponse(contactsResponse.value).map((item) => mapPhonebookEntry(item, 'contact')) : []),
        ...(leadsResponse.status === 'fulfilled' ? normalizeListResponse(leadsResponse.value).map((item) => mapPhonebookEntry(item, 'lead')) : []),
        ...(companiesResponse.status === 'fulfilled' ? normalizeListResponse(companiesResponse.value).map((item) => mapPhonebookEntry(item, 'company')) : []),
      ]
        .filter((item) => pickContactNumber(item))
        .sort((left, right) => pickContactName(left).localeCompare(pickContactName(right), 'ru'))
        .slice(0, 80);

      setContacts(merged);
    } catch (error) {
      setContactsError(L('Не удалось загрузить контакты'));
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    void loadBackendTelephony();
    // Removed legacy polling

    return () => {
      cancelled = true;
      if (providerOriginatedWatchdogRef.current) {
        window.clearTimeout(providerOriginatedWatchdogRef.current);
        providerOriginatedWatchdogRef.current = null;
      }
      // Removed clearInterval
    };
  }, [visible, callStatus, usesServerOriginate]);

  const ensureSipReady = async () => {
    if (sipClient.isRegistered) {
      setSipStatus('registered');
      setSipStatusReason('');
      return true;
    }

    setRegistering(true);
    setSipStatus('connecting');
    setSipStatusReason('');

    try {
      const runtime = runtimeRef.current || (await loadBackendTelephony());
      const sip = runtime?.sipConfig;

      if (!sip?.username || !sip?.realm || !sip?.password || !sip?.websocketProxyUrl) {
        setSipStatus('missing-config');
        setSipStatusReason(L('Отсутствуют SIP credentials или WebSocket URL'));
        return false;
      }

      sipClient.configure({
        realm: sip.realm,
        impi: sip.username,
        impu: sip.impu,
        password: sip.password,
        display_name: sip.displayName,
        websocket_proxy_url: sip.websocketProxyUrl,
        ice_servers: sip.iceServers,
      });

      await sipClient.init();
      await sipClient.register(sip.username, sip.password);
      setSipStatus('registered');
      setSipStatusReason('');
      return true;
    } catch (error) {
      const errorMessage = String(error?.message || 'unknown error').trim();
      const normalized = errorMessage.toLowerCase();
      if (normalized.includes('credentials are not configured')) {
        setSipStatus('missing-config');
      } else if (normalized.includes('registration')) {
        setSipStatus('registration-failed');
      } else {
        setSipStatus('error');
      }
      setSipStatusReason(errorMessage);
      message.error(L('SIP регистрация не удалась') + ': ' + String(error?.message || 'unknown error'));
      return false;
    } finally {
      setRegistering(false);
    }
  };

  const startSipCall = async (validatedDial) => {
    const runtime = runtimeRef.current || (await loadBackendTelephony());
    const dial = validatedDial?.sipDial || normalizeDialForSip(dialNumber);
    if (!dial) throw new Error(L('Введите корректный номер'));

    const registered = await ensureSipReady();
    if (!registered) throw new Error(L('SIP клиент не готов'));

    callTokenRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await sipClient.call(dial, audioRef.current, { uiCallToken: callTokenRef.current });
    setCallStatus('calling');
  };

  const resolveProviderSessionIdFromActiveCalls = async () => {
    try {
      const response = await getActiveCalls();
      const activeCalls = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
          ? response.results
          : [];

      return String(
        activeCalls
          .map((item) => normalizeTelephonyCallPayload(item))
          .find((call) => isLikelyServerCall(call, amiCallRef.current))
          ?.sessionId || '',
      ).trim();
    } catch (error) {
      console.warn('[TelephonyDialerModal] Could not resolve pending provider call session:', error);
      return '';
    }
  };

  const handleCall = async () => {
    const validated = validateDialInput(dialNumber, routeMode);
    if (!validated.isValid) {
      message.error(validated.message);
      return;
    }

    try {
      setLastCallOutcome(null);
      if (usesServerOriginate) {
        const runtime = runtimeRef.current || (await loadBackendTelephony());
        const sourceExtension = String(
          runtime?.sipConfig?.extension ||
          runtime?.telephonyCredentials?.extension ||
          runtime?.profile?.pbx_number ||
          ''
        ).trim();
        const response = await initiateCall({
          to_number: validated.providerDial || validated.sipDial,
          from_number: sourceExtension,
        });
        const targetNumber = String(response?.to_number || validated.providerDial || validated.sipDial || '').trim();
        const fromNumber = String(response?.from_number || sourceExtension || '').trim();
        amiCallRef.current = {
          sessionId: String(response?.session_id || '').trim(),
          toNumber: targetNumber,
          fromNumber,
          detectedOnce: false,
        };
        setAmiRuntimeCall(
          normalizeTelephonyCallPayload({
            session_id: response?.session_id || '',
            phone_number: targetNumber,
            caller_id: fromNumber,
            called_number: targetNumber,
            status: response?.call_status || 'ringing',
            direction: 'outbound',
          })
        );
        setActiveDisplayNumber(targetNumber);
        setCallStatus('provider-originated');
        appendRecentCall({
          sessionId: response?.session_id || '',
          callId: response?.session_id || `${Date.now()}`,
          phoneNumber: targetNumber,
          direction: 'outbound',
          status: response?.call_status || 'ringing',
          startedAt: new Date().toISOString(),
        });
        return;
      }

      setCallStatus('calling');
      await startSipCall(validated);
    } catch (error) {
      setCallStatus('failed');
      setLastCallOutcome({
        status: 'failed',
        reason: String(error?.message || '').trim(),
        duration: 0,
      });
      appendRecentCall({
        phoneNumber: dialNumber,
        direction: 'outbound',
        status: 'failed',
        reason: String(error?.message || '').trim(),
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
      });
      message.error(L('Ошибка звонка') + ': ' + String(error?.message || 'unknown error'));
    }
  };

  const handleAnswerIncoming = () => {
    if (!sipClient.callSession) {
      message.warning(L('Активный входящий звонок не найден'));
      return;
    }

    if (answeringInProgressRef.current) {
      message.info(L('Ответ уже выполняется, ждите'));
      return;
    }

    try {
      const ok = sipClient.answerCall(audioRef.current);
      if (!ok) {
        message.warning(L('Не удалось отправить ответ на вызов'));
        return;
      }

      answeringInProgressRef.current = true;
      setCallStatus('calling');
    } catch (error) {
      message.error(L('Не удалось ответить на звонок'));
    }
  };

  const handleRejectIncoming = () => {
    if (!sipClient.callSession) {
      message.warning(L('Активный входящий звонок не найден'));
      return;
    }
    try {
      sipClient.rejectCall();
      setCallStatus('ended');
      setLastCallOutcome({
        status: 'failed',
        reason: 'rejected',
        duration: 0,
      });
    } catch (error) {
      message.error(L('Не удалось отклонить звонок'));
    }
  };

  const handleHangup = async () => {
    if (sipClient.callSession) {
      sipClient.hangup();
      setCallStatus('ended');
      return;
    }

    if (usesServerOriginate) {
      let sessionId = amiRuntimeCall?.sessionId || amiCallRef.current.sessionId;
      if (!sessionId) {
        const fallbackSessionId = await resolveProviderSessionIdFromActiveCalls();
        if (!fallbackSessionId) {
          message.info(L('Звонок уже завершается'));
          return;
        }
        sessionId = fallbackSessionId;
        amiCallRef.current = {
          sessionId: fallbackSessionId,
          toNumber: amiCallRef.current.toNumber,
          fromNumber: amiCallRef.current.fromNumber,
          detectedOnce: amiCallRef.current.detectedOnce,
        };
      }

      hangupActiveCall(sessionId)
        .then(() => {
          setCallStatus('ended');
          setAmiRuntimeCall((prev) => (prev ? { ...prev, status: 'ended' } : prev));
          setLastCallOutcome({
            status: 'ended',
            reason: '',
            duration: Number(amiRuntimeCall?.duration || 0),
          });
        })
        .catch((error) => {
          console.error('[TelephonyDialerModal] Bridge hangup failed:', error);
          message.error(L('Не удалось завершить ami-звонок на стороне PBX'));
        });
      return;
    }

    sipClient.hangup();
    setCallStatus('ended');
  };

  const handleMute = () => {
    const next = sipClient.toggleMute();
    setMuted(next);
  };

  const handleToggleHold = () => {
    if (isAmiMode) {
      message.info(L('Hold недоступен в режиме Go connector'));
      return;
    }
    if (callStatus !== 'connected') return;
    const next = sipClient.toggleHold();
    setIsHeld(next);
  };

  const handleTransfer = () => {
    const target = String(transferTarget || '').trim();
    if (!target) {
      message.warning(L('Укажите номер/extension для transfer'));
      return;
    }
    if (isAmiMode) {
      message.info(L('Transfer в режиме Go connector пока недоступен в UI'));
      return;
    }
    if (callStatus !== 'connected') {
      message.warning(L('Transfer доступен только во время активного разговора'));
      return;
    }
    const ok = sipClient.transferCall(target);
    if (!ok) {
      message.error(L('Не удалось выполнить transfer'));
      return;
    }
    message.success(L('Transfer отправлен на') + ' ' + target);
    setTransferTarget('');
  };

  const handleConference = () => {
    const target = String(transferTarget || '').trim();
    if (!target) {
      message.warning(L('Укажите номер/extension для конференции'));
      return;
    }
    if (isAmiMode) {
      message.info(L('Конференция в режиме Go connector пока недоступна в UI'));
      return;
    }
    if (callStatus !== 'connected') {
      message.warning(L('Конференция доступна только во время активного разговора'));
      return;
    }
    const ok = sipClient.transferCall(target);
    if (!ok) {
      message.error(L('Не удалось инициировать конференцию'));
      return;
    }
    message.success(L('Конференция инициирована через') + ' ' + target);
    setTransferTarget('');
  };

  const appendDial = (value) => {
    if (callStatus === 'connected' || callStatus === 'calling') {
      sipClient.sendDTMF(value);
      return;
    }
    setDialNumber((prev) => `${prev}${value}`);
  };

  const handleAsteriskKeyClick = () => {
    if (callStatus === 'connected' || callStatus === 'calling') {
      appendDial('*');
      return;
    }

    if (asteriskClickTimeoutRef.current) {
      window.clearTimeout(asteriskClickTimeoutRef.current);
      asteriskClickTimeoutRef.current = null;
      setDialNumber((prev) => `${prev}+`);
      return;
    }

    asteriskClickTimeoutRef.current = window.setTimeout(() => {
      setDialNumber((prev) => `${prev}*`);
      asteriskClickTimeoutRef.current = null;
    }, 220);
  };

  const backspaceDial = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const clearDial = () => {
    setDialNumber('');
  };

  const handleToggleDnd = () => {
    setDndEnabled((prev) => {
      const next = !prev;
      if (typeof message?.info === 'function') {
        message.info(next ? L('Режим «Не беспокоить» включен') : L('Режим «Не беспокоить» выключен'));
      }
      return next;
    });
  };

  const dialValidation = useMemo(() => validateDialInput(dialNumber, routeMode), [dialNumber, routeMode]);

  const canStartCall =
    dialValidation.isValid &&
    !['incoming', 'calling', 'connected', 'provider-originated'].includes(callStatus) &&
    !loadingConfig &&
    !registering;
  
  const outcomeMeta = useMemo(
    () => getCallOutcomeMeta(lastCallOutcome?.status, lastCallOutcome?.reason),
    [lastCallOutcome?.reason, lastCallOutcome?.status],
  );
  useEffect(() => {
    if (!visible) return;
    if (!autoCallRequestId) return;
    if (autoCallHandledRef.current === autoCallRequestId) return;
    if (!dialValidation.isValid || !canStartCall) return;

    autoCallHandledRef.current = autoCallRequestId;
    void handleCall();
  }, [autoCallRequestId, canStartCall, dialValidation.isValid, visible]);

  const callTag = useMemo(() => {
    const runtimeStatus = getTelephonyRuntimeStatusMeta(callStatus, {
      duration: callDuration,
      amiMode: isAmiMode,
      idleTitle: L('Телефонная панель готова'),
      idleLabel: L('Ожидание'),
    });
    const map = {
      idle: { color: runtimeStatus.color, text: `${L('Вызов')}: ${runtimeStatus.label}`, icon: <PauseCircleFilled /> },
      incoming: { color: runtimeStatus.color, text: `${L('Вызов')}: ${L('Входящий')}`, icon: <PhoneTwoTone twoToneColor="#22c55e" /> },
      calling: { color: runtimeStatus.color, text: `${L('Вызов')}: ${runtimeStatus.label}`, icon: <SyncOutlined spin /> },
      connected: {
        color: runtimeStatus.color,
        text: `${L('Вызов')}: ${runtimeStatus.label} ${formatRuntimeDuration(callDuration)}`,
        icon: <PhoneTwoTone twoToneColor="#22c55e" />,
      },
      ended: {
        color: runtimeStatus.color,
        text: `${L('Вызов')}: ${runtimeStatus.label} ${formatRuntimeDuration(callDuration)}`,
        icon: <CheckCircleFilled />,
      },
      failed: { color: runtimeStatus.color, text: `${L('Вызов')}: ${runtimeStatus.label}`, icon: <ExclamationCircleFilled /> },
      'provider-originated': { color: runtimeStatus.color, text: `${L('Вызов')}: ${runtimeStatus.label}`, icon: <PhoneOutlined /> },
    };
    return map[callStatus] || map.idle;
  }, [callDuration, callStatus, isAmiMode]);

  const headerPresence = useMemo(() => {
    if (dndEnabled) {
      return { key: 'dnd', title: L('Не беспокоить') };
    }
    if (['registered', 'ready', 'not-required'].includes(String(sipStatus || '').toLowerCase())) {
      return { key: 'online', title: L('Онлайн: ожидает звонка') };
    }
    return { key: 'offline', title: L('Оффлайн') };
  }, [dndEnabled, sipStatus]);

  const activePhoneLabel = useMemo(() => {
    const runtimeNumber =
      amiRuntimeCall?.phoneNumber ||
      amiRuntimeCall?.calledNumber ||
      amiRuntimeCall?.callerId ||
      activeDisplayNumber ||
      dialNumber;
    return String(runtimeNumber || '').trim() || L('Неизвестный номер');
  }, [activeDisplayNumber, amiRuntimeCall?.calledNumber, amiRuntimeCall?.callerId, amiRuntimeCall?.phoneNumber, dialNumber]);

  const callTargetOptions = useMemo(() => {
    return contacts
      .map((entry) => {
        const label = pickContactName(entry);
        const number = pickContactNumber(entry);
        if (!number) return null;
        const typeLabel = String(entry?.displayType || '').trim();
        const plainLabel = typeLabel ? `${label} (${typeLabel})` : label;
        return {
          value: sanitizeDialInput(number),
          label: (
            <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>{plainLabel}</span>
              <span style={{ color: token.colorTextSecondary }}>{number}</span>
            </Space>
          ),
          searchText: `${label} ${number} ${typeLabel}`.toLowerCase(),
        };
      })
      .filter(Boolean)
      .slice(0, 120);
  }, [contacts, token.colorTextSecondary]);

  const filteredContacts = useMemo(() => {
    const query = String(contactsSearch || '').trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => {
      const name = pickContactName(contact).toLowerCase();
      const number = pickContactNumber(contact).toLowerCase();
      const type = String(contact?.displayType || '').toLowerCase();
      return name.includes(query) || number.includes(query) || type.includes(query);
    });
  }, [contacts, contactsSearch]);


  
  const primaryPanel = useMemo(() => {
    // Top component - standard PBX control panel
    const sourceExtension = runtimeRef.current?.sipConfig?.extension ||
                              runtimeRef.current?.telephonyCredentials?.extension ||
                              runtimeRef.current?.profile?.pbx_number ||
                              '1001';

    const pbxControlMode = isAmiMode ? 'Asterisk AMI' : 'Browser SIP';
    const hasActiveCall = callStatus !== 'idle' && callStatus !== 'ended' && callStatus !== 'failed';

    const topCard = (
      <Card className="telephony-dialer-card telephony-dialer-card--pbx" size="small" bordered={true} styles={{ body: { padding: 16 } }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div className="pbx-header">
            <div>
              <div className="pbx-title">{L('Звонилка')}</div>
              <div className="pbx-subtitle">{L('Внутренний номер')}: {sourceExtension}</div>
            </div>
            <Tag color="#e6f4ff" style={{ color: '#1677ff', border: 'none', fontWeight: 600, fontSize: 13, borderRadius: 12, padding: '4px 10px' }}>
              {pbxControlMode}
            </Tag>
          </div>

          <div className="pbx-badges">
            <span className="pbx-badge pbx-badge--outline">
              <UserOutlined /> {sourceExtension}
            </span>
            <span className="pbx-badge pbx-badge--outline">
              {isAmiMode ? L('Управление вызовом через PBX') : L('Встроенная звонилка WebRTC')}
            </span>
          </div>

          <div className="pbx-actions">
            <Button
              className={`pbx-toggle-btn ${dndEnabled ? 'pbx-toggle-btn--active' : ''}`}
              icon={<StopOutlined />}
              onClick={handleToggleDnd}
            >
              DND
            </Button>
            <Button
              className={`pbx-toggle-btn ${autoAnswerEnabled ? 'pbx-toggle-btn--active' : ''}`}
              icon={<CheckCircleFilled />}
              onClick={() => setAutoAnswerEnabled(!autoAnswerEnabled)}
            >
              {L('Автоответ')}
            </Button>
          </div>
        </Space>
      </Card>
    );

    let activeCallCard = null;

    if (hasActiveCall) {
      const getCallStateMeta = () => {
        if (callStatus === 'incoming') {
          return { title: L('Входящий звонок'), sub: L('Новый входящий вызов'), icon: <PhoneFilled />, color: 'green', showActions: 'incoming' };
        }
        if (callStatus === 'calling' || callStatus === 'provider-originated') {
          return { title: L('Набор номера'), sub: L('Идёт попытка установить соединение'), icon: <SyncOutlined spin />, color: 'blue', showActions: 'calling' };
        }
        if (callStatus === 'connected') {
          return { title: L('Разговор'), sub: formatRuntimeDuration(callDuration), icon: <AudioOutlined />, color: 'success', showActions: 'connected' };
        }
        return { title: L('Вызов'), sub: callStatus, icon: <PhoneOutlined />, color: 'default', showActions: 'calling' };
      };

      const meta = getCallStateMeta();

      activeCallCard = (
        <Card className="telephony-dialer-card telephony-dialer-card--active-call" size="small" bordered={true} styles={{ body: { padding: '20px 16px' } }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div className="active-call-header">
              <div className={`active-call-icon active-call-icon--${meta.color}`}>
                {meta.icon}
              </div>
              <div className="active-call-info">
                <div className="active-call-title">{meta.title}</div>
                <div className="active-call-sub">{meta.sub}</div>
              </div>
            </div>

            <div className="active-call-number-container">
              <div className="active-call-number">
                {activePhoneLabel}
              </div>
              <Tag color="#e6f4ff" style={{ color: '#1677ff', border: 'none', fontWeight: 600, borderRadius: 12 }}>
                {L('Линия 1')}
              </Tag>
            </div>

            <div className="active-call-actions">
              {meta.showActions === 'incoming' && (
                <Row gutter={12}>
                  <Col span={12}>
                    <Button danger block size="large" className="active-call-btn active-call-btn--reject" onClick={handleRejectIncoming}>
                      <StopOutlined /> {L('Отклонить')}
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button type="primary" block size="large" className="active-call-btn active-call-btn--answer" onClick={handleAnswerIncoming}>
                      <PhoneFilled /> {L('Ответить')}
                    </Button>
                  </Col>
                </Row>
  const isAmiMode = usesServerOriginate;
  )}
              {meta.showActions === 'calling' && (
                <Button danger block size="large" className="active-call-btn active-call-btn--hangup" onClick={handleHangup}>
                  <StopOutlined /> {L('Завершить')}
                </Button>
              )}
              {meta.showActions === 'connected' && (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button block size="large" onClick={handleMute} className={`active-call-btn-toggle ${muted ? 'active-call-btn-toggle--active' : ''}`}>
                        {muted ? <AudioOutlined /> : <AudioOutlined />}
                        {muted ? L('Включить микрофон') : L('Выключить микрофон')}
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button block size="large" onClick={handleToggleHold} className={`active-call-btn-toggle ${isHeld ? 'active-call-btn-toggle--active' : ''}`}>
                        {isHeld ? <PauseCircleFilled /> : <PauseCircleFilled />}
                        {isHeld ? L('Снять с удержания') : L('Удержание')}
                      </Button>
                    </Col>
                  </Row>
                  <Button danger block size="large" className="active-call-btn active-call-btn--hangup" onClick={handleHangup}>
                    <StopOutlined /> {L('Завершить')}
                  </Button>
                </Space>
              )}
            </div>
          </Space>
        </Card>
      );
    }

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {topCard}
        {activeCallCard}
      </Space>
    );
  }, [
    activePhoneLabel,
    callDuration,
    callStatus,
    handleAnswerIncoming,
    handleRejectIncoming,
    handleHangup,
    handleMute,
    handleToggleHold,
    handleToggleDnd,
    dndEnabled,
    autoAnswerEnabled,
    isAmiMode,
    isHeld,
    muted,
  ]);


  const showCompactDialer = ['idle', 'ended', 'failed'].includes(callStatus);
  const showOutcomeInsteadOfDialer = Boolean(outcomeMeta && showCompactDialer);

  useEffect(() => {
    if (!showCompactDialer && activeTab !== 'dialer') {
      setActiveTab('dialer');
    }
  }, [activeTab, showCompactDialer]);

  const modalZIndex = DEFAULT_Z_INDEX;
  const expandedModalWidth = 396;
  const modalWidth = minimized
    ? 320
    : Math.min(expandedModalWidth, Math.max(360, viewportWidth - 16));
  const closeAndReset = () => {
    if (callStatus === 'calling' || callStatus === 'connected' || callStatus === 'provider-originated') {
      if (usesServerOriginate && !sipClient.callSession) {
        const sessionId = String(amiRuntimeCall?.sessionId || amiCallRef.current.sessionId || '').trim();
        if (sessionId) {
          void hangupActiveCall(sessionId).catch((error) => {
            console.warn('[TelephonyDialerModal] Failed to hangup bridge call while closing dialer:', error);
          });
        }
      } else {
        sipClient.hangup();
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallStatus('idle');
    setMuted(false);
    setIsHeld(false);
    setTransferTarget('');
    setCallDuration(0);
    setMinimized(false);
    setAmiRuntimeCall(null);
    setOutgoingCallCardVisible(false);
    setOutgoingCallCardPhone('');
    setOutgoingCallCardData(null);
    autoCallHandledRef.current = '';
    amiCallRef.current = {
      sessionId: '',
      toNumber: '',
      fromNumber: '',
      detectedOnce: false,
    };
    callTokenRef.current = null;
    activeCallIdentityRef.current = { callId: '', sessionId: '' };
    setLastCallOutcome(null);
    setActiveDisplayNumber('');
    onClose?.();
  };

  const clampWindowPosition = (nextX, nextY) => {
    if (typeof window === 'undefined') return { x: nextX, y: nextY };
    const width = modalWidth;
    const height = minimized ? 64 : 620;
    const x = Math.min(Math.max(8, nextX), Math.max(8, window.innerWidth - width - 8));
    const y = Math.min(Math.max(8, nextY), Math.max(8, window.innerHeight - height - 8));
    return { x, y };
  };

  const updateWindowPosition = (nextX, nextY) => {
    setWindowPosition(clampWindowPosition(nextX, nextY));
  };

  const stopDragging = () => {
    dragStateRef.current.active = false;
    window.removeEventListener('mousemove', onDragging);
    window.removeEventListener('mouseup', stopDragging);
  };

  const onDragging = (event) => {
    if (!dragStateRef.current.active) return;
    updateWindowPosition(
      event.clientX - dragStateRef.current.offsetX,
      event.clientY - dragStateRef.current.offsetY,
    );
  };

  const startDragging = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragStateRef.current = {
      active: true,
      offsetX: event.clientX - windowPosition.x,
      offsetY: event.clientY - windowPosition.y,
    };
    window.addEventListener('mousemove', onDragging);
    window.addEventListener('mouseup', stopDragging);
  };

  useEffect(() => {
    return () => {
      stopDragging();
      if (asteriskClickTimeoutRef.current) {
        window.clearTimeout(asteriskClickTimeoutRef.current);
        asteriskClickTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setWindowPosition((prev) => clampWindowPosition(prev.x, prev.y));
  }, [visible, modalWidth, minimized]);

  const useNumberFromTab = (value) => {
    const next = sanitizeDialInput(value);
    if (!next) return;
    setDialNumber(next);
    setActiveTab('dialer');
  };

  const dialerTabContent = (
    <div className="telephony-dialer-tab-content">
      {outcomeMeta ? (
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div className={`telephony-outcome telephony-outcome--compact telephony-outcome--${outcomeMeta.tone}`}>
              <div className="telephony-outcome__top">
                <Tag color={callTag.color} icon={callTag.icon} className="telephony-outcome__tag">
                  {callTag.text}
                </Tag>
                {dialValidation.isValid ? (
                  <span className="telephony-outcome__kind">
                    {dialValidation.targetKind === 'internal' ? L('Внутренний call') : L('Обычный call')}
                  </span>
                ) : null}
              </div>
              <div className="telephony-outcome__body">
                <div className="telephony-outcome__summary">
                  <div className="telephony-outcome__number">{activePhoneLabel}</div>
                  <div className="telephony-outcome__title">{outcomeMeta.title}</div>
                  <div className="telephony-outcome__description">{outcomeMeta.description}</div>
                </div>
                <Space size={8} className="telephony-outcome__actions">
                  <Button size="small" onClick={() => setLastCallOutcome(null)}>
                    {L('Скрыть')}
                  </Button>
                  {dialNumber ? (
                    <Button size="small" type="primary" onClick={() => void handleCall()} disabled={!canStartCall}>
                      {L('Call снова')}
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
          </Space>
        </Card>
      ) : null}
      {primaryPanel}
      {showCompactDialer && !showOutcomeInsteadOfDialer ? (
        <>
          <Input
            value={dialNumber}
            onChange={(e) => setDialNumber(sanitizeDialInput(e.target.value))}
            onPressEnter={() => {
              if (canStartCall) {
                handleCall();
              }
            }}
            placeholder={L('Введите номер')}
            prefix={<PhoneOutlined />}
            status={dialNumber && !dialValidation.isValid ? 'error' : ''}
            suffix={
              <Space size={2}>
                <Tooltip title={L('Стереть символ')}>
                  <Button
                    type="text"
                    icon={<span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>⌫</span>}
                    onClick={backspaceDial}
                    disabled={!dialNumber}
                    aria-label={L('Стереть символ')}
                  />
                </Tooltip>
              </Space>
            }
          />

          <div className="dial-pad">
            <Row gutter={[8, 8]}>
              {DTMF_KEYS.map((digit) => (
                <Col key={digit} span={8}>
                  <Button 
                    block 
                    size="large" 
                    className="dial-pad__key"
                    onClick={digit === '*' ? handleAsteriskKeyClick : () => appendDial(digit)}
                  >
                    <span className="dial-pad__digit">{digit}</span>
                    <span className="dial-pad__letters">
                      {DTMF_HINTS[digit] || ''}
                    </span>
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          
          <Row gutter={8} className="telephony-dialer-footer">
            <Col span={12}>
              <Tooltip title={L('Очистить номер')}>
                <Button
                  block
                  icon={<DeleteOutlined />}
                  onClick={clearDial}
                  className="telephony-dialer-footer__icon-btn"
                  aria-label={L('Очистить номер')}
                >
                  {L('Очистить')}
                </Button>
              </Tooltip>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                className="crm-btn--call telephony-dialer-footer__call-btn"
                icon={<PhoneFilled />}
                disabled={!canStartCall}
                onClick={handleCall}
                aria-label={L('Позвонить')}
                style={{ width: '100%' }}
              >
                {registering ? L('Подключение...') : L('Позвонить')}
              </Button>
            </Col>
          </Row>

        </>
      ) : null}

    </div>
  );

  const logsTabContent = (
    <div className="telephony-tab-content telephony-tab-content--logs">
      {logsError ? <Alert type="error" showIcon title={logsError} /> : null}
      <Card size="small" styles={{ body: { padding: 0 } }}>
        {recentCalls.length ? (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {recentCalls.map((call, index) => {
              const number = pickCallNumber(call);
              const status = normalizeCallStatus(call);
              return (
                <div
                  key={`${call.callId || call.sessionId || number || index}`}
                  style={{
                    padding: '10px 12px',
                    borderBottom: index < recentCalls.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                    cursor: number ? 'pointer' : 'default',
                  }}
                  onClick={() => useNumberFromTab(number)}
                >
                  <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                    <Space size={8} wrap>
                      <Tag color="blue">{normalizeCallDirection(call)}</Tag>
                      <Tag color={status.color}>{status.text}</Tag>
                    </Space>
                    <span style={{ fontWeight: 600 }}>{number || '-'}</span>
                    <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>{formatCallTime(call)}</span>
                  </Space>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 16, color: token.colorTextSecondary }}>
            {loadingLogs ? L('Загрузка логов...') : L('Логи звонков пока пустые')}
          </div>
        )}
      </Card>
    </div>
  );

  const contactsTabContent = (
    <div className="telephony-tab-content telephony-tab-content--contacts">
      {contactsError ? <Alert type="error" showIcon title={contactsError} /> : null}
      <Input
        allowClear
        value={contactsSearch}
        onChange={(event) => setContactsSearch(event.target.value)}
        placeholder={L('Поиск контактов: имя или номер')}
      />
      <Card size="small" styles={{ body: { padding: 0 } }}>
        {filteredContacts.length ? (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filteredContacts.map((contact, index) => {
              const name = pickContactName(contact);
              const number = pickContactNumber(contact);
              return (
                <div
                  key={String(contact.id || `${name}-${index}`)}
                  style={{
                    padding: '10px 12px',
                    borderBottom: index < filteredContacts.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                    cursor: number ? 'pointer' : 'default',
                    opacity: number ? 1 : 0.75,
                  }}
                  onClick={() => useNumberFromTab(number)}
                >
                  <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                    <Space size={8} wrap>
                      <span style={{ fontWeight: 600 }}>{name || L('Без имени')}</span>
                      {contact.displayType ? <Tag>{contact.displayType}</Tag> : null}
                    </Space>
                    <span style={{ color: token.colorTextSecondary }}>{number || L('Нет номера')}</span>
                  </Space>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 16, color: token.colorTextSecondary }}>
            {loadingContacts ? L('Загрузка контактов...') : L('Контакты не найдены')}
          </div>
        )}
      </Card>
    </div>
  );

  if (visible && minimized) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            left: windowPosition.x,
            top: windowPosition.y,
            width: 320,
            zIndex: modalZIndex,
            boxShadow: token.boxShadowSecondary,
            borderRadius: 10,
            background: token.colorBgElevated,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div
            onMouseDown={startDragging}
            style={{
              cursor: 'move',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Space size={8} style={{ minWidth: 0 }}>
              <ArrowsAltOutlined style={{ color: token.colorTextSecondary }} />
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {L('Телефонная звонилка')}
              </span>
            </Space>
            <div className="telephony-window-controls">
              <Button
                size="small"
                type="text"
                icon={<ArrowsAltOutlined />}
                className="telephony-window-control-btn"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setMinimized(false)}
              />
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
                className="telephony-window-control-btn telephony-window-control-btn--close"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={closeAndReset}
              />
            </div>
          </div>
          <div style={{ padding: '0 12px 10px', color: token.colorTextSecondary, fontSize: 12 }}>
            {callTag.text}
          </div>
        </div>
        <div style={{ display: 'none' }}>
          <audio ref={audioRef} autoPlay />
        </div>
      </>
    );
  }

  return (
    <Modal
      {...TELEPHONY_MODAL_PROPS}
      className="telephony-softphone-modal"
      title={(
        <div
          className={`telephony-softphone-header ${showCompactDialer ? 'telephony-softphone-header--tabs' : ''}`}
          onMouseDown={startDragging}
        >
          {showCompactDialer ? (
            <div className="telephony-softphone-header__tabs" onMouseDown={(event) => event.stopPropagation()}>
              <Tabs
                size="small"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'dialer', label: L('Набор') },
                  { key: 'logs', label: L('Логи') },
                  { key: 'contacts', label: L('Контакты') },
                ]}
              />
            </div>
          ) : (
            <Space size={8} className="telephony-softphone-header__title">
              <span
                className={`telephony-softphone-header__dot telephony-softphone-header__dot--${headerPresence.key}`}
                title={headerPresence.title}
              />
            </Space>
          )}
          <div className="telephony-window-controls">
            <Button
              size="small"
              type="text"
              icon={<MinusOutlined />}
              className="telephony-window-control-btn"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => setMinimized(true)}
            />
            <Button
              size="small"
              type="text"
              icon={<CloseOutlined />}
              className="telephony-window-control-btn telephony-window-control-btn--close"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={closeAndReset}
            />
          </div>
        </div>
      )}
      open={visible}
      onCancel={closeAndReset}
      closable={false}
      footer={null}
      width={modalWidth}
      styles={{
        ...TELEPHONY_MODAL_STYLES,
        content: { padding: 0 },
        header: { margin: 0, padding: 0 },
        body: { padding: 0 },
      }}
      centered={false}
      mask={false}
      style={{ left: windowPosition.x, top: windowPosition.y, margin: 0, paddingBottom: 0, position: 'fixed' }}
      zIndex={modalZIndex}
      destroyOnHidden
    >
      <div className="telephony-softphone-body">
        <OutgoingCallCard
          visible={outgoingCallCardVisible}
          phoneNumber={outgoingCallCardPhone}
          callData={outgoingCallCardData}
          onClose={() => setOutgoingCallCardVisible(false)}
        />
        {activeTab === 'dialer' ? dialerTabContent : null}
        {showCompactDialer && activeTab === 'logs' ? logsTabContent : null}
        {showCompactDialer && activeTab === 'contacts' ? contactsTabContent : null}

        <div style={{ display: 'none' }}>
          <audio ref={audioRef} autoPlay />
        </div>
      </div>
    </Modal>
  );
}
// Force dev server reload Tue Apr 21 00:53:26 +05 2026
