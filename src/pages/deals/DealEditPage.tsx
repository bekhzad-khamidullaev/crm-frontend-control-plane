import { DealForm } from '@/widgets/deal-form';
import React from 'react';

interface DealEditPageProps {
  id?: number | string;
}

export const DealEditPage: React.FC<DealEditPageProps> = ({ id }) => {
  const dealId = id ? Number(id) : undefined;
  return <DealForm id={dealId} />;
};

export default DealEditPage;
