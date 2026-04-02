/**
 * ClickToCall Component
 * Click on phone number to initiate call
 * Rewritten to use only Ant Design components
 */

import React, { useState } from 'react';
import { Button, App } from 'antd';
import { requestDialerOpen } from '../shared/ui/telephonyDialer.js';
import ChannelBrandIcon from '../channel/ChannelBrandIcon.jsx';

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
      requestDialerOpen({ number: phoneNumber, autoCall: true });
    } catch (error) {
      console.error('Error opening dialer:', error);
      message.error('Ошибка запуска встроенной звонилки');
    } finally {
      setCalling(false);
    }
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <Button
      type={type === 'link' ? 'link' : 'default'}
      size={size}
      loading={calling}
      icon={showIcon ? <ChannelBrandIcon channel="telephony" size={14} /> : null}
      style={{ padding: type === 'link' ? 0 : undefined }}
      onClick={handleCall}
    >
      {phoneNumber}
    </Button>
  );
}
