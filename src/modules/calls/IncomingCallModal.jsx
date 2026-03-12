import React, { useEffect, useState } from 'react';
import { Mail, Phone, PhoneCall, User, X } from 'lucide-react';

import { Alert, Avatar, Badge, Button, Modal, Skeleton, Space, Typography } from 'antd';

import { api } from '../../lib/api/client.js';
import sipClient from '../../lib/telephony/SIPClient.js';

const { Text, Title } = Typography;

function IncomingCallModal({ visible, callData, onAnswer, onReject }) {
  const [searchingContact, setSearchingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    if (visible && callData?.phoneNumber) {
      searchContactByPhone(callData.phoneNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, callData]);

  const searchContactByPhone = async (phoneNumber) => {
    setSearchingContact(true);
    setContactInfo(null);
    try {
      const response = await api.get('/api/contacts/', { params: { search: phoneNumber } });
      if (response.data.results && response.data.results.length > 0) {
        setContactInfo({ type: 'contact', data: response.data.results[0] });
        return;
      }

      const leadsResponse = await api.get('/api/leads/', { params: { search: phoneNumber } });
      if (leadsResponse.data.results && leadsResponse.data.results.length > 0) {
        setContactInfo({ type: 'lead', data: leadsResponse.data.results[0] });
      }
    } catch (error) {
      console.error('Error searching contact:', error);
    } finally {
      setSearchingContact(false);
    }
  };

  const handleAnswer = () => {
    onAnswer?.(callData);
    const audioElement = document.getElementById('incoming-call-audio');
    if (audioElement) {
      sipClient.answerCall(audioElement);
    }
  };

  const handleReject = () => {
    onReject?.(callData);
    sipClient.rejectCall();
  };

  if (!callData) return null;

  return (
    <Modal open={visible} footer={null} closable={false} centered>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space>
          <PhoneCall size={20} />
          <Title level={4} style={{ margin: 0 }}>Входящий звонок</Title>
        </Space>

        {searchingContact ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Space>
        ) : contactInfo ? (
          <Space direction="vertical" size={8}>
            <Space>
              <Avatar icon={<User size={16} />} />
              <Space direction="vertical" size={0}>
                <Text strong>{contactInfo.data.first_name} {contactInfo.data.last_name}</Text>
                <Badge color={contactInfo.type === 'contact' ? 'blue' : 'purple'} text={contactInfo.type === 'contact' ? 'Контакт' : 'Лид'} />
              </Space>
            </Space>
            {contactInfo.data.company ? <Text type="secondary">{contactInfo.data.company}</Text> : null}
            {contactInfo.data.email ? (
              <Text>
                <Mail size={14} /> {contactInfo.data.email}
              </Text>
            ) : null}
          </Space>
        ) : (
          <Space direction="vertical" size={8}>
            <Space>
              <Avatar icon={<User size={16} />} />
              <Text strong>{callData.callerName || 'Неизвестный номер'}</Text>
            </Space>
            <Alert type="warning" message="Контакт не найден в CRM" showIcon />
          </Space>
        )}

        <Text strong>
          <Phone size={14} /> {callData.phoneNumber}
        </Text>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button danger icon={<X size={14} />} onClick={handleReject}>Отклонить</Button>
          <Button type="primary" icon={<Phone size={14} />} onClick={handleAnswer}>Ответить</Button>
        </Space>

        <audio id="incoming-call-audio" autoPlay />
      </Space>
    </Modal>
  );
}

export default IncomingCallModal;
