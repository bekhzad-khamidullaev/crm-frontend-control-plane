import { CompanyForm } from '@/widgets/company-form';
import { useCreateCompany } from '@/entities/company/api/mutations';
import { navigate } from '@/router.js';
import React from 'react';

export const CompanyCreatePage: React.FC = () => {
  const createMutation = useCreateCompany();

  const handleSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync(values);
      navigate('/companies');
    } catch (error) {
      // Error handled by mutation or global handler
    }
  };

  return (
    <CompanyForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      isEdit={false}
    />
  );
};
export default CompanyCreatePage;
