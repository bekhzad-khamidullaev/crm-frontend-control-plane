import React from 'react';
import { Card, Spin, Alert, Empty, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
  retryLabel = 'Повторить',
  bordered = true,
  size = 'default',
  className = '',
  style = {},
  bodyStyle = {},
}) {
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
          description={error.message || 'Не удалось загрузить данные'}
          type="error"
          showIcon
          action={
            typeof onRetry === 'function' ? (
              <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : null
          }
        />
      ) : children ? (
        children
      ) : (
        <Empty description="Нет данных" />
      )}
    </Card>
  );
}

AnalyticsCard.propTypes = {
  title: PropTypes.node,
  loading: PropTypes.bool,
  error: PropTypes.object,
  children: PropTypes.node,
  extra: PropTypes.node,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  bordered: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  className: PropTypes.string,
  style: PropTypes.object,
  bodyStyle: PropTypes.object,
};

export default AnalyticsCard;
