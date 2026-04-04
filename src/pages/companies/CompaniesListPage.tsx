import React from 'react';
import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CompaniesTable } from '@/widgets/companies-table';
import { PageHeader } from '@/shared/ui/PageHeader';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const CompaniesListPage: React.FC = () => {
  const canManage = canWrite();
  return (
    <>
      <PageHeader
        title="Компании"
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
      <Card>
        <CompaniesTable />
      </Card>
    </>
  );
};

export default CompaniesListPage;
