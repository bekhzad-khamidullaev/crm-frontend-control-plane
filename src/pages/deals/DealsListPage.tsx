import { DealsRejectionsView } from '@/widgets/deals-rejections';
import { DealsTable } from '@/widgets/deals-table';
import { PlusOutlined, StopOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Segmented, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
const { Title } = Typography;

export const DealsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [viewMode, setViewMode] = useState<'table' | 'rejections'>(() => {
    const stored = localStorage.getItem('deals:view-mode');
    if (stored === 'rejections') return stored;
    return 'table';
  });

  useEffect(() => {
    localStorage.setItem('deals:view-mode', viewMode);
  }, [viewMode]);
  const canManage = canWrite();

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Сделки</Title>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
          <Segmented
            value={viewMode}
            options={[
              { label: 'Таблица', value: 'table', icon: <UnorderedListOutlined /> },
              { label: 'Отказы', value: 'rejections', icon: <StopOutlined /> },
            ]}
            onChange={(value) => setViewMode(value as 'table' | 'rejections')}
          />
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
      </Space>
      <Card>
        {viewMode === 'table' ? <DealsTable /> : null}
        {viewMode === 'rejections' ? <DealsRejectionsView readOnly={!canManage} /> : null}
      </Card>
    </>
  );
};

export default DealsListPage;
