import React from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
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
      bordered={bordered}
      size={size}
      className={className}
      style={style}
      bodyStyle={bodyStyle}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Загрузка данных..." />
        </div>
      ) : error ? (
        <Alert
          message="Ошибка загрузки"
          description={error.message || 'Не удалось загрузить данные'}
          type="error"
          showIcon
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
  bordered: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  className: PropTypes.string,
  style: PropTypes.object,
  bodyStyle: PropTypes.object,
};

export default AnalyticsCard;
