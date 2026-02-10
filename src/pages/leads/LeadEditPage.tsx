import React from 'react';
import { LeadForm } from '@/widgets/lead-form';

interface LeadEditPageProps {
  id?: number;
}

export const LeadEditPage: React.FC<LeadEditPageProps> = ({ id }) => {
  return <LeadForm id={id} />;
};
