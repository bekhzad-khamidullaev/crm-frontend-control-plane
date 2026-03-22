import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
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
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Typography,
  Upload,
  theme as antdTheme,
} from 'antd';
import {
  ApiOutlined,
  BellOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  GlobalOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShareAltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import LegacyIntegrationsPage from './integrations.jsx';
import settingsApi from '../lib/api/settings.js';
import { exportCrmDataExcel, importCrmDataExcel } from '../lib/api/crmData.js';
import {
  executeDsrRequest,
  getComplianceReport,
  getDsrRequests,
  getRetentionPolicies,
  runRetentionPolicies,
} from '../lib/api/compliance.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { formatValueForUi, isPlainObject as isPlainObjectValue } from '../lib/utils/value-display.js';
import { t } from '../lib/i18n/index.js';

const { Text } = Typography;

const formatDateTime = (value) => {
  if (!value) return '-';
  return dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm') : String(value);
};

function prettifyKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value) {
  return isPlainObjectValue(value);
}

function isTimeString(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function keyLooksLikeTime(key) {
  const normalized = String(key || '').toLowerCase();
  return normalized.includes('time') || normalized.endsWith('_at') || normalized.endsWith('_hour');
}

function normalizeForForm(value, parentKey = '') {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForForm(item, parentKey));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeForForm(item, key)]));
  }

  if (isTimeString(value) && keyLooksLikeTime(parentKey)) {
    return dayjs(value, value.length === 8 ? 'HH:mm:ss' : 'HH:mm');
  }

  return value;
}

function serializeForSubmit(value, parentKey = '') {
  if (Array.isArray(value)) {
    return value.map((item) => serializeForSubmit(item, parentKey));
  }

  if (dayjs.isDayjs(value)) {
    return keyLooksLikeTime(parentKey) ? value.format('HH:mm') : value.toISOString();
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeForSubmit(item, key)]));
  }

  return value;
}

function inferFieldType(key, value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (dayjs.isDayjs(value) || (isTimeString(value) && keyLooksLikeTime(key))) return 'time';
  if (Array.isArray(value) && value.every((item) => ['string', 'number'].includes(typeof item))) return 'tags';
  if (typeof value === 'string' && (String(key).includes('url') || value.startsWith('http'))) return 'url';
  if (typeof value === 'string' && value.length > 120) return 'textarea';
  if (typeof value === 'string') return 'text';
  if (Array.isArray(value)) return 'list';
  if (isPlainObject(value)) return 'group';
  return 'text';
}

