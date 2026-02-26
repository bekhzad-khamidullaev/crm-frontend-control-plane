/**
 * IntegrationCard Component
 * Universal component for displaying integration status with connect/disconnect functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Statistic, Row, Col, Switch, App, Spin, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  LineChartOutlined,
  ApiOutlined,
} from '@ant-design/icons';

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
  children,
}) {
  const { message } = App.useApp();
  const [actionLoading, setActionLoading] = useState(false);

  const isConnected = status === 'connected';
  const hasError = status === 'error';

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await onConnect();
      message.success(`${title} успешно подключен`);
    } catch (error) {
      message.error(`Ошибка подключения ${title}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setActionLoading(true);
    try {
      await onDisconnect();
      message.success(`${title} отключен`);
    } catch (error) {
      message.error(`Ошибка отключения ${title}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = () => {
    if (isConnected) {
      return <Tag icon={<CheckCircleOutlined />} color="success">Подключено</Tag>;
    }
    if (hasError) {
      return <Tag icon={<CloseCircleOutlined />} color="error">Ошибка</Tag>;
    }
    return <Tag color="default">Не подключено</Tag>;
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
              size="small"
            >
              Обновить
            </Button>
          )}
          {isConnected && onSettings && (
            <Button
              icon={<SettingOutlined />}
              onClick={onSettings}
              size="small"
            >
              Настройки
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
              message="Ошибка подключения"
              description={error}
              type="error"
              showIcon
              closable
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
                  <Button danger onClick={handleDisconnect} loading={actionLoading}>
                    Отключить
                  </Button>
                )}
                {onSettings && (
                  <Button onClick={onSettings}>
                    Настроить
                  </Button>
                )}
              </Space>
            ) : (
              <Button type="primary" onClick={handleConnect} loading={actionLoading}>
                Подключить {title}
              </Button>
            )}
          </div>
        </Space>
      </Spin>
    </Card>
  );
}
