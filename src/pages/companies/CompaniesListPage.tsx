import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/ui/PageHeader';
import { CompaniesTable } from '@/widgets/companies-table';
import { navigate } from '@/router.js';

export const CompaniesListPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Компании"
        breadcrumbs={[
          { title: 'Компании', href: '#/companies' }
        ]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/companies/new')}
          >
            Создать компанию
          </Button>
        }
      />

      <CompaniesTable />
    </>
  );
};

export default CompaniesListPage;
