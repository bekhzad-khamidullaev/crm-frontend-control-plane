/**
 * ClickToCall Component
 * Click on phone number to initiate call
 */

import React, { useState } from 'react';
import { Button, Dropdown, App, Modal } from 'antd';
import { PhoneOutlined, CopyOutlined, MessageOutlined } from '@ant-design/icons';
import { initiateCall } from '../lib/api/telephony';
import SendSMSModal from './SendSMSModal';

export default function ClickToCall({ 
  phoneNumber, 
  contactName = '',
  contactId = null,
  entityType = 'contact',
  size = 'small',
  type = 'link',
  showIcon = true,
}) {
  const { message } = App.useApp();
  const [calling, setCalling] = useState(false);

  const handleCall = async () => {
    if (!phoneNumber) {
      message.error('Номер телефона не указан');
      return;
    }

    setCalling(true);
    try {
      await initiateCall({
        phone_number: phoneNumber,
        contact_name: contactName,
        entity_type: entityType,
        entity_id: contactId,
      });
      
      message.success(`Звонок на ${phoneNumber} инициирован`);
    } catch (error) {
      console.error('Error initiating call:', error);
      message.error('Ошибка инициации звонка');
    } finally {
      setCalling(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber);
    message.success('Номер скопирован');
  };

  const [smsModalVisible, setSmsModalVisible] = useState(false);

  const handleSMS = () => {
    setSmsModalVisible(true);
  };

  const menuItems = [
    {
      key: 'call',
      icon: <PhoneOutlined />,
      label: 'Позвонить',
      onClick: handleCall,
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Скопировать номер',
      onClick: handleCopy,
    },
    {
      key: 'sms',
      icon: <MessageOutlined />,
      label: 'Отправить SMS',
      onClick: handleSMS,
    },
  ];

  if (!phoneNumber) {
    return null;
  }

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <Button
          type={type}
          size={size}
          icon={showIcon ? <PhoneOutlined /> : null}
          loading={calling}
          style={{ padding: type === 'link' ? 0 : undefined }}
        >
          {phoneNumber}
        </Button>
      </Dropdown>

      <SendSMSModal
        visible={smsModalVisible}
        onClose={() => setSmsModalVisible(false)}
        phoneNumber={phoneNumber}
        contactName={contactName}
        entityType={entityType}
        entityId={contactId}
      />
    </>
  );
}
