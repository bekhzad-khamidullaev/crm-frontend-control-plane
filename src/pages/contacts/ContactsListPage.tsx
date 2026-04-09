import { ContactsTable } from '@/widgets/contacts-table';
import { BusinessEntityListShell } from '@/components/business/BusinessEntityListShell';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Grid } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const ContactsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  return (
    <BusinessEntityListShell
        title="Контакты"
        subtitle="Единый реестр контактных лиц с быстрым доступом к коммуникациям и владельцам."
        extra={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/contacts/new')}
              block={isMobile}
            >
              {isMobile ? 'Создать' : 'Создать контакт'}
            </Button>
          ) : null
        }
      >
      <ContactsTable />
    </BusinessEntityListShell>
  );
};

export default ContactsListPage;
