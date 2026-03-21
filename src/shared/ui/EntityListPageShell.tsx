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
        }}
        styles={{
          body: {
            padding: isMobile ? 16 : 24,
          },
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {toolbar ? <div>{toolbar}</div> : null}
          {error ? (
            <Alert
              type="error"
              showIcon
              style={{
                borderRadius: token.borderRadiusLG,
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
          ) : null}
          <Flex vertical gap={16}>
            {children}
          </Flex>
        </Space>
      </Card>
    </>
  );
};
