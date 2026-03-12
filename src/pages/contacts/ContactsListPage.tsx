import { ContactsTable } from '@/widgets/contacts-table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Space, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
const { Title } = Typography;

export const ContactsListPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Контакты</Title>
        {canManage ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/contacts/new')}
            block={isMobile}
          >
            {isMobile ? 'Создать' : 'Создать контакт'}
          </Button>
        ) : null}
      </Space>
      <Card>
      <ContactsTable />
      </Card>
    </>
  );
};

export default ContactsListPage;
