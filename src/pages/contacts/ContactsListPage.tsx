import { PageHeader } from '@/shared/ui/PageHeader';
import { ContactsTable } from '@/widgets/contacts-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Grid } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';

export const ContactsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <>
      <PageHeader
        title="Контакты"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/contacts/new')}
            block={isMobile}
          >
            {isMobile ? 'Создать' : 'Создать контакт'}
          </Button>
        }
      />
      <ContactsTable />
    </>
  );
};

export default ContactsListPage;
