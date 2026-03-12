import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CompaniesTable } from '@/widgets/companies-table';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
const { Title } = Typography;

export const CompaniesListPage: React.FC = () => {
  const canManage = canWrite();
  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Компании</Title>
        {canManage ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/companies/new')}
          >
            Создать компанию
          </Button>
        ) : null}
      </Space>
      <Card>
      <CompaniesTable />
      </Card>
    </>
  );
};

export default CompaniesListPage;
