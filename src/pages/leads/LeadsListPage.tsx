import { PageHeader } from '@/shared/ui/PageHeader';
import { LeadsTable } from '@/widgets/leads-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';

export const LeadsListPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Лиды"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leads/new')}>
            Создать лид
          </Button>
        }
      />
      <LeadsTable />
    </>
  );
};

export default LeadsListPage;
