import React from 'react';
import { Spin } from 'antd';
import { CompanyForm } from '@/widgets/company-form';
import { useUpdateCompany } from '@/entities/company/api/mutations';
import { useCompany } from '@/entities/company/api/queries';
import { navigate } from '@/router.js';

export interface CompanyEditPageProps {
  id?: number;
}

export const CompanyEditPage: React.FC<CompanyEditPageProps> = ({ id }) => {
  const { data: company, isLoading: isLoadingCompany } = useCompany(id!);
  const updateMutation = useUpdateCompany();

  const handleSubmit = async (values: any) => {
    if (!id) return;
    try {
      const payload = {
        ...values,
        full_name: values.name || values.full_name,
      };
      await updateMutation.mutateAsync({ id, data: payload });
      navigate('/companies');
    } catch (error) {
       // Error handled
    }
  };

  if (isLoadingCompany) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!company && !isLoadingCompany) {
     return <div>Компания не найдена</div>;
  }

  // Map company full_name to name for form if needed
  const initialValues = {
    ...company,
    name: company?.full_name,
  };

  return (
    <CompanyForm
      initialValues={initialValues as any}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      isEdit={true}
    />
  );
};

export default CompanyEditPage;
