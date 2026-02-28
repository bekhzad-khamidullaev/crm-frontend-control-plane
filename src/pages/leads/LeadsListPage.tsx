import { PageHeader } from '@/shared/ui/PageHeader';
import { LeadsTable } from '@/widgets/leads-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Grid } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';

export const LeadsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <>
      <PageHeader
        title="Лиды"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/leads/new')}
            block={isMobile}
          >
            {isMobile ? 'Создать' : 'Создать лид'}
          </Button>
        }
      />
      <LeadsTable />
    </>
  );
};

export default LeadsListPage;
