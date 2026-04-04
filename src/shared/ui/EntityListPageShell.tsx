import { Alert, Button, Card, Flex, Grid, Space, theme } from 'antd';
import React from 'react';
import { PageHeader } from './PageHeader';

export interface EntityListPageShellProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  toolbar?: React.ReactNode;
  error?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  children: React.ReactNode;
}

export const EntityListPageShell: React.FC<EntityListPageShellProps> = ({
  title,
  subtitle,
  extra,
  toolbar,
  error,
  onRetry,
  retryLabel = 'Повторить',
  children,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} extra={extra} />
      <Card
        variant="borderless"
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
          overflow: 'hidden',
        }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          {toolbar ? (
            <div
              style={{
                padding: isMobile ? 16 : 20,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
              }}
            >
              {toolbar}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                padding: isMobile ? 16 : 20,
                paddingBottom: toolbar ? 0 : isMobile ? 16 : 20,
              }}
            >
              <Alert
                type="error"
                showIcon
                style={{
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                }}
                message={error}
                action={
                  onRetry ? (
                    <Button size="small" onClick={onRetry}>
                      {retryLabel}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : null}

          <Flex
            vertical
            gap={16}
            style={{
              padding: isMobile ? 16 : 20,
              background: token.colorBgContainer,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {children}
          </Flex>
        </Space>
      </Card>
    </>
  );
};
