/**
 * TelegramConnect Component
 * Component for connecting Telegram Bot
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Card, App } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { connectTelegramBot, setTelegramWebhook } from '../lib/api/integrations/telegram';
import { apiConfig } from '../lib/api/client';
import { t } from '../lib/i18n';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

const { Link, Paragraph } = Typography;

const getDefaultTelegramWebhookUrl = () => {
  if (typeof window === 'undefined') return '';

  const fallbackOrigin = window.location.origin;
  try {
    const origin = new URL(apiConfig?.baseUrl || fallbackOrigin, fallbackOrigin).origin;
    return `${origin.replace(/\/+$/, '')}/api/telegram/webhook/`;
  } catch {
    return `${fallbackOrigin.replace(/\/+$/, '')}/api/telegram/webhook/`;
  }
};

export default function TelegramConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const defaultWebhookUrl = getDefaultTelegramWebhookUrl();
  const webhookUrlValue = Form.useWatch('webhook_url', form);

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

      message.success(tr('telegramConnect.messages.connected', 'Telegram бот успешно подключен'));
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      message.error(getErrorText(error, tr('telegramConnect.messages.connectError', 'Ошибка подключения Telegram бота')));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhookUrl = async () => {
    const value = (webhookUrlValue || '').trim();
    if (!value) {
      message.warning(tr('telegramConnect.messages.webhookEmpty', 'Webhook URL пустой'));
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      message.success(tr('telegramConnect.messages.webhookCopied', 'Webhook URL скопирован'));
    } catch (error) {
      message.error(tr('telegramConnect.messages.webhookCopyError', 'Не удалось скопировать Webhook URL'));
    }
  };

  return (
    <div>
      <Alert
        message={tr('telegramConnect.alert.title', 'Подключение Telegram бота')}
        description={tr('telegramConnect.alert.description', 'Для подключения вам потребуется создать бота через @BotFather и получить токен')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title={tr('telegramConnect.guide.title', 'Инструкция по созданию бота')} style={{ marginBottom: 24 }}>
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
            {tr('telegramConnect.guide.aboutText', '• /setabouttext - текст "О боте"')}
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
        initialValues={{ webhook_url: defaultWebhookUrl }}
        onFinish={handleConnect}
      >
        <Form.Item
          label="Bot Token"
          name="bot_token"
            rules={[
            { required: true, message: tr('telegramConnect.validation.enterToken', 'Введите токен бота') },
            { 
              pattern: /^\d+:[A-Za-z0-9_-]+$/, 
              message: tr('telegramConnect.validation.tokenFormat', 'Неверный формат токена (должен быть: 123456:ABC-DEF...)') 
            },
          ]}
          extra={tr('telegramConnect.fields.tokenExtra', 'Токен бота, который вы получили от @BotFather')}
        >
          <Input.Password
            prefix={<ChannelBrandIcon channel="telegram" size={16} />}
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
                <Input
                  placeholder={defaultWebhookUrl || 'https://crm.example.com/api/telegram/webhook/'}
                  addonAfter={
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={handleCopyWebhookUrl}
                    >
                      {tr('telegramConnect.actions.copy', 'Скопировать')}
                    </Button>
                  }
                />
              </Form.Item>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Alert
          message={tr('telegramConnect.notes.title', 'Важные заметки')}
          description={
            <ul style={{ marginBottom: 0 }}>
              <li>{tr('telegramConnect.notes.serverReachable', "Убедитесь, что ваш сервер доступен из интернета для получения webhook'ов")}</li>
              <li>Telegram требует HTTPS для webhook (в dev режиме можно использовать ngrok)</li>
              <li>{tr('telegramConnect.notes.botReceivesAll', 'Бот будет получать все сообщения, отправленные ему пользователями')}</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<ChannelBrandIcon channel="telegram" size={16} />}
            >
              {tr('telegramConnect.actions.connect', 'Подключить Telegram бота')}
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                {tr('actions.cancel', 'Отмена')}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
