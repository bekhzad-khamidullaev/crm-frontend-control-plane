import React, { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Form, Input, Segmented, Select, Space, Switch, Table, Tabs, Tag, Typography } from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { t } from '../lib/i18n/index.js';
import smsApi from '../lib/api/sms.js';

const { TextArea } = Input;
const { Text, Title } = Typography;

function SmsHistoryTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await smsApi.history({ limit: 50 });
      setData(res?.results || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card
      size="small"
      title={t('smsCenterPage.history.title')}
      extra={(
        <Button size="small" icon={<ReloadOutlined />} onClick={load} loading={loading}>
          {t('smsCenterPage.common.refresh')}
        </Button>
      )}
    >
      <Table
        dataSource={data}
        rowKey={(record) => record.id || record.message_id || `${record.phone || ''}-${record.sent_at || Math.random()}`}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        columns={[
          {
            title: t('smsCenterPage.history.columns.channelId'),
            dataIndex: 'channel_id',
            key: 'channel_id',
            width: 140,
            render: (value) => <Tag>{value || '-'}</Tag>,
          },
          { title: t('smsCenterPage.history.columns.recipient'), dataIndex: 'phone', key: 'phone', width: 180 },
          { title: t('smsCenterPage.history.columns.text'), dataIndex: 'text', key: 'text', ellipsis: true },
          { title: t('smsCenterPage.history.columns.status'), dataIndex: 'status', key: 'status', width: 140, render: (value) => <Tag>{value || '-'}</Tag> },
          {
            title: t('smsCenterPage.history.columns.date'),
            dataIndex: 'sent_at',
            key: 'sent_at',
            width: 190,
            render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
          },
        ]}
      />
    </Card>
  );
}

function SmsSendTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [mode, setMode] = useState('single');
  const [sending, setSending] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [channelOptions, setChannelOptions] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    const loadDefaultChannel = async () => {
      try {
        setLoadingChannels(true);
        const [status, providersResponse] = await Promise.all([smsApi.status(), smsApi.providers()]);
        const providers = providersResponse?.results || providersResponse || [];
        const options = Array.isArray(providers)
          ? providers
              .filter((provider) => provider?.is_active !== false)
              .map((provider) => ({
                value: String(provider.channel_id || provider.id),
                label: `${provider.name || provider.provider || provider.title || 'Channel'} (#${provider.channel_id || provider.id})`,
              }))
          : [];
        setChannelOptions(options);

        const defaultChannel = status?.active_channel_id ? String(status.active_channel_id) : null;
        if (defaultChannel) {
          setActiveChannelId(defaultChannel);
          form.setFieldValue('channel_id', defaultChannel);
          return;
        }
        if (options.length > 0) {
          form.setFieldValue('channel_id', options[0].value);
        }
      } catch {
        setActiveChannelId(null);
      } finally {
        setLoadingChannels(false);
      }
    };
    loadDefaultChannel();
  }, [form]);

  const helperText = useMemo(() => {
    if (activeChannelId) {
      return t('smsCenterPage.common.activeChannelHint', { id: activeChannelId });
    }
    return t('smsCenterPage.common.noChannelDetected');
  }, [activeChannelId]);

  const handleSubmit = async (values) => {
    setSending(true);
    try {
      if (mode === 'bulk') {
        const phoneNumbers = String(values.phone_numbers || '')
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

        const response = await smsApi.sendBulk({
          channel_id: values.channel_id,
          phone_numbers: phoneNumbers,
          text: values.text,
        });

        if (response?.status === 'queued') {
          message.success(t('smsCenterPage.messages.bulkQueued', { count: String(phoneNumbers.length) }));
        } else if (response?.status === 'error' || response?.error) {
          message.error(response?.error || response?.detail || t('smsCenterPage.messages.sendError'));
          return;
        } else {
          message.success(t('smsCenterPage.messages.sent'));
        }
      } else {
        const response = await smsApi.send({
          channel_id: values.channel_id,
          to: values.to,
          text: values.text,
          async: values.async,
        });

        if (response?.status === 'error') {
          message.error(response?.detail || t('smsCenterPage.messages.sendError'));
          return;
        }
        if (response?.status === 'accepted') {
          message.success(t('smsCenterPage.messages.queued'));
        } else {
          message.success(t('smsCenterPage.messages.sent'));
        }
      }

      form.resetFields(['to', 'phone_numbers', 'text']);
    } catch {
      message.error(t('smsCenterPage.messages.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card size="small">
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space direction="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>{t('smsCenterPage.send.title')}</Title>
          <Text type="secondary">{t('smsCenterPage.send.subtitle')}</Text>
        </Space>

        <Text type="secondary">{helperText}</Text>

        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ async: true }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Form.Item
              name="channel_id"
              label={t('smsCenterPage.send.fields.channelId')}
              rules={[{ required: true, message: t('smsCenterPage.send.validation.channelRequired') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={loadingChannels}
                options={channelOptions}
                placeholder={t('smsCenterPage.send.placeholders.channelId')}
              />
            </Form.Item>

            <Form.Item label={t('smsCenterPage.send.fields.mode')}>
              <Segmented
                size="small"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'single', label: t('smsCenterPage.send.modes.single') },
                  { value: 'bulk', label: t('smsCenterPage.send.modes.bulk') },
                ]}
              />
            </Form.Item>

            {mode === 'bulk' ? (
              <Form.Item
                label={t('smsCenterPage.send.fields.phones')}
                name="phone_numbers"
                rules={[{ required: true, message: t('smsCenterPage.send.validation.numbersRequired') }]}
              >
                <TextArea rows={4} placeholder={t('smsCenterPage.send.placeholders.phones')} />
              </Form.Item>
            ) : (
              <Form.Item
                label={t('smsCenterPage.send.fields.phone')}
                name="to"
                rules={[{ required: true, message: t('smsCenterPage.send.validation.phoneRequired') }]}
              >
                <Input placeholder={t('smsCenterPage.send.placeholders.phone')} />
              </Form.Item>
            )}

            <Form.Item
              label={t('smsCenterPage.send.fields.text')}
              name="text"
              rules={[{ required: true, message: t('smsCenterPage.send.validation.textRequired') }]}
            >
              <TextArea rows={4} placeholder={t('smsCenterPage.send.placeholders.text')} />
            </Form.Item>

            {mode === 'single' ? (
              <Form.Item label={t('smsCenterPage.send.fields.async')} name="async" valuePropName="checked">
                <Switch />
              </Form.Item>
            ) : null}

            <Space>
              <Button size="small" onClick={() => form.resetFields(['to', 'phone_numbers', 'text'])}>
                {t('smsCenterPage.common.clear')}
              </Button>
              <Button type="primary" size="small" htmlType="submit" icon={<SendOutlined />} loading={sending}>
                {t('smsCenterPage.send.submit')}
              </Button>
            </Space>
          </Space>
        </Form>
      </Space>
    </Card>
  );
}

export default function SmsCenterPage() {
  const tabs = [
    { key: 'send', label: t('smsCenterPage.tabs.send'), children: <SmsSendTab /> },
    { key: 'history', label: t('smsCenterPage.tabs.history'), children: <SmsHistoryTab /> },
  ];

  return <Tabs defaultActiveKey="send" items={tabs} />;
}
