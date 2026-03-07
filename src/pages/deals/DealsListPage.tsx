import { EntityListPageShell } from '@/shared/ui';
import { DealsTable } from '@/widgets/deals-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Grid } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const DealsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  return (
    <EntityListPageShell
      title="Сделки"
      extra={
        canManage
          ? [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/deals/new')}
                block={isMobile}
              >
                {isMobile ? 'Создать' : 'Создать сделку'}
              </Button>,
            ]
          : []
      }
    >
      <DealsTable />
    </EntityListPageShell>
  );
};

export default DealsListPage;
