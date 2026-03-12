import { Button, Card, Empty } from 'antd';
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
    <Card style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
          {description ? (
            <div style={{ marginTop: 4, fontSize: 14, color: 'rgba(0, 0, 0, 0.45)' }}>{description}</div>
          ) : null}
        </div>
        {children}
        {actionLabel && onAction ? (
          <div>
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
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
