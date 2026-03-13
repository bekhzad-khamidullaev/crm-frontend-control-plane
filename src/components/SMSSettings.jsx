/**
 * SMSSettings Component
 * Configure and test SMS providers available in the backend
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
} from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, MessageOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import smsApi from '../lib/api/sms.js';
import { t } from '../lib/i18n';
import { formatValueForUi } from '../lib/utils/value-display.js';

const { TextArea } = Input;

export default function SMSSettings({ onSuccess }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [providerForm] = Form.useForm();
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);
  const [providerModal, setProviderModal] = useState({ open: false, record: null });
  const [savingProvider, setSavingProvider] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadProviders();
    loadStatus();
  }, []);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await smsApi.providers();
      const list = response?.results || response || [];
      setProviders(Array.isArray(list) ? list : []);
      if (!form.getFieldValue('channel_id') && list.length > 0) {
        const firstId = list[0].channel_id || list[0].id;
        if (firstId !== undefined) {
          form.setFieldsValue({ channel_id: firstId });
        }
      }
    } catch (error) {
      console.error('Error loading SMS providers:', error);
      message.error(tr('smsSettings.messages.loadProvidersError', 'Не удалось загрузить список SMS провайдеров'));
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await smsApi.status();
      setStatus(response || null);
    } catch (error) {
      console.error('Error loading SMS status:', error);
      message.error(tr('smsSettings.messages.loadStatusError', 'Не удалось загрузить статус SMS'));
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const providerOptions = useMemo(
    () =>
      providers
        .filter((provider) => provider.is_active !== false)
        .map((provider) => ({
        value: provider.channel_id || provider.id,
        label: provider.name || provider.provider || provider.title || tr('smsSettings.common.channel', 'Канал'),
      })),
    [providers]
  );

  const providerColumns = [
    {
      title: tr('smsSettings.table.channelId', 'ID канала'),
      key: 'channel_id',
      render: (_, record) => record.channel_id || record.id || '-',
    },
    {
      title: tr('smsSettings.table.provider', 'Провайдер'),
      key: 'provider',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.name || record.type_display || record.provider || record.title || '-'}</span>
          <Tag>{record.type_display || record.provider || '-'}</Tag>
        </Space>
      ),
    },
    {
      title: tr('smsSettings.table.status', 'Статус'),
      key: 'status',
      render: (_, record) => {
        if (record.configured === false) return <Tag color="error">{tr('smsSettings.status.notConfigured', 'Не настроен')}</Tag>;
        if (record.is_active === false) return <Tag>{tr('smsSettings.status.inactive', 'Неактивен')}</Tag>;
        return <Tag color="success">{tr('smsSettings.status.ready', 'Готов')}</Tag>;
      },
    },
    {
      title: tr('smsSettings.table.actions', 'Действия'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openProviderModal(record)}>
            {tr('actions.edit', 'Редактировать')}
          </Button>
          <Popconfirm
            title={tr('smsSettings.confirm.deleteProviderTitle', 'Удалить SMS провайдера?')}
            description={tr('smsSettings.confirm.deleteProviderDescription', 'Это действие удалит канал и его настройки.')}
            onConfirm={() => handleDeleteProvider(record)}
            okText={tr('actions.delete', 'Удалить')}
            cancelText={tr('actions.cancel', 'Отмена')}
          >
            <Button type="link" danger icon={<DeleteOutlined />} loading={deletingId === (record.id || record.channel_id)}>
              {tr('actions.delete', 'Удалить')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statusEntries = useMemo(() => {
    if (!status) return [];
    if (Array.isArray(status)) {
      return status.map((item, index) => [tr('smsSettings.statusItem', 'Статус {index}', { index: index + 1 }), item]);
    }
    return Object.entries(status);
  }, [status]);

  const handleSendTest = async (values) => {
    setSending(true);
    try {
      const response = await smsApi.send({
        channel_id: values.channel_id,
        to: values.to,
        text: values.text,
        async: false,
      });
      if (response?.status === 'ok') {
        message.success(tr('smsSettings.messages.testSent', 'Тестовое SMS отправлено'));
      } else {
        message.error(response?.detail || tr('smsSettings.messages.providerError', 'Провайдер вернул ошибку'));
        return;
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error sending test SMS:', error);
      message.error(tr('smsSettings.messages.sendError', 'Не удалось отправить SMS'));
    } finally {
      setSending(false);
    }
  };

  const openProviderModal = (record = null) => {
    setProviderModal({ open: true, record });
    const initialValues = record
      ? {
          type: record.type || record.provider,
          name: record.name,
          is_active: record.is_active !== false,
          eskiz_email: record.eskiz_email || '',
          eskiz_from: record.eskiz_from || '',
          playmobile_auth_type: record.playmobile_auth_type || 'basic',
          playmobile_api_url: record.playmobile_api_url || '',
          playmobile_status_url: record.playmobile_status_url || '',
          playmobile_login: record.playmobile_login || '',
          playmobile_from: record.playmobile_from || '',
        }
      : {
          type: 'eskiz',
          name: '',
          is_active: true,
          playmobile_auth_type: 'basic',
        };
    providerForm.setFieldsValue(initialValues);
  };

  const closeProviderModal = () => {
    setProviderModal({ open: false, record: null });
    providerForm.resetFields();
  };

  const handleSaveProvider = async () => {
    try {
      const values = await providerForm.validateFields();
      const payload = { ...values };
      if (!providerModal.record && payload.type === 'eskiz') {
        const hasToken = Boolean(payload.eskiz_token);
        const hasEmailPassword = Boolean(payload.eskiz_email && payload.eskiz_password);
        if (!hasToken && !hasEmailPassword) {
          message.error(tr('smsSettings.messages.eskizCredentialsError', 'Для Eskiz укажите token или пару email/password'));
          return;
        }
      }

      if (providerModal.record) {
        ['eskiz_password', 'eskiz_token', 'playmobile_password', 'playmobile_token'].forEach((field) => {
          if (!payload[field]) delete payload[field];
        });
      }

      setSavingProvider(true);
      if (providerModal.record) {
        await smsApi.updateProvider(providerModal.record.id || providerModal.record.channel_id, payload);
        message.success(tr('smsSettings.messages.providerUpdated', 'SMS провайдер обновлен'));
      } else {
        await smsApi.createProvider(payload);
        message.success(tr('smsSettings.messages.providerAdded', 'SMS провайдер добавлен'));
      }
      closeProviderModal();
      await Promise.all([loadProviders(), loadStatus()]);
      onSuccess?.();
    } catch (error) {
      if (error?.errorFields) return;
      console.error('Error saving SMS provider:', error);
      const details = error?.details || error?.response?.data;
      const firstDetail =
        (Array.isArray(details?.non_field_errors) && details.non_field_errors[0]) ||
        (details && typeof details === 'object' && Object.values(details).flat?.()[0]) ||
        details?.detail;
      message.error(firstDetail || tr('smsSettings.messages.providerSaveError', 'Не удалось сохранить SMS провайдера'));
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (record) => {
    const id = record.id || record.channel_id;
    if (!id) return;
    setDeletingId(id);
    try {
      await smsApi.deleteProvider(id);
      message.success(tr('smsSettings.messages.providerDeleted', 'SMS провайдер удален'));
      await Promise.all([loadProviders(), loadStatus()]);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting SMS provider:', error);
      message.error(tr('smsSettings.messages.providerDeleteError', 'Не удалось удалить SMS провайдера'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyProviderUrl = async (fieldName) => {
    const value = (providerForm.getFieldValue(fieldName) || '').trim();
    if (!value) {
      message.warning(tr('smsSettings.messages.urlEmpty', 'URL пустой'));
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
      message.success(tr('smsSettings.messages.urlCopied', 'URL скопирован'));
    } catch (error) {
      message.error(tr('smsSettings.messages.urlCopyError', 'Не удалось скопировать URL'));
    }
  };

  const selectedProviderType = Form.useWatch('type', providerForm);
  const selectedPlaymobileAuthType = Form.useWatch('playmobile_auth_type', providerForm);

  return (
    <div>
      <Alert
        message={tr('smsSettings.header.message', 'SMS провайдеры')}
        description={tr('smsSettings.header.description', 'Добавляйте и редактируйте SMS-провайдеров напрямую в этом окне. После сохранения можно сразу выполнить тест отправки.')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title={tr('smsSettings.providers.title', 'Доступные провайдеры')}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => openProviderModal()}>
              {tr('actions.create', 'Добавить')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadProviders} loading={loadingProviders}>
              {tr('actions.refresh', 'Обновить')}
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={providerColumns}
          dataSource={providers}
          rowKey={(record) => record.channel_id || record.id}
          pagination={{ pageSize: 5 }}
          loading={loadingProviders}
        />
      </Card>

      <Card
        title={tr('smsSettings.serviceStatus.title', 'Статус сервиса')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadStatus} loading={loadingStatus}>
            {tr('actions.refresh', 'Обновить')}
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {statusEntries.length === 0 ? (
          <Empty description={tr('smsSettings.empty.noData', 'Нет данных')} />
        ) : (
          <Row gutter={[16, 16]}>
            {statusEntries.map(([key, value]) => (
              <Col xs={24} md={12} key={key}>
                <Card size="small">
                  {(() => {
                    const formatted = formatValueForUi(value, { key });
                    if (formatted.kind === 'number') {
                      return <Statistic title={key} value={formatted.number} />;
                    }
                    if (formatted.kind === 'complex') {
                      return (
                        <Descriptions column={1} size="small" bordered>
                          {Object.entries(formatted.value).map(([nestedKey, nestedValue]) => {
                            const nestedFormatted = formatValueForUi(nestedValue, { key: nestedKey });
                            return (
                              <Descriptions.Item key={nestedKey} label={nestedKey}>
                                {nestedFormatted.kind === 'complex' ? JSON.stringify(nestedFormatted.value) : nestedFormatted.text}
                              </Descriptions.Item>
                            );
                          })}
                        </Descriptions>
                      );
                    }
                    if (formatted.text === tr('smsSettings.boolean.yes', 'Да') || formatted.text === tr('smsSettings.boolean.no', 'Нет')) {
                      return (
                        <>
                          <div style={{ marginBottom: 8, color: '#71717a' }}>{key}</div>
                          <Tag color={formatted.text === tr('smsSettings.boolean.yes', 'Да') ? 'green' : 'default'}>{formatted.text}</Tag>
                        </>
                      );
                    }
                    return (
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label={key}>{formatted.text}</Descriptions.Item>
                      </Descriptions>
                    );
                  })()}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card title={tr('smsSettings.test.title', 'Тестовая отправка')}>
        <Form form={form} layout="vertical" onFinish={handleSendTest}>
          <Form.Item
            label={tr('smsSettings.test.channel', 'Канал отправки')}
            name="channel_id"
            rules={[{ required: true, message: tr('smsSettings.validation.selectChannel', 'Выберите канал') }]}
          >
            <Select options={providerOptions} placeholder={tr('smsSettings.placeholders.selectProvider', 'Выберите провайдера')} />
          </Form.Item>

          <Form.Item
            label={tr('smsSettings.test.recipient', 'Номер получателя')}
            name="to"
            rules={[
              { required: true, message: tr('smsSettings.validation.enterNumber', 'Введите номер') },
              { pattern: /^\+?[\d\s\-\(\)]+$/, message: tr('smsSettings.validation.invalidPhone', 'Неверный формат номера') },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={tr('smsSettings.test.messageText', 'Текст сообщения')}
            name="text"
            rules={[{ required: true, message: tr('smsSettings.validation.enterMessageText', 'Введите текст сообщения') }]}
          >
            <TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<MessageOutlined />} loading={sending}>
                {tr('smsSettings.actions.sendTest', 'Отправить тест')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title={providerModal.record ? tr('smsSettings.modal.editProvider', 'Редактирование SMS провайдера') : tr('smsSettings.modal.addProvider', 'Добавление SMS провайдера')}
        open={providerModal.open}
        onCancel={closeProviderModal}
        onOk={handleSaveProvider}
        okText={tr('actions.save', 'Сохранить')}
        confirmLoading={savingProvider}
        width={720}
      >
        <Form form={providerForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={tr('smsSettings.form.providerType', 'Тип провайдера')} name="type" rules={[{ required: true, message: tr('smsSettings.validation.selectProvider', 'Выберите провайдера') }]}>
                <Select
                  options={[
                    { value: 'eskiz', label: 'Eskiz SMS' },
                    { value: 'playmobile', label: 'PlayMobile' },
                  ]}
                  disabled={Boolean(providerModal.record)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={tr('smsSettings.form.name', 'Название')} name="name">
                <Input placeholder={tr('smsSettings.placeholders.providerName', 'Например: Eskiz Prod')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={tr('smsSettings.form.active', 'Активен')} name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>

          {selectedProviderType === 'eskiz' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={tr('smsSettings.form.sender', 'Отправитель (from)')} name="eskiz_from">
                    <Input placeholder="4546" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="eskiz_email">
                    <Input placeholder="api@example.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={providerModal.record ? tr('smsSettings.form.passwordOptional', 'Пароль (оставьте пустым, чтобы не менять)') : tr('smsSettings.form.password', 'Пароль')}
                    name="eskiz_password"
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={providerModal.record ? tr('smsSettings.form.tokenOptional', 'Токен (оставьте пустым, чтобы не менять)') : tr('smsSettings.form.token', 'Токен')}
                    name="eskiz_token"
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {selectedProviderType === 'playmobile' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={tr('smsSettings.form.authType', 'Тип авторизации')} name="playmobile_auth_type" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'basic', label: 'Login/Password' },
                        { value: 'token', label: 'Bearer Token' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={tr('smsSettings.form.sender', 'Отправитель (from)')} name="playmobile_from">
                    <Input placeholder="4546" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={tr('smsSettings.form.apiUrl', 'API URL')}
                    name="playmobile_api_url"
                    rules={[{ required: true, message: tr('smsSettings.validation.apiUrl', 'Укажите API URL') }]}
                  >
                    <Input
                      placeholder="https://send.smsxabar.uz/broker-api/send"
                      addonAfter={
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopyProviderUrl('playmobile_api_url')}
                        >
                          {tr('smsSettings.actions.copy', 'Скопировать')}
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={tr('smsSettings.form.statusUrl', 'Status URL')} name="playmobile_status_url">
                    <Input
                      placeholder="https://send.smsxabar.uz/broker-api/status"
                      addonAfter={
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopyProviderUrl('playmobile_status_url')}
                        >
                          {tr('smsSettings.actions.copy', 'Скопировать')}
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {selectedPlaymobileAuthType === 'token' ? (
                <Form.Item
                  label={providerModal.record ? tr('smsSettings.form.bearerTokenOptional', 'Bearer Token (оставьте пустым, чтобы не менять)') : tr('smsSettings.form.bearerToken', 'Bearer Token')}
                  name="playmobile_token"
                  rules={!providerModal.record ? [{ required: true, message: tr('smsSettings.validation.bearerToken', 'Укажите Bearer Token') }] : []}
                >
                  <Input.Password />
                </Form.Item>
              ) : (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={tr('smsSettings.form.login', 'Логин')}
                      name="playmobile_login"
                      rules={[{ required: true, message: tr('smsSettings.validation.login', 'Укажите логин') }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={providerModal.record ? tr('smsSettings.form.passwordOptional', 'Пароль (оставьте пустым, чтобы не менять)') : tr('smsSettings.form.password', 'Пароль')}
                      name="playmobile_password"
                      rules={!providerModal.record ? [{ required: true, message: tr('smsSettings.validation.password', 'Укажите пароль') }] : []}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
