import {
  CloseOutlined,
  DeleteOutlined,
  MinusOutlined,
  PhoneFilled,
  PhoneOutlined,
  ReloadOutlined,
  ArrowsAltOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Input, Modal, Row, Space, Tabs, Tag, Tooltip, theme } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCallHistory, initiateCall, normalizeTelephonyCallPayload } from '../lib/api/telephony.js';
import { getContacts } from '../lib/api/client.js';
import sipClient from '../lib/telephony/SIPClient.js';
import { loadTelephonyRuntimeConfig } from '../lib/telephony/runtimeConfig.js';
import { DEFAULT_TELEPHONY_ROUTE_MODE } from '../lib/telephony/constants.js';
import { TELEPHONY_MODAL_PROPS } from '../shared/ui/telephonyModal.js';
import '../styles/telephony.css';

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
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

function normalizeDialForSip(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length >= 12) return digits.slice(-9);
  return digits;
}

function isLikelyInternalExtension(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 0 && digits.length <= 6;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function sanitizeDialInput(raw) {
  return String(raw || '').replace(/[^\d+*#()\-\s.]/g, '');
}

function normalizeProviderDial(value) {
  return sanitizeDialInput(value).replace(/[^\d+]/g, '');
}

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
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
  if (direction === 'inbound' || direction === 'incoming') return 'Входящий';
  if (direction === 'outbound' || direction === 'outgoing') return 'Исходящий';
  return 'Звонок';
}

function normalizeCallStatus(call = {}) {
  const status = String(call.status || '').toLowerCase();
  if (['answered', 'completed', 'ended', 'hangup'].includes(status)) return { color: 'success', text: 'Завершён' };
  if (['ringing', 'connecting', 'queued', 'waiting'].includes(status)) return { color: 'processing', text: 'В процессе' };
  if (['busy', 'failed', 'abandoned', 'no_answer'].includes(status)) return { color: 'error', text: 'Ошибка' };
  return { color: 'default', text: status || 'Неизвестно' };
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
      message: 'Введите номер телефона',
      sipDial: '',
      providerDial: '',
    };
  }

  if (invalidChars) {
    return {
      isValid: false,
      message: 'Недопустимые символы. Разрешены только цифры, +, *, #, пробел, скобки и дефис',
      sipDial: '',
      providerDial: '',
    };
  }

  if (plusCount > 1 || (plusCount === 1 && !value.startsWith('+'))) {
    return {
      isValid: false,
      message: 'Символ "+" допустим только в начале номера',
      sipDial: '',
      providerDial: '',
    };
  }

  const mode = String(routeMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase();
  const sipDial = normalizeDialForSip(value);
  const providerDial = normalizeProviderDial(value).replace(/^\+/, '');

  if (hasStarHash) {
    return {
      isValid: false,
      message: 'Символы * и # разрешены только для DTMF во время активного звонка',
      sipDial,
      providerDial,
    };
  }

  if (mode === 'embedded') {
    if (digits.length < 2 || digits.length > 15) {
      return {
        isValid: false,
        message: 'Номер для встроенного режима должен содержать от 2 до 15 цифр',
        sipDial,
        providerDial,
      };
    }
    return { isValid: true, message: '', sipDial, providerDial };
  }

  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      message: 'Внешний номер должен содержать от 7 до 15 цифр',
      sipDial,
      providerDial,
    };
  }

  return { isValid: true, message: '', sipDial, providerDial };
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
  const [contacts, setContacts] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [logsLoadedOnce, setLogsLoadedOnce] = useState(false);
  const [contactsLoadedOnce, setContactsLoadedOnce] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [sipStatus, setSipStatus] = useState(sipClient.isRegistered ? 'registered' : 'offline');
  const [numberLabel, setNumberLabel] = useState('-');
  const [routeMode, setRouteMode] = useState(DEFAULT_TELEPHONY_ROUTE_MODE);
  const [callStatus, setCallStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transportStatus, setTransportStatus] = useState(sipClient.ua ? 'connected' : 'disconnected');
  const [minimized, setMinimized] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [windowPositionReady, setWindowPositionReady] = useState(false);

  const runtimeRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const callTokenRef = useRef(null);
  const autoCallHandledRef = useRef('');
  const dialNumberRef = useRef(String(initialNumber || ''));
  const dragStateRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    setDialNumber(String(initialNumber || ''));
    dialNumberRef.current = String(initialNumber || '');
  }, [initialNumber]);

  useEffect(() => {
    if (visible) return;
    setActiveTab('dialer');
    setMinimized(false);
    setLogsLoadedOnce(false);
    setContactsLoadedOnce(false);
    setRecentCalls([]);
    setContacts([]);
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
    dialNumberRef.current = String(dialNumber || '');
  }, [dialNumber]);

  useEffect(() => {
    const onRegistered = () => setSipStatus('registered');
    const onUnregistered = () => setSipStatus('offline');
    const onSipError = () => setSipStatus('error');
    const onTransport = (data) => {
      const status = String(data?.status || '').toLowerCase();
      if (!status) return;
      if (status === 'connected') setTransportStatus('connected');
      if (status === 'disconnected') setTransportStatus('disconnected');
      if (status === 'connecting') setTransportStatus('connecting');
    };

    const ownCall = (data) => {
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
      setCallStatus('calling');
      setMuted(false);
      setCallDuration(0);
    };

    const onCallAnswered = (data) => {
      if (!ownCall(data)) return;
      setCallStatus('connected');
    };

    const onCallEnded = (data) => {
      if (!ownCall(data)) return;
      setCallStatus(data?.status === 'failed' ? 'failed' : 'ended');
      const duration = Number(data?.duration || 0);
      setCallDuration(duration);
      setMuted(false);
      callTokenRef.current = null;
    };

    sipClient.on('registered', onRegistered);
    sipClient.on('unregistered', onUnregistered);
    sipClient.on('error', onSipError);
    sipClient.on('transportStateChange', onTransport);
    sipClient.on('callStarted', onCallStarted);
    sipClient.on('callAnswered', onCallAnswered);
    sipClient.on('callEnded', onCallEnded);

    return () => {
      sipClient.off('registered', onRegistered);
      sipClient.off('unregistered', onUnregistered);
      sipClient.off('error', onSipError);
      sipClient.off('transportStateChange', onTransport);
      sipClient.off('callStarted', onCallStarted);
      sipClient.off('callAnswered', onCallAnswered);
      sipClient.off('callEnded', onCallEnded);
    };
  }, []);

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

  const loadBackendTelephony = async () => {
    setLoadingConfig(true);
    try {
      const runtime = await loadTelephonyRuntimeConfig();
      runtimeRef.current = runtime;
      setRouteMode(runtime?.sipConfig?.routeMode || DEFAULT_TELEPHONY_ROUTE_MODE);

      const activeNumber = String(runtime?.sipConfig?.phoneNumber || '').trim();
      setNumberLabel(activeNumber || '-');

      setSipStatus(sipClient.isRegistered ? 'registered' : runtime?.sipReady ? 'ready' : 'missing-config');
      setTransportStatus(sipClient.ua ? 'connected' : 'disconnected');
      return runtime;
    } catch (error) {
      runtimeRef.current = null;
      setSipStatus('error');
      message.error('Не удалось загрузить настройки телефонии из бэкенда');
      return null;
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    loadBackendTelephony();
  }, [visible]);

  const loadRecentCalls = async () => {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const response = await getCallHistory({ page: 1, page_size: 20, ordering: '-started_at' });
      const normalized = normalizeListResponse(response).map((item) => normalizeTelephonyCallPayload(item));
      setRecentCalls(normalized);
      setLogsLoadedOnce(true);
    } catch (error) {
      setLogsError('Не удалось загрузить логи звонков');
      setRecentCalls([]);
      setLogsLoadedOnce(true);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadContactsList = async () => {
    setLoadingContacts(true);
    setContactsError('');
    try {
      const response = await getContacts({ page: 1, page_size: 30, ordering: 'full_name' });
      setContacts(normalizeListResponse(response));
      setContactsLoadedOnce(true);
    } catch (error) {
      setContactsError('Не удалось загрузить контакты');
      setContacts([]);
      setContactsLoadedOnce(true);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (activeTab === 'logs' && !loadingLogs && !logsLoadedOnce) {
      void loadRecentCalls();
      return;
    }
    if (activeTab === 'contacts' && !loadingContacts && !contactsLoadedOnce) {
      void loadContactsList();
    }
  }, [activeTab, contactsLoadedOnce, loadingContacts, loadingLogs, logsLoadedOnce, visible]);

  const ensureSipReady = async () => {
    if (sipClient.isRegistered) {
      setSipStatus('registered');
      return true;
    }

    setRegistering(true);
    setSipStatus('connecting');

    try {
      const runtime = runtimeRef.current || (await loadBackendTelephony());
      const sip = runtime?.sipConfig;

      if (!sip?.username || !sip?.realm || !sip?.password || !sip?.websocketProxyUrl) {
        setSipStatus('missing-config');
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
      return true;
    } catch (error) {
      setSipStatus('error');
      message.error(`SIP регистрация не удалась: ${String(error?.message || 'unknown error')}`);
      return false;
    } finally {
      setRegistering(false);
    }
  };

  const startProviderCall = async (runtime, validatedProviderDial = '') => {
    const toNumber = String(validatedProviderDial || normalizeProviderDial(dialNumber)).replace(/^\+/, '');
    const fromNumber = String(runtime?.sipConfig?.phoneNumber || runtime?.profile?.pbx_number || '').trim();
    if (!toNumber) throw new Error('Введите номер');

    await initiateCall({
      to_number: toNumber,
      from_number: fromNumber || undefined,
      provider: runtime?.sipConfig?.provider || undefined,
    });

    setCallStatus('provider-originated');
    message.success('Звонок отправлен через сервер телефонии');
  };

  const startSipCall = async (validatedDial) => {
    const runtime = runtimeRef.current || (await loadBackendTelephony());
    const dial = validatedDial?.sipDial || normalizeDialForSip(dialNumber);
    if (!dial) throw new Error('Введите корректный номер');

    const registered = await ensureSipReady();
    if (!registered) throw new Error('SIP клиент не готов');

    callTokenRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await sipClient.call(dial, audioRef.current, { uiCallToken: callTokenRef.current });
    setCallStatus('calling');
  };

  const handleCall = async () => {
    const validated = validateDialInput(dialNumber, routeMode);
    if (!validated.isValid) {
      message.error(validated.message);
      return;
    }

    try {
      setCallStatus('calling');
      const runtime = runtimeRef.current || (await loadBackendTelephony());
      const mode = String(runtime?.sipConfig?.routeMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase();

      if (mode === 'bridge') {
        await startProviderCall(runtime, validated.providerDial);
        return;
      }

      await startSipCall(validated);
    } catch (error) {
      setCallStatus('failed');
      message.error(`Ошибка звонка: ${String(error?.message || 'unknown error')}`);
    }
  };

  const handleHangup = () => {
    sipClient.hangup();
    setCallStatus('ended');
  };

  const handleMute = () => {
    const next = sipClient.toggleMute();
    setMuted(next);
  };

  const appendDial = (value) => {
    if (callStatus === 'connected' || callStatus === 'calling') {
      sipClient.sendDTMF(value);
      return;
    }
    setDialNumber((prev) => `${prev}${value}`);
  };

  const backspaceDial = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const clearDial = () => {
    setDialNumber('');
  };

  const dialValidation = useMemo(() => validateDialInput(dialNumber, routeMode), [dialNumber, routeMode]);
  const canStartCall =
    dialValidation.isValid && callStatus !== 'calling' && callStatus !== 'connected' && !loadingConfig && !registering;

  useEffect(() => {
    if (!visible) return;
    if (!autoCallRequestId) return;
    if (autoCallHandledRef.current === autoCallRequestId) return;
    if (!dialValidation.isValid || !canStartCall) return;

    autoCallHandledRef.current = autoCallRequestId;
    void handleCall();
  }, [autoCallRequestId, canStartCall, dialValidation.isValid, visible]);

  const transportTag = useMemo(() => {
    const map = {
      connected: { color: 'success', text: 'Транспорт: онлайн' },
      connecting: { color: 'processing', text: 'Транспорт: подключение' },
      disconnected: { color: 'default', text: 'Транспорт: оффлайн' },
    };
    return map[transportStatus] || map.disconnected;
  }, [transportStatus]);

  const callTag = useMemo(() => {
    const map = {
      idle: { color: 'default', text: 'Вызов: ожидание' },
      calling: { color: 'processing', text: 'Вызов: набор' },
      connected: { color: 'success', text: `Вызов: разговор ${formatDuration(callDuration)}` },
      ended: { color: 'default', text: `Вызов: завершен ${formatDuration(callDuration)}` },
      failed: { color: 'error', text: 'Вызов: ошибка' },
      'provider-originated': { color: 'blue', text: 'Вызов: отправлен провайдеру' },
    };
    return map[callStatus] || map.idle;
  }, [callDuration, callStatus]);

  const closeAndReset = () => {
    if (callStatus === 'calling' || callStatus === 'connected') {
      sipClient.hangup();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallStatus('idle');
    setMuted(false);
    setCallDuration(0);
    setMinimized(false);
    autoCallHandledRef.current = '';
    callTokenRef.current = null;
    onClose?.();
  };

  const clampWindowPosition = (nextX, nextY) => {
    if (typeof window === 'undefined') return { x: nextX, y: nextY };
    const width = minimized ? 320 : 420;
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

  useEffect(() => () => stopDragging(), []);

  const useNumberFromTab = (value) => {
    const next = sanitizeDialInput(value);
    if (!next) return;
    setDialNumber(next);
    setActiveTab('dialer');
  };

  const dialerTabContent = (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Input
        value={dialNumber}
        onChange={(e) => setDialNumber(sanitizeDialInput(e.target.value))}
        onPressEnter={() => {
          if (canStartCall) {
            handleCall();
          }
        }}
        placeholder="Введите номер"
        prefix={<PhoneOutlined />}
        disabled={callStatus === 'connected'}
        status={dialNumber && !dialValidation.isValid ? 'error' : ''}
        suffix={
          <Space size={2}>
            <Tooltip title="Удалить символ">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={backspaceDial}
                disabled={!dialNumber || callStatus === 'connected'}
              />
            </Tooltip>
          </Space>
        }
      />

      <Row gutter={[8, 8]}>
        {DTMF_KEYS.map((digit) => (
          <Col key={digit} span={8}>
            <Button block size="large" onClick={() => appendDial(digit)}>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{digit}</span>
                <span style={{ fontSize: 10, color: token.colorTextSecondary }}>{DTMF_HINTS[digit] || ' '}</span>
              </div>
            </Button>
          </Col>
        ))}
        <Col span={8}>
          <Button block onClick={loadBackendTelephony} icon={<ReloadOutlined />} />
        </Col>
        <Col span={8}>
          <Button block onClick={() => appendDial('+')}>+</Button>
        </Col>
        <Col span={8}>
          <Button block onClick={clearDial}>C</Button>
        </Col>
      </Row>

      <Row gutter={8}>
        <Col span={6}>
          <Tooltip title="Завершить звонок">
            <Button
              danger
              block
              icon={<StopOutlined />}
              disabled={callStatus !== 'calling' && callStatus !== 'connected'}
              onClick={handleHangup}
            />
          </Tooltip>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            block
            icon={<PhoneFilled />}
            disabled={!canStartCall}
            onClick={handleCall}
          >
            {registering ? 'Подключение...' : 'Позвонить'}
          </Button>
        </Col>
        <Col span={6}>
          <Tooltip title={callStatus === 'connected' ? 'Выключить/включить микрофон' : 'Обновить статус'}>
            <Button
              block
              type={muted ? 'primary' : 'default'}
              icon={callStatus === 'connected' ? undefined : <ReloadOutlined />}
              onClick={callStatus === 'connected' ? handleMute : loadBackendTelephony}
            >
              {callStatus === 'connected' ? 'M' : ''}
            </Button>
          </Tooltip>
        </Col>
      </Row>

      <Card size="small">
        <Space size={[8, 8]} wrap>
          <Tag color={transportTag.color}>{transportTag.text}</Tag>
          <Tag color={callTag.color}>{callTag.text}</Tag>
          <Tag>SIP: {sipStatus}</Tag>
          <Tag>{numberLabel !== '-' ? numberLabel : 'extension'}</Tag>
        </Space>
      </Card>

      {dialNumber && !dialValidation.isValid ? (
        <Alert type="error" showIcon message={dialValidation.message} />
      ) : null}
    </Space>
  );

  const logsTabContent = (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Button onClick={loadRecentCalls} icon={<ReloadOutlined />} loading={loadingLogs} block>
        Обновить логи
      </Button>
      {logsError ? <Alert type="error" showIcon message={logsError} /> : null}
      <Card size="small" bodyStyle={{ padding: 0 }}>
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
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
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
            {loadingLogs ? 'Загрузка логов...' : 'Логи звонков пока пустые'}
          </div>
        )}
      </Card>
      <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>
        Нажмите на запись, чтобы подставить номер в набор.
      </span>
    </Space>
  );

  const contactsTabContent = (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Button onClick={loadContactsList} icon={<ReloadOutlined />} loading={loadingContacts} block>
        Обновить контакты
      </Button>
      {contactsError ? <Alert type="error" showIcon message={contactsError} /> : null}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        {contacts.length ? (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {contacts.map((contact, index) => {
              const name = pickContactName(contact);
              const number = pickContactNumber(contact);
              return (
                <div
                  key={String(contact.id || `${name}-${index}`)}
                  style={{
                    padding: '10px 12px',
                    borderBottom: index < contacts.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                    cursor: number ? 'pointer' : 'default',
                    opacity: number ? 1 : 0.75,
                  }}
                  onClick={() => useNumberFromTab(number)}
                >
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <span style={{ fontWeight: 600 }}>{name || 'Без имени'}</span>
                    <span style={{ color: token.colorTextSecondary }}>{number || 'Нет номера'}</span>
                  </Space>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 16, color: token.colorTextSecondary }}>
            {loadingContacts ? 'Загрузка контактов...' : 'Контакты не найдены'}
          </div>
        )}
      </Card>
      <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>
        Нажмите на контакт, чтобы подставить номер в набор.
      </span>
    </Space>
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
            zIndex: 1060,
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
                Телефонная звонилка
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
      title={(
        <div
          onMouseDown={startDragging}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'move',
            gap: 8,
            width: '100%',
            paddingRight: 4,
          }}
        >
          <Space size={8}>
            <ArrowsAltOutlined style={{ color: token.colorTextSecondary }} />
            <span>Телефонная звонилка</span>
          </Space>
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
      width={420}
      centered={false}
      mask={false}
      style={{ left: windowPosition.x, top: windowPosition.y, margin: 0, paddingBottom: 0, position: 'fixed' }}
      destroyOnHidden
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'dialer', label: 'Набор' },
            { key: 'logs', label: 'Логи' },
            { key: 'contacts', label: 'Контакты' },
          ]}
        />
        {activeTab === 'dialer' ? dialerTabContent : null}
        {activeTab === 'logs' ? logsTabContent : null}
        {activeTab === 'contacts' ? contactsTabContent : null}

        <div style={{ display: 'none' }}>
          <audio ref={audioRef} autoPlay />
        </div>
      </Space>
    </Modal>
  );
}
