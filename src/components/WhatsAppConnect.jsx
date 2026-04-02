import React, { useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Select, Space, Switch, theme as antdTheme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { connectWhatsAppAccount, discoverWhatsAppAssets } from '../lib/api/integrations/whatsapp.js';
import { t } from '../lib/i18n';
import { useTheme } from '../lib/hooks/useTheme';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

const idsEqual = (left, right) => String(left) === String(right);

export default function WhatsAppConnect({ onSuccess, onCancel }) {
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
  const [metaAssets, setMetaAssets] = useState([]);
  const selectedBusinessId = Form.useWatch('business_account_id', form);
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

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await connectWhatsAppAccount(values);
      message.success(tr('whatsappConnect.messages.connected', 'WhatsApp Business подключен'));
      onSuccess?.(result);
    } catch (error) {
      message.error(getErrorText(error, tr('whatsappConnect.messages.connectError', 'Ошибка подключения WhatsApp Business')));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    const accessToken = (form.getFieldValue('access_token') || '').trim();
    if (!accessToken) {
      message.warning(tr('whatsappConnect.messages.enterToken', 'Сначала укажите Access token'));
      return;
    }

    setDiscovering(true);
    try {
      const response = await discoverWhatsAppAssets(accessToken);
      const items = Array.isArray(response?.results) ? response.results : [];
      setMetaAssets(items);
      if (!items.length) {
        message.warning(tr('whatsappConnect.messages.numbersNotFound', 'Не удалось найти WhatsApp номера для этого токена'));
        return;
      }

      const first = items[0];
      form.setFieldsValue({
        business_account_id: first.business_account_id,
        phone_number_id: first.phone_number_id,
        phone_number: first.display_phone_number || form.getFieldValue('phone_number'),
        business_name: form.getFieldValue('business_name') || first.business_name,
      });
      message.success(tr('whatsappConnect.messages.numbersFound', 'Найдено номеров: {count}', { count: items.length }));
    } catch (error) {
      message.error(getErrorText(error, tr('whatsappConnect.messages.loadMetaError', 'Не удалось загрузить данные из Meta')));
    } finally {
      setDiscovering(false);
    }
  };

  const businessOptions = Array.from(
    new Map(
      metaAssets.map((asset) => [
        asset.business_account_id,
        {
          value: asset.business_account_id,
          label: `${asset.business_name || 'WhatsApp Business'} (${asset.business_account_id})`,
          businessName: asset.business_name || '',
        },
      ])
    ).values()
  );
  const phoneOptions = metaAssets
    .filter((asset) => !selectedBusinessId || idsEqual(asset.business_account_id, selectedBusinessId))
    .map((asset) => ({
      value: asset.phone_number_id,
      label: `${asset.display_phone_number || asset.phone_number_id}${asset.verified_name ? ` (${asset.verified_name})` : ''}`,
      businessId: asset.business_account_id,
      displayPhoneNumber: asset.display_phone_number || '',
      businessName: asset.business_name || '',
    }));

  return (
    <div style={{ color: token.colorText }}>
      <Alert
        type="info"
        showIcon
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.28)' : token.colorInfoBorder}`,
          background: isDark ? 'rgba(10, 19, 35, 0.92)' : token.colorInfoBg,
        }}
        message={tr('whatsappConnect.alert.title', 'Подключение WhatsApp Cloud API')}
        description={tr('whatsappConnect.alert.description', 'Укажите Access token и подтяните Business Account/Phone Number ID автоматически из Meta.')}
      />

      <Card
        title={tr('whatsappConnect.form.title', 'Данные подключения')}
        style={surfaceCardStyle}
        styles={{ body: { padding: 24 } }}
      >
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
        <Form.Item>
          <Button type="primary" ghost={isDark} icon={<ReloadOutlined />} onClick={handleDiscover} loading={discovering}>
            {tr('whatsappConnect.actions.loadFromMeta', 'Загрузить номера из Meta')}
          </Button>
        </Form.Item>

        <Form.Item
          label={tr('whatsappConnect.fields.accountName', 'Название аккаунта')}
          name="business_name"
          rules={[{ required: true, message: tr('whatsappConnect.validation.enterAccountName', 'Введите название аккаунта') }]}
        >
          <Input prefix={<ChannelBrandIcon channel="whatsapp" size={16} />} placeholder="Main WhatsApp" />
        </Form.Item>

        <Form.Item
          label="Display phone number"
          name="phone_number"
          rules={[{ required: true, message: tr('whatsappConnect.validation.enterPhone', 'Введите номер WhatsApp') }]}
        >
          <Input placeholder="+998901112233" />
        </Form.Item>

        <Form.Item
          label="Phone number ID"
          name="phone_number_id"
          rules={[{ required: true, message: tr('whatsappConnect.validation.selectPhoneId', 'Выберите phone_number_id') }]}
        >
          <Select
            placeholder={tr('whatsappConnect.placeholders.selectPhoneFromMeta', 'Выберите номер из Meta')}
            options={phoneOptions}
            showSearch
            optionFilterProp="label"
            onChange={(value, option) => {
              if (option?.businessId) {
                form.setFieldValue('business_account_id', option.businessId);
              }
              if (option?.displayPhoneNumber) {
                form.setFieldValue('phone_number', option.displayPhoneNumber);
              }
              if (option?.businessName && !form.getFieldValue('business_name')) {
                form.setFieldValue('business_name', option.businessName);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Business account ID"
          name="business_account_id"
          rules={[{ required: true, message: tr('whatsappConnect.validation.selectBusinessAccount', 'Выберите business account') }]}
        >
          <Select
            placeholder={tr('whatsappConnect.placeholders.selectBusinessAccount', 'Выберите бизнес-аккаунт')}
            options={businessOptions}
            showSearch
            optionFilterProp="label"
            onChange={(value, option) => {
              if (option?.businessName && !form.getFieldValue('business_name')) {
                form.setFieldValue('business_name', option.businessName);
              }
              const matchingPhone = phoneOptions.find((item) => idsEqual(item.businessId, value));
              if (matchingPhone && !form.getFieldValue('phone_number_id')) {
                form.setFieldValue('phone_number_id', matchingPhone.value);
                if (matchingPhone.displayPhoneNumber) {
                  form.setFieldValue('phone_number', matchingPhone.displayPhoneNumber);
                }
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Access token"
          name="access_token"
          rules={[{ required: true, message: tr('whatsappConnect.validation.enterAccessToken', 'Введите access token') }]}
        >
          <Input.Password placeholder="EAAG..." />
        </Form.Item>

        <Form.Item label="App secret" name="app_secret">
          <Input.Password placeholder="Meta app secret (optional)" />
        </Form.Item>

        <Form.Item label="Verify token" name="verify_token">
          <Input placeholder="verify-token-for-webhook" />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item label={tr('whatsappConnect.fields.active', 'Активен')} name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label={tr('whatsappConnect.fields.autoSync', 'Автосинк')} name="auto_sync_messages" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label={tr('whatsappConnect.fields.autoLeads', 'Авто-лиды')} name="auto_create_leads" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={loading}>
                {tr('whatsappConnect.actions.connect', 'Подключить WhatsApp')}
              </Button>
              {onCancel && <Button onClick={onCancel}>{tr('actions.cancel', 'Отмена')}</Button>}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
