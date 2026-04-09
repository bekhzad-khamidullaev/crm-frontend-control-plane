import React from 'react';
import { Button, Grid } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { BusinessEntityListShell } from '@/components/business/BusinessEntityListShell';
import { CompaniesTable } from '@/widgets/companies-table';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const CompaniesListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  return (
    <BusinessEntityListShell
        title="Компании"
        subtitle="Централизованный реестр компаний с inline-редактированием и быстрым переходом к сделкам и контактам."
        extra={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/companies/new')}
              block={isMobile}
            >
              {isMobile ? 'Создать' : 'Создать компанию'}
            </Button>
          ) : null
        }
      >
      <CompaniesTable />
    </BusinessEntityListShell>
  );
};

export default CompaniesListPage;
