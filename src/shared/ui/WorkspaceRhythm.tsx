import { Card, Col, Grid, Row, Space, Typography, theme } from 'antd';
import React from 'react';

const { Text } = Typography;

export interface WorkspaceSummaryItem {
  key: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

interface WorkspaceSummaryStripProps {
  items: WorkspaceSummaryItem[];
}

export const WorkspaceSummaryStrip: React.FC<WorkspaceSummaryStripProps> = ({ items }) => {
  const filteredItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  if (filteredItems.length === 0) return null;

  const span = filteredItems.length >= 4 ? 6 : filteredItems.length === 3 ? 8 : 12;

  return (
    <Row gutter={[8, 8]}>
      {filteredItems.map((item) => (
        <Col key={item.key} xs={24} sm={12} lg={span}>
          <Card
            variant="borderless"
            style={{
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
              boxShadow: token.boxShadowTertiary,
              height: '100%',
            }}
            styles={{
              body: {
                padding: isMobile ? 10 : 12,
              },
            }}
          >
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.01em' }}>
                {item.label}
              </Text>
              <Text
                strong
                style={{
                  fontSize: isMobile ? 18 : 20,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
              >
                {item.value}
              </Text>
              {item.hint ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {item.hint}
                </Text>
              ) : null}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

interface WorkspaceTabsShellProps {
  children: React.ReactNode;
}

export const WorkspaceTabsShell: React.FC<WorkspaceTabsShellProps> = ({ children }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgElevated,
        boxShadow: token.boxShadowTertiary,
      }}
      styles={{
        body: {
          padding: isMobile ? 8 : 10,
        },
      }}
    >
      {children}
    </Card>
  );
};
