import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Select,
  Table,
  Space,
  message,
  Divider,
  Tag,
  Popconfirm,
  Modal,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  ApiOutlined,
  BellOutlined,
  LockOutlined,
  LinkOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  SafetyOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  getSettings,
  updateSettings,
  getAPIKeys,
  createAPIKey,
  revokeAPIKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getIntegrationLogs,
  getSecuritySettings,
  updateSecuritySettings,
} from '../lib/api/settings';
import InstagramConnect from '../components/InstagramConnect';
import FacebookConnect from '../components/FacebookConnect';
import TelegramConnect from '../components/TelegramConnect';
import SMSSettings from '../components/SMSSettings';
import TelephonySettings from '../components/TelephonySettings';

function SettingsPage() {
  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [webhookForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [integrationLogs, setIntegrationLogs] = useState([]);
  const [integrationModalVisible, setIntegrationModalVisible] = useState(null);

  useEffect(() => {
    loadSettings();
    loadAPIKeys();
    loadWebhooks();
    loadIntegrationLogs();
    loadSecuritySettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      form.setFieldsValue(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAPIKeys = async () => {
    try {
      const data = await getAPIKeys();
      setApiKeys(data);
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      await updateSettings(values);
      message.success('Настройки сохранены');
    } catch (error) {
      message.error('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async (values) => {
    setLoading(true);
    try {
      const newKey = await createAPIKey(values);
      message.success('API ключ создан');
      message.info(`Ключ: ${newKey.key} (сохраните его, больше не покажется)`);
      apiKeyForm.resetFields();
      loadAPIKeys();
    } catch (error) {
      message.error('Ошибка создания ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAPIKey = async (keyId) => {
    try {
      await revokeAPIKey(keyId);
      message.success('API ключ отозван');
      loadAPIKeys();
    } catch (error) {
      message.error('Ошибка отзыва ключа');
    }
  };

  const loadWebhooks = async () => {
    try {
      const data = await getWebhooks();
      setWebhooks(data);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const loadIntegrationLogs = async () => {
    try {
      const data = await getIntegrationLogs({ page: 1, page_size: 10 });
      setIntegrationLogs(data.results || []);
    } catch (error) {
      console.error('Error loading integration logs:', error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const data = await getSecuritySettings();
      securityForm.setFieldsValue(data);
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const handleCreateWebhook = async (values) => {
    setLoading(true);
    try {
      await createWebhook(values);
      message.success('Webhook создан');
      webhookForm.resetFields();
      loadWebhooks();
    } catch (error) {
      message.error('Ошибка создания webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await deleteWebhook(id);
      message.success('Webhook удален');
      loadWebhooks();
    } catch (error) {
      message.error('Ошибка удаления webhook');
    }
  };

  const handleUpdateSecurity = async (values) => {
    setLoading(true);
    try {
      await updateSecuritySettings(values);
      message.success('Настройки безопасности обновлены');
    } catch (error) {
      message.error('Ошибка обновления настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationSuccess = () => {
    setIntegrationModalVisible(null);
    message.success('Интеграция успешно настроена');
  };

  const apiKeyColumns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Ключ',
      dataIndex: 'key_preview',
      key: 'key_preview',
      render: (text) => <code>{text}...</code>,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Активен' : 'Отозван'}
        </Tag>
      ),
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('ru'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(record.key);
              message.success('Ключ скопирован');
            }}
          />
          <Popconfirm
            title="Отозвать ключ?"
            onConfirm={() => handleRevokeAPIKey(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'general',
      label: <span><SettingOutlined />Общие</span>,
      children: (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSettingsUpdate}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                label="Название компании"
                name="company_name"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email компании"
                name="company_email"
              >
                <Input type="email" />
              </Form.Item>

              <Form.Item
                label="Телефон компании"
                name="company_phone"
              >
                <Input />
              </Form.Item>

              <Divider />

              <Form.Item
                label="Язык по умолчанию"
                name="default_language"
              >
                <Select>
                  <Select.Option value="ru">Русский</Select.Option>
                  <Select.Option value="en">English</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Часовой пояс"
                name="timezone"
              >
                <Select>
                  <Select.Option value="Europe/Moscow">Москва (UTC+3)</Select.Option>
                  <Select.Option value="Europe/Kiev">Киев (UTC+2)</Select.Option>
                  <Select.Option value="Asia/Almaty">Алматы (UTC+6)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Сохранить
                </Button>
              </Form.Item>
            </Form>
      ),
    },
    {
      key: 'integrations',
      label: <span><LinkOutlined />Интеграции</span>,
      children: (
            <>
              <Alert
                message="Интеграции с внешними сервисами"
                description="Подключите внешние сервисы для расширения возможностей CRM. Все настройки безопасно хранятся и шифруются."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Социальные сети" type="inner">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Instagram Business</strong>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          Работа с Direct сообщениями и комментариями
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIntegrationModalVisible('instagram')}
                      >
                        Настроить
                      </Button>
                    </Space>
                  </Card>

                  <Card size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Facebook Messenger</strong>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          Обработка сообщений из Messenger
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIntegrationModalVisible('facebook')}
                      >
                        Настроить
                      </Button>
                    </Space>
                  </Card>

                  <Card size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Telegram Bot</strong>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          Уведомления и чаты через Telegram
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIntegrationModalVisible('telegram')}
                      >
                        Настроить
                      </Button>
                    </Space>
                  </Card>
                </Space>
              </Card>

              <Card title="Коммуникации" type="inner">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>SMS рассылки</strong>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          Twilio, Vonage, SMSC и другие провайдеры
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIntegrationModalVisible('sms')}
                      >
                        Настроить
                      </Button>
                    </Space>
                  </Card>

                  <Card size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Телефония (VoIP)</strong>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          SIP/WebRTC для звонков из CRM
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIntegrationModalVisible('telephony')}
                      >
                        Настроить
                      </Button>
                    </Space>
                  </Card>
                </Space>
              </Card>
              </Space>
            </>
      ),
    },
    {
      key: 'notifications',
      label: <span><BellOutlined />Уведомления</span>,
      children: (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSettingsUpdate}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                label="Email уведомления о новых лидах"
                name="notify_new_leads"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="SMS уведомления о звонках"
                name="notify_missed_calls"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Push уведомления в браузере"
                name="push_notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Сохранить
                </Button>
              </Form.Item>
            </Form>
      ),
    },
    {
      key: 'api-keys',
      label: <span><ApiOutlined />API Ключи</span>,
      children: (
            <>
              <Card title="Создать новый API ключ" style={{ marginBottom: 24 }}>
                <Form
                  form={apiKeyForm}
                  layout="inline"
                  onFinish={handleCreateAPIKey}
                >
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: 'Введите название' }]}
                  >
                    <Input placeholder="Название ключа" style={{ width: 300 }} />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<PlusOutlined />}
                      loading={loading}
                    >
                      Создать
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Table
                columns={apiKeyColumns}
                dataSource={apiKeys}
                rowKey="id"
                pagination={false}
              />
            </>
      ),
    },
    {
      key: 'security',
      label: <span><SafetyOutlined />Безопасность</span>,
      children: (
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleUpdateSecurity}
              style={{ maxWidth: 800 }}
            >
              <Alert
                message="Настройки безопасности"
                description="Управление доступом и защита данных"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Form.Item
                label="IP Whitelist"
                name="ip_whitelist"
                extra="Разрешенные IP адреса (по одному на строку)"
              >
                <Input.TextArea rows={4} placeholder="192.168.1.1&#10;10.0.0.1" />
              </Form.Item>

              <Form.Item
                label="Rate Limit (запросов в минуту)"
                name="rate_limit"
              >
                <Input type="number" />
              </Form.Item>

              <Form.Item
                label="Требовать 2FA для всех пользователей"
                name="require_2fa"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Автоматический выход (минуты неактивности)"
                name="session_timeout"
              >
                <Input type="number" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Сохранить
                </Button>
              </Form.Item>
            </Form>
      ),
    },
    {
      key: 'logs',
      label: <span><HistoryOutlined />Логи интеграций</span>,
      children: (
            <Table
              columns={[
                { 
                  title: 'Интеграция', 
                  dataIndex: 'integration', 
                  key: 'integration',
                  render: (text) => <Tag>{text}</Tag>,
                },
                { 
                  title: 'Действие', 
                  dataIndex: 'action', 
                  key: 'action' 
                },
                { 
                  title: 'Статус', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'success' ? 'green' : 'red'}>
                      {status}
                    </Tag>
                  ),
                },
                { 
                  title: 'Время', 
                  dataIndex: 'timestamp', 
                  key: 'timestamp',
                  render: (date) => new Date(date).toLocaleString('ru'),
                },
              ]}
              dataSource={integrationLogs}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={<><SettingOutlined /> Настройки системы</>}>
        <Tabs defaultActiveKey="general" items={tabItems} />
      </Card>

      {/* Integration Modals */}
      <Modal
        title="Настройка Instagram"
        open={integrationModalVisible === 'instagram'}
        onCancel={() => setIntegrationModalVisible(null)}
        footer={null}
        width={700}
      >
        <InstagramConnect
          onSuccess={handleIntegrationSuccess}
          onCancel={() => setIntegrationModalVisible(null)}
        />
      </Modal>

      <Modal
        title="Настройка Facebook Messenger"
        open={integrationModalVisible === 'facebook'}
        onCancel={() => setIntegrationModalVisible(null)}
        footer={null}
        width={700}
      >
        <FacebookConnect
          onSuccess={handleIntegrationSuccess}
          onCancel={() => setIntegrationModalVisible(null)}
        />
      </Modal>

      <Modal
        title="Настройка Telegram"
        open={integrationModalVisible === 'telegram'}
        onCancel={() => setIntegrationModalVisible(null)}
        footer={null}
        width={700}
      >
        <TelegramConnect
          onSuccess={handleIntegrationSuccess}
          onCancel={() => setIntegrationModalVisible(null)}
        />
      </Modal>

      <Modal
        title="Настройка SMS"
        open={integrationModalVisible === 'sms'}
        onCancel={() => setIntegrationModalVisible(null)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <SMSSettings onSuccess={handleIntegrationSuccess} />
      </Modal>

      <Modal
        title="Настройка телефонии"
        open={integrationModalVisible === 'telephony'}
        onCancel={() => setIntegrationModalVisible(null)}
        footer={null}
        width={700}
      >
        <TelephonySettings onSuccess={handleIntegrationSuccess} />
      </Modal>
    </div>
  );
}

export default SettingsPage;
