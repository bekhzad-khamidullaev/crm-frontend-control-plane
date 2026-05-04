import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, List, Row, Space, Steps, Tag, Typography } from 'antd';
import { CheckCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { getIntegrationWizardContext } from '../../lib/api/integrationHub.js';
import ChannelBrandIcon from '../channel/ChannelBrandIcon.jsx';

const { Text, Paragraph } = Typography;

const CHANNEL_ICON_ALIASES = {
  whatsapp_business: 'whatsapp',
  whatsapp_cloud: 'whatsapp',
  wa: 'whatsapp',
  fb: 'facebook',
  messenger: 'facebook',
  facebook_messenger: 'facebook',
  ig: 'instagram',
  instagram_direct: 'instagram',
  tg: 'telegram',
  telegram_user: 'telegram',
  telegram_bot: 'telegram',
  playmobile: 'sms',
  eskiz: 'sms',
  voip: 'telephony',
  calls: 'telephony',
  phone: 'telephony',
};

const getChannelIconKey = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  return CHANNEL_ICON_ALIASES[normalized] || normalized;
};

function statusTag(status) {
  if (status === 'active') return <Tag color="success">Активен</Tag>;
  if (status === 'requires_attention') return <Tag color="warning">Требует внимания</Tag>;
  return <Tag>Не подключен</Tag>;
}

export default function ChannelSetupWizard({
  catalog = [],
  loading = false,
  onOpenConnectModal,
  onRunCheck,
  onOpenDiagnostics,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [wizardContext, setWizardContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);

  const selectedItem = useMemo(
    () => catalog.find((item) => String(item.channel) === String(selectedChannel)),
    [catalog, selectedChannel],
  );

  useEffect(() => {
    if (!catalog.length) return;
    if (!selectedChannel) {
      setSelectedChannel(catalog[0].channel);
    }
  }, [catalog, selectedChannel]);

  useEffect(() => {
    let alive = true;
    const loadContext = async () => {
      if (!selectedChannel) {
        setWizardContext(null);
        return;
      }
      setContextLoading(true);
      try {
        const data = await getIntegrationWizardContext(selectedChannel);
        if (alive) setWizardContext(data || null);
      } catch {
        if (alive) setWizardContext(null);
      } finally {
        if (alive) setContextLoading(false);
      }
    };
    loadContext();
    return () => {
      alive = false;
    };
  }, [selectedChannel]);

  const openConnect = () => {
    if (!selectedItem) return;
    if (typeof onOpenConnectModal === 'function') onOpenConnectModal(selectedItem.channel);
  };

  const runCheck = () => {
    if (!selectedItem) return;
    if (typeof onRunCheck === 'function') onRunCheck(selectedItem.channel);
  };

  return (
    <Card
      size="small"
      loading={loading}
      title="Мастер подключения каналов"
      extra={selectedItem ? statusTag(selectedItem.status) : null}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Подключите канал за 4 шага"
          description="Мастер скрывает токены и webhook-детали. Технические параметры остаются в отдельной диагностике."
        />
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          size="small"
          items={[
            { title: 'Выбор канала' },
            { title: 'Проверка доступа' },
            { title: 'Подключение' },
            { title: 'Проверка и запуск' },
          ]}
        />

        {currentStep === 0 && (
          <Row gutter={[12, 12]}>
            {catalog.map((item) => (
              <Col xs={24} md={12} lg={8} key={item.channel}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => setSelectedChannel(item.channel)}
                  style={{
                    borderColor: selectedChannel === item.channel ? '#1677ff' : undefined,
                  }}
                >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Space align="center" size={8}>
                          <ChannelBrandIcon
                            channel={getChannelIconKey(item.channel || item.title)}
                            size={16}
                          />
                          <Text strong>{item.title}</Text>
                        </Space>
                        {statusTag(item.status)}
                      </Space>
                      <Text type="secondary">
                      Время подключения: {item.eta_minutes} минут
                    </Text>
                    <Text type="secondary">
                      Ошибки за 24ч: {item.errors_24h || 0}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {currentStep === 1 && (
          <Card size="small" loading={contextLoading}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space align="center" size={8}>
                <ChannelBrandIcon
                  channel={getChannelIconKey(selectedItem?.channel || selectedItem?.title || 'omnichannel')}
                  size={16}
                />
                <Text strong>{selectedItem?.title || 'Канал не выбран'}</Text>
              </Space>
              <Paragraph style={{ marginBottom: 0 }}>
                Система автоматически проверит доступы и активы. От вас нужен только выбор канала и подтверждение.
              </Paragraph>
              <Text strong>Что понадобится</Text>
              <List
                size="small"
                dataSource={wizardContext?.required_rights || selectedItem?.required_rights || []}
                renderItem={(value) => <List.Item>{value}</List.Item>}
                locale={{ emptyText: 'Требования появятся после выбора канала' }}
              />
              <Text strong>Ограничения канала</Text>
              <List
                size="small"
                dataSource={wizardContext?.limitations || selectedItem?.limitations || []}
                renderItem={(value) => <List.Item>{value}</List.Item>}
                locale={{ emptyText: 'Ограничения не указаны' }}
              />
            </Space>
          </Card>
        )}

        {currentStep === 2 && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="Подключение канала"
              description="Откроется форма подключения выбранного канала. После сохранения мастер вернется к автопроверке."
            />
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={openConnect} disabled={!selectedItem}>
              Открыть форму подключения
            </Button>
          </Space>
        )}

        {currentStep === 3 && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message="Финальная проверка"
              description="Запустите тест канала и откройте диагностику только если есть ошибки."
            />
            <Space wrap>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={runCheck} disabled={!selectedItem}>
                Проверить канал
              </Button>
              <Button onClick={onOpenDiagnostics}>Открыть диагностику</Button>
            </Space>
          </Space>
        )}
      </Space>
    </Card>
  );
}
