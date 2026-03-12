import { DealsTable } from '@/widgets/deals-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Space, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
const { Title } = Typography;

export const DealsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Сделки</Title>
        {canManage ? (
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/deals/new')}
            block={isMobile}
          >
            {isMobile ? 'Создать' : 'Создать сделку'}
          </Button>
        ) : null}
      </Space>
      <Card>
      <DealsTable />
      </Card>
    </>
  );
};

export default DealsListPage;
