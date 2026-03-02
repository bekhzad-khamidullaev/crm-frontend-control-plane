import {
  AudioMutedOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PhoneFilled,
  PhoneOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { App, Badge, Button, Col, Divider, Input, Modal, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initiateCall } from '../lib/api/telephony.js';
import sipClient from '../lib/telephony/SIPClient.js';
import { loadTelephonyRuntimeConfig } from '../lib/telephony/runtimeConfig.js';

const { Text } = Typography;

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

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

  const mode = String(routeMode || 'auto').toLowerCase();
  const sipDial = normalizeDialForSip(value);
  const providerDial = normalizeProviderDial(value).replace(/^\+/, '');

  if (mode === 'internal') {
    if (value.includes('+')) {
      return {
        isValid: false,
        message: 'Для внутреннего режима используйте короткий внутренний номер без "+"',
        sipDial,
        providerDial,
      };
    }
    if (!isLikelyInternalExtension(sipDial)) {
      return {
        isValid: false,
        message: 'Внутренний номер должен содержать от 2 до 6 цифр',
        sipDial,
        providerDial,
      };
    }
    return { isValid: true, message: '', sipDial, providerDial };
  }

  if (hasStarHash) {
    return {
      isValid: false,
      message: 'Символы * и # разрешены только для DTMF во время активного звонка',
      sipDial,
      providerDial,
    };
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

export default function TelephonyDialerModal({ visible, onClose, initialNumber = '' }) {
  const { message } = App.useApp();
  const [dialNumber, setDialNumber] = useState(String(initialNumber || ''));
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [sipStatus, setSipStatus] = useState(sipClient.isRegistered ? 'registered' : 'offline');
  const [numberStatus, setNumberStatus] = useState('unknown');
  const [numberLabel, setNumberLabel] = useState('-');
  const [routeMode, setRouteMode] = useState('auto');
  const [provider, setProvider] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transportStatus, setTransportStatus] = useState(sipClient.ua ? 'connected' : 'disconnected');

  const runtimeRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const callTokenRef = useRef(null);
  const dialNumberRef = useRef(String(initialNumber || ''));

  useEffect(() => {
    setDialNumber(String(initialNumber || ''));
    dialNumberRef.current = String(initialNumber || '');
  }, [initialNumber]);

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
      setOnHold(false);
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
      setOnHold(false);
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
      setRouteMode(runtime?.sipConfig?.routeMode || 'auto');
      setProvider(runtime?.sipConfig?.provider || '');

      const activeNumber = String(runtime?.sipConfig?.phoneNumber || '').trim();
      setNumberLabel(activeNumber || '-');
      setNumberStatus(activeNumber ? 'active' : 'missing');

      setSipStatus(sipClient.isRegistered ? 'registered' : runtime?.sipReady ? 'ready' : 'missing-config');
      setTransportStatus(sipClient.ua ? 'connected' : 'disconnected');
      return runtime;
    } catch (error) {
      runtimeRef.current = null;
      setSipStatus('error');
      setNumberStatus('error');
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

    const mode = runtime?.sipConfig?.routeMode || 'auto';
    if (mode === 'internal' && !isLikelyInternalExtension(dial)) {
      throw new Error('Для режима internal доступен только внутренний короткий номер');
    }
    if (mode === 'external' && isLikelyInternalExtension(dial)) {
      throw new Error('Для режима external используйте внешний номер');
    }

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
      const mode = runtime?.sipConfig?.routeMode || 'auto';

      if (mode === 'provider' || mode === 'asterisk') {
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

  const handleHold = () => {
    const next = sipClient.toggleHold();
    setOnHold(next);
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

  const sipTag = useMemo(() => {
    const map = {
      registered: { color: 'success', text: 'SIP: зарегистрирован' },
      ready: { color: 'processing', text: 'SIP: готов к регистрации' },
      connecting: { color: 'processing', text: 'SIP: подключение...' },
      offline: { color: 'default', text: 'SIP: оффлайн' },
      'missing-config': { color: 'warning', text: 'SIP: нет backend-конфига' },
      error: { color: 'error', text: 'SIP: ошибка' },
    };
    return map[sipStatus] || map.offline;
  }, [sipStatus]);

  const numberTag = useMemo(() => {
    const map = {
      active: { color: 'success', text: `Номер: ${numberLabel}` },
      missing: { color: 'warning', text: 'Номер: не настроен в backend' },
      unknown: { color: 'default', text: 'Номер: неизвестно' },
      error: { color: 'error', text: 'Номер: ошибка загрузки' },
    };
    return map[numberStatus] || map.unknown;
  }, [numberLabel, numberStatus]);

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
    setOnHold(false);
    setCallDuration(0);
    callTokenRef.current = null;
    onClose?.();
  };

  return (
    <Modal
      title="Звонилка (JsSIP)"
      open={visible}
      onCancel={closeAndReset}
      footer={null}
      width={430}
      destroyOnClose
      centered
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          <Tag color={transportTag.color}>{transportTag.text}</Tag>
          <Tag color={sipTag.color}>{sipTag.text}</Tag>
          <Tag color={numberTag.color}>{numberTag.text}</Tag>
          <Tag color={callTag.color}>{callTag.text}</Tag>
          <Tag color="blue">Маршрут: {routeMode}</Tag>
          {provider ? <Tag color="purple">Провайдер: {provider}</Tag> : null}
        </Space>

        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space size="large" wrap>
            <Badge status={transportTag.color === 'success' ? 'success' : transportTag.color === 'processing' ? 'processing' : 'default'} text={transportTag.text} />
            <Badge status={sipTag.color === 'success' ? 'success' : sipTag.color === 'processing' ? 'processing' : sipTag.color === 'error' ? 'error' : 'default'} text={sipTag.text} />
          </Space>
          <Space size="large" wrap>
            <Badge status={numberTag.color === 'success' ? 'success' : numberTag.color === 'error' ? 'error' : 'warning'} text={numberTag.text} />
            <Badge status={callTag.color === 'success' ? 'success' : callTag.color === 'processing' ? 'processing' : callTag.color === 'error' ? 'error' : 'default'} text={callTag.text} />
          </Space>
        </Space>

        <Input
          value={dialNumber}
          onChange={(e) => setDialNumber(sanitizeDialInput(e.target.value))}
          placeholder="Введите номер"
          prefix={<PhoneOutlined />}
          size="large"
          disabled={callStatus === 'connected'}
          status={dialNumber && !dialValidation.isValid ? 'error' : ''}
          suffix={
            <Space size={2}>
              <Tooltip title="Удалить символ">
                <Button type="text" icon={<DeleteOutlined />} onClick={backspaceDial} disabled={!dialNumber || callStatus === 'connected'} />
              </Tooltip>
              <Tooltip title="Очистить поле">
                <Button type="text" icon={<CloseCircleOutlined />} onClick={clearDial} disabled={!dialNumber || callStatus === 'connected'} />
              </Tooltip>
              <Tooltip title="Обновить статусы телефонии">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  loading={loadingConfig}
                  onClick={loadBackendTelephony}
                />
              </Tooltip>
            </Space>
          }
        />
        {dialNumber && !dialValidation.isValid ? (
          <Text type="danger">
            <InfoCircleOutlined /> {dialValidation.message}
          </Text>
        ) : (
          <Text type="secondary">
            <CheckCircleOutlined /> Готовый набор: {dialValidation.sipDial || '-'}
          </Text>
        )}

        <Row gutter={[8, 8]}>
          {DTMF_KEYS.map((digit) => (
            <Col span={8} key={digit}>
              <Button block size="large" onClick={() => appendDial(digit)}>
                {digit}
              </Button>
            </Col>
          ))}
        </Row>

        <Divider style={{ margin: '8px 0' }} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            icon={<PhoneFilled />}
            loading={registering}
            disabled={!canStartCall}
            onClick={handleCall}
          >
            Позвонить
          </Button>

          <Button
            danger
            icon={<StopOutlined />}
            disabled={callStatus !== 'calling' && callStatus !== 'connected'}
            onClick={handleHangup}
          >
            Завершить
          </Button>

          <Button
            icon={muted ? <AudioMutedOutlined /> : <AudioOutlined />}
            disabled={callStatus !== 'connected'}
            onClick={handleMute}
          >
            {muted ? 'Без звука' : 'Микрофон'}
          </Button>

          <Button
            icon={onHold ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            disabled={callStatus !== 'connected'}
            onClick={handleHold}
          >
            {onHold ? 'Снять hold' : 'Hold'}
          </Button>
        </Space>

        <Text type="secondary">Статус звонка: {callTag.text}</Text>

        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </Space>
    </Modal>
  );
}
