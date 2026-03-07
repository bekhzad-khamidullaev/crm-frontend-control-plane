import { Empty } from 'antd';
import React from 'react';
import * as ButtonModule from '../../components/ui/button.jsx';
import * as CardModule from '../../components/ui/card.jsx';

const { Button } = ButtonModule as any;
const { Card } = CardModule as any;

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
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {children}
        {actionLabel && onAction ? (
          <div>
            <Button variant="outline" onClick={onAction}>
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
