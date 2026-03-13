/**
 * InstagramConnect Component
 * Component for connecting Instagram Business API
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Steps, Card, App, Select } from 'antd';
import { InstagramOutlined, ReloadOutlined } from '@ant-design/icons';
import { connectInstagram, discoverInstagramAccounts } from '../lib/api/integrations/instagram';
import { t } from '../lib/i18n';

const { Link, Paragraph } = Typography;
const { Step } = Steps;

export default function InstagramConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

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
      const result = await connectInstagram(values);
      message.success(tr('instagramConnect.messages.connected', 'Instagram подключен'));
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      message.error(getErrorText(error, tr('instagramConnect.messages.connectError', 'Ошибка подключения Instagram')));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    const accessToken = (form.getFieldValue('access_token') || '').trim();
    if (!accessToken) {
      message.warning(tr('instagramConnect.messages.enterAccessToken', 'Сначала укажите Access Token'));
      return;
    }
    setDiscovering(true);
    try {
      const response = await discoverInstagramAccounts(accessToken);
      const items = Array.isArray(response?.results) ? response.results : [];
      setAccounts(items);
      if (!items.length) {
        message.warning(tr('instagramConnect.messages.accountsNotFound', 'По этому токену Instagram аккаунты не найдены'));
        return;
      }
      const first = items[0];
      form.setFieldsValue({
        instagram_user_id: first.instagram_user_id,
        username: first.username,
        facebook_page_id: first.facebook_page_id || '',
        facebook_page_name: first.facebook_page_name || '',
      });
      message.success(tr('instagramConnect.messages.accountsFound', 'Найдено аккаунтов: {count}', { count: items.length }));
    } catch (error) {
      console.error('Error discovering Instagram accounts:', error);
      message.error(getErrorText(error, tr('instagramConnect.messages.loadAccountsError', 'Не удалось загрузить Instagram аккаунты')));
    } finally {
      setDiscovering(false);
    }
  };

  const accountOptions = accounts.map((account) => ({
    value: account.instagram_user_id,
    label: `@${account.username} (${account.instagram_user_id})`,
    username: account.username,
    facebookPageId: account.facebook_page_id,
    facebookPageName: account.facebook_page_name,
  }));

  return (
    <div>
      <Alert
        message={tr('instagramConnect.alert.title', 'Подключение Instagram Business')}
        description={tr('instagramConnect.alert.description', 'Для подключения вам потребуется Instagram Business аккаунт и токен доступа от Facebook Developers')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title={tr('instagramConnect.steps.createApp', 'Создание приложения')} description="Facebook Developers" />
        <Step title={tr('instagramConnect.steps.getToken', 'Получение токена')} description="Access Token" />
        <Step title={tr('instagramConnect.steps.connect', 'Подключение')} description={tr('instagramConnect.steps.inputData', 'Ввод данных')} />
      </Steps>

      {currentStep === 0 && (
        <Card>
          <Typography>
            <Paragraph>
              <strong>{tr('instagramConnect.guides.step1Title', 'Шаг 1: Создайте приложение в Facebook Developers')}</strong>
            </Paragraph>
            <Paragraph>
              1. Перейдите на{' '}
              <Link href="https://developers.facebook.com" target="_blank">
                developers.facebook.com
              </Link>
            </Paragraph>
            <Paragraph>
              2. Создайте новое приложение и выберите тип "Business"
            </Paragraph>
            <Paragraph>
              {tr('instagramConnect.guides.step1Item3', '3. Добавьте продукт "Instagram Basic Display" или "Instagram Graph API"')}
            </Paragraph>
            <Paragraph>
              4. Настройте права доступа: instagram_basic, instagram_manage_messages
            </Paragraph>
          </Typography>
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            {tr('common.next', 'Далее')}
          </Button>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <Typography>
            <Paragraph>
              <strong>{tr('instagramConnect.guides.step2Title', 'Шаг 2: Получите токен доступа')}</strong>
            </Paragraph>
            <Paragraph>
              {tr('instagramConnect.guides.step2Item1', '1. В настройках приложения перейдите в раздел "Instagram Basic Display" или "Instagram Graph API"')}
            </Paragraph>
            <Paragraph>
              2. Создайте токен доступа с необходимыми правами
            </Paragraph>
            <Paragraph>
              3. Сохраните токен и ID вашего Instagram Business аккаунта
            </Paragraph>
          </Typography>
          <Space>
            <Button onClick={() => setCurrentStep(0)}>{tr('actions.back', 'Назад')}</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>
              {tr('common.next', 'Далее')}
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 2 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConnect}
        >
          <Form.Item
            label="Access Token"
            name="access_token"
            rules={[
              { required: true, message: tr('instagramConnect.validation.enterToken', 'Введите токен доступа') },
              { min: 20, message: tr('instagramConnect.validation.tokenShort', 'Токен слишком короткий') },
            ]}
            extra={tr('instagramConnect.fields.tokenExtra', 'Токен доступа от Facebook для Instagram Business API')}
          >
            <Input.Password
              prefix={<InstagramOutlined />}
              placeholder="EAAxxxxxxxxxxxxx"
            />
          </Form.Item>

          <Form.Item>
            <Button icon={<ReloadOutlined />} onClick={handleDiscover} loading={discovering}>
              {tr('instagramConnect.actions.loadFromMeta', 'Загрузить аккаунты из Meta')}
            </Button>
          </Form.Item>

          <Form.Item
            label={tr('instagramConnect.fields.accountId', 'Идентификатор Instagram Business аккаунта')}
            name="instagram_user_id"
            rules={[
              { required: true, message: tr('instagramConnect.validation.enterAccountId', 'Введите идентификатор аккаунта') },
              { pattern: /^\d+$/, message: tr('instagramConnect.validation.accountIdDigits', 'Идентификатор должен содержать только цифры') },
            ]}
            extra={tr('instagramConnect.fields.accountIdExtra', 'Числовой идентификатор вашего Instagram Business аккаунта')}
          >
            <Select
              placeholder={tr('instagramConnect.placeholders.selectAccount', 'Выберите Instagram аккаунт')}
              options={accountOptions}
              showSearch
              optionFilterProp="label"
              onChange={(value, option) => {
                if (option?.username) {
                  form.setFieldValue('username', option.username);
                }
                if (option?.facebookPageId) {
                  form.setFieldValue('facebook_page_id', option.facebookPageId);
                }
                if (option?.facebookPageName) {
                  form.setFieldValue('facebook_page_name', option.facebookPageName);
                }
              }}
            />
          </Form.Item>

          <Form.Item name="facebook_page_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="facebook_page_name" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: tr('instagramConnect.validation.enterUsername', 'Введите username') },
            ]}
            extra={tr('instagramConnect.fields.usernameExtra', 'Username Instagram Business аккаунта')}
          >
            <Input placeholder="your_business" />
          </Form.Item>

          <Alert
            message={tr('common.important', 'Важно')}
            description={tr('instagramConnect.warning.businessAccount', 'Убедитесь, что ваш Instagram аккаунт является Business аккаунтом и подключен к Facebook странице')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                {tr('actions.back', 'Назад')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {tr('instagramConnect.actions.connect', 'Подключить Instagram')}
              </Button>
              {onCancel && (
                <Button onClick={onCancel}>
                  {tr('actions.cancel', 'Отмена')}
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      )}
    </div>
  );
}
