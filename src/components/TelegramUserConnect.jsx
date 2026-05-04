import React, { useState } from 'react';
import { Alert, App, Button, Form, Input, Space, Typography } from 'antd';
import { LinkOutlined, UserOutlined } from '@ant-design/icons';
import {
  connectTelegramUserAccount,
  getTelegramUserAccounts,
  requestTelegramUserCode,
  confirmTelegramUserCode,
  confirmTelegramUserPassword,
  syncTelegramUserInbox,
  updateTelegramUserAccount,
} from '../lib/api/integrations/telegram';
import { t } from '../lib/i18n';

const { Text } = Typography;

export default function TelegramUserConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState('');
  const [account, setAccount] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const getErrorText = (error, fallback) => {
    const details = error?.details || {};
    if (Array.isArray(details?.non_field_errors) && details.non_field_errors.length) {
      return String(details.non_field_errors[0]);
    }
    if (details && typeof details === 'object') {
      const firstFieldError = Object.values(details).find((entry) => {
        if (Array.isArray(entry) && entry.length > 0) return true;
        return typeof entry === 'string';
      });
      if (Array.isArray(firstFieldError) && firstFieldError.length) return String(firstFieldError[0]);
      if (typeof firstFieldError === 'string') return firstFieldError;
    }
    if (typeof details === 'string') return details;
    if (typeof details?.message === 'string') return details.message;
    if (typeof details?.error === 'string') return details.error;
    if (typeof details?.detail === 'string') return details.detail;
    if (typeof error?.message === 'string' && !error.message.startsWith('HTTP ')) return error.message;
    return fallback;
  };

  const normalizePhone = (raw) => String(raw || '').replace(/\s+/g, '').trim();

  const findExistingByPhone = async (phoneNumber) => {
    const response = await getTelegramUserAccounts({ page_size: 200 }).catch(() => null);
    const list = response?.results || response || [];
    return (Array.isArray(list) ? list : []).find(
      (item) => normalizePhone(item?.phone_number) === normalizePhone(phoneNumber)
    );
  };

  const startCodeFlow = async (targetAccount) => {
    const requested = await requestTelegramUserCode(targetAccount.id);
    setAccount({ ...targetAccount, ...requested });
    setCode('');
    setPassword('');
    form.resetFields(['phone_number', 'api_id', 'api_hash']);
    message.success(tr('telegramUserConnect.messages.codeRequested', 'Код подтверждения отправлен в Telegram'));
    onSuccess?.(targetAccount);
  };

  const handleConnect = async (values) => {
    setLoading(true);
    try {
      const phoneNumber = normalizePhone(values.phone_number);
      const existingAccount = await findExistingByPhone(phoneNumber);
      if (existingAccount?.id) {
        const updatePayload = {
          is_active: true,
        };
        const apiId = String(values.api_id || '').trim();
        const apiHash = String(values.api_hash || '').trim();
        if (apiId) updatePayload.api_id = apiId;
        if (apiHash) updatePayload.api_hash = apiHash;
        const updated = await updateTelegramUserAccount(existingAccount.id, updatePayload);
        await startCodeFlow(updated || existingAccount);
        return;
      }

      const payload = {
        is_active: true,
        phone_number: phoneNumber,
      };
      const apiId = String(values.api_id || '').trim();
      const apiHash = String(values.api_hash || '').trim();
      if (apiId) payload.api_id = apiId;
      if (apiHash) payload.api_hash = apiHash;
      const created = await connectTelegramUserAccount(payload);
      await startCodeFlow(created);
    } catch (error) {
      message.error(getErrorText(error, tr('telegramUserConnect.messages.connectError', 'Ошибка запуска авторизации Telegram')));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (!account?.id) return;
    setStepLoading('request_code');
    try {
      const result = await requestTelegramUserCode(account.id);
      setAccount((prev) => ({ ...(prev || {}), ...result }));
      message.success(tr('telegramUserConnect.messages.codeRequested', 'Код подтверждения отправлен в Telegram'));
    } catch (error) {
      message.error(getErrorText(error, tr('telegramUserConnect.messages.codeRequestError', 'Не удалось запросить код')));
    } finally {
      setStepLoading('');
    }
  };

  const handleConfirmCode = async () => {
    if (!account?.id) return;
    setStepLoading('confirm_code');
    try {
      const result = await confirmTelegramUserCode(account.id, { code });
      setAccount((prev) => ({ ...(prev || {}), ...result, auth_state: result.auth_state || prev?.auth_state }));
      if (result.requires_2fa) {
        message.warning(tr('telegramUserConnect.messages.twoFaRequired', 'Для аккаунта включена 2FA, введите пароль'));
      } else {
        message.success(tr('telegramUserConnect.messages.authorized', 'Telegram аккаунт авторизован'));
        onSuccess?.(result);
      }
    } catch (error) {
      message.error(getErrorText(error, tr('telegramUserConnect.messages.codeConfirmError', 'Не удалось подтвердить код')));
    } finally {
      setStepLoading('');
    }
  };

  const handleConfirm2fa = async () => {
    if (!account?.id) return;
    setStepLoading('confirm_2fa');
    try {
      const result = await confirmTelegramUserPassword(account.id, { password });
      setAccount((prev) => ({ ...(prev || {}), ...result, auth_state: result.auth_state || prev?.auth_state }));
      message.success(tr('telegramUserConnect.messages.twoFaOk', '2FA подтвержден, аккаунт авторизован'));
      onSuccess?.(result);
    } catch (error) {
      message.error(getErrorText(error, tr('telegramUserConnect.messages.twoFaError', 'Не удалось подтвердить 2FA пароль')));
    } finally {
      setStepLoading('');
    }
  };

  const handleSyncInbox = async () => {
    if (!account?.id) return;
    setStepLoading('sync_inbox');
    try {
      const result = await syncTelegramUserInbox(account.id, {});
      message.success(
        tr('telegramUserConnect.messages.syncOk', 'Inbox синхронизирован: создано {created}, дублей {duplicates}', {
          created: result?.created ?? 0,
          duplicates: result?.duplicates ?? 0,
        })
      );
    } catch (error) {
      message.error(getErrorText(error, tr('telegramUserConnect.messages.syncError', 'Ошибка синхронизации inbox')));
    } finally {
      setStepLoading('');
    }
  };

  return (
    <div>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message={tr('telegramUserConnect.alert.title', 'Вход в Telegram')}
        description={tr(
          'telegramUserConnect.alert.description',
          'Как в клиентском приложении: введите номер, получите код, затем подтвердите 2FA-пароль при необходимости.'
        )}
      />

      <Form form={form} layout="vertical" onFinish={handleConnect}>
        <Form.Item
          label={tr('telegramUserConnect.fields.phone', 'Телефон')}
          name="phone_number"
          rules={[
            { required: true, message: tr('telegramUserConnect.validation.phone', 'Введите номер телефона') },
            { pattern: /^\+\d{7,20}$/, message: tr('telegramUserConnect.validation.phoneFormat', 'Формат: +998901234567') },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="+998901234567" />
        </Form.Item>

        <Form.Item
          label={tr('telegramUserConnect.fields.apiId', 'Telegram API ID (опционально)')}
          name="api_id"
          rules={[
            {
              pattern: /^\d*$/,
              message: tr('telegramUserConnect.validation.apiIdDigits', 'API ID должен содержать только цифры'),
            },
          ]}
          extra={tr(
            'telegramUserConnect.fields.apiIdExtra',
            'Оставьте пустым, если TELEGRAM_API_ID настроен на backend.'
          )}
        >
          <Input placeholder="12345678" />
        </Form.Item>

        <Form.Item
          label={tr('telegramUserConnect.fields.apiHash', 'Telegram API Hash (опционально)')}
          name="api_hash"
          extra={tr(
            'telegramUserConnect.fields.apiHashExtra',
            'Оставьте пустым, если TELEGRAM_API_HASH настроен на backend.'
          )}
        >
          <Input.Password placeholder="0123456789abcdef0123456789abcdef" />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<LinkOutlined />}>
            {tr('telegramUserConnect.actions.continue', 'Продолжить')}
          </Button>
          {onCancel ? (
            <Button onClick={onCancel}>{tr('actions.cancel', 'Отмена')}</Button>
          ) : null}
        </Space>
      </Form>

      {account?.id ? (
        <div style={{ marginTop: 16 }}>
          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 12 }}
            message={tr('telegramUserConnect.flow.title', 'Подтверждение входа')}
            description={
              <Space direction="vertical" size={8}>
                <Text>
                  {tr('telegramUserConnect.flow.state', 'Текущий статус: {state}', {
                    state: account.auth_state || 'draft',
                  })}
                </Text>
                <Space wrap>
                  <Button onClick={handleRequestCode} loading={stepLoading === 'request_code'}>
                    {tr('telegramUserConnect.actions.requestCode', 'Запросить код повторно')}
                  </Button>
                  {account.auth_state === 'authorized' ? (
                    <Button type="default" onClick={handleSyncInbox} loading={stepLoading === 'sync_inbox'}>
                      {tr('telegramUserConnect.actions.syncInbox', 'Синхронизировать inbox')}
                    </Button>
                  ) : null}
                </Space>
              </Space>
            }
          />

          <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={tr('telegramUserConnect.placeholders.code', 'Код из Telegram')}
            />
            <Button
              type="primary"
              onClick={handleConfirmCode}
              loading={stepLoading === 'confirm_code'}
              disabled={!code.trim()}
            >
              {tr('telegramUserConnect.actions.confirmCode', 'Подтвердить код')}
            </Button>
          </Space.Compact>

          {(account.auth_state === 'password_required' || account.requires_2fa) ? (
            <Space.Compact style={{ width: '100%' }}>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tr('telegramUserConnect.placeholders.twoFa', 'Пароль 2FA')}
              />
              <Button
                type="primary"
                onClick={handleConfirm2fa}
                loading={stepLoading === 'confirm_2fa'}
                disabled={!password.trim()}
              >
                {tr('telegramUserConnect.actions.confirm2fa', 'Подтвердить 2FA')}
              </Button>
            </Space.Compact>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
