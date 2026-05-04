import { LeadForm } from '@/widgets/lead-form';
import React from 'react';

interface LeadEditPageProps {
  id?: number;
}

export const LeadEditPage: React.FC<LeadEditPageProps> = ({ id }) => {
  return <LeadForm id={id} />;
};

export default LeadEditPage;
