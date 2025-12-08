import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import PropTypes from 'prop-types';
import { t } from '../../lib/i18n';

function AnalyticsStatusBanner({ message = t('dashboard.analytics.unavailable'), details, onRetry }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text strong type="warning">
            {message}
          </Typography.Text>
          {details && (
            <Typography.Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {details}
            </Typography.Text>
          )}
          {onRetry && (
            <Space>
              <Button type="primary" onClick={onRetry}>{t('actions.retry')}</Button>
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
}

AnalyticsStatusBanner.propTypes = {
  message: PropTypes.string,
  details: PropTypes.string,
  onRetry: PropTypes.func,
};

export default AnalyticsStatusBanner;
