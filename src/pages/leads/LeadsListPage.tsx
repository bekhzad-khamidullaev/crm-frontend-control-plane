import { LeadsKanbanBoard } from '@/widgets/leads-kanban';
import { LeadsTable } from '@/widgets/leads-table';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Segmented, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
const { Title } = Typography;

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
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Лиды</Title>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
          <Segmented
            value={viewMode}
            options={[
              { label: 'Таблица', value: 'table', icon: <UnorderedListOutlined /> },
              { label: 'Канбан', value: 'kanban', icon: <AppstoreOutlined /> },
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
              {isMobile ? 'Создать' : 'Создать лид'}
            </Button>
          )}
        </Space>
      </Space>
      <Card>
      {viewMode === 'table' ? <LeadsTable /> : <LeadsKanbanBoard readOnly={!canManage} />}
      </Card>
    </>
  );
};

export default LeadsListPage;
