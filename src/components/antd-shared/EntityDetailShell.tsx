import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Grid,
  Row,
  Space,
  Tabs,
  Typography,
} from 'antd';
import React from 'react';

const { Title, Text } = Typography;

export interface EntityDetailStat {
  key: string;
  label: string;
  value: React.ReactNode;
}

export interface EntityDetailTab {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

export interface EntityDetailShellProps {
  backLabel?: string;
  onBack: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  statusTag?: React.ReactNode;
  primaryActions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  stats?: EntityDetailStat[];
  tabs: EntityDetailTab[];
  defaultTabKey?: string;
  bodyPaddingMobile?: number;
  bodyPaddingDesktop?: number;
}

export const EntityDetailShell: React.FC<EntityDetailShellProps> = ({
  backLabel = 'Назад',
  onBack,
  title,
  subtitle,
  statusTag,
  primaryActions,
  secondaryActions,
  stats = [],
  tabs,
  defaultTabKey,
  bodyPaddingMobile = 12,
  bodyPaddingDesktop = 24,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} block={isMobile}>
              {backLabel}
            </Button>
            {secondaryActions}
          </Space>
          <Space wrap>{primaryActions}</Space>
        </Space>
      </div>

      <Card
        bodyStyle={{ padding: isMobile ? bodyPaddingMobile : bodyPaddingDesktop }}
        style={{ marginBottom: stats.length ? 16 : 0 }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap align="center">
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              {title}
            </Title>
            {statusTag}
          </Space>
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        </Space>
      </Card>

      {stats.length ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {stats.map((stat) => (
            <Col key={stat.key} xs={24} md={24 / Math.min(stats.length, 3)}>
              <Card bodyStyle={{ padding: isMobile ? 12 : 20 }}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">{stat.label}</Text>
                  <Text strong style={{ fontSize: isMobile ? 20 : 24 }}>
                    {stat.value}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      <Card bodyStyle={{ padding: isMobile ? bodyPaddingMobile : bodyPaddingDesktop }}>
        <Tabs
          items={tabs}
          defaultActiveKey={defaultTabKey || tabs[0]?.key}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>
    </div>
  );
};
