import { Alert, Button, Card, Grid, Space } from 'antd';
import { PageHeader } from '@/shared/ui/PageHeader';
import type { BusinessEntityListShellProps } from './interface';
import './index.css';

export default function BusinessEntityListShell({
  title,
  subtitle,
  extra,
  toolbar,
  error,
  retryLabel = 'Повторить',
  onRetry,
  children,
}: BusinessEntityListShellProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} extra={extra} />
      <Card className="component_BusinessEntityListShell_card" variant="borderless">
        <Space direction="vertical" size={0} className="component_BusinessEntityListShell_stack">
          {toolbar ? (
            <div
              className={[
                'component_BusinessEntityListShell_toolbar',
                isMobile ? 'component_BusinessEntityListShell_toolbar_mobile' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {toolbar}
            </div>
          ) : null}

          {error ? (
            <div
              className={[
                'component_BusinessEntityListShell_error',
                isMobile ? 'component_BusinessEntityListShell_error_mobile' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Alert
                type="error"
                showIcon
                className="component_BusinessEntityListShell_errorAlert"
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

          <div
            className={[
              'component_BusinessEntityListShell_content',
              isMobile ? 'component_BusinessEntityListShell_content_mobile' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {children}
          </div>
        </Space>
      </Card>
    </>
  );
}
