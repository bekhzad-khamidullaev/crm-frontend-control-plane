import React from 'react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DealsTable } from '@/widgets/deals-table';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
// @ts-ignore
import { navigate } from '@/router.js';

export const DealsListPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Сделки"
        extra={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/deals/new')}
          >
            Создать сделку
          </Button>,
        ]}
      />
      <DealsTable />
    </>
  );
};
