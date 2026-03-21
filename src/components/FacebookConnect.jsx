/**
 * FacebookConnect Component
 * Component for connecting Facebook Messenger
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Card, App, Select } from 'antd';
import { FacebookOutlined, ReloadOutlined } from '@ant-design/icons';
import { connectFacebook, discoverFacebookPages } from '../lib/api/integrations/facebook';
import { t } from '../lib/i18n';

const { Link, Paragraph } = Typography;

export default function FacebookConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [pages, setPages] = useState([]);

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
    <div>
      <Alert
        message={tr('facebookConnect.alert.title', 'Подключение Facebook Messenger')}
        description={tr('facebookConnect.alert.description', 'Для подключения вам потребуется Facebook страница и токен доступа с правами manage_pages и pages_messaging')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title={tr('facebookConnect.guide.title', 'Инструкция по подключению')} style={{ marginBottom: 24 }}>
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
            prefix={<FacebookOutlined />}
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
          <Button icon={<ReloadOutlined />} onClick={handleDiscover} loading={discovering}>
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
            <div>
              Убедитесь, что токен имеет следующие права:
              <ul>
                <li>pages_messaging - для отправки и получения сообщений</li>
                <li>pages_manage_metadata - для управления настройками</li>
                <li>pages_read_engagement - для чтения взаимодействий</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item>
          <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<FacebookOutlined />}>
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
    </div>
  );
}
