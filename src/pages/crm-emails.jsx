import React from 'react';
import { Space } from 'antd';
import CommunicationsHub from '../modules/communications/CommunicationsHub.jsx';

export default function CrmEmailsPage() {
  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <CommunicationsHub defaultTab="crm-emails" allowedTabs={['crm-emails']} />
    </Space>
  );
}
