import { LeadsKanbanBoard } from '@/widgets/leads-kanban';
import { LeadsTable } from '@/widgets/leads-table';
import { BusinessEntityListShell } from '@/components/business/BusinessEntityListShell';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Grid, Segmented, Space } from 'antd';
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
import { t } from '@/lib/i18n';

export const LeadsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    const stored = localStorage.getItem('leads:view-mode');
    return stored === 'kanban' ? 'kanban' : 'table';
  });

  useEffect(() => {
    localStorage.setItem('leads:view-mode', viewMode);
  }, [viewMode]);
  const canManage = canWrite();

  return (
    <BusinessEntityListShell
        title={t('leadsListPage.title')}
        subtitle="Управляйте воронкой лидов, фильтрами и быстрым переходом между табличным и канбан режимом."
        extra={(
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
            <Segmented
              value={viewMode}
              options={[
                { label: t('leadsListPage.view.table'), value: 'table', icon: <UnorderedListOutlined /> },
                { label: t('leadsListPage.view.kanban'), value: 'kanban', icon: <AppstoreOutlined /> },
              ]}
              onChange={(value) => setViewMode(value as 'table' | 'kanban')}
            />
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/leads/new')}
                block={isMobile}
              >
                {isMobile ? t('leadsListPage.actions.createShort') : t('leadsListPage.actions.createLead')}
              </Button>
            )}
          </Space>
        )}
      >
      {viewMode === 'table' ? <LeadsTable /> : <LeadsKanbanBoard readOnly={!canManage} />}
    </BusinessEntityListShell>
  );
};

export default LeadsListPage;