function SettingField({ fieldKey, path, value, isDark = false }) {
  const type = inferFieldType(fieldKey, value);
  const label = prettifyKey(fieldKey);
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };

  if (type === 'group') {
    return (
      <Card
        size="small"
        variant="borderless"
        styles={{ body: { padding: 16 } }}
        style={{
          background: isDark ? '#1e232e' : '#fafafa',
          border: `1px solid ${isDark ? '#2d3343' : '#f0f0f0'}`,
          marginBottom: 16,
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Text strong>{label}</Text>
            <div>
              <Text type="secondary">{tr('settingsWorkspace.field.groupDescription', 'Настройка группы параметров.')}</Text>
            </div>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(value).map(([childKey, childValue]) => (
              <Col xs={24} md={12} key={[...path, childKey].join('.')}>
                <SettingField fieldKey={childKey} path={[...path, childKey]} value={childValue} isDark={isDark} />
              </Col>
            ))}
          </Row>
        </Space>
      </Card>
    );
  }

  if (type === 'list') {
    return (
      <Form.Item label={label} name={path}>
        <Select mode="tags" open={false} placeholder={tr('settingsWorkspace.field.addValues', 'Добавьте значения')} tokenSeparators={[',']} />
      </Form.Item>
    );
  }

  if (type === 'boolean') {
    return (
      <Form.Item label={label} name={path} valuePropName="checked">
        <Switch />
      </Form.Item>
    );
  }

  if (type === 'number') {
    return (
      <Form.Item label={label} name={path}>
        <InputNumber style={{ width: '100%' }} min={0} />
      </Form.Item>
    );
  }

  if (type === 'time') {
    return (
      <Form.Item label={label} name={path}>
        <TimePicker format="HH:mm" style={{ width: '100%' }} />
      </Form.Item>
    );
  }

  if (type === 'textarea') {
    return (
      <Form.Item label={label} name={path}>
        <Input.TextArea rows={4} placeholder={`${tr('settingsWorkspace.field.enter', 'Введите')} ${label.toLowerCase()}`} />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={label} name={path}>
      <Input type={type === 'url' ? 'url' : 'text'} placeholder={`${tr('settingsWorkspace.field.enter', 'Введите')} ${label.toLowerCase()}`} />
    </Form.Item>
  );
}

function SettingsConfigurator({
  title,
  description,
  icon,
  data,
  loading,
  saving,
  onReload,
  onSave,
  isDark = false,
}) {
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const fieldEntries = useMemo(() => Object.entries(data || {}), [data]);

  useEffect(() => {
    form.setFieldsValue(normalizeForForm(data || {}));
  }, [data, form]);

  return (
    <Card>
      <Alert type="info" showIcon icon={icon} message={title} description={description} style={{ marginBottom: 16 }} />
      {!fieldEntries.length ? (
        <Empty description={tr('settingsWorkspace.empty.section', 'Сервер ещё не вернул параметры для этой секции')} />
      ) : (
        <Form form={form} layout="vertical" onFinish={(values) => onSave(serializeForSubmit(values))}>
          <Row gutter={[16, 16]}>
            {fieldEntries.map(([fieldKey, value]) => (
              <Col xs={24} md={inferFieldType(fieldKey, value) === 'group' ? 24 : 12} key={fieldKey}>
                <SettingField fieldKey={fieldKey} path={[fieldKey]} value={normalizeForForm(value, fieldKey)} isDark={isDark} />
              </Col>
            ))}
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {tr('actions.save', 'Сохранить')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
              {tr('actions.refresh', 'Обновить')}
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}

function ComplianceSummary({ report }) {
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  if (!report || !Object.keys(report).length) {
    return <Empty description={tr('settingsWorkspace.empty.complianceReport', 'Нет данных по compliance-отчёту')} />;
  }

  const normalizedEntries = Object.entries(report).map(([key, value]) => [key, formatValueForUi(value, { key })]);
  const scalarEntries = normalizedEntries.filter(([, formatted]) => formatted.kind !== 'complex');
  const objectEntries = normalizedEntries.filter(([, formatted]) => formatted.kind === 'complex');

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {scalarEntries.length ? (
        <Row gutter={[16, 16]}>
          {scalarEntries.map(([key, formatted]) => (
            <Col xs={24} md={8} key={key}>
              <Card size="small">
                <Statistic title={prettifyKey(key)} value={formatted.kind === 'number' ? formatted.number : undefined} />
                {formatted.kind !== 'number' ? <Text strong>{formatted.text}</Text> : null}
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {objectEntries.map(([key, formatted]) => (
        <Card key={key} size="small" title={prettifyKey(key)}>
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            {Object.entries(formatted.value || {}).map(([childKey, childValue]) => {
              const childFormatted = formatValueForUi(childValue, { key: childKey });
              return (
                <Descriptions.Item key={childKey} label={prettifyKey(childKey)}>
                  {childFormatted.kind === 'complex' ? JSON.stringify(childFormatted.value) : childFormatted.text}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </Card>
      ))}
    </Space>
  );
}

function normalizeList(response) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
}

export default function SettingsIntegrationsWorkspace({ defaultTab = 'system' } = {}) {
  const { token } = antdTheme.useToken();
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sectionLoading, setSectionLoading] = useState({});
  const [sectionSaving, setSectionSaving] = useState({});
  const [generalSettings, setGeneralSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [userNotificationSettings, setUserNotificationSettings] = useState({});
  const [securitySettings, setSecuritySettings] = useState({});
  const [massmailSettings, setMassmailSettings] = useState({});
  const [remindersSettings, setRemindersSettings] = useState({});
  const [domains, setDomains] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [integrationLogs, setIntegrationLogs] = useState([]);
  const [integrationLogStats, setIntegrationLogStats] = useState({});
  const [securitySessions, setSecuritySessions] = useState([]);
  const [securityAuditItems, setSecurityAuditItems] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [dsrItems, setDsrItems] = useState([]);
  const [retentionItems, setRetentionItems] = useState([]);
  const [dataExchangeLoading, setDataExchangeLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const setLoadingState = (key, value) => setSectionLoading((prev) => ({ ...prev, [key]: value }));
  const setSavingState = (key, value) => setSectionSaving((prev) => ({ ...prev, [key]: value }));

  const loadWorkspace = async () => {
    await Promise.all([
      loadGeneralSettings(),
      loadNotifications(),
      loadSecurity(),
      loadMassmailSettings(),
      loadReminderSettings(),
      loadPublicDomains(),
      loadWebhooks(),
      loadIntegrationLogs(),
      loadSecurityActivity(),
      loadComplianceData(),
    ]);
  };

  const wrapLoad = async (key, loader) => {
    setLoadingState(key, true);
    try {
      await loader();
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      message.error(tr('settingsWorkspace.messages.loadError', 'Не удалось загрузить секцию {section}', { section: key }));
    } finally {
      setLoadingState(key, false);
    }
  };

  const loadGeneralSettings = () => wrapLoad('general', async () => {
    const data = await settingsApi.general();
    setGeneralSettings(data ?? {});
  });

  const loadNotifications = () => wrapLoad('notifications', async () => {
    const [globalData, userData] = await Promise.all([settingsApi.notifications(), settingsApi.userNotifications()]);
    setNotificationSettings(globalData ?? {});
    setUserNotificationSettings(userData ?? {});
  });

  const loadSecurity = () => wrapLoad('security', async () => {
    const data = await settingsApi.security();
    setSecuritySettings(data ?? {});
  });

  const loadMassmailSettings = () => wrapLoad('massmail', async () => {
    const data = await settingsApi.massmail();
    setMassmailSettings(data ?? {});
  });

  const loadReminderSettings = () => wrapLoad('reminders', async () => {
    const data = await settingsApi.reminders();
    setRemindersSettings(data ?? {});
  });

  const loadPublicDomains = () => wrapLoad('domains', async () => {
    const data = await settingsApi.publicEmailDomains();
    const list = data?.domains || data?.results || data || [];
    setDomains(Array.isArray(list) ? list : []);
  });

  const loadWebhooks = () => wrapLoad('webhooks', async () => {
    const response = await settingsApi.webhooks.list({ limit: 50 });
    setWebhooks(normalizeList(response));
  });

  const loadIntegrationLogs = () => wrapLoad('integrationLogs', async () => {
    const [statsResp, logsResp] = await Promise.all([
      settingsApi.integrationLogs.stats(),
      settingsApi.integrationLogs.list({ limit: 20 }),
    ]);
    setIntegrationLogStats(statsResp || {});
    setIntegrationLogs(normalizeList(logsResp));
  });

  const loadSecurityActivity = () => wrapLoad('securityActivity', async () => {
    const [sessionsResp, auditResp] = await Promise.all([
      settingsApi.securitySessions({ limit: 20 }),
      settingsApi.securityAuditLog({ limit: 20 }),
    ]);
    setSecuritySessions(normalizeList(sessionsResp));
    setSecurityAuditItems(normalizeList(auditResp));
  });

  const loadComplianceData = () => wrapLoad('compliance', async () => {
    const [reportResp, dsrResp, retentionResp] = await Promise.all([
      getComplianceReport(),
      getDsrRequests({ page_size: 50 }),
      getRetentionPolicies({ page_size: 50 }),
    ]);
    setComplianceReport(reportResp || null);
    setDsrItems(normalizeList(dsrResp));
    setRetentionItems(normalizeList(retentionResp));
  });

  const saveSection = async (key, payload, request, reload) => {
    setSavingState(key, true);
    try {
      await request(payload);
      message.success(tr('settingsWorkspace.messages.saved', 'Настройки сохранены'));
      await reload();
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      message.error(tr('settingsWorkspace.messages.saveError', 'Ошибка сохранения настроек'));
    } finally {
      setSavingState(key, false);
    }
  };

  const handleExecuteDsr = async (record) => {
    try {
      await executeDsrRequest(record.id);
      message.success(tr('settingsWorkspace.messages.dsrExecuted', 'DSR выполнен'));
      await loadComplianceData();
    } catch (error) {
      console.error('Error executing DSR:', error);
      message.error(tr('settingsWorkspace.messages.dsrExecuteError', 'Не удалось выполнить DSR'));
    }
  };

  const handleRunRetention = async () => {
    try {
      setLoadingState('compliance', true);
      const result = await runRetentionPolicies();
      message.success(tr('settingsWorkspace.messages.retentionExecuted', 'Retention выполнен: {count} политик', { count: result?.count || 0 }));
      await loadComplianceData();
    } catch (error) {
      console.error('Error running retention:', error);
      message.error(tr('settingsWorkspace.messages.retentionExecuteError', 'Не удалось выполнить retention политики'));
    } finally {
      setLoadingState('compliance', false);
    }
  };

  const handleTestWebhook = async (record) => {
    try {
      await settingsApi.webhooks.test(record.id, {});
      message.success(tr('settingsWorkspace.messages.webhookTested', 'Webhook проверен'));
      await loadWebhooks();
    } catch (error) {
      console.error('Error testing webhook:', error);
      message.error(tr('settingsWorkspace.messages.webhookTestError', 'Не удалось проверить webhook'));
    }
  };

  const importSheetRows = Object.entries(importResult?.sheets || {}).map(([name, stats]) => ({
    key: name,
    name,
    created: stats?.created || 0,
    updated: stats?.updated || 0,
    errors: stats?.errors || 0,
  }));

  const domainColumns = [
    {
      title: tr('settingsWorkspace.table.domain', 'Домен'),
      dataIndex: 'domain',
      key: 'domain',
      render: (value, record) => value || record,
    },
    {
      title: tr('settingsWorkspace.table.status', 'Статус'),
      key: 'status',
      width: 160,
      render: () => <Tag color="blue">{tr('settingsWorkspace.domains.public', 'Публичный')}</Tag>,
    },
  ];

  const overviewStats = [
    {
      key: 'general',
      title: tr('settingsWorkspace.overview.general', 'Системных секций'),
      value: [generalSettings, securitySettings, notificationSettings, massmailSettings, remindersSettings].filter(
        (section) => Object.keys(section || {}).length,
      ).length,
      icon: <SettingOutlined style={{ color: token.colorPrimary }} />,
    },
    {
      key: 'domains',
      title: tr('settingsWorkspace.overview.domains', 'Публичных доменов'),
      value: domains.length,
      icon: <GlobalOutlined style={{ color: '#1677ff' }} />,
    },
    {
      key: 'webhooks',
      title: tr('settingsWorkspace.overview.webhooks', 'Активных webhooks'),
      value: webhooks.filter((item) => item.is_active).length,
      icon: <ShareAltOutlined style={{ color: '#13c2c2' }} />,
    },
    {
      key: 'logs',
      title: tr('settingsWorkspace.overview.logs', 'Integration logs'),
      value: Array.isArray(integrationLogStats?.timeline) ? integrationLogStats.timeline.length : integrationLogs.length,
      icon: <CloudSyncOutlined style={{ color: '#722ed1' }} />,
    },
    {
      key: 'dsr',
      title: tr('settingsWorkspace.overview.dsr', 'DSR в работе'),
      value: dsrItems.filter((item) => item.status !== 'completed').length,
      icon: <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />,
    },
    {
      key: 'retention',
      title: tr('settingsWorkspace.overview.retention', 'Активных retention'),
      value: retentionItems.filter((item) => item.is_active).length,
      icon: <DatabaseOutlined style={{ color: '#52c41a' }} />,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: tr('settingsWorkspace.tabs.overview', 'Обзор'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('settingsWorkspace.overview.heroTitle', 'Единый workspace для настроек и интеграций')}
            description={tr(
              'settingsWorkspace.overview.heroDescription',
              'Экран объединяет core system settings, compliance, data exchange, webhooks, integration logs и все каналы интеграции в одном месте.',
            )}
          />
          <Row gutter={[16, 16]}>
            {overviewStats.map((item) => (
              <Col xs={24} md={12} xl={8} key={item.key}>
                <Card>
                  <Space align="start">
                    <div style={{ fontSize: 24 }}>{item.icon}</div>
                    <Statistic title={item.title} value={item.value} />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card title={tr('settingsWorkspace.overview.quickSync', 'Синхронизация с backend')}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="General">{Object.keys(generalSettings || {}).length ? 'synced' : 'empty'}</Descriptions.Item>
                  <Descriptions.Item label="Notifications">{Object.keys(notificationSettings || {}).length ? 'synced' : 'empty'}</Descriptions.Item>
                  <Descriptions.Item label="Security">{Object.keys(securitySettings || {}).length ? 'synced' : 'empty'}</Descriptions.Item>
                  <Descriptions.Item label="Webhooks">{webhooks.length}</Descriptions.Item>
                  <Descriptions.Item label="Integration Logs">{integrationLogs.length}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title={tr('settingsWorkspace.overview.quickActions', 'Быстрые действия')}>
                <Space wrap>
                  <Button onClick={() => setActiveTab('system')}>{tr('settingsWorkspace.actions.openSystem', 'Открыть систему')}</Button>
                  <Button onClick={() => setActiveTab('operations')}>{tr('settingsWorkspace.actions.openOps', 'Открыть ops')}</Button>
                  <Button onClick={() => setActiveTab('compliance')}>{tr('settingsWorkspace.actions.openCompliance', 'Открыть compliance')}</Button>
                  <Button type="primary" onClick={() => setActiveTab('integrations')}>{tr('settingsWorkspace.actions.openIntegrations', 'Открыть интеграции')}</Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'system',
      label: tr('settingsWorkspace.tabs.system', 'Система'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.general.title', 'General settings')}
                description={tr('settingsWorkspace.general.description', 'Компания, язык, timezone и базовые параметры runtime-конфигурации.')}
                icon={<SettingOutlined />}
                data={generalSettings}
                loading={sectionLoading.general}
                saving={sectionSaving.general}
                onReload={loadGeneralSettings}
                onSave={(payload) => saveSection('general', payload, settingsApi.updateGeneral, loadGeneralSettings)}
                isDark={isDark}
              />
            </Col>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.notifications.title', 'Global notifications')}
                description={tr('settingsWorkspace.notifications.description', 'Глобальная политика уведомлений, quiet hours и delivery channels.')}
                icon={<BellOutlined />}
                data={notificationSettings}
                loading={sectionLoading.notifications}
                saving={sectionSaving.notifications}
                onReload={loadNotifications}
                onSave={(payload) => saveSection('notifications', payload, settingsApi.updateNotifications, loadNotifications)}
                isDark={isDark}
              />
            </Col>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.userNotifications.title', 'My notifications')}
                description={tr('settingsWorkspace.userNotifications.description', 'Персональные настройки уведомлений текущего пользователя.')}
                icon={<BellOutlined />}
                data={userNotificationSettings}
                loading={sectionLoading.notifications}
                saving={sectionSaving.userNotifications}
                onReload={loadNotifications}
                onSave={(payload) => saveSection('userNotifications', payload, settingsApi.updateUserNotifications, loadNotifications)}
                isDark={isDark}
              />
            </Col>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.security.title', 'Security settings')}
                description={tr('settingsWorkspace.security.description', 'Пароли, сессии, MFA-политики и ограничения безопасности.')}
                icon={<SafetyCertificateOutlined />}
                data={securitySettings}
                loading={sectionLoading.security}
                saving={sectionSaving.security}
                onReload={loadSecurity}
                onSave={(payload) => saveSection('security', payload, settingsApi.updateSecurity, loadSecurity)}
                isDark={isDark}
              />
            </Col>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.massmail.title', 'Massmail settings')}
                description={tr('settingsWorkspace.massmail.description', 'Лимиты, business hours и unsubscribe policy для массовых email-рассылок.')}
                icon={<MailOutlined />}
                data={massmailSettings}
                loading={sectionLoading.massmail}
                saving={sectionSaving.massmail}
                onReload={loadMassmailSettings}
                onSave={(payload) => saveSection('massmail', payload, settingsApi.updateMassmail, loadMassmailSettings)}
                isDark={isDark}
              />
            </Col>
            <Col xs={24} xl={12}>
              <SettingsConfigurator
                title={tr('settingsWorkspace.reminders.title', 'Reminder settings')}
                description={tr('settingsWorkspace.reminders.description', 'Интервалы проверки и системные параметры reminders.')}
                icon={<BellOutlined />}
                data={remindersSettings}
                loading={sectionLoading.reminders}
                saving={sectionSaving.reminders}
                onReload={loadReminderSettings}
                onSave={(payload) => saveSection('reminders', payload, settingsApi.updateReminders, loadReminderSettings)}
                isDark={isDark}
              />
            </Col>
          </Row>
          <Card
            title={tr('settingsWorkspace.domains.title', 'Публичные домены email')}
            extra={<Button icon={<ReloadOutlined />} onClick={loadPublicDomains} loading={sectionLoading.domains}>{tr('actions.refresh', 'Обновить')}</Button>}
          >
            <Table columns={domainColumns} dataSource={domains} rowKey={(record) => record.domain || record} loading={sectionLoading.domains} pagination={{ pageSize: 10, hideOnSinglePage: true }} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'operations',
      label: tr('settingsWorkspace.tabs.operations', 'Webhooks и логи'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card
                title={tr('settingsWorkspace.webhooks.title', 'Webhooks')}
                extra={<Button icon={<ReloadOutlined />} onClick={loadWebhooks} loading={sectionLoading.webhooks}>{tr('actions.refresh', 'Обновить')}</Button>}
              >
                <Table
                  size="small"
                  rowKey={(record) => record.id}
                  dataSource={webhooks}
                  loading={sectionLoading.webhooks}
                  pagination={false}
                  locale={{ emptyText: tr('settingsWorkspace.empty.webhooks', 'Webhook endpoints пока не настроены') }}
                  columns={[
                    { title: 'URL', dataIndex: 'url', key: 'url', render: (value) => <Text ellipsis={{ tooltip: value }}>{value}</Text> },
                    {
                      title: tr('settingsWorkspace.table.status', 'Статус'),
                      dataIndex: 'is_active',
                      key: 'is_active',
                      width: 120,
                      render: (value) => <Tag color={value ? 'success' : 'default'}>{value ? tr('status.active', 'Активен') : tr('status.paused', 'Пауза')}</Tag>,
                    },
                    { title: tr('settingsWorkspace.table.success', 'Успешно'), dataIndex: 'success_count', key: 'success_count', width: 110 },
                    { title: tr('settingsWorkspace.table.failed', 'Ошибки'), dataIndex: 'failure_count', key: 'failure_count', width: 90 },
                    {
                      title: tr('settingsWorkspace.table.actions', 'Действия'),
                      key: 'actions',
                      render: (_, record) => (
                        <Button type="link" onClick={() => handleTestWebhook(record)}>
                          {tr('settingsWorkspace.actions.testWebhook', 'Тест')}
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card
                title={tr('settingsWorkspace.logs.statsTitle', 'Integration logs summary')}
                extra={<Button icon={<ReloadOutlined />} onClick={loadIntegrationLogs} loading={sectionLoading.integrationLogs}>{tr('actions.refresh', 'Обновить')}</Button>}
              >
                <Row gutter={[12, 12]}>
                  {Object.entries(integrationLogStats?.by_status || {}).slice(0, 6).map(([statusKey, value]) => (
                    <Col xs={12} md={8} key={statusKey}>
                      <Card size="small">
                        <Statistic title={prettifyKey(statusKey)} value={value} />
                      </Card>
                    </Col>
                  ))}
                  {!Object.keys(integrationLogStats?.by_status || {}).length && (
                    <Col span={24}>
                      <Empty description={tr('settingsWorkspace.empty.logStats', 'Статистика логов пока недоступна')} />
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
          <Card
            title={tr('settingsWorkspace.logs.recentTitle', 'Recent integration logs')}
            extra={<Button icon={<ReloadOutlined />} onClick={loadIntegrationLogs} loading={sectionLoading.integrationLogs}>{tr('actions.refresh', 'Обновить')}</Button>}
          >
            <Table
              size="small"
              rowKey={(record) => record.id}
              dataSource={integrationLogs}
              loading={sectionLoading.integrationLogs}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              columns={[
                { title: tr('settingsWorkspace.table.integration', 'Интеграция'), dataIndex: 'integration', key: 'integration' },
                { title: tr('settingsWorkspace.table.action', 'Действие'), dataIndex: 'action', key: 'action' },
                {
                  title: tr('settingsWorkspace.table.status', 'Статус'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (value) => <Tag color={String(value).toLowerCase() === 'success' ? 'success' : 'error'}>{value}</Tag>,
                },
                { title: tr('settingsWorkspace.table.user', 'Пользователь'), dataIndex: 'user_email', key: 'user_email', render: (value) => value || '-' },
                { title: tr('settingsWorkspace.table.timestamp', 'Время'), dataIndex: 'timestamp', key: 'timestamp', render: formatDateTime },
              ]}
            />
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card
                title={tr('settingsWorkspace.security.sessionsTitle', 'Активные сессии')}
                extra={<Button icon={<ReloadOutlined />} onClick={loadSecurityActivity} loading={sectionLoading.securityActivity}>{tr('actions.refresh', 'Обновить')}</Button>}
              >
                <Table
                  size="small"
                  rowKey={(record) => record.id || record.session_key}
                  dataSource={securitySessions}
                  loading={sectionLoading.securityActivity}
                  pagination={{ pageSize: 5, hideOnSinglePage: true }}
                  columns={[
                    { title: tr('settingsWorkspace.table.user', 'Пользователь'), dataIndex: 'user_email', key: 'user_email', render: (value) => value || '-' },
                    { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', render: (value) => value || '-' },
                    { title: tr('settingsWorkspace.table.lastActivity', 'Активность'), dataIndex: 'last_activity', key: 'last_activity', render: formatDateTime },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card
                title={tr('settingsWorkspace.security.auditTitle', 'Security audit')}
                extra={<Button icon={<ReloadOutlined />} onClick={loadSecurityActivity} loading={sectionLoading.securityActivity}>{tr('actions.refresh', 'Обновить')}</Button>}
              >
                <Table
                  size="small"
                  rowKey={(record) => record.id}
                  dataSource={securityAuditItems}
                  loading={sectionLoading.securityActivity}
                  pagination={{ pageSize: 5, hideOnSinglePage: true }}
                  columns={[
                    { title: tr('settingsWorkspace.table.action', 'Действие'), dataIndex: 'action', key: 'action' },
                    { title: tr('settingsWorkspace.table.actor', 'Актор'), dataIndex: 'actor_email', key: 'actor_email', render: (value) => value || '-' },
                    { title: tr('settingsWorkspace.table.created', 'Создано'), dataIndex: 'created_at', key: 'created_at', render: formatDateTime },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'compliance',
      label: tr('settingsWorkspace.tabs.compliance', 'Compliance и данные'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            title={tr('settingsWorkspace.compliance.overviewTitle', 'Compliance overview')}
            extra={<Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={sectionLoading.compliance}>{tr('actions.refresh', 'Обновить')}</Button>}
          >
            <Alert
              type="info"
              showIcon
              message={tr('settingsWorkspace.compliance.summaryTitle', 'Сводка по согласию, DSR и retention')}
              description={tr('settingsWorkspace.compliance.summaryDescription', 'Показатели представлены в виде карточек и таблиц без сырого JSON.')}
              style={{ marginBottom: 16 }}
            />
            <ComplianceSummary report={complianceReport} />
          </Card>

          <Card title={tr('settingsWorkspace.crmData.title', 'Импорт и экспорт CRM')}>
            <Alert
              message={tr('settingsWorkspace.crmData.alertTitle', 'Обмен данными через Excel')}
              description={tr('settingsWorkspace.crmData.alertDescription', 'Экспорт формирует Excel-файл по всем сущностям CRM. Для импорта используйте тот же формат.')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Text strong>{tr('settingsWorkspace.crmData.export.title', 'Экспорт данных')}</Text>
                      <Text type="secondary">{tr('settingsWorkspace.crmData.export.description', 'Скачать полный Excel-файл с текущими данными CRM.')}</Text>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={dataExchangeLoading}
                        onClick={async () => {
                          try {
                            setDataExchangeLoading(true);
                            const blob = await exportCrmDataExcel();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `crm_full_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            message.success(tr('settingsWorkspace.messages.exportDone', 'Экспорт CRM завершён'));
                          } catch (error) {
                            console.error('Error exporting CRM data:', error);
                            message.error(tr('settingsWorkspace.messages.exportError', 'Не удалось экспортировать данные CRM'));
                          } finally {
                            setDataExchangeLoading(false);
                          }
                        }}
                      >
                        {tr('settingsWorkspace.crmData.export.action', 'Экспортировать в Excel')}
                      </Button>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Text strong>{tr('settingsWorkspace.crmData.import.title', 'Импорт данных')}</Text>
                      <Text type="secondary">{tr('settingsWorkspace.crmData.import.description', 'Загрузите подготовленный Excel-файл и запустите обработку.')}</Text>
                      <Space wrap>
                        <Upload
                          maxCount={1}
                          beforeUpload={(file) => {
                            setImportFile(file);
                            return false;
                          }}
                          onRemove={() => setImportFile(null)}
                          accept=".xlsx"
                        >
                          <Button icon={<UploadOutlined />}>{tr('settingsWorkspace.crmData.import.selectFile', 'Выбрать Excel файл')}</Button>
                        </Upload>
                        <Button
                          type="primary"
                          loading={dataExchangeLoading}
                          disabled={!importFile}
                          onClick={async () => {
                            if (!importFile) return;
                            try {
                              setDataExchangeLoading(true);
                              const result = await importCrmDataExcel(importFile);
                              setImportResult(result);
                              message.success(tr('settingsWorkspace.messages.importDone', 'Импорт CRM завершён'));
                            } catch (error) {
                              console.error('Error importing CRM data:', error);
                              message.error(tr('settingsWorkspace.messages.importError', 'Ошибка импорта CRM данных'));
                            } finally {
                              setDataExchangeLoading(false);
                            }
                          }}
                        >
                          {tr('settingsWorkspace.crmData.import.action', 'Импортировать')}
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
              {importResult ? (
                <Card size="small" title={tr('settingsWorkspace.crmData.lastImport', 'Результат последнего импорта')}>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}>
                      <Statistic title={tr('settingsWorkspace.crmData.stats.created', 'Создано')} value={importResult.created || 0} />
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic title={tr('settingsWorkspace.crmData.stats.updated', 'Обновлено')} value={importResult.updated || 0} />
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic title={tr('settingsWorkspace.crmData.stats.errors', 'Ошибок')} value={importResult.errors || 0} />
                    </Col>
                  </Row>
                  <Table
                    pagination={false}
                    dataSource={importSheetRows}
                    columns={[
                      { title: tr('settingsWorkspace.crmData.table.sheet', 'Лист'), dataIndex: 'name', key: 'name' },
                      { title: tr('settingsWorkspace.crmData.table.created', 'Создано'), dataIndex: 'created', key: 'created' },
                      { title: tr('settingsWorkspace.crmData.table.updated', 'Обновлено'), dataIndex: 'updated', key: 'updated' },
                      { title: tr('settingsWorkspace.crmData.table.errors', 'Ошибки'), dataIndex: 'errors', key: 'errors', render: (value) => <Tag color={value ? 'red' : 'green'}>{value}</Tag> },
                    ]}
                  />
                </Card>
              ) : null}
            </Space>
          </Card>

          <Card
            title={tr('settingsWorkspace.compliance.dsrTitle', 'DSR Requests')}
            extra={<Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={sectionLoading.compliance}>{tr('actions.refresh', 'Обновить')}</Button>}
          >
            <Table
              rowKey={(record) => record.id}
              loading={sectionLoading.compliance}
              dataSource={dsrItems}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id', width: 220 },
                { title: tr('settingsWorkspace.table.type', 'Тип'), dataIndex: 'request_type', key: 'request_type', render: prettifyKey },
                { title: tr('settingsWorkspace.table.status', 'Статус'), dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'completed' ? 'green' : value === 'failed' ? 'red' : 'blue'}>{prettifyKey(value)}</Tag> },
                { title: tr('settingsWorkspace.table.reason', 'Причина'), dataIndex: 'reason', key: 'reason', render: (value) => value || '-' },
                {
                  title: tr('settingsWorkspace.table.actions', 'Действия'),
                  key: 'actions',
                  render: (_, record) => (
                    <Button type="link" disabled={record.status === 'completed' || record.status === 'in_progress'} onClick={() => handleExecuteDsr(record)}>
                      {tr('settingsWorkspace.compliance.execute', 'Выполнить')}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>

          <Card
            title={tr('settingsWorkspace.compliance.retentionTitle', 'Retention Policies')}
            extra={(
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={sectionLoading.compliance}>
                  {tr('actions.refresh', 'Обновить')}
                </Button>
                <Button type="primary" onClick={handleRunRetention} loading={sectionLoading.compliance}>
                  {tr('settingsWorkspace.compliance.runRetention', 'Запустить retention')}
                </Button>
              </Space>
            )}
          >
            <Table
              rowKey={(record) => record.id}
              loading={sectionLoading.compliance}
              dataSource={retentionItems}
              pagination={false}
              columns={[
                { title: tr('settingsWorkspace.table.name', 'Название'), dataIndex: 'name', key: 'name' },
                { title: tr('settingsWorkspace.table.entity', 'Сущность'), dataIndex: 'entity', key: 'entity', render: prettifyKey },
                { title: tr('settingsWorkspace.table.action', 'Действие'), dataIndex: 'action', key: 'action', render: prettifyKey },
                { title: tr('settingsWorkspace.table.retentionDays', 'Срок хранения (дни)'), dataIndex: 'retention_days', key: 'retention_days' },
                { title: tr('settingsWorkspace.table.activity', 'Активность'), dataIndex: 'is_active', key: 'is_active', render: (value) => (value ? <Tag color="green">{tr('settingsWorkspace.status.active', 'Активна')}</Tag> : <Tag>{tr('settingsWorkspace.status.inactive', 'Неактивна')}</Tag>) },
                { title: tr('settingsWorkspace.table.lastRun', 'Последний запуск'), dataIndex: 'last_run_at', key: 'last_run_at', render: formatDateTime },
              ]}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'integrations',
      label: tr('settingsWorkspace.tabs.integrations', 'Интеграции'),
      children: <LegacyIntegrationsPage embedded />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
        }}
        title={(
          <Space>
            <ApiOutlined />
            <span>{tr('settingsWorkspace.title', 'Settings and Integrations Workspace')}</span>
          </Space>
        )}
        extra={(
          <Button icon={<ReloadOutlined />} onClick={loadWorkspace} loading={Object.values(sectionLoading).some(Boolean) || dataExchangeLoading}>
            {tr('settingsWorkspace.actions.refreshAll', 'Обновить всё')}
          </Button>
        )}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}
