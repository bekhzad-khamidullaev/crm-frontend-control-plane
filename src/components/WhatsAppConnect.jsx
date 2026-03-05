import React, { useState } from 'react';
import { Alert, App, Button, Form, Input, Space, Switch } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { connectWhatsAppAccount } from '../lib/api/integrations/whatsapp.js';

export default function WhatsAppConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const getErrorText = (error, fallback) => {
    const details = error?.details || {};
    if (typeof details === 'string') return details;
    if (typeof details?.message === 'string') return details.message;
    if (typeof details?.error === 'string') return details.error;
    if (typeof details?.detail === 'string') return details.detail;
    if (typeof error?.message === 'string' && !error.message.startsWith('HTTP ')) return error.message;
    return fallback;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await connectWhatsAppAccount(values);
      message.success('WhatsApp Business подключен');
      onSuccess?.(result);
    } catch (error) {
      message.error(getErrorText(error, 'Ошибка подключения WhatsApp Business'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Подключение WhatsApp Cloud API"
        description="Заполните данные Business Account, phone number ID и токен Meta Graph API."
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
          auto_sync_messages: true,
          auto_create_leads: true,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Название аккаунта"
          name="business_name"
          rules={[{ required: true, message: 'Введите название аккаунта' }]}
        >
          <Input prefix={<MessageOutlined />} placeholder="Main WhatsApp" />
        </Form.Item>

        <Form.Item
          label="Display phone number"
          name="phone_number"
          rules={[{ required: true, message: 'Введите номер WhatsApp' }]}
        >
          <Input placeholder="+998901112233" />
        </Form.Item>

        <Form.Item
          label="Phone number ID"
          name="phone_number_id"
          rules={[{ required: true, message: 'Введите phone_number_id' }]}
        >
          <Input placeholder="123456789012345" />
        </Form.Item>

        <Form.Item label="Business account ID" name="business_account_id">
          <Input placeholder="987654321098765" />
        </Form.Item>

        <Form.Item
          label="Access token"
          name="access_token"
          rules={[{ required: true, message: 'Введите access token' }]}
        >
          <Input.Password placeholder="EAAG..." />
        </Form.Item>

        <Form.Item label="App secret" name="app_secret">
          <Input.Password placeholder="Meta app secret (optional)" />
        </Form.Item>

        <Form.Item label="Verify token" name="verify_token">
          <Input placeholder="verify-token-for-webhook" />
        </Form.Item>

        <Space size="large">
          <Form.Item label="Активен" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Автосинк" name="auto_sync_messages" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Авто-лиды" name="auto_create_leads" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Подключить WhatsApp
            </Button>
            {onCancel && <Button onClick={onCancel}>Отмена</Button>}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
