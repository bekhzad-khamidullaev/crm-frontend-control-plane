import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { FolderOutlined } from '@ant-design/icons';

const { Title } = Typography;

function ProjectsList() {
  return (
    <div>
      <Title level={2}>Проекты</Title>
      <Card>
        <Empty
          image={<FolderOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Модуль проектов в разработке"
        />
      </Card>
    </div>
  );
}

export default ProjectsList;
