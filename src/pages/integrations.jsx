/**
 * Integrations Page
 * Manage SMS, telephony, and social integrations backed by CRM API
 */

import React, { useEffect, useState } from 'react';
import { Card, Space, Button, Modal, App, Table, Tag, Form, Input, InputNumber, Select, Switch, Popconfirm } from 'antd';
import {
  ApiOutlined,
  MessageOutlined,
  PhoneOutlined,
  ReloadOutlined,
  FacebookOutlined,
  InstagramOutlined,
  SendOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import IntegrationCard from '../components/IntegrationCard';
import SMSSettings from '../components/SMSSettings';
import TelephonySettings from '../components/TelephonySettings';
import FacebookConnect from '../components/FacebookConnect.jsx';
import InstagramConnect from '../components/InstagramConnect.jsx';
import TelegramConnect from '../components/TelegramConnect.jsx';
import smsApi from '../lib/api/sms.js';
import { getTelephonyStats, getVoIPConnections } from '../lib/api/telephony';
import {
  getFacebookPages,
  disconnectFacebook,
  testFacebookPage,
} from '../lib/api/integrations/facebook.js';
import {
  getInstagramAccounts,
  disconnectInstagram,
  testInstagramAccount,
} from '../lib/api/integrations/instagram.js';
import {
  getTelegramBots,
  disconnectTelegramBot,
  testTelegramBot,
  setTelegramWebhook,
} from '../lib/api/integrations/telegram.js';
import {
  getAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProviderConnection,
} from '../lib/api/integrations/ai.js';

const formatDateTime = (value) => {
  if (!value) return '-';
  return dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm') : String(value);
};

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
};

