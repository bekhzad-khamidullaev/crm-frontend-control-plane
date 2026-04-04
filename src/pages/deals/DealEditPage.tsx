import { DealForm } from '@/widgets/deal-form';
import { Space } from 'antd';
import React from 'react';

interface DealEditPageProps {
  id?: number | string;
}

export const DealEditPage: React.FC<DealEditPageProps> = ({ id }) => {
  const dealId = id ? Number(id) : undefined;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <DealForm id={dealId} />
    </Space>
  );
};

export default DealEditPage;
