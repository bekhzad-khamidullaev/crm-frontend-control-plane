import React, { useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Modal, Space, Spin, Typography } from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

function resolveErrorMessage(error) {
  if (typeof error === 'string') return error;
  return (
    error?.details?.message ||
    error?.details?.detail ||
    error?.details?.details?.message ||
    error?.details?.details?.detail ||
    error?.message ||
    'Не удалось загрузить данные'
  );
}

function resolveErrorMeta(error) {
  if (!error || typeof error === 'string') return null;

  const code =
    error?.details?.code ||
    error?.details?.details?.code ||
    error?.details?.error ||
    error?.code ||
    null;
  const correlationId =
    error?.details?.correlation_id ||
    error?.details?.details?.correlation_id ||
    error?.details?.correlationId ||
    error?.details?.details?.correlationId ||
    error?.correlation_id ||
    null;
  const explicitRetryable = [
    error?.retryable,
    error?.details?.retryable,
    error?.details?.details?.retryable,
  ].find((value) => typeof value === 'boolean');
  const statusCode = Number(
    error?.status ||
      error?.response?.status ||
      error?.details?.status ||
      error?.details?.details?.status ||
      0
  );
  const fallbackRetryable =
    Number.isFinite(statusCode) && statusCode > 0
      ? [429, 502, 503, 504].includes(statusCode) || statusCode >= 500
      : null;
  const retryable = explicitRetryable ?? fallbackRetryable;

  if (!code && !correlationId && retryable === null) return null;
  return { code, correlationId, retryable };
}

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
  onDrillDown,
  onOpenSettings,
  onFullscreen,
  widgetActions = false,
  widgetKey = '',
  widgetPeriod = '',
  widgetSummary = '',
  bordered = true,
  size = 'default',
  className = '',
  style = {},
  bodyStyle = {},
}) {
  const cardRef = useRef(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const errorDescription = useMemo(() => resolveErrorMessage(error), [error]);
  const errorMeta = useMemo(() => resolveErrorMeta(error), [error]);

  const fallbackWidgetKey =
    widgetKey || (typeof title === 'string' && title.trim() ? title.trim() : 'widget');
  const actionsExtra = widgetActions ? (
    <Space size={4} wrap>
      <Button size="small" onClick={() => onRetry?.()} disabled={!onRetry}>
        Обновить
      </Button>
      <Button
        size="small"
        onClick={() => {
          if (onDrillDown) {
            onDrillDown({ widgetKey: fallbackWidgetKey, title });
            return;
          }
          setDrilldownOpen(true);
        }}
      >
        Drill-down
      </Button>
      <Button
        size="small"
        onClick={() => {
          if (onOpenSettings) {
            onOpenSettings({ widgetKey: fallbackWidgetKey, title });
            return;
          }
          setSettingsOpen(true);
        }}
      >
        Настройки
      </Button>
      <Button
        size="small"
        onClick={() => {
          if (onFullscreen) {
            onFullscreen({ widgetKey: fallbackWidgetKey, title });
            return;
          }
          if (cardRef.current?.requestFullscreen) {
            cardRef.current.requestFullscreen().catch(() => {});
          }
        }}
      >
        Fullscreen
      </Button>
      {extra}
    </Space>
  ) : (
    extra
  );

  return (
    <>
      <Card
        ref={cardRef}
        title={title}
        extra={actionsExtra}
        variant={bordered ? 'outlined' : 'borderless'}
        size={size}
        className={className}
        style={style}
        styles={{ body: bodyStyle }}
        data-widget-key={fallbackWidgetKey}
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
            description={
              errorMeta ? (
                <Space direction="vertical" size={0}>
                  <Text>{errorDescription}</Text>
                  {errorMeta.code ? <Text type="secondary">code: {errorMeta.code}</Text> : null}
                  {errorMeta.correlationId ? (
                    <Text type="secondary">correlation_id: {errorMeta.correlationId}</Text>
                  ) : null}
                  {errorMeta.retryable !== null ? (
                    <Text type="secondary">
                      retryable: {errorMeta.retryable ? 'true' : 'false'}
                    </Text>
                  ) : null}
                </Space>
              ) : (
                errorDescription
              )
            }
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
      <Modal
        open={drilldownOpen}
        title={`${typeof title === 'string' ? title : 'Widget'}: drill-down`}
        footer={null}
        onCancel={() => setDrilldownOpen(false)}
      >
        <Space direction="vertical" size="small">
          <Text>
            Виджет: <Text strong>{fallbackWidgetKey}</Text>
          </Text>
          {widgetPeriod ? (
            <Text type="secondary">Период: {widgetPeriod}</Text>
          ) : null}
          <Text type="secondary">
            {widgetSummary || 'Детальный drill-down доступен в модуле аналитики и связанных списках.'}
          </Text>
        </Space>
      </Modal>
      <Modal
        open={settingsOpen}
        title={`${typeof title === 'string' ? title : 'Widget'}: настройки`}
        footer={null}
        onCancel={() => setSettingsOpen(false)}
      >
        <Space direction="vertical" size="small">
          <Text type="secondary">
            Базовые настройки карточки будут расширяться в следующих релизах.
          </Text>
          <Text>
            Виджет: <Text strong>{fallbackWidgetKey}</Text>
          </Text>
        </Space>
      </Modal>
    </>
  );
}

AnalyticsCard.propTypes = {
  title: PropTypes.node,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  extra: PropTypes.node,
  onRetry: PropTypes.func,
  onDrillDown: PropTypes.func,
  onOpenSettings: PropTypes.func,
  onFullscreen: PropTypes.func,
  widgetActions: PropTypes.bool,
  widgetKey: PropTypes.string,
  widgetPeriod: PropTypes.string,
  widgetSummary: PropTypes.string,
  bordered: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  className: PropTypes.string,
  style: PropTypes.object,
  bodyStyle: PropTypes.object,
};

export default AnalyticsCard;
