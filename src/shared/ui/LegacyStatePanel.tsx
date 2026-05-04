import { Button, Card, Empty, Space, Typography } from 'antd';
import React from 'react';

interface LegacyStatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function LegacyStatePanel({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: LegacyStatePanelProps) {
  return (
    <Card styles={{ body: { padding: 24 } }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space direction="vertical" size={4}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
        </Space>
        {children}
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </Space>
    </Card>
  );
}

interface LegacyLoadingStateProps {
  title?: string;
  description?: string;
}

export function LegacyLoadingState({
  title = 'Загрузка данных',
  description = 'Подождите, данные экрана подгружаются.',
}: LegacyLoadingStateProps) {
  return <LegacyStatePanel title={title} description={description} />;
}

interface LegacyEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LegacyEmptyState({
  title = 'Данные не найдены',
  description = 'Возможно, запись была удалена или у вас нет к ней доступа.',
  actionLabel,
  onAction,
}: LegacyEmptyStateProps) {
  return (
    <LegacyStatePanel
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    >
      <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </LegacyStatePanel>
  );
}

interface LegacyErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LegacyErrorState({
  title = 'Не удалось загрузить данные',
  description = 'Попробуйте повторить загрузку или вернитесь к списку.',
  actionLabel = 'Повторить',
  onAction,
}: LegacyErrorStateProps) {
  return (
    <LegacyStatePanel
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
