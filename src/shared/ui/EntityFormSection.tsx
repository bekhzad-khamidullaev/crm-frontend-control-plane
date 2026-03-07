import { Divider, Space, Typography } from 'antd';
import React from 'react';

const { Text, Title } = Typography;

export interface EntityFormSectionProps {
  title: string;
  description?: string;
}

export const EntityFormSection: React.FC<EntityFormSectionProps> = ({
  title,
  description,
}) => (
  <div style={{ marginBottom: 20 }}>
    <Space direction="vertical" size={2} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
      {description ? <Text type="secondary">{description}</Text> : null}
    </Space>
    <Divider style={{ margin: '12px 0 0' }} />
  </div>
);
