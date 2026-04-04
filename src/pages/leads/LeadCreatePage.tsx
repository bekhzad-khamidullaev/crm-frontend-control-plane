import { LeadForm } from '@/widgets/lead-form';
import { Space } from 'antd';
import React from 'react';

export const LeadCreatePage: React.FC = () => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <LeadForm />
    </Space>
  );
};

export default LeadCreatePage;