export default function IntegrationsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState({});
  const [statuses, setStatuses] = useState({
    sms: { status: 'disconnected', stats: {} },
    telephony: { status: 'disconnected', stats: {} },
    facebook: { status: 'disconnected', stats: {} },
    instagram: { status: 'disconnected', stats: {} },
    telegram: { status: 'disconnected', stats: {} },
    ai: { status: 'disconnected', stats: {} },
  });
  const [modalVisible, setModalVisible] = useState({
    sms: false,
    telephony: false,
    facebook: false,
    instagram: false,
    telegram: false,
    ai: false,
  });
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [telegramBots, setTelegramBots] = useState([]);
  const [aiProviders, setAIProviders] = useState([]);
  const [aiModal, setAIModal] = useState({ open: false, record: null });
  const [aiSaving, setAISaving] = useState(false);
  const [aiTestingId, setAITestingId] = useState(null);
  const [aiDefaultingId, setAIDefaultingId] = useState(null);
  const [aiForm] = Form.useForm();
  const [webhookModal, setWebhookModal] = useState({ open: false, bot: null });
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookForm] = Form.useForm();

  const getErrorText = (error, fallback) => {
    const details = error?.details || {};
    if (typeof details === 'string') return details;
    if (typeof details?.message === 'string') return details.message;
    if (typeof details?.error === 'string') return details.error;
    if (typeof details?.detail === 'string') return details.detail;
    if (typeof error?.message === 'string' && !error.message.startsWith('HTTP ')) return error.message;
    return fallback;
  };

  useEffect(() => {
    loadAllStatuses();
  }, []);

  const loadAllStatuses = async () => {
    await Promise.all([
      loadSMSStatus(),
      loadTelephonyStatus(),
      loadFacebookStatus(),
      loadInstagramStatus(),
      loadTelegramStatus(),
      loadAIStatus(),
    ]);
  };

  const loadSMSStatus = async () => {
    setLoading((prev) => ({ ...prev, sms: true }));
    try {
      const [providers, status] = await Promise.all([smsApi.providers(), smsApi.status()]);
      const list = normalizeList(providers);
      const connected = Array.isArray(list) && list.length > 0;

      const stats = status && typeof status === 'object' ? status : {};
      setStatuses((prev) => ({
        ...prev,
        sms: {
          status: connected ? 'connected' : 'disconnected',
          stats: {
            Каналов: list.length,
            ...stats,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading SMS status:', error);
      setStatuses((prev) => ({
        ...prev,
        sms: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, sms: false }));
    }
  };

  const loadTelephonyStatus = async () => {
    setLoading((prev) => ({ ...prev, telephony: true }));
    try {
      const [connections, stats] = await Promise.all([getVoIPConnections(), getTelephonyStats()]);
      const list = normalizeList(connections);
      const active = list.find((item) => item.active);

      setStatuses((prev) => ({
        ...prev,
        telephony: {
          status: active ? 'connected' : 'disconnected',
          stats: {
            Подключений: list.length,
            'Активный провайдер': active?.provider || '-',
            'Звонков сегодня': stats?.calls_today || stats?.total || 0,
            Пропущенных: stats?.missed || stats?.missed_calls || 0,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading telephony status:', error);
      setStatuses((prev) => ({
        ...prev,
        telephony: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, telephony: false }));
    }
  };

  const loadFacebookStatus = async () => {
    setLoading((prev) => ({ ...prev, facebook: true }));
    try {
      const response = await getFacebookPages({ page_size: 50 });
      const list = normalizeList(response);
      setFacebookPages(list);

      const stats = {
        Страниц: list.length,
        Сообщений: list.reduce((sum, item) => sum + (item.messages_synced || 0), 0),
        Подписчиков: list.reduce((sum, item) => sum + (item.followers_count || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        facebook: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Facebook status:', error);
      setFacebookPages([]);
      setStatuses((prev) => ({
        ...prev,
        facebook: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, facebook: false }));
    }
  };

  const loadInstagramStatus = async () => {
    setLoading((prev) => ({ ...prev, instagram: true }));
    try {
      const response = await getInstagramAccounts({ page_size: 50 });
      const list = normalizeList(response);
      setInstagramAccounts(list);

      const stats = {
        Аккаунтов: list.length,
        Сообщений: list.reduce((sum, item) => sum + (item.messages_synced || 0), 0),
        Комментариев: list.reduce((sum, item) => sum + (item.comments_synced || 0), 0),
        Подписчиков: list.reduce((sum, item) => sum + (item.followers_count || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        instagram: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Instagram status:', error);
      setInstagramAccounts([]);
      setStatuses((prev) => ({
        ...prev,
        instagram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, instagram: false }));
    }
  };

  const loadTelegramStatus = async () => {
    setLoading((prev) => ({ ...prev, telegram: true }));
    try {
      const response = await getTelegramBots({ page_size: 50 });
      const list = normalizeList(response);
      setTelegramBots(list);

      const stats = {
        Ботов: list.length,
        'Сообщений получено': list.reduce((sum, item) => sum + (item.messages_received || 0), 0),
        'Сообщений отправлено': list.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
        'Активных чатов': list.reduce((sum, item) => sum + (item.active_chats || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        telegram: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Telegram status:', error);
      setTelegramBots([]);
      setStatuses((prev) => ({
        ...prev,
        telegram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, telegram: false }));
    }
  };

  const loadAIStatus = async () => {
    setLoading((prev) => ({ ...prev, ai: true }));
    try {
      const response = await getAIProviders({ page_size: 50 });
      const list = normalizeList(response);
      setAIProviders(list);

      const activeCount = list.filter((item) => item.is_active).length;
      const defaultProvider = list.find((item) => item.is_default);
      const stats = {
        Провайдеров: list.length,
        Активных: activeCount,
        'По умолчанию': defaultProvider?.name || '-',
      };

      setStatuses((prev) => ({
        ...prev,
        ai: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading AI providers:', error);
      setAIProviders([]);
      setStatuses((prev) => ({
        ...prev,
        ai: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, ai: false }));
    }
  };

  const openModal = (type) => setModalVisible((prev) => ({ ...prev, [type]: true }));
  const closeModal = (type) => setModalVisible((prev) => ({ ...prev, [type]: false }));

  const handleIntegrationSuccess = async (type) => {
    closeModal(type);
    message.success('Настройки сохранены');
    if (type === 'sms') await loadSMSStatus();
    if (type === 'telephony') await loadTelephonyStatus();
    if (type === 'facebook') await loadFacebookStatus();
    if (type === 'instagram') await loadInstagramStatus();
    if (type === 'telegram') await loadTelegramStatus();
    if (type === 'ai') await loadAIStatus();
  };

  const openAIModal = (record = null) => {
    if (record) {
      aiForm.setFieldsValue({
        name: record.name,
        provider: record.provider,
        model: record.model || '',
        base_url: record.base_url || '',
        api_key: '',
        is_active: !!record.is_active,
        is_default: !!record.is_default,
        timeout_seconds: record.timeout_seconds || 45,
        temperature: Number(record.temperature ?? 0.2),
        max_tokens: record.max_tokens || 800,
      });
    } else {
      aiForm.setFieldsValue({
        name: '',
        provider: 'openai',
        model: 'gpt-4o-mini',
        base_url: '',
        api_key: '',
        is_active: true,
        is_default: false,
        timeout_seconds: 45,
        temperature: 0.2,
        max_tokens: 800,
      });
    }
    setAIModal({ open: true, record });
  };

  const closeAIModal = () => {
    setAIModal({ open: false, record: null });
    aiForm.resetFields();
  };

  const handleAISave = async () => {
    try {
      const values = await aiForm.validateFields();
      setAISaving(true);
      const payload = { ...values };

      if (aiModal.record && !payload.api_key) {
        delete payload.api_key;
      }

      if (aiModal.record?.id) {
        await updateAIProvider(aiModal.record.id, payload);
        message.success('AI провайдер обновлен');
      } else {
        await createAIProvider(payload);
        message.success('AI провайдер добавлен');
      }

      closeAIModal();
      loadAIStatus();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorText(error, 'Не удалось сохранить AI провайдера'));
    } finally {
      setAISaving(false);
    }
  };

  const handleAITest = async (record) => {
    setAITestingId(record.id);
    try {
      const result = await testAIProviderConnection(record.id);
      message.success(result?.output_text ? `Тест OK: ${result.output_text}` : 'Подключение проверено');
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, 'Не удалось проверить AI провайдера'));
    } finally {
      setAITestingId(null);
    }
  };

  const handleAIDelete = async (record) => {
    try {
      await deleteAIProvider(record.id);
      message.success('AI провайдер удален');
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, 'Не удалось удалить AI провайдера'));
    }
  };

  const handleAIMakeDefault = async (record) => {
    if (!record?.id) return;
    setAIDefaultingId(record.id);
    try {
      await updateAIProvider(record.id, { is_default: true, is_active: true });
      message.success(`Провайдер "${record.name}" установлен по умолчанию`);
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, 'Не удалось установить провайдера по умолчанию'));
    } finally {
      setAIDefaultingId(null);
    }
  };

  const handleFacebookTest = async (record) => {
    try {
      await testFacebookPage(record.id);
      message.success('Facebook подключение проверено');
      loadFacebookStatus();
    } catch (error) {
      message.error('Не удалось проверить Facebook подключение');
    }
  };

  const handleFacebookDisconnect = async (record) => {
    try {
      await disconnectFacebook(record.id);
      message.success('Facebook страница отключена');
      loadFacebookStatus();
    } catch (error) {
      message.error('Не удалось отключить Facebook страницу');
    }
  };

  const handleInstagramTest = async (record) => {
    try {
      await testInstagramAccount(record.id);
      message.success('Instagram подключение проверено');
      loadInstagramStatus();
    } catch (error) {
      message.error('Не удалось проверить Instagram подключение');
    }
  };

  const handleInstagramDisconnect = async (record) => {
    try {
      await disconnectInstagram(record.id);
      message.success('Instagram аккаунт отключен');
      loadInstagramStatus();
    } catch (error) {
      message.error('Не удалось отключить Instagram аккаунт');
    }
  };

  const handleTelegramTest = async (record) => {
    try {
      await testTelegramBot(record.id);
      message.success('Telegram подключение проверено');
      loadTelegramStatus();
    } catch (error) {
      message.error('Не удалось проверить Telegram подключение');
    }
  };

  const handleTelegramDisconnect = async (record) => {
    try {
      await disconnectTelegramBot(record.id);
      message.success('Telegram бот отключен');
      loadTelegramStatus();
    } catch (error) {
      message.error('Не удалось отключить Telegram бот');
    }
  };

  const openWebhookModal = (bot) => {
    webhookForm.setFieldsValue({ webhook_url: bot?.webhook_url || '' });
    setWebhookModal({ open: true, bot });
  };

  const closeWebhookModal = () => {
    setWebhookModal({ open: false, bot: null });
    webhookForm.resetFields();
  };

  const handleWebhookSave = async () => {
    try {
      const values = await webhookForm.validateFields();
      if (!webhookModal.bot?.id) {
        message.error('Не удалось определить бота');
        return;
      }
      setWebhookSaving(true);
      await setTelegramWebhook(webhookModal.bot.id, values);
      message.success('Webhook обновлен');
      closeWebhookModal();
      loadTelegramStatus();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorText(error, 'Не удалось обновить webhook'));
    } finally {
      setWebhookSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>Интеграции</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadAllStatuses}>
            Обновить все
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <IntegrationCard
            title="SMS"
            description="Провайдеры и статус отправки SMS"
            icon={<MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
            type="sms"
            status={statuses.sms.status}
            stats={statuses.sms.stats}
            error={statuses.sms.error}
            loading={loading.sms}
            onConnect={() => openModal('sms')}
            onRefresh={loadSMSStatus}
          />

          <IntegrationCard
            title="Телефония"
            description="Подключения VoIP/SIP для звонков из CRM"
            icon={<PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
            type="telephony"
            status={statuses.telephony.status}
            stats={statuses.telephony.stats}
            error={statuses.telephony.error}
            loading={loading.telephony}
            onConnect={() => openModal('telephony')}
            onRefresh={loadTelephonyStatus}
          />

          <IntegrationCard
            title="Facebook Messenger"
            description="Подключенные страницы для обработки сообщений"
            icon={<FacebookOutlined style={{ fontSize: 24, color: '#1877F2' }} />}
            type="facebook"
            status={statuses.facebook.status}
            stats={statuses.facebook.stats}
            error={statuses.facebook.error}
            loading={loading.facebook}
            onConnect={() => openModal('facebook')}
            onRefresh={loadFacebookStatus}
          >
            {facebookPages.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.facebook_page_id}
                columns={[
                  { title: 'Страница', dataIndex: 'page_name', key: 'page_name' },
                  { title: 'ID', dataIndex: 'facebook_page_id', key: 'facebook_page_id' },
                  {
                    title: 'Статус',
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag color={value ? 'green' : 'default'}>{value ? 'Активна' : 'Пауза'}</Tag>
                    ),
                  },
                  {
                    title: 'Синхронизация',
                    dataIndex: 'last_sync_at',
                    key: 'last_sync_at',
                    render: formatDateTime,
                  },
                  {
                    title: 'Действия',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button type="link" onClick={() => handleFacebookTest(record)}>
                          Тест
                        </Button>
                        <Button type="link" danger onClick={() => handleFacebookDisconnect(record)}>
                          Отключить
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={facebookPages}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title="Instagram"
            description="Instagram Business аккаунты"
            icon={<InstagramOutlined style={{ fontSize: 24, color: '#E1306C' }} />}
            type="instagram"
            status={statuses.instagram.status}
            stats={statuses.instagram.stats}
            error={statuses.instagram.error}
            loading={loading.instagram}
            onConnect={() => openModal('instagram')}
            onRefresh={loadInstagramStatus}
          >
            {instagramAccounts.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.instagram_user_id}
                columns={[
                  { title: 'Username', dataIndex: 'username', key: 'username' },
                  { title: 'ID', dataIndex: 'instagram_user_id', key: 'instagram_user_id' },
                  {
                    title: 'Статус',
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag color={value ? 'green' : 'default'}>{value ? 'Активен' : 'Пауза'}</Tag>
                    ),
                  },
                  {
                    title: 'Синхронизация',
                    dataIndex: 'last_sync_at',
                    key: 'last_sync_at',
                    render: formatDateTime,
                  },
                  {
                    title: 'Действия',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button type="link" onClick={() => handleInstagramTest(record)}>
                          Тест
                        </Button>
                        <Button type="link" danger onClick={() => handleInstagramDisconnect(record)}>
                          Отключить
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={instagramAccounts}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title="Telegram"
            description="Telegram боты для входящих сообщений"
            icon={<SendOutlined style={{ fontSize: 24, color: '#2AABEE' }} />}
            type="telegram"
            status={statuses.telegram.status}
            stats={statuses.telegram.stats}
            error={statuses.telegram.error}
            loading={loading.telegram}
            onConnect={() => openModal('telegram')}
            onRefresh={loadTelegramStatus}
          >
            {telegramBots.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.bot_username}
                columns={[
                  { title: 'Бот', dataIndex: 'bot_name', key: 'bot_name' },
                  { title: 'Username', dataIndex: 'bot_username', key: 'bot_username' },
                  {
                    title: 'Статус',
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag color={value ? 'green' : 'default'}>{value ? 'Активен' : 'Пауза'}</Tag>
                    ),
                  },
                  {
                    title: 'Последняя активность',
                    dataIndex: 'last_activity_at',
                    key: 'last_activity_at',
                    render: formatDateTime,
                  },
                  {
                    title: 'Действия',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button type="link" onClick={() => handleTelegramTest(record)}>
                          Тест
                        </Button>
                        <Button type="link" onClick={() => openWebhookModal(record)}>
                          Webhook
                        </Button>
                        <Button type="link" danger onClick={() => handleTelegramDisconnect(record)}>
                          Отключить
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={telegramBots}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title="AI Провайдеры"
            description="OpenAI, Gemini, Claude и совместимые модели для AI-функций CRM"
            icon={<RobotOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
            type="ai"
            status={statuses.ai.status}
            stats={statuses.ai.stats}
            error={statuses.ai.error}
            loading={loading.ai}
            onConnect={() => openAIModal()}
            onRefresh={loadAIStatus}
          >
            {aiProviders.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id}
                columns={[
                  { title: 'Название', dataIndex: 'name', key: 'name' },
                  { title: 'Провайдер', dataIndex: 'provider', key: 'provider' },
                  { title: 'Модель', dataIndex: 'model', key: 'model', render: (value) => value || '-' },
                  {
                    title: 'Статус',
                    key: 'status',
                    render: (_, record) => (
                      <Space>
                        <Tag color={record.is_active ? 'green' : 'default'}>
                          {record.is_active ? 'Активен' : 'Пауза'}
                        </Tag>
                        {record.is_default && <Tag color="blue">По умолчанию</Tag>}
                      </Space>
                    ),
                  },
                  {
                    title: 'Ключ',
                    dataIndex: 'api_key_preview',
                    key: 'api_key_preview',
                    render: (value) => value || '-',
                  },
                  {
                    title: 'Действия',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          loading={aiTestingId === record.id}
                          onClick={() => handleAITest(record)}
                        >
                          Тест
                        </Button>
                        <Button type="link" onClick={() => openAIModal(record)}>
                          Редактировать
                        </Button>
                        {!record.is_default && (
                          <Button
                            type="link"
                            loading={aiDefaultingId === record.id}
                            onClick={() => handleAIMakeDefault(record)}
                          >
                            По умолчанию
                          </Button>
                        )}
                        <Popconfirm
                          title="Удалить AI провайдера?"
                          onConfirm={() => handleAIDelete(record)}
                          okText="Удалить"
                          cancelText="Отмена"
                        >
                          <Button type="link" danger>
                            Удалить
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                dataSource={aiProviders}
                pagination={false}
              />
            )}
          </IntegrationCard>
        </Space>
      </Card>

      <Modal
        title="Настройка SMS"
        open={modalVisible.sms}
        onCancel={() => closeModal('sms')}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <SMSSettings onSuccess={() => handleIntegrationSuccess('sms')} />
      </Modal>

      <Modal
        title="Настройка телефонии"
        open={modalVisible.telephony}
        onCancel={() => closeModal('telephony')}
        footer={null}
        width={700}
      >
        <TelephonySettings onSuccess={() => handleIntegrationSuccess('telephony')} />
      </Modal>

      <Modal
        title="Подключение Facebook"
        open={modalVisible.facebook}
        onCancel={() => closeModal('facebook')}
        footer={null}
        width={720}
      >
        <FacebookConnect onSuccess={() => handleIntegrationSuccess('facebook')} onCancel={() => closeModal('facebook')} />
      </Modal>

      <Modal
        title="Подключение Instagram"
        open={modalVisible.instagram}
        onCancel={() => closeModal('instagram')}
        footer={null}
        width={720}
      >
        <InstagramConnect onSuccess={() => handleIntegrationSuccess('instagram')} onCancel={() => closeModal('instagram')} />
      </Modal>

      <Modal
        title="Подключение Telegram"
        open={modalVisible.telegram}
        onCancel={() => closeModal('telegram')}
        footer={null}
        width={720}
      >
        <TelegramConnect onSuccess={() => handleIntegrationSuccess('telegram')} onCancel={() => closeModal('telegram')} />
      </Modal>

      <Modal
        title="Webhook Telegram"
        open={webhookModal.open}
        onCancel={closeWebhookModal}
        onOk={handleWebhookSave}
        okText="Сохранить"
        confirmLoading={webhookSaving}
      >
        <Form form={webhookForm} layout="vertical">
          <Form.Item
            label="Webhook URL"
            name="webhook_url"
            rules={[{ type: 'url', message: 'Укажите корректный URL' }]}
          >
            <Input placeholder="Оставьте пустым для автогенерации URL" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={aiModal.record ? 'Редактирование AI провайдера' : 'Добавление AI провайдера'}
        open={aiModal.open}
        onCancel={closeAIModal}
        onOk={handleAISave}
        okText="Сохранить"
        confirmLoading={aiSaving}
        width={760}
      >
        <Form form={aiForm} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: 'Введите название провайдера' }]}
          >
            <Input placeholder="OpenAI Prod" />
          </Form.Item>

          <Form.Item
            label="Провайдер"
            name="provider"
            rules={[{ required: true, message: 'Выберите провайдера' }]}
          >
            <Select
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'gemini', label: 'Google Gemini' },
                { value: 'claude', label: 'Anthropic Claude' },
                { value: 'openai_compatible', label: 'OpenAI Compatible' },
                { value: 'custom', label: 'Custom HTTP' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Модель" name="model">
            <Input placeholder="gpt-4o-mini / gemini-1.5-flash / claude-3-5-sonnet-20241022" />
          </Form.Item>

          <Form.Item label="Base URL" name="base_url">
            <Input placeholder="https://api.openai.com" />
          </Form.Item>

          <Form.Item
            label={aiModal.record ? 'API Key (оставьте пустым, чтобы не менять)' : 'API Key'}
            name="api_key"
            rules={aiModal.record ? [] : [{ required: true, message: 'Введите API ключ' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="Timeout (sec)" name="timeout_seconds">
              <InputNumber min={5} max={300} />
            </Form.Item>
            <Form.Item label="Temperature" name="temperature">
              <InputNumber min={0} max={2} step={0.1} />
            </Form.Item>
            <Form.Item label="Max tokens" name="max_tokens">
              <InputNumber min={1} max={8000} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="Активен" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="По умолчанию" name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
