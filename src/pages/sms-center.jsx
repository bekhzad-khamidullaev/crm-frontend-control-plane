import React, { useEffect, useState } from 'react';
import { Tabs, Card, Table, Form, Input, Button, Switch, message, Select } from 'antd';
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
          { title: 'Канал', dataIndex: 'channel_id', key: 'channel_id', width: 120 },
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
      const res = await smsApi.history({ page_size: 50 });
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
            dataIndex: 'channel_id',
            key: 'channel_id',
            width: 140,
            render: (value) => providerNameByChannel[value] || '-',
          },
          { title: 'Получатель', dataIndex: 'to', key: 'to' },
          { title: 'Текст', dataIndex: 'text', key: 'text' },
          { title: 'Статус', dataIndex: 'status', key: 'status', width: 120 },
          { title: 'Дата', dataIndex: 'created_at', key: 'created_at', width: 180 },
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

  return (
    <Card title="Статус SMS" extra={<Button onClick={load}>Обновить</Button>}>
      {loading ? 'Загрузка...' : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>}
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
