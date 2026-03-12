import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Card, Table, Form, Input, Button, Switch, message, Select, Row, Col, Statistic, Tag, Empty, Descriptions } from 'antd';
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
    <Card title="SMS провайдеры" extra={<Button onClick={load}>Обновить</Button>}>
      <Table
        dataSource={data}
        rowKey={(record) => record.id || record.name || record.channel_id || Math.random()}
        loading={loading}
        columns={[
          { title: 'Название', dataIndex: 'name', key: 'name' },
          {
            title: 'Канал',
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
    <Card title="История SMS" extra={<Button onClick={load}>Обновить</Button>}>
      <Table
        dataSource={data}
        rowKey={(record) => record.id || record.message_id || Math.random()}
        loading={loading}
        columns={[
          {
            title: 'Канал',
            dataIndex: 'provider',
            key: 'provider',
            width: 140,
            render: (_value, record) =>
              providerNameByChannel[record.channel_id || record.id] ||
              record.provider ||
              record.type_display ||
              '-',
          },
          { title: 'Получатель', dataIndex: 'phone', key: 'phone' },
          { title: 'Текст', dataIndex: 'text', key: 'text' },
          { title: 'Статус', dataIndex: 'status', key: 'status', width: 120 },
          { title: 'Дата', dataIndex: 'sent_at', key: 'sent_at', width: 180 },
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
    <Card title="Статус SMS" extra={<Button onClick={load}>Обновить</Button>}>
      {loading ? (
        'Загрузка...'
      ) : !data ? (
        <Empty description="Нет данных по SMS-статусу" />
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
                    <Tag color={row.value ? 'green' : 'default'}>{row.value ? 'Да' : 'Нет'}</Tag>
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
                        title: 'Значение',
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
        await smsApi.sendBulk({
          channel_id: values.channel_id,
          phone_numbers: phoneNumbers,
          text: values.text,
        });
      } else {
        await smsApi.send({
          channel_id: values.channel_id,
          to: values.to,
          text: values.text,
          async: values.async,
        });
      }
      message.success('SMS отправлено');
      form.resetFields();
    } catch (error) {
      message.error('Не удалось отправить SMS');
    }
  };

  return (
    <Card title={bulk ? 'Отправка SMS (Bulk)' : 'Отправка SMS'}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ async: true }}>
        <Form.Item label="Канал" name="channel_id" rules={[{ required: true, message: 'Укажите канал' }]}>
          <Select
            loading={providersLoading}
            placeholder="Выберите канал"
            options={(providers || []).map((provider) => ({
              value: provider.channel_id || provider.id,
              label: provider.name || provider.provider || provider.title || 'Канал',
            }))}
          />
        </Form.Item>
        {bulk ? (
          <Form.Item label="Телефоны (по одному на строку)" name="phone_numbers" rules={[{ required: true, message: 'Укажите номера' }]}>
            <TextArea rows={4} />
          </Form.Item>
        ) : (
          <Form.Item label="Телефон" name="to" rules={[{ required: true, message: 'Укажите номер' }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item label="Текст" name="text" rules={[{ required: true, message: 'Введите текст' }]}>
          <TextArea rows={4} />
        </Form.Item>
        {!bulk && (
          <Form.Item label="Отправлять асинхронно" name="async" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
        <Button type="primary" htmlType="submit">
          Отправить
        </Button>
      </Form>
    </Card>
  );
}

export default function SmsCenterPage() {
  const tabs = [
    { key: 'providers', label: 'Провайдеры', children: <ProvidersTab /> },
    { key: 'history', label: 'История', children: <HistoryTab /> },
    { key: 'status', label: 'Статус', children: <StatusTab /> },
    { key: 'send', label: 'Отправка', children: <SendTab /> },
    { key: 'send-bulk', label: 'Bulk', children: <SendTab bulk /> },
  ];

  return <Tabs items={tabs} />;
}
