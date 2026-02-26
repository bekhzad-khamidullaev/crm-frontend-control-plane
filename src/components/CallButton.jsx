import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Space, Typography, App, Input, Select, Badge, Tooltip } from 'antd';
import { PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined, AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import { createCallLog, updateCallLog, uploadRecording } from '../lib/api/calls.js';
import sipClient from '../lib/telephony/SIPClient.js';
import { getProfile } from '../lib/api/user.js';
import { setActiveCall, clearActiveCall, addCallToHistory } from '../lib/store/index.js';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function CallButton({ phone, name, entityType, entityId, size = 'middle', type = 'default', icon = true, mode = 'browser' }) {
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, completed
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callLogId, setCallLogId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const ensureSipRegistration = async () => {
    if (sipClient.isRegistered) return true;

    const profile = await getProfile().catch(() => null);
    const sipUri = profile?.jssip_sip_uri || '';
    const sipUserFromUri = sipUri.startsWith('sip:') ? sipUri.split(':')[1]?.split('@')[0] : '';
    const sipRealmFromUri = sipUri.includes('@') ? sipUri.split('@')[1] : '';
    const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};

    const username = sipUserFromUri || profile?.pbx_number || import.meta.env.VITE_SIP_USERNAME;
    const realm = sipRealmFromUri || import.meta.env.VITE_SIP_REALM || 'pbx.windevs.uz';
    const password = profile?.jssip_sip_password || import.meta.env.VITE_SIP_PASSWORD;
    const websocketProxyUrl =
      profile?.jssip_ws_uri || import.meta.env.VITE_SIP_SERVER || runtimeConfig.pbxServer || '';
    const displayName =
      profile?.jssip_display_name || profile?.full_name || import.meta.env.VITE_SIP_DISPLAY_NAME || 'CRM User';

    if (!username || !password || !websocketProxyUrl) {
      throw new Error('SIP credentials are not configured');
    }

    sipClient.configure({
      realm,
      impi: username,
      impu: `sip:${username}@${realm}`,
      password,
      display_name: displayName,
      websocket_proxy_url: websocketProxyUrl,
    });

    await sipClient.init();
    await sipClient.register(username, password);
    return true;
  };

  // Setup event listeners for SIP client
  useEffect(() => {
    const handleCallStarted = async (callData) => {
      console.log('[CallButton] Call started:', callData);
      setCallStatus('calling');
      
      // Create call log in CRM
      try {
        const logData = {
          phone_number: callData.phoneNumber,
          direction: callData.direction,
          status: 'initiated',
          started_at: callData.startedAt,
        };
        
        if (entityType === 'lead' && entityId) {
          logData.related_lead = entityId;
        } else if (entityType === 'contact' && entityId) {
          logData.related_contact = entityId;
        }
        
        const response = await createCallLog(logData);
        setCallLogId(response.id);
        
        // Update SIP client with call log ID
        sipClient.updateCurrentCallMetadata({ id: response.id });
        
        // Set active call in store
        setActiveCall({
          id: response.id,
          phoneNumber: callData.phoneNumber,
          direction: callData.direction,
          status: 'initiated',
          entityType,
          entityId,
          name,
        });
      } catch (error) {
        console.error('[CallButton] Error creating call log:', error);
      }
    };

    const handleCallAnswered = (callData) => {
      console.log('[CallButton] Call answered:', callData);
      setCallStatus('connected');
      startTimer();
      
      // Update call log
      if (callLogId) {
        updateCallLog(callLogId, {
          status: 'connected',
          answered_at: callData.answeredAt
        }).catch(console.error);
      }
    };

    const handleCallEnded = async (callData) => {
      console.log('[CallButton] Call ended:', callData);
      stopTimer();
      setCallDuration(callData.duration);
      setCallStatus('completed');
      
      // Clear active call from store
      clearActiveCall();
      
      // Update call log with final data
      if (callLogId || callData.id) {
        try {
          const updatedCall = await updateCallLog(callLogId || callData.id, {
            status: 'completed',
            ended_at: callData.endedAt,
            duration: callData.duration,
            notes: callNotes
          });
          
          // Add to call history in store
          addCallToHistory(updatedCall);
        } catch (error) {
          console.error('[CallButton] Error updating call log:', error);
        }
      }
    };

    const handleRecordingStarted = () => {
      setIsRecording(true);
      message.success('Запись начата');
    };

    const handleRecordingStopped = (data) => {
      setIsRecording(false);
      setRecordingBlob(data.blob);
      message.info('Запись остановлена');
    };

    sipClient.on('callStarted', handleCallStarted);
    sipClient.on('callAnswered', handleCallAnswered);
    sipClient.on('callEnded', handleCallEnded);
    sipClient.on('recordingStarted', handleRecordingStarted);
    sipClient.on('recordingStopped', handleRecordingStopped);

    return () => {
      sipClient.off('callStarted', handleCallStarted);
      sipClient.off('callAnswered', handleCallAnswered);
      sipClient.off('callEnded', handleCallEnded);
      sipClient.off('recordingStarted', handleRecordingStarted);
      sipClient.off('recordingStopped', handleRecordingStopped);
    };
  }, [callLogId, callNotes, entityType, entityId]);

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
          await ensureSipRegistration();
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
      
      // Create call log for mobile
      try {
        const logData = {
          phone_number: phone,
          direction: 'outbound',
          status: 'initiated',
          started_at: new Date().toISOString(),
        };
        
        if (entityType === 'lead' && entityId) {
          logData.related_lead = entityId;
        } else if (entityType === 'contact' && entityId) {
          logData.related_contact = entityId;
        }
        
        const response = await createCallLog(logData);
        setCallLogId(response.id);
      } catch (error) {
        console.error('[CallButton] Error creating call log:', error);
      }
      
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

  const toggleRecording = () => {
    if (isRecording) {
      sipClient.stopRecording();
    } else {
      const started = sipClient.startRecording();
      if (!started) {
        message.error('Не удалось начать запись');
      }
    }
  };

  const endCall = async () => {
    stopTimer();
    
    // Stop recording if active
    if (isRecording) {
      sipClient.stopRecording();
    }
    
    if (mode === 'browser' && sipClient.callSession) {
      // Hangup WebRTC call
      sipClient.hangup();
    }
    
    setCallStatus('completed');
    
    // Update call log with notes and outcome
    if (callLogId) {
      try {
        await updateCallLog(callLogId, {
          status: callOutcome || 'completed',
          notes: callNotes,
          duration: callDuration,
          ended_at: new Date().toISOString()
        });
        
        // Upload recording if available
        if (recordingBlob) {
          try {
            await uploadRecording(callLogId, recordingBlob);
            message.success('Звонок и запись сохранены');
          } catch (error) {
            console.error('[CallButton] Error uploading recording:', error);
            message.warning('Звонок сохранен, но запись не удалось загрузить');
          }
        } else {
          message.success('Звонок завершен и сохранен');
        }
      } catch (error) {
        console.error('[CallButton] Error saving call log:', error);
        message.error('Ошибка при сохранении звонка');
      }
    }
    
    // Clear recording data
    sipClient.clearRecording();
    setRecordingBlob(null);
  };

  const closeModal = () => {
    stopTimer();
    
    // Stop recording if active
    if (isRecording) {
      sipClient.stopRecording();
    }
    
    setModalVisible(false);
    setCallStatus('idle');
    setCallDuration(0);
    setCallNotes('');
    setCallOutcome('');
    setCallLogId(null);
    setIsRecording(false);
    setRecordingBlob(null);
    sipClient.clearRecording();
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
              
              {/* Recording indicator */}
              {mode === 'browser' && (
                <div style={{ marginTop: 16 }}>
                  <Tooltip title={isRecording ? 'Остановить запись' : 'Начать запись'}>
                    <Badge dot={isRecording} color="red">
                      <Button
                        type={isRecording ? 'primary' : 'default'}
                        danger={isRecording}
                        icon={isRecording ? <AudioOutlined /> : <AudioMutedOutlined />}
                        onClick={toggleRecording}
                      >
                        {isRecording ? 'Запись...' : 'Записать'}
                      </Button>
                    </Badge>
                  </Tooltip>
                </div>
              )}
            </div>

            <Select
              placeholder="Результат звонка"
              style={{ width: '100%' }}
              value={callOutcome}
              onChange={setCallOutcome}
            >
              <Option value="successful">Успешный разговор</Option>
              <Option value="no_answer">Не ответил</Option>
              <Option value="busy">Занято</Option>
              <Option value="voicemail">Голосовая почта</Option>
              <Option value="wrong_number">Неверный номер</Option>
              <Option value="callback">Перезвонить позже</Option>
            </Select>

            <TextArea
              placeholder="Заметки о звонке..."
              rows={4}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />

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
