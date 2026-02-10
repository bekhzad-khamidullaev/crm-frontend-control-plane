import React from 'react';
import { DealForm } from '@/widgets/deal-form';

interface DealEditPageProps {
  id?: number | string;
}

export const DealEditPage: React.FC<DealEditPageProps> = ({ id }) => {
  const dealId = id ? Number(id) : undefined;
  return <DealForm id={dealId} />;
};
