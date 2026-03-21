/**
 * IntegrationCard Component
 * Universal component for displaying integration status with connect/disconnect functionality
 */

import React, { useState } from 'react';
import { Card, Button, Space, Tag, Statistic, Row, Col, App, Spin, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { t } from '../lib/i18n';

export default function IntegrationCard({
  title,
  description,
  icon,
  type, // 'instagram', 'facebook', 'telegram', 'sms', 'telephony'
  status, // 'connected', 'disconnected', 'error'
  stats = {},
  onConnect,
  onDisconnect,
  onSettings,
  onRefresh,
  loading = false,
  error = null,
  disabled = false,
  disabledReason = '',
  children,
}) {
  const { message } = App.useApp();
  const [actionLoading, setActionLoading] = useState(false);
  const tt = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const isConnected = status === 'connected';
  const hasError = status === 'error';

  const handleConnect = async () => {
    if (disabled) return;
    setActionLoading(true);
    try {
      await onConnect();
    } catch (error) {
      message.error(t('integrationCard.messages.connectError', { title }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (disabled) return;
    if (!onDisconnect) return;
    setActionLoading(true);
    try {
      await onDisconnect();
      message.success(t('integrationCard.messages.disconnected', { title }));
    } catch (error) {
      message.error(t('integrationCard.messages.disconnectError', { title }));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = () => {
    if (isConnected) {
      return <Tag icon={<CheckCircleOutlined />} color="success">{t('integrationCard.status.connected')}</Tag>;
    }
    if (hasError) {
      return <Tag icon={<CloseCircleOutlined />} color="error">{t('integrationCard.status.error')}</Tag>;
    }
    return <Tag color="default">{t('integrationCard.status.disconnected')}</Tag>;
  };

  return (
    <Card
      title={
        <Space>
          {icon}
          <span>{title}</span>
          {getStatusTag()}
        </Space>
      }
      extra={
        <Space>
          {isConnected && onRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              disabled={disabled}
              size="small"
            >
              {t('integrationCard.actions.refresh')}
            </Button>
          )}
          {isConnected && onSettings && (
            <Button
              icon={<SettingOutlined />}
              onClick={onSettings}
              disabled={disabled}
              size="small"
            >
              {t('integrationCard.actions.settings')}
            </Button>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <p style={{ margin: 0, color: '#666' }}>{description}</p>

          {hasError && error && (
            <Alert
              message={t('integrationCard.messages.connectionErrorTitle')}
              description={error}
              type="error"
              showIcon
              closable
            />
          )}
          {disabled && (
            <Alert
              message={tt('integrationCard.messages.restrictedTitle', 'Действие ограничено лицензией')}
              description={disabledReason || tt('integrationCard.messages.restrictedDescription', 'Обновите лицензию для доступа к интеграциям')}
              type="warning"
              showIcon
            />
          )}

          {isConnected && stats && Object.keys(stats).length > 0 && (
            <Row gutter={16}>
              {Object.entries(stats).map(([key, value]) => (
                <Col span={8} key={key}>
                  <Statistic
                    title={key}
                    value={value}
                    prefix={<LineChartOutlined />}
                  />
                </Col>
              ))}
            </Row>
          )}

          {children}

          <div style={{ marginTop: 16 }}>
            {isConnected ? (
              <Space>
                {onDisconnect && (
                  <Button danger onClick={handleDisconnect} loading={actionLoading} disabled={disabled}>
                    {t('integrationCard.actions.disconnect')}
                  </Button>
                )}
                {onSettings && (
                  <Button onClick={onSettings} disabled={disabled}>
                    {t('integrationCard.actions.configure')}
                  </Button>
                )}
              </Space>
            ) : (
              <Button type="primary" onClick={handleConnect} loading={actionLoading} disabled={disabled}>
                {t('integrationCard.actions.connect')} {title}
              </Button>
            )}
          </div>
        </Space>
      </Spin>
    </Card>
  );
}
