/**
 * FacebookConnect Component
 * Component for connecting Facebook Messenger
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Card, App, Select, theme as antdTheme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { connectFacebook, discoverFacebookPages } from '../lib/api/integrations/facebook';
import { t } from '../lib/i18n';
import { useTheme } from '../lib/hooks/useTheme';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

const { Link, Paragraph } = Typography;

export default function FacebookConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const { token } = antdTheme.useToken();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [pages, setPages] = useState([]);
  const surfaceCardStyle = {
    marginBottom: 24,
    borderRadius: 18,
    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.18)' : token.colorBorderSecondary}`,
    background: isDark ? 'rgba(12, 19, 32, 0.92)' : token.colorBgContainer,
    boxShadow: isDark ? '0 16px 30px rgba(2, 6, 23, 0.28)' : '0 12px 24px rgba(15, 23, 42, 0.06)',
  };

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
      const result = await connectFacebook(values);
      message.success(tr('facebookConnect.messages.connected', 'Facebook Messenger подключен'));
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      message.error(getErrorText(error, tr('facebookConnect.messages.connectError', 'Ошибка подключения Facebook Messenger')));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    const accessToken = (form.getFieldValue('access_token') || '').trim();
    if (!accessToken) {
      message.warning(tr('facebookConnect.messages.enterToken', 'Сначала укажите Page Access Token'));
      return;
    }
    setDiscovering(true);
    try {
      const response = await discoverFacebookPages(accessToken);
      const items = Array.isArray(response?.results) ? response.results : [];
      setPages(items);
      if (!items.length) {
        message.warning(tr('facebookConnect.messages.pagesNotFound', 'По этому токену страницы не найдены'));
        return;
      }
      const first = items[0];
      form.setFieldsValue({
        facebook_page_id: first.facebook_page_id,
        page_name: first.page_name,
        access_token: first.access_token || accessToken,
      });
      message.success(tr('facebookConnect.messages.pagesFound', 'Найдено страниц: {count}', { count: items.length }));
    } catch (error) {
      console.error('Error discovering Facebook pages:', error);
      message.error(getErrorText(error, tr('facebookConnect.messages.loadPagesError', 'Не удалось загрузить страницы из Meta')));
    } finally {
      setDiscovering(false);
    }
  };

  const pageOptions = pages.map((page) => ({
    value: page.facebook_page_id,
    label: `${page.page_name || 'Facebook Page'} (${page.facebook_page_id})`,
    pageName: page.page_name,
    accessToken: page.access_token,
  }));

  return (
    <div style={{ color: token.colorText }}>
      <Alert
        message={tr('facebookConnect.alert.title', 'Подключение Facebook Messenger')}
        description={tr('facebookConnect.alert.description', 'Для подключения вам потребуется Facebook страница и токен доступа с правами manage_pages и pages_messaging')}
        type="info"
        showIcon
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.28)' : token.colorInfoBorder}`,
          background: isDark ? 'rgba(10, 19, 35, 0.92)' : token.colorInfoBg,
        }}
      />

      <Card
        title={tr('facebookConnect.guide.title', 'Инструкция по подключению')}
        style={{ marginBottom: 24, borderRadius: 18 }}
        styles={{ body: { lineHeight: 1.6 } }}
      >
        <Typography>
          <Paragraph>
            <strong>1. Создайте приложение Facebook</strong>
          </Paragraph>
          <Paragraph>
            • Перейдите на{' '}
            <Link href="https://developers.facebook.com/apps" target="_blank">
              developers.facebook.com/apps
            </Link>
          </Paragraph>
          <Paragraph>
            • Создайте новое приложение типа "Business"
          </Paragraph>
          <Paragraph>
            • Добавьте продукт "Messenger"
          </Paragraph>

          <Paragraph style={{ marginTop: 16 }}>
            <strong>2. Получите токен доступа</strong>
          </Paragraph>
          <Paragraph>
            {tr('facebookConnect.guide.itemMessengerSettings', '• В разделе "Messenger" → "Settings" найдите "Access Tokens"')}
          </Paragraph>
          <Paragraph>
            • Выберите вашу Facebook страницу и получите токен
          </Paragraph>
          <Paragraph>
            • Токен должен иметь права: pages_messaging, pages_manage_metadata
          </Paragraph>

          <Paragraph style={{ marginTop: 16 }}>
            <strong>3. Получите ID страницы</strong>
          </Paragraph>
          <Paragraph>
            • Откройте вашу Facebook страницу
          </Paragraph>
          <Paragraph>
            • ID страницы находится в URL: facebook.com/[PAGE_ID]
          </Paragraph>
        </Typography>
      </Card>

      <Card
        title={tr('facebookConnect.form.title', 'Данные подключения')}
        style={surfaceCardStyle}
        styles={{ body: { padding: 24 } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConnect}
        >
        <Form.Item
          label="Page Access Token"
          name="access_token"
          rules={[
            { required: true, message: tr('facebookConnect.validation.enterToken', 'Введите токен доступа страницы') },
            { min: 20, message: tr('facebookConnect.validation.tokenShort', 'Токен слишком короткий') },
          ]}
          extra={tr('facebookConnect.fields.tokenExtra', 'Долгосрочный токен доступа вашей Facebook страницы')}
        >
          <Input.Password
            prefix={<ChannelBrandIcon channel="facebook" size={16} />}
            placeholder="EAAxxxxxxxxxxxxx"
          />
        </Form.Item>

        <Form.Item
          label="App Secret"
          name="app_secret"
          extra={tr('facebookConnect.fields.appSecretExtra', 'Используется для проверки подписи webhook (X-Hub-Signature-256)')}
        >
          <Input.Password placeholder="Meta app secret" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" ghost={isDark} icon={<ReloadOutlined />} onClick={handleDiscover} loading={discovering}>
            Загрузить страницы из Meta
          </Button>
        </Form.Item>

        <Form.Item
          label={tr('facebookConnect.fields.pageId', 'Идентификатор Facebook страницы')}
          name="facebook_page_id"
          rules={[
            { required: true, message: tr('facebookConnect.validation.enterPageId', 'Введите идентификатор страницы') },
          ]}
          extra={tr('facebookConnect.fields.pageIdExtra', 'Идентификатор вашей Facebook страницы (можно найти в настройках страницы)')}
        >
          <Select
            placeholder={tr('facebookConnect.placeholders.selectPage', 'Выберите страницу')}
            options={pageOptions}
            showSearch
            optionFilterProp="label"
            onChange={(value, option) => {
              if (option?.pageName) {
                form.setFieldValue('page_name', option.pageName);
              }
              if (option?.accessToken) {
                form.setFieldValue('access_token', option.accessToken);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label={tr('facebookConnect.fields.pageName', 'Название страницы')}
          name="page_name"
          rules={[
            { required: true, message: tr('facebookConnect.validation.enterPageName', 'Введите название страницы') },
          ]}
          extra={tr('facebookConnect.fields.pageNameExtra', 'Название страницы, которое отображается в Facebook')}
        >
          <Input placeholder="CRM Support" />
        </Form.Item>

        <Alert
          message={tr('facebookConnect.permissions.title', 'Проверка прав доступа')}
          description={
            <div style={{ lineHeight: 1.65 }}>
              Убедитесь, что токен имеет следующие права:
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>pages_messaging - для отправки и получения сообщений</li>
                <li>pages_manage_metadata - для управления настройками</li>
                <li>pages_read_engagement - для чтения взаимодействий</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{
            marginBottom: 16,
            borderRadius: 14,
            border: '1px solid rgba(250, 173, 20, 0.32)',
            background: isDark ? 'rgba(44, 28, 4, 0.92)' : token.colorWarningBg,
          }}
        />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ChannelBrandIcon channel="facebook" size={16} />}
              >
                {tr('facebookConnect.actions.connect', 'Подключить Facebook Messenger')}
              </Button>
              {onCancel && (
                <Button onClick={onCancel}>
                  {tr('actions.cancel', 'Отмена')}
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
