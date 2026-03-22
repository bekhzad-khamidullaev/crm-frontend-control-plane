import React from 'react';
import { Alert, Button, Card, Empty, Spin } from 'antd';
import PropTypes from 'prop-types';

/**
 * Reusable analytics card wrapper with loading and error states
 */
function AnalyticsCard({
  title,
  loading,
  error,
  children,
  extra,
  onRetry,
  bordered = true,
  size = 'default',
  className = '',
  style = {},
  bodyStyle = {},
}) {
  const errorDescription =
    typeof error === 'string'
      ? error
      : error?.details?.message ||
        error?.details?.detail ||
        error?.message ||
        'Не удалось загрузить данные';

  return (
    <Card
      title={title}
      extra={extra}
      variant={bordered ? 'outlined' : 'borderless'}
      size={size}
      className={className}
      style={style}
      styles={{ body: bodyStyle }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large">
            <div style={{ padding: '20px' }}>Загрузка данных...</div>
          </Spin>
        </div>
      ) : error ? (
        <Alert
          message="Ошибка загрузки"
          description={errorDescription}
          type="error"
          showIcon
          action={
            onRetry ? (
              <Button size="small" onClick={onRetry}>
                Повторить
              </Button>
            ) : null
          }
        />
      ) : children ? (
        children
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет данных" />
      )}
    </Card>
  );
}

AnalyticsCard.propTypes = {
  title: PropTypes.node,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  extra: PropTypes.node,
  onRetry: PropTypes.func,
  bordered: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  className: PropTypes.string,
  style: PropTypes.object,
  bodyStyle: PropTypes.object,
};

export default AnalyticsCard;
