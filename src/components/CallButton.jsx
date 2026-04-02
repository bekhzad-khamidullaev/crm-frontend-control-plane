import { CheckCircleOutlined, ClockCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import { App, Button, Descriptions, Divider, Modal, Space, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { initiateCall } from '../lib/api/telephony.js';
import { addCallToHistory, clearActiveCall, setActiveCall } from '../lib/store/index.js';
import { navigate } from '../router.js';
import sipClient from '../lib/telephony/SIPClient.js';
import { loadTelephonyRuntimeConfig } from '../lib/telephony/runtimeConfig.js';
import { DEFAULT_TELEPHONY_ROUTE_MODE } from '../lib/telephony/constants.js';
import { TELEPHONY_MODAL_PROPS } from '../shared/ui/telephonyModal.js';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

const { Text, Title } = Typography;

function CallButton({ phone, name, entityType, entityId, size = 'middle', type = 'default', icon = true, mode = 'browser' }) {
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, completed
  const [callDuration, setCallDuration] = useState(0);
  const [connectedCallData, setConnectedCallData] = useState(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const currentCallTokenRef = useRef(null);
  const fallbackAttemptedRef = useRef(false);
  const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '');
  const normalizeDialForSip = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('998') && digits.length >= 12) {
      return digits.slice(-9);
    }
    return digits;
  };
  const isLikelyInternalExtension = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length > 0 && digits.length <= 5;
  };
  const normalizeProvider = (value) => String(value || '').trim();

  const isOwnCall = (callData) => {
    if (!callData || typeof callData !== 'object') return false;

    const token = callData.uiCallToken;
    if (token) {
      return token === currentCallTokenRef.current;
    }

    const callEntityId = callData.relatedEntityId ?? callData.entityId;
    const localEntityId = entityId ?? null;
    if (callEntityId != null && localEntityId != null) {
      return String(callEntityId) === String(localEntityId);
    }

    const callPhone = normalizePhone(callData.phoneNumber || callData.number);
    const localPhone = normalizePhone(phone);
    if (callPhone && localPhone) {
      return callPhone === localPhone;
    }

    const callName = String(callData.contactName || callData.name || '').trim();
    const localName = String(name || '').trim();
    if (callName && localName) {
      return callName === localName;
    }

    return false;
  };

  const startServerOriginateCall = async (runtime) => {
    if (fallbackAttemptedRef.current) return false;
    fallbackAttemptedRef.current = true;

    const fromNumber = String(runtime?.profile?.pbx_number || '').trim();
    const toNumber = normalizePhone(phone).replace(/^\+/, '');
    const provider = normalizeProvider(runtime?.sipConfig?.provider);
    if (!toNumber) return false;

    await initiateCall({
      to_number: toNumber,
      from_number: fromNumber || undefined,
      contact_id: entityType === 'contact' ? entityId : undefined,
      lead_id: entityType === 'lead' ? entityId : undefined,
      provider: provider || undefined,
    });

    message.success(`Звонок отправлен через сервер телефонии${provider ? ` (${provider})` : ''}`);
    closeModal();
    return true;
  };

  // Setup event listeners for SIP client
  useEffect(() => {
    const handleCallStarted = async (callData) => {
      if (!isOwnCall(callData)) return;
      console.log('[CallButton] Call started:', callData);
      setCallStatus('calling');

      setActiveCall({
        id: callData.id,
        phoneNumber: callData.phoneNumber,
        direction: callData.direction,
        status: 'initiated',
        entityType,
        entityId,
        name,
      });
    };

    const handleCallAnswered = (callData) => {
      if (!isOwnCall(callData)) return;
      console.log('[CallButton] Call answered:', callData);
      setConnectedCallData(callData || null);
      setModalVisible(true);
      setCallStatus('connected');
      startTimer();
    };

    const handleCallEnded = async (callData) => {
      if (!isOwnCall(callData)) return;
      console.log('[CallButton] Call ended:', callData);
      stopTimer();
      clearActiveCall();
      const duration = Number(callData?.duration || 0);
      const failed = callData?.status === 'failed';
      const reason = callData?.reason || callData?.cause || '';

      if (failed) {
        const isNotFound = /not found/i.test(String(reason));
        if (isNotFound) {
          const runtime = await loadTelephonyRuntimeConfig().catch(() => null);
          try {
            const started = await startServerOriginateCall(runtime);
            if (started) return;
          } catch (fallbackError) {
            console.error('[CallButton] Fallback originate failed after SIP Not Found:', fallbackError);
          }
        }
        setCallDuration(0);
        setCallStatus('idle');
        message.error({
          key: `call-error-${currentCallTokenRef.current || 'unknown'}`,
          content: `Звонок не установлен${reason ? `: ${reason}` : ''}`,
        });
        return;
      }

      setCallDuration(duration);
      setCallStatus('completed');
      addCallToHistory(callData);
    };

    sipClient.on('callStarted', handleCallStarted);
    sipClient.on('callAnswered', handleCallAnswered);
    sipClient.on('callEnded', handleCallEnded);

    return () => {
      sipClient.off('callStarted', handleCallStarted);
      sipClient.off('callAnswered', handleCallAnswered);
      sipClient.off('callEnded', handleCallEnded);
    };
  }, [entityType, entityId, name, phone]);

  const handleCall = () => {
    if (!phone) {
      message.error('Номер телефона не указан');
      return;
    }
    fallbackAttemptedRef.current = false;
    setModalVisible(true);
    setCallStatus('idle');
    setConnectedCallData(null);
  };

  const ensureSipReady = async () => {
    if (sipClient.isRegistered) return true;

    const runtime = await loadTelephonyRuntimeConfig().catch(() => null);
    const sip = runtime?.sipConfig;

    if (!sip?.username || !sip?.realm || !sip?.password || !sip?.websocketProxyUrl) {
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
    if (!sipClient.isRegistered) {
      await sipClient.register(sip.username, sip.password);
    }
    return sipClient.isRegistered;
  };

  const startCall = async () => {
    setCallStatus('calling');
    const callToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    currentCallTokenRef.current = callToken;
    fallbackAttemptedRef.current = false;

    if (mode === 'browser') {
      // Route call based on user's telephony settings.
      try {
        const runtime = await loadTelephonyRuntimeConfig().catch(() => null);
        const routeMode = String(runtime?.sipConfig?.routeMode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase();
        if (routeMode === 'bridge') {
          const started = await startServerOriginateCall(runtime);
          if (!started) throw new Error('Не удалось отправить звонок через сервер');
          return;
        }

        const dialNumber = normalizeDialForSip(phone);
        if (!dialNumber) {
          throw new Error('Неверный формат номера');
        }
        if (!sipClient.isRegistered) {
          const registered = await ensureSipReady();
          if (!registered) {
            if (typeof window !== 'undefined' && !window.SIPml) {
              message.error('SIP библиотека не загружена');
            } else {
              message.error('SIP клиент не настроен для пользователя');
            }
            setCallStatus('idle');
            return;
          }
        }

        const audioElement = audioRef.current;
        await sipClient.call(dialNumber, audioElement, {
          uiCallToken: callToken,
          relatedEntity: entityType,
          relatedEntityId: entityId,
          contactName: name
        });
      } catch (error) {
        console.error('[CallButton] Error starting call:', error);
        const reason = String(error?.message || '').trim();
        if (/not found/i.test(reason)) {
          const runtime = await loadTelephonyRuntimeConfig().catch(() => null);
          try {
            const started = await startServerOriginateCall(runtime);
            if (started) return;
          } catch (fallbackError) {
            console.error('[CallButton] Fallback originate failed:', fallbackError);
          }
        }
        message.error({
          key: `call-error-${currentCallTokenRef.current || 'unknown'}`,
          content: 'Ошибка при звонке: ' + reason,
        });
        setCallStatus('idle');
        currentCallTokenRef.current = null;
      }
    } else if (mode === 'mobile') {
      // Mobile tel: link
      window.location.href = `tel:${phone}`;

      // Simulate connection for mobile
      setTimeout(() => {
        setCallStatus('connected');
        startTimer();
      }, 2000);
    } else {
      // Desktop - open external app
      window.open(`tel:${phone}`);
      setCallStatus('idle');
      closeModal();
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const endCall = async () => {
    stopTimer();

    if (mode === 'browser' && sipClient.callSession) {
      // Hangup WebRTC call
      sipClient.hangup();
    }

    setCallStatus('completed');
  };

  const closeModal = () => {
    stopTimer();

    setModalVisible(false);
    setCallStatus('idle');
    setCallDuration(0);
    setConnectedCallData(null);
    currentCallTokenRef.current = null;
    fallbackAttemptedRef.current = false;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderModalContent = () => {
    const entityTypeLabel = entityType === 'lead'
      ? 'Лид'
      : entityType === 'company'
        ? 'Компания'
        : entityType === 'contact'
          ? 'Контакт'
          : 'Клиент';
    const callDirectionLabel = connectedCallData?.direction === 'outbound' ? 'Исходящий' : 'Входящий';

    const handleOpenEntityCard = () => {
      if (!entityType || !entityId) return;
      const path = entityType === 'lead'
        ? `/leads/${entityId}`
        : entityType === 'company'
          ? `/companies/${entityId}`
          : `/contacts/${entityId}`;
      navigate(path);
    };

    switch (callStatus) {
      case 'idle':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Title level={3} style={{ marginTop: 16 }}>
                {name}
              </Title>
              <Text style={{ fontSize: 24, fontWeight: 500 }}>
                {phone}
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              block
              icon={<ChannelBrandIcon channel="telephony" size={16} />}
              onClick={startCall}
              style={{ height: 48 }}
            >
              Позвонить
            </Button>
          </Space>
        );

      case 'calling':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <PhoneOutlined
              spin
              style={{ fontSize: 64, color: '#1890ff' }}
            />
            <div>
              <Title level={4}>{name}</Title>
              <Text type="secondary">Соединение...</Text>
            </div>
          </Space>
        );

      case 'connected':
        return (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>
                {name}
              </Title>
              <Text style={{ fontSize: 22, fontWeight: 500 }}>
                {phone}
              </Text>
              <div style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#52c41a',
                marginTop: 8
              }}>
                <ClockCircleOutlined /> {formatDuration(callDuration)}
              </div>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Статус звонка">
                <Tag color="green">Разговор</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Направление">{callDirectionLabel}</Descriptions.Item>
              <Descriptions.Item label="Тип сущности">{entityTypeLabel}</Descriptions.Item>
              <Descriptions.Item label="ID сущности">{entityId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Номер">{connectedCallData?.phoneNumber || phone || '-'}</Descriptions.Item>
            </Descriptions>

            {entityId ? (
              <Button size="large" block onClick={handleOpenEntityCard}>
                Открыть карточку клиента
              </Button>
            ) : null}

            <Button
              type="primary"
              danger
              size="large"
              block
              onClick={endCall}
              style={{ height: 52, fontWeight: 600 }}
            >
              Завершить звонок
            </Button>
          </Space>
        );

      case 'completed':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <div>
              <Title level={4}>Звонок завершен</Title>
              <Text type="secondary">
                Длительность: {formatDuration(callDuration)}
              </Text>
            </div>
            <Button type="primary" block onClick={closeModal}>
              Закрыть
            </Button>
          </Space>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (callStatus) {
      case 'idle':
        return 'Исходящий звонок';
      case 'calling':
        return 'Соединение...';
      case 'connected':
        return 'Идет разговор';
      case 'completed':
        return 'Звонок завершен';
      default:
        return 'Звонок';
    }
  };

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={icon ? <ChannelBrandIcon channel="telephony" size={14} /> : null}
        onClick={handleCall}
      >
        {icon ? 'Позвонить' : phone}
      </Button>

      <Modal
        {...TELEPHONY_MODAL_PROPS}
        title={getModalTitle()}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={callStatus === 'connected' ? 760 : 400}
      >
        {renderModalContent()}
        {/* Audio element for WebRTC */}
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </Modal>
    </>
  );
}

export default CallButton;
