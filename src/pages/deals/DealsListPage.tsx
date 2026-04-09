import { DealsRejectionsView } from '@/widgets/deals-rejections';
import { DealsTable } from '@/widgets/deals-table';
import { BusinessEntityListShell } from '@/components/business/BusinessEntityListShell';
import { PlusOutlined, StopOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Grid, Segmented, Space } from 'antd';
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
import { t } from '@/lib/i18n';

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
    <BusinessEntityListShell
        title={t('dealsListPage.title')}
        subtitle="Контролируйте сделки по стадиям, отслеживайте причины отказов и быстро создавайте новые возможности."
        extra={(
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
            <Segmented
              value={viewMode}
              options={[
                { label: t('dealsListPage.view.table'), value: 'table', icon: <UnorderedListOutlined /> },
                { label: t('dealsListPage.view.rejections'), value: 'rejections', icon: <StopOutlined /> },
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
                {isMobile ? t('dealsListPage.actions.createShort') : t('dealsListPage.actions.createDeal')}
              </Button>
            ) : null}
          </Space>
        )}
      >
      {viewMode === 'table' ? <DealsTable /> : null}
      {viewMode === 'rejections' ? <DealsRejectionsView readOnly={!canManage} /> : null}
    </BusinessEntityListShell>
  );
};

export default DealsListPage;
