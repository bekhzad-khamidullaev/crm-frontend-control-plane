import { CompanyForm } from '@/widgets/company-form';
import { useCreateCompany } from '@/entities/company/api/mutations';
import { navigate } from '@/router.js';
import { Space } from 'antd';

export const CompanyCreatePage: React.FC = () => {
  const createMutation = useCreateCompany();

  const handleSubmit = async (values: any) => {
    try {
      // Map 'name' to 'full_name' if needed
      const payload = {
        ...values,
        full_name: values.name || values.full_name,
      };
      await createMutation.mutateAsync(payload);
      navigate('/companies');
    } catch (error) {
      // Error handled by mutation or global handler
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <CompanyForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        isEdit={false}
      />
    </Space>
  );
};
export default CompanyCreatePage;
