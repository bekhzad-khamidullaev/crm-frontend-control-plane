/**
 * TelegramConnect Component
 * Component for connecting Telegram Bot
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Card, App } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { connectTelegramBot, setTelegramWebhook } from '../lib/api/integrations/telegram';

const { Link, Paragraph } = Typography;

export default function TelegramConnect({ onSuccess, onCancel }) {
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

  const handleConnect = async (values) => {
    setLoading(true);
    try {
      const result = await connectTelegramBot(values);
      const botId = result?.id || result?.bot_id;

      if (botId && values.webhook_url) {
        await setTelegramWebhook(botId, { webhook_url: values.webhook_url });
      }

      message.success('Telegram бот успешно подключен');
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      message.error(getErrorText(error, 'Ошибка подключения Telegram бота'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="Подключение Telegram бота"
        description="Для подключения вам потребуется создать бота через @BotFather и получить токен"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="Инструкция по созданию бота" style={{ marginBottom: 24 }}>
        <Typography>
          <Paragraph>
            <strong>1. Создайте бота через @BotFather</strong>
          </Paragraph>
          <Paragraph>
            • Откройте Telegram и найдите{' '}
            <Link href="https://t.me/BotFather" target="_blank">
              @BotFather
            </Link>
          </Paragraph>
          <Paragraph>
            • Отправьте команду <code>/newbot</code>
          </Paragraph>
          <Paragraph>
            • Следуйте инструкциям: введите имя бота и username
          </Paragraph>
          <Paragraph>
            • Сохраните токен, который пришлет BotFather (выглядит как: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)
          </Paragraph>

          <Paragraph style={{ marginTop: 16 }}>
            <strong>2. Настройте бота (опционально)</strong>
          </Paragraph>
          <Paragraph>
            • <code>/setdescription</code> - установить описание бота
          </Paragraph>
          <Paragraph>
            • <code>/setabouttext</code> - текст "О боте"
          </Paragraph>
          <Paragraph>
            • <code>/setuserpic</code> - установить аватар бота
          </Paragraph>
          <Paragraph>
            • <code>/setcommands</code> - настроить команды бота
          </Paragraph>
        </Typography>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleConnect}
      >
        <Form.Item
          label="Bot Token"
          name="bot_token"
          rules={[
            { required: true, message: 'Введите токен бота' },
            { 
              pattern: /^\d+:[A-Za-z0-9_-]+$/, 
              message: 'Неверный формат токена (должен быть: 123456:ABC-DEF...)' 
            },
          ]}
          extra="Токен бота, который вы получили от @BotFather"
        >
          <Input.Password
            prefix={<SendOutlined />}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          />
        </Form.Item>

        <Alert
          message="Webhook URL"
          description={
            <div>
              <Paragraph>
                При необходимости укажите URL, на который Telegram будет отправлять события:
              </Paragraph>
              <Form.Item name="webhook_url" style={{ marginBottom: 0 }}>
                <Input placeholder="https://crm.example.com/api/telegram/webhook/" />
              </Form.Item>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Alert
          message="Важные заметки"
          description={
            <ul style={{ marginBottom: 0 }}>
              <li>Убедитесь, что ваш сервер доступен из интернета для получения webhook'ов</li>
              <li>Telegram требует HTTPS для webhook (в dev режиме можно использовать ngrok)</li>
              <li>Бот будет получать все сообщения, отправленные ему пользователями</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
              Подключить Telegram бота
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Отмена
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
