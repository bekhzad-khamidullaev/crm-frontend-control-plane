import React, { useMemo } from 'react';
import { Alert, Button, Card, List, Progress, Space, Tag, Typography } from 'antd';
import { RiseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Text } = Typography;

function statusMeta(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return { color: 'success', text: 'Активна' };
  if (normalized === 'grace') return { color: 'warning', text: 'Льготный период' };
  if (normalized === 'expired') return { color: 'error', text: 'Истекла' };
  if (normalized === 'revoked') return { color: 'error', text: 'Отозвана' };
  if (normalized === 'invalid') return { color: 'error', text: 'Недействительна' };
  if (normalized === 'missing') return { color: 'default', text: 'Не установлена' };
  return { color: 'default', text: normalized || 'Неизвестно' };
}

export default function LicenseActionCenter({
  summary,
  loading = false,
  onRequestLicense,
  onOpenActivation,
}) {
  const status = statusMeta(summary?.status);
  const seatUsage = summary?.seat_usage || {};
  const progress = typeof seatUsage.utilization_percent === 'number' ? seatUsage.utilization_percent : 0;
  const recommendations = useMemo(
    () => (Array.isArray(summary?.recommendations) ? summary.recommendations : []),
    [summary?.recommendations],
  );
  const canManage = summary?.permissions?.can_manage_license ?? true;
  const recommendedFlow = summary?.recommended_flow || null;
  const blockingReasons = Array.isArray(summary?.blocking_reasons) ? summary.blocking_reasons : [];
  const autoRequestEnabled = summary?.auto_request?.enabled_for_user ?? true;

  return (
    <Card
      loading={loading}
      size="small"
      title={(
        <Space>
          <SafetyCertificateOutlined />
          <span>План, лимиты и следующие действия</span>
        </Space>
      )}
      extra={<Tag color={status.color}>{status.text}</Tag>}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap size={[12, 12]}>
          <Text strong>Текущий план: {summary?.plan_code || '—'}</Text>
          <Text type="secondary">Мест: {seatUsage.used ?? 0} / {seatUsage.limit ?? '—'}</Text>
          {seatUsage.over_limit ? <Tag color="error">Лимит превышен</Tag> : null}
        </Space>
        <Progress
          percent={Math.min(Number(progress || 0), 100)}
          status={seatUsage.over_limit ? 'exception' : Number(progress || 0) >= 85 ? 'active' : 'normal'}
          strokeColor={seatUsage.over_limit ? '#ff4d4f' : '#1677ff'}
        />

        <Alert
          type={recommendations.length ? 'warning' : 'success'}
          showIcon
          message={recommendations.length ? 'Есть рекомендуемые действия' : 'Критичных ограничений не найдено'}
          description={recommendations.length
            ? 'Выполните рекомендации ниже, чтобы избежать блокировок.'
            : 'Лицензионное состояние стабильно.'}
        />
        {recommendedFlow ? (
          <Alert
            type={recommendedFlow.mode === 'auto' ? 'success' : 'info'}
            showIcon
            message={recommendedFlow.title}
            description={recommendedFlow.description}
          />
        ) : null}
        {blockingReasons.length ? (
          <Alert
            type="warning"
            showIcon
            message="Есть ограничения для автоматической активации"
            description={blockingReasons.map((row) => row.message).join(' ')}
          />
        ) : null}

        <List
          size="small"
          dataSource={recommendations}
          locale={{ emptyText: 'Рекомендаций нет' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                item.action === 'open_activation_modal' ? (
                  <Button
                    key="install"
                    size="small"
                    type="primary"
                    onClick={onOpenActivation}
                    disabled={!canManage}
                  >
                    Установить
                  </Button>
                ) : null,
                ['request_license', 'increase_seat_limit', 'review_plan', 'upgrade_plan'].includes(item.action) ? (
                  <Button
                    key="request"
                    size="small"
                    icon={<RiseOutlined />}
                    onClick={onRequestLicense}
                    disabled={!autoRequestEnabled}
                  >
                    Запросить обновление
                  </Button>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={<Text strong>{item.title}</Text>}
                description={item.description}
              />
            </List.Item>
          )}
        />
        {!canManage ? (
          <Text type="secondary">Для изменения лицензии нужны права администратора.</Text>
        ) : null}
      </Space>
    </Card>
  );
}
