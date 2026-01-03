import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Space, Typography, App } from 'antd';
import { PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import sipClient from '../lib/telephony/SIPClient.js';
import { setActiveCall, clearActiveCall, addCallToHistory } from '../lib/store/index.js';

const { Text, Title } = Typography;

function CallButton({ phone, name, entityType, entityId, size = 'middle', type = 'default', icon = true, mode = 'browser' }) {
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, completed
  const [callDuration, setCallDuration] = useState(0);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Setup event listeners for SIP client
  useEffect(() => {
    const handleCallStarted = async (callData) => {
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
      console.log('[CallButton] Call answered:', callData);
      setCallStatus('connected');
      startTimer();
    };

    const handleCallEnded = async (callData) => {
      console.log('[CallButton] Call ended:', callData);
      stopTimer();
      setCallDuration(callData.duration);
      setCallStatus('completed');
      
      // Clear active call from store
      clearActiveCall();

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
  }, [entityType, entityId, name]);

  const handleCall = () => {
    if (!phone) {
      message.error('Номер телефона не указан');
      return;
    }
    setModalVisible(true);
    setCallStatus('idle');
  };

  const startCall = async () => {
    setCallStatus('calling');
    
    if (mode === 'browser') {
      // WebRTC call via SIP
      try {
        if (!sipClient.isRegistered) {
          message.error('SIP клиент не подключен. Попробуйте перезагрузить страницу.');
          setCallStatus('idle');
          return;
        }

        const audioElement = audioRef.current;
        await sipClient.call(phone, audioElement, {
          relatedEntity: entityType,
          relatedEntityId: entityId,
          contactName: name
        });
      } catch (error) {
        console.error('[CallButton] Error starting call:', error);
        message.error('Ошибка при звонке: ' + error.message);
        setCallStatus('idle');
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
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderModalContent = () => {
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
              icon={<PhoneOutlined />}
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
              <Title level={4} style={{ marginTop: 8 }}>
                {name}
              </Title>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 'bold', 
                color: '#52c41a',
                marginTop: 8 
              }}>
                <ClockCircleOutlined /> {formatDuration(callDuration)}
              </div>
            </div>

            <Button
              type="primary"
              danger
              size="large"
              block
              onClick={endCall}
              style={{ height: 48 }}
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
        icon={icon ? <PhoneOutlined /> : null}
        onClick={handleCall}
      >
        {icon ? 'Позвонить' : phone}
      </Button>

      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={400}
        centered
      >
        {renderModalContent()}
        {/* Audio element for WebRTC */}
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </Modal>
    </>
  );
}

export default CallButton;
