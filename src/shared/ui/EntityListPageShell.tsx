import { Alert, Button, Card, Grid } from 'antd';
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

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} extra={extra} />
      <Card
        variant="borderless"
        styles={{
          body: {
            padding: isMobile ? 16 : 20,
          },
        }}
      >
        {toolbar ? <div style={{ marginBottom: 16 }}>{toolbar}</div> : null}
        {error ? (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
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
        {children}
      </Card>
    </>
  );
};
