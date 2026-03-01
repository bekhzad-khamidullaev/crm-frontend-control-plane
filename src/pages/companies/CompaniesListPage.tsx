import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/ui/PageHeader';
import { CompaniesTable } from '@/widgets/companies-table';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const CompaniesListPage: React.FC = () => {
  const canManage = canWrite();
  return (
    <>
      <PageHeader
        title="Компании"
        breadcrumbs={[
          { title: 'Компании', href: '#/companies' }
        ]}
        extra={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/companies/new')}
            >
              Создать компанию
            </Button>
          ) : null
        }
      />

      <CompaniesTable />
    </>
  );
};

export default CompaniesListPage;
