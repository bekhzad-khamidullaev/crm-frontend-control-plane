import { PageHeader } from '@/shared/ui/PageHeader';
import { DealsTable } from '@/widgets/deals-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
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

export default DealsListPage;
