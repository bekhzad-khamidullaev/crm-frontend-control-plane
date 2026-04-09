import { Button, Card, Empty, Result, Skeleton, Space, Typography } from 'antd';
import type { BusinessScreenStateProps } from './interface';
import './index.css';

const { Text, Title } = Typography;

const DEFAULT_CONTENT: Record<BusinessScreenStateProps['variant'], { title: string; description: string }> = {
  loading: {
    title: 'Загрузка данных',
    description: 'Подождите, данные экрана подгружаются.',
  },
  empty: {
    title: 'Данные не найдены',
    description: 'Пока здесь нет записей по выбранным условиям.',
  },
  error: {
    title: 'Не удалось загрузить данные',
    description: 'Попробуйте повторить загрузку или вернуться к предыдущему экрану.',
  },
  forbidden: {
    title: 'Доступ ограничен',
    description: 'У вас недостаточно прав для просмотра этого раздела.',
  },
  notFound: {
    title: 'Запись не найдена',
    description: 'Возможно, запись была удалена или у вас нет к ней доступа.',
  },
};

export default function BusinessScreenState({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: BusinessScreenStateProps) {
  const resolvedTitle = title || DEFAULT_CONTENT[variant].title;
  const resolvedDescription = description || DEFAULT_CONTENT[variant].description;

  if (variant === 'loading') {
    return (
      <div className="component_BusinessScreenState_root">
        <Card className="component_BusinessScreenState_loadingCard">
          <Space direction="vertical" size={12} className="component_BusinessScreenState_loadingStack">
            <Title level={4} className="component_BusinessScreenState_loadingTitle">
              {resolvedTitle}
            </Title>
            <Text type="secondary" className="component_BusinessScreenState_loadingText">
              {resolvedDescription}
            </Text>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Space>
        </Card>
      </div>
    );
  }

  if (variant === 'empty') {
    return (
      <Result
        icon={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />}
        title={resolvedTitle}
        subTitle={resolvedDescription}
        extra={
          actionLabel && onAction ? (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (variant === 'forbidden') {
    return (
      <Result
        status="403"
        title={resolvedTitle}
        subTitle={resolvedDescription}
        extra={
          actionLabel && onAction ? (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (variant === 'notFound') {
    return (
      <Result
        status="404"
        title={resolvedTitle}
        subTitle={resolvedDescription}
        extra={
          actionLabel && onAction ? (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Result
      status="error"
      title={resolvedTitle}
      subTitle={resolvedDescription}
      extra={
        actionLabel && onAction ? (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        ) : undefined
      }
    />
  );
}

