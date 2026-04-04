import { ContactsTable } from '@/widgets/contacts-table';
import { PageHeader } from '@/shared/ui/PageHeader';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Grid } from 'antd';
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
    <>
      <PageHeader
        title="Контакты"
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
      />
      <Card>
        <ContactsTable />
      </Card>
    </>
  );
};

export default ContactsListPage;
