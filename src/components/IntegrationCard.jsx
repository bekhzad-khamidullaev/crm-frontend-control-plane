/**
 * IntegrationCard Component
 * Universal component for displaying integration status with connect/disconnect functionality
 */

import React, { useState } from 'react';
import { Card, Button, Space, Tag, Statistic, Row, Col, App, Spin, Alert, Typography, theme as antdTheme } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { t } from '../lib/i18n';
import { useTheme } from '../lib/hooks/useTheme';
import LicenseRestrictedAction from './LicenseRestrictedAction.jsx';

const { Text } = Typography;

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
  const { token } = antdTheme.useToken();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [actionLoading, setActionLoading] = useState(false);
  const tt = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const isConnected = status === 'connected';
  const hasError = status === 'error';
  const isRestricted = !!disabled;
  const restrictionTitle = tt('integrationCard.messages.restrictedTitle', 'Действие ограничено лицензией');
  const restrictionDescription = disabledReason || tt(
    'integrationCard.messages.restrictedDescription',
    'Обновите лицензию для доступа к интеграциям',
  );

  const handleConnect = async () => {
    if (isRestricted) return;
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
    if (isRestricted) return;
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
      return (
        <Tag
          icon={<CheckCircleOutlined />}
          color="success"
          bordered={false}
          style={{
            fontWeight: 600,
            borderRadius: 999,
            paddingInline: 10,
            border: '1px solid rgba(82, 196, 26, 0.32)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
          }}
        >
          {t('integrationCard.status.connected')}
        </Tag>
      );
    }
    if (hasError) {
      return (
        <Tag
          icon={<CloseCircleOutlined />}
          color="error"
          bordered={false}
          style={{
            fontWeight: 600,
            borderRadius: 999,
            paddingInline: 10,
            border: '1px solid rgba(255, 77, 79, 0.32)',
          }}
        >
          {t('integrationCard.status.error')}
        </Tag>
      );
    }
    return (
      <Tag
        color="default"
        bordered={false}
        style={{
          fontWeight: 600,
          borderRadius: 999,
          paddingInline: 10,
          border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.3)' : token.colorBorderSecondary}`,
        }}
      >
        {t('integrationCard.status.disconnected')}
      </Tag>
    );
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
            <LicenseRestrictedAction restricted={isRestricted} reason={restrictionDescription}>
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
                disabled={isRestricted}
                size="small"
              >
                {t('integrationCard.actions.refresh')}
              </Button>
            </LicenseRestrictedAction>
          )}
          {isConnected && onSettings && (
            <LicenseRestrictedAction restricted={isRestricted} reason={restrictionDescription}>
              <Button
                icon={<SettingOutlined />}
                onClick={onSettings}
                disabled={isRestricted}
                size="small"
              >
                {t('integrationCard.actions.settings')}
              </Button>
            </LicenseRestrictedAction>
          )}
        </Space>
      }
      style={{
        marginBottom: 16,
        border: isRestricted ? '1px solid rgba(217, 119, 6, 0.28)' : undefined,
        boxShadow: isRestricted ? '0 14px 30px rgba(15, 23, 42, 0.08)' : undefined,
        background: isRestricted
          ? isDark
            ? 'linear-gradient(180deg, rgba(69, 43, 12, 0.28), rgba(12, 19, 32, 0.92))'
            : 'linear-gradient(180deg, rgba(255, 251, 235, 0.72), rgba(255, 255, 255, 0.96))'
          : undefined,
      }}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text
            style={{
              display: 'block',
              margin: 0,
              color: token.colorTextSecondary,
              lineHeight: 1.6,
              fontSize: 14,
              maxWidth: 960,
            }}
          >
            {description}
          </Text>

          {hasError && error && (
            <Alert
              message={t('integrationCard.messages.connectionErrorTitle')}
              description={error}
              type="error"
              showIcon
              closable
              style={{
                borderRadius: 14,
                border: '1px solid rgba(255, 77, 79, 0.28)',
                background: isDark ? 'rgba(47, 18, 24, 0.92)' : token.colorErrorBg,
              }}
            />
          )}
          {isRestricted && (
            <Alert
              message={restrictionTitle}
              description={(
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <div style={{ lineHeight: 1.55 }}>{restrictionDescription}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: token.colorTextSecondary }}>
                    {tt(
                      'integrationCard.messages.restrictedHint',
                      'Connect, test, and settings actions remain disabled until the restriction is removed.',
                    )}
                  </div>
                </Space>
              )}
              type="warning"
              showIcon
              style={{
                borderRadius: 14,
                border: '1px solid rgba(217, 119, 6, 0.28)',
                background: isDark ? 'rgba(69, 43, 12, 0.72)' : 'rgba(255, 247, 214, 0.9)',
              }}
            />
          )}

          {isConnected && stats && Object.keys(stats).length > 0 && (
            <Row gutter={[16, 16]}>
              {Object.entries(stats).map(([key, value]) => (
                <Col xs={24} sm={12} md={8} key={key}>
                  <Statistic
                    title={<span style={{ color: token.colorTextSecondary, fontWeight: 600 }}>{key}</span>}
                    value={value}
                    prefix={<LineChartOutlined />}
                    valueStyle={{
                      color: token.colorText,
                      fontWeight: 700,
                      fontSize: 22,
                    }}
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
                  <LicenseRestrictedAction restricted={isRestricted} reason={restrictionDescription}>
                    <Button danger onClick={handleDisconnect} loading={actionLoading} disabled={isRestricted}>
                      {t('integrationCard.actions.disconnect')}
                    </Button>
                  </LicenseRestrictedAction>
                )}
                {onSettings && (
                  <LicenseRestrictedAction restricted={isRestricted} reason={restrictionDescription}>
                    <Button onClick={onSettings} disabled={isRestricted}>
                      {t('integrationCard.actions.configure')}
                    </Button>
                  </LicenseRestrictedAction>
                )}
              </Space>
            ) : (
              <LicenseRestrictedAction restricted={isRestricted} reason={restrictionDescription}>
                <Button type="primary" onClick={handleConnect} loading={actionLoading} disabled={isRestricted}>
                  {t('integrationCard.actions.connect')} {title}
                </Button>
              </LicenseRestrictedAction>
            )}
          </div>
        </Space>
      </Spin>
    </Card>
  );
}
