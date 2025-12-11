/**
 * IncomingCallModal
 * Modal to handle incoming calls via WebSocket notifications
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Avatar, Tag, Spin, Alert, Descriptions } from 'antd';
import { PhoneOutlined, CloseOutlined, UserOutlined, PhoneFilled, MailOutlined } from '@ant-design/icons';
import sipClient from '../../lib/telephony/SIPClient.js';
import { api as apiClient } from '../../lib/api/client.js';

const { Title, Text } = Typography;

function IncomingCallModal({ visible, callData, onAnswer, onReject }) {
  const [searchingContact, setSearchingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    if (visible && callData?.phoneNumber) {
      searchContactByPhone(callData.phoneNumber);
    }
  }, [visible, callData]);

  const searchContactByPhone = async (phoneNumber) => {
    setSearchingContact(true);
    try {
      // Search in contacts
      const response = await apiClient.get('/api/contacts/', {
        params: { search: phoneNumber }
      });

      if (response.data.results && response.data.results.length > 0) {
        setContactInfo({
          type: 'contact',
          data: response.data.results[0],
        });
        return;
      }

      // Search in leads
      const leadsResponse = await apiClient.get('/api/leads/', {
        params: { search: phoneNumber }
      });

      if (leadsResponse.data.results && leadsResponse.data.results.length > 0) {
        setContactInfo({
          type: 'lead',
          data: leadsResponse.data.results[0],
        });
      }
    } catch (error) {
      console.error('Error searching contact:', error);
    } finally {
      setSearchingContact(false);
    }
  };

  const handleAnswer = () => {
    if (onAnswer) {
      onAnswer(callData);
    }
    // The actual SIP answer logic would be handled by SIPClient
    const audioElement = document.getElementById('incoming-call-audio');
    if (audioElement) {
      sipClient.answerCall(audioElement);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(callData);
    }
    sipClient.rejectCall();
  };

  if (!callData) return null;

  return (
    <Modal
      open={visible}
      onCancel={handleReject}
      footer={null}
      closable={false}
      width={500}
      centered
      maskClosable={false}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* Animated phone icon */}
        <div style={{ marginBottom: 20 }}>
          <Avatar
            size={80}
            icon={<PhoneFilled />}
            style={{
              backgroundColor: '#52c41a',
              animation: 'pulse 1.5s infinite',
            }}
          />
        </div>

        <Title level={3}>Входящий звонок</Title>

        {/* Caller information */}
        {searchingContact ? (
          <Spin tip="Поиск контакта..." spinning={true}>
            <div style={{ minHeight: '80px' }}></div>
          </Spin>
        ) : contactInfo ? (
          <div style={{ marginBottom: 20 }}>
            <Space direction="vertical" size="small">
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>
                {contactInfo.data.first_name} {contactInfo.data.last_name}
              </Title>
              <Tag color={contactInfo.type === 'contact' ? 'blue' : 'green'}>
                {contactInfo.type === 'contact' ? 'Контакт' : 'Лид'}
              </Tag>
              {contactInfo.data.company && (
                <Text type="secondary">{contactInfo.data.company}</Text>
              )}
              {contactInfo.data.email && (
                <Text type="secondary">
                  <MailOutlined /> {contactInfo.data.email}
                </Text>
              )}
            </Space>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#8c8c8c' }} />
            <Title level={4} style={{ margin: '8px 0' }}>
              {callData.callerName || 'Неизвестный номер'}
            </Title>
            <Alert
              message="Контакт не найден в CRM"
              type="info"
              showIcon
              style={{ marginTop: 12, textAlign: 'left' }}
            />
          </div>
        )}

        {/* Phone number */}
        <div style={{ marginBottom: 20 }}>
          <PhoneOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <Text strong style={{ fontSize: 18 }}>
            {callData.phoneNumber}
          </Text>
        </div>

        {/* Action buttons */}
        <Space size="large" style={{ marginTop: 20 }}>
          <Button
            type="primary"
            danger
            size="large"
            icon={<CloseOutlined />}
            onClick={handleReject}
            style={{ width: 140, height: 56 }}
          >
            Отклонить
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PhoneOutlined />}
            onClick={handleAnswer}
            style={{ width: 140, height: 56, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Ответить
          </Button>
        </Space>

        {/* Hidden audio element for incoming call */}
        <audio id="incoming-call-audio" autoPlay style={{ display: 'none' }} />
      </div>

      {/* CSS animation for pulse effect */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
        `}
      </style>
    </Modal>
  );
}

export default IncomingCallModal;
