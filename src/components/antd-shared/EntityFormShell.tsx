import { ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Grid, Space, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

export interface EntityFormShellProps {
  title: string;
  subtitle?: string;
  hint?: string;
  formId: string;
  submitText: string;
  isSubmitting?: boolean;
  onBack: () => void;
  onCancel: () => void;
  backLabel?: string;
  children: React.ReactNode;
}

export const EntityFormShell: React.FC<EntityFormShellProps> = ({
  title,
  subtitle,
  hint,
  formId,
  submitText,
  isSubmitting,
  onBack,
  onCancel,
  backLabel = 'Назад',
  children,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} block={isMobile}>
          {backLabel}
        </Button>
      </Space>

      <Card bodyStyle={{ padding: isMobile ? 16 : 24 }} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
          {hint ? (
            <Alert
              showIcon
              type="info"
              icon={<InfoCircleOutlined />}
              message={hint}
            />
          ) : null}
        </Space>
      </Card>

      {children}

      <Card
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
        style={{
          position: 'sticky',
          bottom: 16,
          marginTop: 16,
          zIndex: 20,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          borderRadius: 14,
        }}
      >
        <Space
          wrap
          style={{
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Text type="secondary">Проверьте обязательные поля и сохраните изменения.</Text>
          <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button onClick={onCancel} block={isMobile}>
              Отмена
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              form={formId}
              loading={isSubmitting}
              block={isMobile}
            >
              {submitText}
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};
