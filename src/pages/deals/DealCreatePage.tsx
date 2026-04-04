import { DealForm } from '@/widgets/deal-form';
import { Space } from 'antd';
import React from 'react';

export const DealCreatePage: React.FC = () => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <DealForm />
    </Space>
  );
};

export default DealCreatePage;
