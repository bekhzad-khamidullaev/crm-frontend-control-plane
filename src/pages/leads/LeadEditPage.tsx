import { LeadForm } from '@/widgets/lead-form';
import { Space } from 'antd';
import React from 'react';

interface LeadEditPageProps {
  id?: number;
}

export const LeadEditPage: React.FC<LeadEditPageProps> = ({ id }) => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <LeadForm id={id} />
    </Space>
  );
};

export default LeadEditPage;
