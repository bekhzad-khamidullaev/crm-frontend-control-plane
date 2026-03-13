import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Card, Table, Form, Input, Button, Switch, message, Select, Row, Col, Statistic, Tag, Empty, Descriptions } from 'antd';
import { t } from '../lib/i18n/index.js';
import smsApi from '../lib/api/sms.js';

const { TextArea } = Input;

function ProvidersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await smsApi.providers();
      setData(res?.results || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card title={t('smsCenterPage.providers.title')} extra={<Button onClick={load}>{t('smsCenterPage.common.refresh')}</Button>}>
      <Table
        dataSource={data}
        rowKey={(record) => record.id || record.name || record.channel_id || Math.random()}
        loading={loading}
        columns={[
          { title: t('smsCenterPage.providers.columns.name'), dataIndex: 'name', key: 'name' },
          {
            title: t('smsCenterPage.common.channel'),
            key: 'channel',
            width: 140,
            render: (_, record) => record.type_display || record.type || record.channel_id || '-',
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

function HistoryTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await smsApi.history({ limit: 50 });
      setData(res?.results || res || []);
      const providersRes = await smsApi.providers();
      setProviders(providersRes?.results || providersRes || []);
    } finally {
      setLoading(false);
    }
  };

  const providerNameByChannel = providers.reduce((acc, provider) => {
    const key = provider.channel_id || provider.id;
    if (key !== undefined) {
      acc[key] = provider.name || provider.provider || provider.title || '-';
    }
    return acc;
  }, {});

  useEffect(() => {
    load();
  }, []);

  return (
    <Card title={t('smsCenterPage.history.title')} extra={<Button onClick={load}>{t('smsCenterPage.common.refresh')}</Button>}>
      <Table
        dataSource={data}
        rowKey={(record) => record.id || record.message_id || Math.random()}
        loading={loading}
        columns={[
          {
            title: t('smsCenterPage.common.channel'),
            dataIndex: 'provider',
            key: 'provider',
            width: 140,
            render: (_value, record) =>
              providerNameByChannel[record.channel_id] ||
              record.provider_display ||
              record.provider ||
              record.type_display ||
              '-',
          },
          { title: t('smsCenterPage.history.columns.recipient'), dataIndex: 'phone', key: 'phone' },
          { title: t('smsCenterPage.history.columns.text'), dataIndex: 'text', key: 'text' },
          { title: t('smsCenterPage.history.columns.status'), dataIndex: 'status', key: 'status', width: 120 },
          { title: t('smsCenterPage.history.columns.date'), dataIndex: 'sent_at', key: 'sent_at', width: 180 },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

function StatusTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await smsApi.status();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scalarRows = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data)
      .filter(([, value]) => !Array.isArray(value) && (typeof value !== 'object' || value === null))
      .map(([key, value]) => ({ key, label: key.replace(/_/g, ' '), value }));
  }, [data]);

  const collectionRows = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data)
      .filter(([, value]) => Array.isArray(value) || (value && typeof value === 'object'))
      .map(([key, value]) => ({
        key,
        label: key.replace(/_/g, ' '),
        value,
      }));
  }, [data]);

  return (
    <Card title={t('smsCenterPage.status.title')} extra={<Button onClick={load}>{t('smsCenterPage.common.refresh')}</Button>}>
      {loading ? (
        t('smsCenterPage.common.loading')
      ) : !data ? (
        <Empty description={t('smsCenterPage.status.empty')} />
      ) : (
        <Row gutter={[16, 16]}>
          {scalarRows.map((row) => (
            <Col xs={24} md={8} key={row.key}>
              <Card size="small">
                {typeof row.value === 'number' ? (
                  <Statistic title={row.label} value={row.value} />
                ) : typeof row.value === 'boolean' ? (
                  <>
                    <div style={{ marginBottom: 8, color: '#71717a' }}>{row.label}</div>
                    <Tag color={row.value ? 'green' : 'default'}>{row.value ? t('smsCenterPage.common.yes') : t('smsCenterPage.common.no')}</Tag>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 8, color: '#71717a' }}>{row.label}</div>
                    <strong>{String(row.value ?? '-')}</strong>
                  </>
                )}
              </Card>
            </Col>
          ))}
          {collectionRows.map((row) => (
            <Col xs={24} key={row.key}>
              <Card size="small" title={row.label}>
                {Array.isArray(row.value) ? (
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={row.value.map((item, index) => ({ key: index, value: item }))}
                    columns={[
                      {
                        title: t('smsCenterPage.status.value'),
                        dataIndex: 'value',
                        key: 'value',
                        render: (value) =>
                          typeof value === 'object' ? (
                            <Descriptions size="small" column={1}>
                              {Object.entries(value || {}).map(([key, nestedValue]) => (
                                <Descriptions.Item key={key} label={key.replace(/_/g, ' ')}>
                                  {String(nestedValue ?? '-')}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          ) : (
                            String(value ?? '-')
                          ),
                      },
                    ]}
                  />
                ) : (
                  <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
                    {Object.entries(row.value || {}).map(([key, nestedValue]) => (
                      <Descriptions.Item key={key} label={key.replace(/_/g, ' ')}>
                        {String(nestedValue ?? '-')}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}

function SendTab({ bulk = false }) {
  const [form] = Form.useForm();
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      setProvidersLoading(true);
      try {
        const res = await smsApi.providers();
        setProviders(res?.results || res || []);
      } finally {
        setProvidersLoading(false);
      }
    };
    loadProviders();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (bulk) {
        const phoneNumbers = values.phone_numbers
          .split('\n')
          .map((v) => v.trim())
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
      form.resetFields();
    } catch (error) {
      message.error(t('smsCenterPage.messages.sendError'));
    }
  };

  return (
    <Card title={bulk ? t('smsCenterPage.send.bulkTitle') : t('smsCenterPage.send.title')}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ async: true }}>
        <Form.Item label={t('smsCenterPage.common.channel')} name="channel_id" rules={[{ required: true, message: t('smsCenterPage.send.validation.channelRequired') }]}>
          <Select
            loading={providersLoading}
            placeholder={t('smsCenterPage.send.placeholders.selectChannel')}
            options={(providers || []).map((provider) => ({
              value: provider.channel_id || provider.id,
              label: provider.name || provider.provider || provider.title || t('smsCenterPage.common.channel'),
            }))}
          />
        </Form.Item>
        {bulk ? (
          <Form.Item label={t('smsCenterPage.send.fields.phones')} name="phone_numbers" rules={[{ required: true, message: t('smsCenterPage.send.validation.numbersRequired') }]}>
            <TextArea rows={4} />
          </Form.Item>
        ) : (
          <Form.Item label={t('smsCenterPage.send.fields.phone')} name="to" rules={[{ required: true, message: t('smsCenterPage.send.validation.phoneRequired') }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item label={t('smsCenterPage.send.fields.text')} name="text" rules={[{ required: true, message: t('smsCenterPage.send.validation.textRequired') }]}>
          <TextArea rows={4} />
        </Form.Item>
        {!bulk && (
          <Form.Item label={t('smsCenterPage.send.fields.async')} name="async" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
        <Button type="primary" htmlType="submit">
          {t('smsCenterPage.send.submit')}
        </Button>
      </Form>
    </Card>
  );
}

export default function SmsCenterPage() {
  const tabs = [
    { key: 'providers', label: t('smsCenterPage.tabs.providers'), children: <ProvidersTab /> },
    { key: 'history', label: t('smsCenterPage.tabs.history'), children: <HistoryTab /> },
    { key: 'status', label: t('smsCenterPage.tabs.status'), children: <StatusTab /> },
    { key: 'send', label: t('smsCenterPage.tabs.send'), children: <SendTab /> },
    { key: 'send-bulk', label: 'Bulk', children: <SendTab bulk /> },
  ];

  return <Tabs items={tabs} />;
}
