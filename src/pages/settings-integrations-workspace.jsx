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
  Grid,
  Input,
  InputNumber,
  Modal,
  Progress,
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
  AppstoreAddOutlined,
  ApiOutlined,
  BellOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  GlobalOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShareAltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import LegacyIntegrationsPage from './integrations.jsx';
import LeadRulesPanel from './settings-lead-rules-panel.jsx';
import settingsApi from '../lib/api/settings.js';
import marketplaceApi, {
  groupModulesByType,
  normalizeModuleType,
} from '../lib/api/plugins.js';
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
import { navigate } from '../router.js';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';

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

function resolveChannelBrandKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return 'omnichannel';
  if (/(whatsapp|wa\b)/.test(normalized)) return 'whatsapp';
  if (/(facebook|messenger|\bfb\b)/.test(normalized)) return 'facebook';
  if (/(instagram|\big\b)/.test(normalized)) return 'instagram';
  if (/(telegram|\btg\b)/.test(normalized)) return 'telegram';
  if (/(playmobile|eskiz|sms)/.test(normalized)) return 'sms';
  if (/(email|mail|massmail)/.test(normalized)) return 'crm-email';
  if (/(telephony|voip|sip|asterisk|call|phone)/.test(normalized)) return 'telephony';
  if (/(omnichannel|inbox|chat|webhook)/.test(normalized)) return 'omnichannel';
  return normalized;
}

function renderChannelCell(value) {
  const label = value || '-';
  return (
    <Space size={8} align="center">
      <ChannelBrandIcon channel={resolveChannelBrandKey(label)} size={14} />
      <span>{label}</span>
    </Space>
  );
}

function interpolateFallback(template, vars = {}) {
  let result = String(template || '');
  for (const [name, value] of Object.entries(vars || {})) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
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

function getFieldSelectOptions(fieldKey, value) {
  const key = String(fieldKey || '').toLowerCase();
  if (key.includes('timezone')) {
    return ['UTC', 'Asia/Tashkent', 'Europe/Moscow', 'Europe/Berlin', 'America/New_York'].map((item) => ({
      label: item,
      value: item,
    }));
  }
  if (key.includes('language') || key.includes('locale')) {
    return ['en', 'ru', 'uz'].map((item) => ({ label: item.toUpperCase(), value: item }));
  }
  if (key.includes('frequency') || key.includes('digest')) {
    return ['instant', 'hourly', 'daily', 'weekly'].map((item) => ({
      label: prettifyKey(item),
      value: item,
    }));
  }
  if (key.includes('mode')) {
    return ['auto', 'manual', 'disabled'].map((item) => ({
      label: prettifyKey(item),
      value: item,
    }));
  }
  if (key.includes('status')) {
    return ['active', 'inactive', 'paused'].map((item) => ({
      label: prettifyKey(item),
      value: item,
    }));
  }
  if (key.includes('policy')) {
    return ['strict', 'balanced', 'relaxed'].map((item) => ({
      label: prettifyKey(item),
      value: item,
    }));
  }
  if (key.includes('provider')) {
    return ['smtp', 'ses', 'sendgrid', 'mailgun'].map((item) => ({
      label: item.toUpperCase(),
      value: item,
    }));
  }
  if (Array.isArray(value) && value.length > 0 && value.every((item) => ['string', 'number'].includes(typeof item))) {
    return value.map((item) => ({ label: String(item), value: item }));
  }
  return null;
}

function isReadOnlyField(fieldKey) {
  const key = String(fieldKey || '').toLowerCase();
  return (
    key === 'id'
    || key.endsWith('_id')
    || key.endsWith('_at')
    || key.includes('created')
    || key.includes('updated')
    || key.includes('timestamp')
    || key.includes('last_run')
  );
}

function SettingField({ fieldKey, path, value, isDark = false }) {
  const type = inferFieldType(fieldKey, value);
  const label = prettifyKey(fieldKey);
  const selectOptions = getFieldSelectOptions(fieldKey, value);
  const isReadOnly = isReadOnlyField(fieldKey);
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? interpolateFallback(fallback, vars) : localized;
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
        <Select
          mode="multiple"
          options={selectOptions || []}
          placeholder={tr('settingsWorkspace.field.selectValues', 'Выберите значения')}
          allowClear
        />
      </Form.Item>
    );
  }

  if (type === 'boolean') {
    return (
      <Form.Item label={label} name={path} valuePropName="checked">
        <Switch disabled={isReadOnly} />
      </Form.Item>
    );
  }

  if (type === 'number') {
    return (
      <Form.Item label={label} name={path}>
        <InputNumber style={{ width: '100%' }} min={0} disabled={isReadOnly} />
      </Form.Item>
    );
  }

  if (type === 'time') {
    return (
      <Form.Item label={label} name={path}>
        <TimePicker format="HH:mm" style={{ width: '100%' }} disabled={isReadOnly} />
      </Form.Item>
    );
  }

  if (type === 'textarea') {
    return (
      <Form.Item label={label} name={path}>
        <Input.TextArea
          rows={4}
          readOnly={isReadOnly}
          placeholder={`${tr('settingsWorkspace.field.enter', 'Введите')} ${label.toLowerCase()}`}
        />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={label} name={path}>
      {selectOptions ? (
        <Select
          options={selectOptions}
          placeholder={`${tr('settingsWorkspace.field.select', 'Выберите')} ${label.toLowerCase()}`}
          allowClear
          disabled={isReadOnly}
        />
      ) : (
        <Input
          type={type === 'url' ? 'url' : 'text'}
          readOnly={isReadOnly}
          placeholder={`${tr('settingsWorkspace.field.enter', 'Введите')} ${label.toLowerCase()}`}
        />
      )}
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
    return localized === key ? interpolateFallback(fallback, vars) : localized;
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
    return localized === key ? interpolateFallback(fallback, vars) : localized;
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
                  {childFormatted.kind === 'complex'
                    ? t('settingsWorkspace.value.structured', 'Структурированные данные')
                    : childFormatted.text}
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

function normalizeMarketplaceStatus(value) {
  return String(value || 'unknown').toLowerCase();
}

function getMarketplaceStatusMeta(status, tr) {
  const normalized = normalizeMarketplaceStatus(status);
  if (normalized === 'installed') {
    return { color: 'success', label: tr('settingsWorkspace.marketplace.status.installed', 'Installed') };
  }
  if (normalized === 'failed' || normalized === 'error') {
    return { color: 'error', label: tr('settingsWorkspace.marketplace.status.failed', 'Failed') };
  }
  if (normalized === 'uninstalled') {
    return { color: 'default', label: tr('settingsWorkspace.marketplace.status.uninstalled', 'Uninstalled') };
  }
  if (normalized === 'upgrading' || normalized === 'installing' || normalized === 'pending') {
    return { color: 'processing', label: tr('settingsWorkspace.marketplace.status.pending', 'In progress') };
  }
  return { color: 'blue', label: prettifyKey(normalized) };
}

function resolveMarketplaceCompatibility(extension, compatibility = []) {
  const codeNeedle = String(extension?.code || '').toLowerCase();
  const nameNeedle = String(extension?.name || '').toLowerCase();
  return compatibility.find((item) => {
    const haystack = [
      item?.extension_code,
      item?.extension_name,
      item?.code,
      item?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (codeNeedle && haystack.includes(codeNeedle)) || (nameNeedle && haystack.includes(nameNeedle));
  }) || null;
}

function getIntegrationHealthMeta(item) {
  const type = item?.type;
  if (type === 'webhook') {
    if (!item?.enabled) return { color: 'default', label: 'Disabled' };
    if (Number(item?.failure_count || 0) > 0) return { color: 'error', label: 'Errors' };
    return { color: 'success', label: 'Healthy' };
  }
  if (type === 'extension') {
    const status = normalizeMarketplaceStatus(item?.status);
    if (status === 'installed' && item?.compatible !== false) return { color: 'success', label: 'Installed' };
    if (status === 'failed' || status === 'error') return { color: 'error', label: 'Failed' };
    if (item?.compatible === false) return { color: 'warning', label: 'Blocked' };
    if (status === 'uninstalled') return { color: 'default', label: 'Uninstalled' };
    return { color: 'processing', label: 'In progress' };
  }
  return { color: 'default', label: 'Unknown' };
}

function normalizeMarketplaceCatalogPayload(payload) {
  const modules = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.modules)
      ? payload.modules
      : Array.isArray(payload?.results)
        ? payload.results
        : [];
  const version = payload?.version || payload?.catalog_version || '';
  return { modules, version };
}

function resolveModuleManifest(moduleItem = {}) {
  const manifest = isPlainObject(moduleItem?.manifest) ? moduleItem.manifest : {};
  return {
    ...manifest,
    manifest_version: manifest?.manifest_version || 'v1',
    code: manifest?.code || moduleItem?.code || '',
    name: manifest?.name || moduleItem?.name || moduleItem?.code || '',
    version: manifest?.version || moduleItem?.version || '1.0.0',
    compatibility: {
      ...(manifest?.compatibility || {}),
      crm_version: manifest?.compatibility?.crm_version || moduleItem?.crm_version || '2026.03',
    },
  };
}

function getPreviewEntries(payload, limit = 8) {
  if (!isPlainObject(payload)) return [];
  return Object.entries(payload).slice(0, limit);
}

function getIntegrationLogContext(record = {}) {
  const metadata = isPlainObject(record.metadata) ? record.metadata : {};
  return {
    queueState: record.queue_state ?? metadata.queue_state ?? metadata.queueState ?? null,
    replayable: record.replayable ?? metadata.replayable ?? metadata.replay_ready ?? null,
    slaStatus: record.sla_status ?? metadata.sla_status ?? metadata.slaState ?? null,
    signatureValid: record.signature_valid ?? metadata.signature_valid ?? metadata.signatureValid ?? null,
    archivedAt: record.archived_at ?? metadata.archived_at ?? metadata.archivedAt ?? null,
  };
}

export default function SettingsIntegrationsWorkspace({ defaultTab = 'system' } = {}) {
  const screens = Grid.useBreakpoint();
  const { token } = antdTheme.useToken();
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? interpolateFallback(fallback, vars) : localized;
  };

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sectionLoading, setSectionLoading] = useState({});
  const [sectionSaving, setSectionSaving] = useState({});
  const [sectionErrors, setSectionErrors] = useState({});
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
  const [integrationLogModal, setIntegrationLogModal] = useState({
    open: false,
    loading: false,
    record: null,
    detail: null,
    error: null,
  });
  const [activeIntegrationLogId, setActiveIntegrationLogId] = useState(null);
  const [webhookDeliveriesModal, setWebhookDeliveriesModal] = useState({
    open: false,
    loading: false,
    webhook: null,
    deliveries: [],
    selectedDeliveryId: null,
    error: null,
    retryingId: null,
  });
  const [webhookTestContext, setWebhookTestContext] = useState(null);
  const [securitySessions, setSecuritySessions] = useState([]);
  const [securityAuditItems, setSecurityAuditItems] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [dsrItems, setDsrItems] = useState([]);
  const [retentionItems, setRetentionItems] = useState([]);
  const [marketplaceExtensions, setMarketplaceExtensions] = useState([]);
  const [marketplaceCompatibility, setMarketplaceCompatibility] = useState([]);
  const [marketplaceCatalogModules, setMarketplaceCatalogModules] = useState([]);
  const [marketplaceCatalogVersion, setMarketplaceCatalogVersion] = useState('');
  const [marketplaceModuleSearch, setMarketplaceModuleSearch] = useState('');
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState('all');
  const [marketplaceModuleTypeFilter, setMarketplaceModuleTypeFilter] = useState('all');
  const [marketplaceModal, setMarketplaceModal] = useState({
    open: false,
    mode: 'install',
    extensionId: null,
    extensionName: '',
    manifestVersion: 'v1',
    code: '',
    name: '',
    version: '1.0.0',
    crmVersion: '2026.03',
    manifestRaw: '',
    diagnostics: null,
    loading: false,
  });
  const [dataExchangeLoading, setDataExchangeLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const integrationLogStatusEntries = useMemo(
    () => Object.entries(integrationLogStats?.by_status || {}),
    [integrationLogStats]
  );
  const integrationTopAction = useMemo(() => {
    const actionEntries = Object.entries(integrationLogStats?.by_action || {});
    if (!actionEntries.length) return null;
    return actionEntries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0];
  }, [integrationLogStats]);
  const integrationLogSummaryCards = useMemo(() => {
    const totalLogs = Array.isArray(integrationLogStats?.timeline)
      ? integrationLogStats.timeline.length
      : integrationLogs.length;
    const errorCount = integrationLogStatusEntries
      .filter(([key]) => ['error', 'failed', 'failure'].includes(String(key).toLowerCase()))
      .reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const successCount = integrationLogStatusEntries
      .filter(([key]) => ['ok', 'success', 'completed'].includes(String(key).toLowerCase()))
      .reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const webhookFailures = webhooks.reduce((sum, item) => sum + Number(item?.failure_count || 0), 0);

    return [
      {
        key: 'logs',
        label: tr('settingsWorkspace.logs.cards.total', 'Всего логов'),
        value: totalLogs || 0,
        tone: 'default',
      },
      {
        key: 'errors',
        label: tr('settingsWorkspace.logs.cards.errors', 'Ошибки'),
        value: errorCount,
        tone: errorCount > 0 ? 'danger' : 'default',
      },
      {
        key: 'success',
        label: tr('settingsWorkspace.logs.cards.success', 'Успешно'),
        value: successCount,
        tone: successCount > 0 ? 'success' : 'default',
      },
      {
        key: 'webhooks',
        label: tr('settingsWorkspace.logs.cards.webhookFailures', 'Ошибки webhook'),
        value: webhookFailures,
        tone: webhookFailures > 0 ? 'warning' : 'default',
      },
    ];
  }, [integrationLogStats, integrationLogs, integrationLogStatusEntries, webhooks, tr]);
  const integrationErrorCount =
    integrationLogSummaryCards.find((item) => item.key === 'errors')?.value || 0;
  const operationsAlertType =
    integrationErrorCount > 0 || webhooks.some((item) => Number(item?.failure_count || 0) > 0)
      ? 'warning'
      : 'info';
  const complianceCards = useMemo(
    () => [
      {
        key: 'dsr_pending',
        label: tr('settingsWorkspace.compliance.cards.pendingDsr', 'DSR в работе'),
        value: dsrItems.filter((item) => item.status !== 'completed').length,
        tone: dsrItems.some((item) => item.status !== 'completed') ? 'warning' : 'default',
      },
      {
        key: 'dsr_done',
        label: tr('settingsWorkspace.compliance.cards.completedDsr', 'DSR завершено'),
        value: dsrItems.filter((item) => item.status === 'completed').length,
        tone: 'success',
      },
      {
        key: 'retention_active',
        label: tr('settingsWorkspace.compliance.cards.retentionActive', 'Retention активно'),
        value: retentionItems.filter((item) => item.is_active).length,
        tone: retentionItems.some((item) => item.is_active) ? 'info' : 'default',
      },
      {
        key: 'retention_paused',
        label: tr('settingsWorkspace.compliance.cards.retentionPaused', 'Retention paused'),
        value: retentionItems.filter((item) => !item.is_active).length,
        tone: retentionItems.some((item) => !item.is_active) ? 'warning' : 'default',
      },
    ],
    [dsrItems, retentionItems, tr]
  );
  const systemSectionReadiness = useMemo(
    () => [
      { key: 'general', label: tr('settingsWorkspace.general.title', 'General settings'), ready: Object.keys(generalSettings || {}).length > 0 },
      { key: 'notifications', label: tr('settingsWorkspace.notifications.title', 'Global notifications'), ready: Object.keys(notificationSettings || {}).length > 0 },
      { key: 'security', label: tr('settingsWorkspace.security.title', 'Security settings'), ready: Object.keys(securitySettings || {}).length > 0 },
      { key: 'massmail', label: tr('settingsWorkspace.massmail.title', 'Massmail settings'), ready: Object.keys(massmailSettings || {}).length > 0 },
      { key: 'reminders', label: tr('settingsWorkspace.reminders.title', 'Reminder settings'), ready: Object.keys(remindersSettings || {}).length > 0 },
    ],
    [generalSettings, notificationSettings, securitySettings, massmailSettings, remindersSettings, tr]
  );
  const systemReadyCount = systemSectionReadiness.filter((item) => item.ready).length;
  const systemSectionCompletion = systemSectionReadiness.length
    ? Math.round((systemReadyCount / systemSectionReadiness.length) * 100)
    : 0;

  const filteredMarketplaceExtensions = useMemo(() => {
    const search = marketplaceSearch.trim().toLowerCase();
    return marketplaceExtensions.filter((item) => {
      const statusMatches =
        marketplaceStatusFilter === 'all'
          ? true
          : normalizeMarketplaceStatus(item?.status) === marketplaceStatusFilter;
      if (!statusMatches) return false;
      if (!search) return true;
      return [item?.name, item?.code, item?.installed_version]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [marketplaceExtensions, marketplaceSearch, marketplaceStatusFilter]);

  const marketplaceStats = useMemo(() => {
    const installed = marketplaceExtensions.filter(
      (item) => normalizeMarketplaceStatus(item?.status) === 'installed'
    ).length;
    const failed = marketplaceExtensions.filter((item) => {
      const status = normalizeMarketplaceStatus(item?.status);
      return status === 'failed' || status === 'error';
    }).length;
    const blocked = marketplaceCompatibility.filter((item) => item.compatible === false).length;

    return { installed, failed, blocked };
  }, [marketplaceExtensions, marketplaceCompatibility]);
  const marketplaceOperationalScore = useMemo(() => {
    const totalSignals = Math.max(1, marketplaceStats.installed + marketplaceStats.failed + marketplaceStats.blocked);
    const penalty = marketplaceStats.failed * 2 + marketplaceStats.blocked * 2;
    const score = Math.max(0, Math.round(((totalSignals - penalty) / totalSignals) * 100));
    return Number.isFinite(score) ? score : 0;
  }, [marketplaceStats]);
  const moduleCatalogRows = useMemo(() => {
    return marketplaceCatalogModules.map((moduleItem, index) => {
      const code = String(moduleItem?.code || resolveModuleManifest(moduleItem).code || '').toLowerCase();
      const installed = marketplaceExtensions.find((item) => String(item?.code || '').toLowerCase() === code) || null;
      const status = installed?.status || 'available';
      return {
        ...moduleItem,
        key: moduleItem?.id || moduleItem?.code || `catalog-${index}`,
        code,
        type: normalizeModuleType(moduleItem?.type || moduleItem?.category || moduleItem?.manifest?.type || code),
        manifest: resolveModuleManifest(moduleItem),
        installed,
        status,
      };
    });
  }, [marketplaceCatalogModules, marketplaceExtensions]);
  const moduleCatalogSections = useMemo(() => groupModulesByType(moduleCatalogRows), [moduleCatalogRows]);
  const filteredModuleCatalogSections = useMemo(() => {
    const query = marketplaceModuleSearch.trim().toLowerCase();
    return moduleCatalogSections
      .filter((section) => marketplaceModuleTypeFilter === 'all' || section.type === marketplaceModuleTypeFilter)
      .map((section) => {
        const items = section.items.filter((item) => {
          if (!query) return true;
          return [item?.name, item?.code, item?.summary, item?.provider]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [marketplaceModuleSearch, moduleCatalogSections, marketplaceModuleTypeFilter]);
  const moduleCatalogTypeOptions = useMemo(
    () => [
      { value: 'all', label: tr('settingsWorkspace.filters.allTypes', 'Все типы') },
      ...moduleCatalogSections.map((section) => ({
        value: section.type,
        label: `${section.title} (${section.items.length})`,
      })),
    ],
    [moduleCatalogSections, tr],
  );
  const integrationRegistryRows = useMemo(() => {
    const webhookRows = webhooks.map((item) => ({
      key: `webhook-${item.id}`,
      type: 'webhook',
      provider: item?.name || item?.event || 'Webhook',
      channel: item?.event || 'Webhook',
      endpoint: item?.target_url || item?.url || '-',
      enabled: Boolean(item?.is_active ?? item?.enabled ?? true),
      failure_count: Number(item?.failure_count || 0),
      recent_activity: item?.updated_at || item?.last_delivery_at || item?.created_at || null,
      status: item?.is_active === false ? 'disabled' : item?.failure_count ? 'error' : 'healthy',
      reason: item?.last_error || null,
      source: item,
    }));
    const extensionRows = marketplaceExtensions.map((item) => {
      const compatibility = resolveMarketplaceCompatibility(item, marketplaceCompatibility);
      return {
        key: `extension-${item.id}`,
        type: 'extension',
        provider: item?.name || item?.code || 'Extension',
        channel: item?.code || '-',
        endpoint: compatibility?.crm_version || item?.installed_version || '-',
        enabled: normalizeMarketplaceStatus(item?.status) !== 'uninstalled',
        failure_count: ['failed', 'error'].includes(normalizeMarketplaceStatus(item?.status)) ? 1 : 0,
        recent_activity: item?.updated_at || item?.installed_at || null,
        status: item?.status,
        compatible: compatibility?.compatible,
        reason: compatibility?.reason || null,
        source: item,
      };
    });
    return [...extensionRows, ...webhookRows].sort((a, b) => dayjs(b.recent_activity).valueOf() - dayjs(a.recent_activity).valueOf());
  }, [marketplaceCompatibility, marketplaceExtensions, webhooks]);
  const marketplaceAlertType =
    marketplaceStats.failed > 0 || marketplaceStats.blocked > 0 ? 'warning' : 'info';

  const marketplaceStatusOptions = useMemo(
    () => [
      { value: 'all', label: tr('settingsWorkspace.filters.allStatuses', 'Все статусы') },
      { value: 'installed', label: tr('settingsWorkspace.marketplace.status.installed', 'Installed') },
      { value: 'pending', label: tr('settingsWorkspace.marketplace.status.pending', 'In progress') },
      { value: 'failed', label: tr('settingsWorkspace.marketplace.status.failed', 'Failed') },
      { value: 'uninstalled', label: tr('settingsWorkspace.marketplace.status.uninstalled', 'Uninstalled') },
    ],
    [tr]
  );
  const toneStyles = {
    info: {
      border: isDark ? 'rgba(96, 165, 250, 0.34)' : 'rgba(59, 130, 246, 0.18)',
      background: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(239, 246, 255, 0.92)',
      value: isDark ? '#dbeafe' : '#1d4ed8',
      label: isDark ? '#93c5fd' : '#2563eb',
    },
    success: {
      border: isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(34, 197, 94, 0.18)',
      background: isDark ? 'rgba(20, 46, 32, 0.9)' : 'rgba(240, 253, 244, 0.96)',
      value: isDark ? '#bbf7d0' : '#166534',
      label: isDark ? '#4ade80' : '#15803d',
    },
    warning: {
      border: isDark ? 'rgba(251, 191, 36, 0.34)' : 'rgba(245, 158, 11, 0.2)',
      background: isDark ? 'rgba(69, 39, 10, 0.9)' : 'rgba(255, 247, 237, 0.96)',
      value: isDark ? '#fde68a' : '#b45309',
      label: isDark ? '#fbbf24' : '#c2410c',
    },
    danger: {
      border: isDark ? 'rgba(248, 113, 113, 0.34)' : 'rgba(239, 68, 68, 0.2)',
      background: isDark ? 'rgba(69, 10, 10, 0.88)' : 'rgba(254, 242, 242, 0.96)',
      value: isDark ? '#fecaca' : '#b91c1c',
      label: isDark ? '#fca5a5' : '#dc2626',
    },
    default: {
      border: isDark ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary,
      background: isDark ? 'rgba(15, 23, 42, 0.82)' : token.colorBgContainer,
      value: isDark ? '#e2e8f0' : token.colorText,
      label: token.colorTextSecondary,
    },
  };

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const setLoadingState = (key, value) => setSectionLoading((prev) => ({ ...prev, [key]: value }));
  const setSavingState = (key, value) => setSectionSaving((prev) => ({ ...prev, [key]: value }));
  const setErrorState = (key, value) => setSectionErrors((prev) => ({ ...prev, [key]: value }));

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
      loadMarketplace(),
    ]);
  };

  const wrapLoad = async (key, loader) => {
    setLoadingState(key, true);
    setErrorState(key, null);
    try {
      await loader();
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      const errorText = error?.message || tr('settingsWorkspace.messages.loadError', 'Не удалось загрузить секцию {section}', { section: key });
      setErrorState(key, errorText);
      message.error(errorText);
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

  const loadMarketplace = () => wrapLoad('marketplace', async () => {
    const [extensionsResp, compatibilityResp, catalogResp] = await Promise.all([
      marketplaceApi.listExtensions({ limit: 100 }),
      marketplaceApi.compatibilityMatrix(),
      marketplaceApi.moduleCatalog().catch(() => null),
    ]);
    const extensions = normalizeList(extensionsResp);
    setMarketplaceExtensions(extensions);
    setMarketplaceCompatibility(Array.isArray(compatibilityResp) ? compatibilityResp : []);
    const parsedCatalog = normalizeMarketplaceCatalogPayload(catalogResp || {});
    if (parsedCatalog.modules.length) {
      setMarketplaceCatalogModules(parsedCatalog.modules);
      setMarketplaceCatalogVersion(parsedCatalog.version || '');
      return;
    }
    const fallbackModules = extensions.map((item) => ({
      code: item?.code,
      name: item?.name,
      type: normalizeModuleType(item?.manifest?.type || item?.compatibility?.integration_type || item?.code),
      provider: 'control-plane',
      summary: item?.last_error
        ? `Installed extension, last issue: ${item.last_error}`
        : 'Installed extension from registry',
      manifest: resolveModuleManifest(item?.manifest || item),
    }));
    setMarketplaceCatalogModules(fallbackModules);
    setMarketplaceCatalogVersion('fallback');
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

  const openMarketplaceModal = (mode, extension = null) => {
    const manifest = extension?.manifest || {};
    const compatibility = manifest.compatibility || {};
    setMarketplaceModal({
      open: true,
      mode,
      extensionId: extension?.id || null,
      extensionName: extension?.name || '',
      manifestVersion: manifest.manifest_version || 'v1',
      code: manifest.code || extension?.code || '',
      name: manifest.name || extension?.name || '',
      version: manifest.version || extension?.installed_version || '1.0.0',
      crmVersion: compatibility.crm_version || '2026.03',
      manifestRaw: Object.keys(manifest || {}).length ? JSON.stringify(manifest, null, 2) : '',
      diagnostics: null,
      loading: false,
    });
  };

  const openMarketplaceModalWithManifest = (mode, manifest, extension = null) => {
    const normalizedManifest = resolveModuleManifest({ manifest, code: manifest?.code, name: manifest?.name, version: manifest?.version });
    setMarketplaceModal({
      open: true,
      mode,
      extensionId: extension?.id || null,
      extensionName: extension?.name || normalizedManifest.name || '',
      manifestVersion: normalizedManifest.manifest_version || 'v1',
      code: normalizedManifest.code || '',
      name: normalizedManifest.name || '',
      version: normalizedManifest.version || '1.0.0',
      crmVersion: normalizedManifest.compatibility?.crm_version || '2026.03',
      manifestRaw: JSON.stringify(normalizedManifest, null, 2),
      diagnostics: null,
      loading: false,
    });
  };

  const handleInstallCatalogModule = (moduleItem) => {
    openMarketplaceModalWithManifest('install', resolveModuleManifest(moduleItem), null);
  };

  const handleUpgradeCatalogModule = (moduleItem) => {
    const installed = moduleItem?.installed;
    if (installed?.id) {
      openMarketplaceModalWithManifest('upgrade', resolveModuleManifest(moduleItem), installed);
      return;
    }
    openMarketplaceModalWithManifest('install', resolveModuleManifest(moduleItem), null);
  };

  const handleLoadManifestFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setMarketplaceModal((prev) => ({
        ...prev,
        manifestRaw: text,
        manifestVersion: parsed?.manifest_version || prev.manifestVersion,
        code: parsed?.code || prev.code,
        name: parsed?.name || prev.name,
        version: parsed?.version || prev.version,
        crmVersion: parsed?.compatibility?.crm_version || prev.crmVersion,
      }));
      message.success(tr('settingsWorkspace.marketplace.manifestLoaded', 'Manifest загружен'));
    } catch (error) {
      message.error(tr('settingsWorkspace.marketplace.manifestInvalid', 'Не удалось прочитать manifest JSON'));
    }
    return false;
  };

  const handleMarketplaceSubmit = async () => {
    if (!marketplaceModal.code || !marketplaceModal.name || !marketplaceModal.version) {
      message.error(
        tr(
          'settingsWorkspace.marketplace.formRequired',
          'Заполните обязательные поля: code, name, version.',
        ),
      );
      return;
    }

    let parsedManifest = {
      manifest_version: marketplaceModal.manifestVersion || 'v1',
      code: marketplaceModal.code.trim(),
      name: marketplaceModal.name.trim(),
      version: marketplaceModal.version.trim(),
      compatibility: {
        crm_version: marketplaceModal.crmVersion || '2026.03',
      },
    };
    if (marketplaceModal.manifestRaw?.trim()) {
      try {
        const rawParsed = JSON.parse(marketplaceModal.manifestRaw);
        parsedManifest = {
          ...rawParsed,
          manifest_version: rawParsed?.manifest_version || marketplaceModal.manifestVersion || 'v1',
          compatibility: {
            ...(rawParsed?.compatibility || {}),
            crm_version: rawParsed?.compatibility?.crm_version || marketplaceModal.crmVersion || '2026.03',
          },
        };
      } catch {
        message.error(tr('settingsWorkspace.marketplace.manifestInvalid', 'Не удалось прочитать manifest JSON'));
        return;
      }
    }

    try {
      setMarketplaceModal((prev) => ({ ...prev, loading: true }));
      if (marketplaceModal.mode === 'upgrade' && marketplaceModal.extensionId) {
        await marketplaceApi.upgradeExtension(marketplaceModal.extensionId, parsedManifest);
      } else {
        await marketplaceApi.installExtension(parsedManifest);
      }
      message.success(
        marketplaceModal.mode === 'upgrade'
          ? tr('settingsWorkspace.marketplace.upgradeSuccess', 'Extension обновлён')
          : tr('settingsWorkspace.marketplace.installSuccess', 'Extension установлен'),
      );
      setMarketplaceModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadMarketplace();
    } catch (error) {
      console.error('Error upserting extension:', error);
      setMarketplaceModal((prev) => ({ ...prev, loading: false }));
      message.error(
        error?.message ||
          tr('settingsWorkspace.marketplace.installError', 'Не удалось применить manifest extension'),
      );
    }
  };

  const handleUninstallExtension = async (extension) => {
    try {
      await marketplaceApi.uninstallExtension(extension.id);
      message.success(tr('settingsWorkspace.marketplace.uninstallSuccess', 'Extension удалён'));
      await loadMarketplace();
    } catch (error) {
      console.error('Error uninstalling extension:', error);
      message.error(tr('settingsWorkspace.marketplace.uninstallError', 'Не удалось удалить extension'));
    }
  };

  const handleLoadDiagnostics = async (extension) => {
    try {
      const diagnosticsResp = await marketplaceApi.extensionDiagnostics(extension.id);
      const diagnosticsData = diagnosticsResp?.diagnostics || diagnosticsResp || {};
      const diagnosticsEntries = getPreviewEntries(diagnosticsData, 16);
      Modal.info({
        title: tr('settingsWorkspace.marketplace.diagnosticsTitle', 'Diagnostics extension'),
        width: 760,
        content: (
          diagnosticsEntries.length ? (
            <Descriptions column={1} size="small" bordered style={{ marginTop: 12 }}>
              {diagnosticsEntries.map(([key, value]) => (
                <Descriptions.Item key={key} label={prettifyKey(key)}>
                  {formatValueForUi(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.diagnostics', 'Diagnostics пока недоступны')} />
          )
        ),
      });
    } catch (error) {
      console.error('Error loading extension diagnostics:', error);
      message.error(tr('settingsWorkspace.marketplace.diagnosticsError', 'Не удалось загрузить diagnostics'));
    }
  };

  const handleTestWebhook = async (record) => {
    try {
      const result = await settingsApi.webhooks.test(record.id, {});
      setWebhookTestContext({
        webhookId: record.id,
        deliveryId: result?.delivery_id || null,
        statusCode: result?.status_code || null,
        durationMs: result?.duration_ms || null,
        event: result?.event || 'test.event',
        testedAt: new Date().toISOString(),
      });
      message.success(tr('settingsWorkspace.messages.webhookTested', 'Webhook проверен'));
      await handleOpenWebhookDeliveries(record, result?.delivery_id || null);
      await loadWebhooks();
    } catch (error) {
      console.error('Error testing webhook:', error);
      message.error(tr('settingsWorkspace.messages.webhookTestError', 'Не удалось проверить webhook'));
    }
  };

  const handleOpenWebhookDeliveries = async (record, selectedDeliveryId = null) => {
    const preservedSelectedId =
      selectedDeliveryId || (webhookDeliveriesModal.webhook?.id === record.id ? webhookDeliveriesModal.selectedDeliveryId : null);
    setWebhookDeliveriesModal({
      open: true,
      loading: true,
      webhook: record,
      deliveries: [],
      selectedDeliveryId: null,
      error: null,
      retryingId: null,
    });
    try {
      const response = await settingsApi.webhooks.deliveries(record.id, { limit: 20 });
      const deliveries = normalizeList(response);
      setWebhookDeliveriesModal({
        open: true,
        loading: false,
        webhook: record,
        deliveries,
        selectedDeliveryId:
          deliveries.find((item) => item.id === preservedSelectedId)?.id || deliveries[0]?.id || null,
        error: null,
        retryingId: null,
      });
    } catch (error) {
      console.error('Error loading webhook deliveries:', error);
      setWebhookDeliveriesModal({
        open: true,
        loading: false,
        webhook: record,
        deliveries: [],
        selectedDeliveryId: null,
        error,
        retryingId: null,
      });
    }
  };

  const handleRetryWebhookDelivery = async (delivery) => {
    const webhookId = webhookDeliveriesModal.webhook?.id;
    if (!webhookId || !delivery?.id) return;
    try {
      setWebhookDeliveriesModal((prev) => ({ ...prev, retryingId: delivery.id }));
      await settingsApi.webhooks.retryDelivery(webhookId, delivery.id, {});
      message.success(tr('settingsWorkspace.messages.deliveryRetried', 'Повторная доставка запущена'));
      await handleOpenWebhookDeliveries(webhookDeliveriesModal.webhook);
      await loadWebhooks();
    } catch (error) {
      console.error('Error retrying webhook delivery:', error);
      message.error(tr('settingsWorkspace.messages.deliveryRetryError', 'Не удалось запустить повторную доставку'));
      setWebhookDeliveriesModal((prev) => ({ ...prev, retryingId: null }));
    }
  };

  const handleOpenIntegrationLog = async (record) => {
    setActiveIntegrationLogId(record?.id || null);
    setIntegrationLogModal({
      open: true,
      loading: true,
      record,
      detail: null,
      error: null,
    });
    try {
      const detail = await settingsApi.integrationLogs.retrieve(record.id);
      setIntegrationLogModal({
        open: true,
        loading: false,
        record,
        detail: detail || null,
        error: null,
      });
    } catch (error) {
      console.error('Error loading integration log detail:', error);
      setIntegrationLogModal({
        open: true,
        loading: false,
        record,
        detail: null,
        error,
      });
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
      key: 'marketplace',
      title: tr('settingsWorkspace.overview.marketplace', 'Marketplace extensions'),
      value: marketplaceExtensions.filter((item) => item.status !== 'uninstalled').length,
      icon: <AppstoreAddOutlined style={{ color: '#9254de' }} />,
    },
    {
      key: 'logs',
      title: tr('settingsWorkspace.overview.logs', 'Integration log errors'),
      value: integrationErrorCount,
      icon: <CloudSyncOutlined style={{ color: integrationErrorCount > 0 ? '#fa8c16' : '#722ed1' }} />,
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
  const integrationLogDetail = integrationLogModal.detail || integrationLogModal.record || null;
  const integrationLogContext = integrationLogDetail ? getIntegrationLogContext(integrationLogDetail) : {};
  const integrationLogRequestPreview = integrationLogDetail ? getPreviewEntries(integrationLogDetail.request_data) : [];
  const integrationLogResponsePreview = integrationLogDetail ? getPreviewEntries(integrationLogDetail.response_data) : [];
  const integrationLogMetadataPreview = integrationLogDetail ? getPreviewEntries(integrationLogDetail.metadata) : [];
  const selectedWebhookDelivery = webhookDeliveriesModal.deliveries.find(
    (item) => item.id === webhookDeliveriesModal.selectedDeliveryId,
  ) || null;
  const activeWebhookTestContext =
    webhookTestContext && webhookTestContext.webhookId === webhookDeliveriesModal.webhook?.id
      ? webhookTestContext
      : null;
  const webhookRequestPreview = selectedWebhookDelivery ? getPreviewEntries(selectedWebhookDelivery.request_body) : [];
  const webhookResponsePreview = selectedWebhookDelivery ? getPreviewEntries(selectedWebhookDelivery.response_body) : [];
  const webhookDeliverySummary = webhookDeliveriesModal.deliveries.reduce(
    (acc, item) => {
      const normalized = String(item.status || '').toLowerCase();
      if (['success', 'completed', 'ok'].includes(normalized)) acc.success += 1;
      else if (['pending', 'queued', 'processing'].includes(normalized)) acc.pending += 1;
      else acc.failed += 1;
      return acc;
    },
    { success: 0, pending: 0, failed: 0 }
  );

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
                  <Descriptions.Item label="Marketplace">{marketplaceExtensions.length}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title={tr('settingsWorkspace.overview.quickActions', 'Быстрые действия')}>
                <Space wrap>
                  <Button onClick={() => navigate('/onboarding')}>{tr('settingsWorkspace.actions.openOnboarding', 'Открыть onboarding')}</Button>
                  <Button onClick={() => setActiveTab('system')}>{tr('settingsWorkspace.actions.openSystem', 'Открыть систему')}</Button>
                  <Button onClick={() => setActiveTab('operations')}>{tr('settingsWorkspace.actions.openOps', 'Открыть ops')}</Button>
                  <Button onClick={() => setActiveTab('compliance')}>{tr('settingsWorkspace.actions.openCompliance', 'Открыть compliance')}</Button>
                  <Button onClick={() => setActiveTab('marketplace')}>{tr('settingsWorkspace.actions.openMarketplace', 'Открыть marketplace')}</Button>
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
          <Alert
            type={operationsAlertType}
            showIcon
            message={tr(
              'settingsWorkspace.operations.healthTitle',
              'Operations health: webhooks {webhooks}, log errors {errors}, top action {action}',
              {
                webhooks: webhooks.filter((item) => item.is_active).length,
                errors: integrationErrorCount,
                action: integrationTopAction ? prettifyKey(integrationTopAction[0]) : tr('settingsWorkspace.logs.noAction', 'нет данных'),
              }
            )}
            description={tr(
              'settingsWorkspace.operations.healthDescription',
              'Если проблема в интеграциях: logs summary -> recent logs -> details. Если проблема в endpoint: webhooks -> deliveries -> details/retry.'
            )}
          />
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title={tr('settingsWorkspace.system.cards.configReady', 'Конфигурационные секции')}
                      value={systemReadyCount}
                      suffix={`/ ${systemSectionReadiness.length}`}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title={tr('settingsWorkspace.system.cards.completion', 'Готовность workspace')}
                      value={systemSectionCompletion}
                      suffix="%"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title={tr('settingsWorkspace.system.cards.publicDomains', 'Публичные домены')}
                      value={domains.length}
                    />
                  </Card>
                </Col>
              </Row>
              <Space wrap>
                {systemSectionReadiness.map((item) => (
                  <Tag key={item.key} color={item.ready ? 'success' : 'default'}>
                    {item.key}: {item.ready ? tr('status.ready', 'готово') : tr('status.pending', 'ожидает данные')}
                  </Tag>
                ))}
              </Space>
              <Space wrap>
                <Button onClick={() => setActiveTab('operations')}>
                  {tr('settingsWorkspace.actions.openOps', 'Открыть ops')}
                </Button>
                <Button type="primary" onClick={() => setActiveTab('integrations')}>
                  {tr('settingsWorkspace.actions.openIntegrations', 'Открыть интеграции')}
                </Button>
              </Space>
            </Space>
          </Card>
          <Card title={tr('settingsWorkspace.system.coreBlock', 'Базовая конфигурация workspace')}>
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
            </Row>
          </Card>
          <Card title={tr('settingsWorkspace.system.notificationsBlock', 'Уведомления и коммуникации')}>
            <Row gutter={[16, 16]}>
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
                  title={tr('settingsWorkspace.massmail.title', 'Massmail settings')}
                  description={tr('settingsWorkspace.massmail.description', 'Лимиты, business hours и unsubscribe policy для массовых email-рассылок.')}
                  icon={<ChannelBrandIcon channel="crm-email" size={16} />}
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
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={tr('settingsWorkspace.domains.title', 'Публичные домены email')}
                extra={<Button icon={<ReloadOutlined />} onClick={loadPublicDomains} loading={sectionLoading.domains}>{tr('actions.refresh', 'Обновить')}</Button>}
              >
                <Table columns={domainColumns} dataSource={domains} rowKey={(record) => record.domain || record} loading={sectionLoading.domains} pagination={{ pageSize: 10, hideOnSinglePage: true }} />
              </Card>
            </Col>
          </Row>
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
                {sectionErrors.webhooks && (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={tr('settingsWorkspace.webhooks.loadError', 'Не удалось загрузить webhooks')}
                    description={sectionErrors.webhooks}
                    action={
                      <Button size="small" onClick={loadWebhooks}>
                        {tr('actions.retry', 'Повторить')}
                      </Button>
                    }
                  />
                )}
                <Table
                  size="small"
                  rowKey={(record) => record.id}
                  dataSource={webhooks}
                  loading={sectionLoading.webhooks}
                  pagination={false}
                  locale={{ emptyText: tr('settingsWorkspace.empty.webhooks', 'Webhook endpoints пока не настроены') }}
                  columns={[
                    {
                      title: tr('settingsWorkspace.table.channel', 'Канал'),
                      dataIndex: 'event',
                      key: 'event',
                      width: 220,
                      render: (value) => renderChannelCell(value || 'Webhook'),
                    },
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
                        <Space size="small">
                          <Button type="link" onClick={() => handleOpenWebhookDeliveries(record)}>
                            {tr('settingsWorkspace.actions.deliveries', 'Deliveries')}
                          </Button>
                          <Button type="link" onClick={() => handleTestWebhook(record)}>
                            {tr('settingsWorkspace.actions.testWebhook', 'Тест')}
                          </Button>
                        </Space>
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
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {sectionErrors.integrationLogs && (
                    <Alert
                      type="error"
                      showIcon
                      message={tr('settingsWorkspace.logs.loadError', 'Не удалось загрузить integration logs')}
                      description={sectionErrors.integrationLogs}
                      action={
                        <Button size="small" onClick={loadIntegrationLogs}>
                          {tr('actions.retry', 'Повторить')}
                        </Button>
                      }
                    />
                  )}
                  {!sectionLoading.integrationLogs && !sectionErrors.integrationLogs && !integrationLogStatusEntries.length && integrationLogs.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      message={tr('settingsWorkspace.logs.statsMissing', 'Статистика статусов временно недоступна')}
                      description={tr(
                        'settingsWorkspace.logs.statsMissingDescription',
                        'Recent logs уже получены, но stats payload пустой. Обновите секцию и проверьте источник stats.',
                      )}
                      action={(
                        <Button size="small" onClick={loadIntegrationLogs}>
                          {tr('actions.retry', 'Повторить')}
                        </Button>
                      )}
                    />
                  )}
                  <Alert
                    type={
                      integrationLogSummaryCards.some((item) => item.key === 'errors' && item.value > 0)
                        ? 'warning'
                        : 'info'
                    }
                    showIcon
                    message={tr(
                      'settingsWorkspace.logs.summaryMessage',
                      'Integration logs: всего {total}, ошибок {errors}, top action {action}',
                      {
                        total: integrationLogSummaryCards.find((item) => item.key === 'logs')?.value || 0,
                        errors: integrationLogSummaryCards.find((item) => item.key === 'errors')?.value || 0,
                        action: integrationTopAction ? prettifyKey(integrationTopAction[0]) : tr('settingsWorkspace.logs.noAction', 'нет данных'),
                      }
                    )}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {integrationLogSummaryCards.map((item) => {
                      const tone = toneStyles[item.tone] || toneStyles.default;
                      return (
                        <div
                          key={item.key}
                          style={{
                            borderRadius: token.borderRadiusLG,
                            border: `1px solid ${tone.border}`,
                            background: tone.background,
                            padding: 14,
                            minHeight: 88,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: tone.label, marginBottom: 8 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, color: tone.value }}>
                            {item.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Row gutter={[12, 12]}>
                    {integrationLogStatusEntries.slice(0, 6).map(([statusKey, value]) => (
                      <Col xs={12} md={8} key={statusKey}>
                        <Card size="small">
                          <Statistic title={prettifyKey(statusKey)} value={value} />
                        </Card>
                      </Col>
                    ))}
                  {!integrationLogStatusEntries.length && (
                    <Col span={24}>
                      <Empty description={tr('settingsWorkspace.empty.logStats', 'Статистика логов пока недоступна')} />
                    </Col>
                  )}
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
          <Card
            title={tr('settingsWorkspace.logs.recentTitle', 'Recent integration logs')}
            extra={<Button icon={<ReloadOutlined />} onClick={loadIntegrationLogs} loading={sectionLoading.integrationLogs}>{tr('actions.refresh', 'Обновить')}</Button>}
          >
            {sectionErrors.integrationLogs && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
                message={tr('settingsWorkspace.logs.recentLoadError', 'Recent logs сейчас недоступны')}
                description={tr(
                  'settingsWorkspace.logs.recentLoadErrorDescription',
                  'Проверьте source API и попробуйте обновить список. Если ошибка повторяется, откройте diagnostics и сравните статус интеграций.',
                )}
                action={
                  <Button size="small" onClick={loadIntegrationLogs}>
                    {tr('actions.retry', 'Повторить')}
                  </Button>
                }
              />
            )}
            <Table
              size="small"
              rowKey={(record) => record.id}
              dataSource={integrationLogs}
              loading={sectionLoading.integrationLogs}
              rowClassName={(record) => (activeIntegrationLogId === record.id ? 'settings-workspace-log-source-row' : '')}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              locale={{
                emptyText: (
                  <Empty
                    description={tr('settingsWorkspace.empty.recentLogs', 'Recent integration logs пока не найдены')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={loadIntegrationLogs}>
                      {tr('actions.refresh', 'Обновить')}
                    </Button>
                  </Empty>
                ),
              }}
              columns={[
                {
                  title: tr('settingsWorkspace.table.integration', 'Интеграция'),
                  dataIndex: 'integration',
                  key: 'integration',
                  render: (value) => renderChannelCell(value || '-'),
                },
                {
                  title: tr('settingsWorkspace.table.action', 'Действие'),
                  dataIndex: 'action',
                  key: 'action',
                  render: (value) => <Text ellipsis={{ tooltip: value }}>{value || '-'}</Text>,
                },
                {
                  title: tr('settingsWorkspace.table.status', 'Статус'),
                  dataIndex: 'status',
                  key: 'status',
                  width: 130,
                  render: (value) => {
                    const normalized = String(value || '').toLowerCase();
                    const color =
                      normalized === 'success'
                        ? 'success'
                        : ['queued', 'pending', 'warning'].includes(normalized)
                          ? 'processing'
                          : 'error';
                    return <Tag color={color}>{value}</Tag>;
                  },
                },
                {
                  title: tr('settingsWorkspace.table.meta', 'Операционный контекст'),
                  key: 'meta',
                  responsive: ['md'],
                  render: (_, record) => {
                    const context = getIntegrationLogContext(record);
                    return (
                      <Space size={[4, 4]} wrap>
                        {context.queueState && <Tag style={{ marginInlineEnd: 0 }}>{context.queueState}</Tag>}
                        {context.replayable && <Tag color="processing" style={{ marginInlineEnd: 0 }}>Replay</Tag>}
                        {context.slaStatus === 'breached' && <Tag color="warning" style={{ marginInlineEnd: 0 }}>SLA risk</Tag>}
                        {context.signatureValid === false && <Tag color="volcano" style={{ marginInlineEnd: 0 }}>Signature</Tag>}
                        {context.archivedAt && <Tag style={{ marginInlineEnd: 0 }}>Archived</Tag>}
                      </Space>
                    );
                  },
                },
                {
                  title: tr('settingsWorkspace.table.user', 'Пользователь'),
                  dataIndex: 'user_email',
                  key: 'user_email',
                  responsive: ['lg'],
                  render: (value) => value || '-',
                },
                {
                  title: tr('settingsWorkspace.table.timestamp', 'Время'),
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  width: 150,
                  responsive: ['sm'],
                  render: formatDateTime,
                },
                {
                  title: tr('settingsWorkspace.table.actions', 'Действия'),
                  key: 'actions',
                  width: 120,
                  render: (_, record) => (
                    <Button type="link" onClick={() => handleOpenIntegrationLog(record)}>
                      {tr('settingsWorkspace.actions.details', 'Details')}
                    </Button>
                  ),
                },
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
              description={tr('settingsWorkspace.compliance.summaryDescription', 'Показатели представлены в виде карточек и таблиц в структурированном виде.')}
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {complianceCards.map((item) => {
                const tone = toneStyles[item.tone] || toneStyles.default;
                return (
                  <div
                    key={item.key}
                    style={{
                      borderRadius: token.borderRadiusLG,
                      border: `1px solid ${tone.border}`,
                      background: tone.background,
                      padding: 14,
                      minHeight: 88,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: tone.label, marginBottom: 8 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, color: tone.value }}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
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
      key: 'marketplace',
      label: tr('settingsWorkspace.tabs.marketplace', 'Marketplace'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type={marketplaceAlertType}
            showIcon
            message={tr('settingsWorkspace.marketplace.title', 'Marketplace Registry')}
            description={tr(
              'settingsWorkspace.marketplace.description',
              'Устанавливайте и обновляйте extension через versioned manifest v1. Для каждого extension доступен diagnostics и compatibility matrix.',
            )}
            action={(
              <Space wrap>
                <Button type="primary" icon={<AppstoreAddOutlined />} onClick={() => openMarketplaceModal('install')}>
                  {tr('settingsWorkspace.marketplace.installAction', 'Установить extension')}
                </Button>
                <Button onClick={() => {
                  setMarketplaceStatusFilter('failed');
                  setMarketplaceSearch('');
                }}>
                  {tr('settingsWorkspace.marketplace.viewProblems', 'Показать проблемные')}
                </Button>
                <Button onClick={() => setActiveTab('integrations')}>
                  {tr('settingsWorkspace.actions.openIntegrations', 'Открыть интеграции')}
                </Button>
              </Space>
            )}
          />
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title={tr('settingsWorkspace.marketplace.cards.installed', 'Installed extensions')}
                  value={marketplaceStats.installed}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title={tr('settingsWorkspace.marketplace.cards.failed', 'Проблемные extensions')}
                  value={marketplaceStats.failed}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title={tr('settingsWorkspace.marketplace.cards.compatibilityIssues', 'Compatibility blocked')}
                  value={marketplaceStats.blocked}
                />
              </Card>
            </Col>
            <Col xs={24}>
              <Card size="small">
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{tr('settingsWorkspace.marketplace.cards.operationalScore', 'Operational score')}</Text>
                    <Text>{marketplaceOperationalScore}%</Text>
                  </Space>
                  <Progress
                    percent={marketplaceOperationalScore}
                    size="small"
                    status={marketplaceOperationalScore >= 80 ? 'success' : marketplaceOperationalScore >= 50 ? 'active' : 'exception'}
                  />
                  <Text type="secondary">
                    {tr(
                      'settingsWorkspace.marketplace.cards.operationalHint',
                      'Score учитывает ошибки extension и блокировки compatibility.',
                    )}
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>
          <Card
            title={tr('settingsWorkspace.marketplace.catalogTitle', 'Каталог модулей интеграции (control-plane)')}
            extra={(
              <Space wrap>
                <Tag color="blue">
                  {tr('settingsWorkspace.marketplace.catalogVersion', 'Catalog')}: {marketplaceCatalogVersion || 'n/a'}
                </Tag>
                <Button icon={<ReloadOutlined />} onClick={loadMarketplace} loading={sectionLoading.marketplace}>
                  {tr('actions.refresh', 'Обновить')}
                </Button>
              </Space>
            )}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={tr('settingsWorkspace.marketplace.catalogDescription', 'Все типы интеграций выделены в отдельные устанавливаемые модули.')}
                description={tr(
                  'settingsWorkspace.marketplace.catalogDescriptionHint',
                  'Выберите тип, откройте модуль и установите его через manifest из control-plane catalog.',
                )}
              />
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={tr('settingsWorkspace.marketplace.searchModules', 'Поиск модулей по code, названию, описанию')}
                  value={marketplaceModuleSearch}
                  onChange={(event) => setMarketplaceModuleSearch(event.target.value)}
                  style={{ width: screens.md ? 420 : '100%' }}
                />
                <Space wrap>
                  <Select
                    value={marketplaceModuleTypeFilter}
                    options={moduleCatalogTypeOptions}
                    onChange={setMarketplaceModuleTypeFilter}
                    style={{ width: screens.md ? 260 : 180 }}
                  />
                  <Button
                    onClick={() => {
                      setMarketplaceModuleSearch('');
                      setMarketplaceModuleTypeFilter('all');
                    }}
                  >
                    {tr('actions.reset', 'Сбросить')}
                  </Button>
                </Space>
              </Space>
              <Tabs
                destroyInactiveTabPane={false}
                items={filteredModuleCatalogSections.map((section) => ({
                  key: section.type,
                  label: `${section.title} (${section.items.length})`,
                  children: (
                    <Row gutter={[12, 12]}>
                      {section.items.map((moduleItem) => {
                        const statusMeta = getMarketplaceStatusMeta(moduleItem?.status, tr);
                        const compatibleRecord = moduleItem?.installed
                          ? resolveMarketplaceCompatibility(moduleItem.installed, marketplaceCompatibility)
                          : null;
                        const blocked = compatibleRecord?.compatible === false;
                        const moduleType = normalizeModuleType(moduleItem?.type);
                        return (
                          <Col xs={24} md={12} xl={8} key={moduleItem.key}>
                            <Card
                              size="small"
                              title={moduleItem?.name || moduleItem?.code}
                              extra={<Tag>{moduleType}</Tag>}
                              styles={{ body: { paddingTop: 12 } }}
                            >
                              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <Text type="secondary">{moduleItem?.summary || '-'}</Text>
                                <Space wrap>
                                  <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                                  <Tag>{moduleItem?.provider || 'control-plane'}</Tag>
                                  {blocked
                                    ? <Tag color="error">Blocked</Tag>
                                    : compatibleRecord
                                      ? <Tag color="success">Compatible</Tag>
                                      : <Tag>Unknown</Tag>}
                                </Space>
                                <Text code>{moduleItem?.code}</Text>
                                <Space wrap>
                                  <Button
                                    type={moduleItem?.installed ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => handleInstallCatalogModule(moduleItem)}
                                  >
                                    {moduleItem?.installed
                                      ? tr('actions.reinstall', 'Переустановить')
                                      : tr('actions.install', 'Установить')}
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={() => handleUpgradeCatalogModule(moduleItem)}
                                  >
                                    {tr('actions.update', 'Обновить')}
                                  </Button>
                                  {moduleItem?.installed ? (
                                    <Button
                                      size="small"
                                      danger
                                      onClick={() => handleUninstallExtension(moduleItem.installed)}
                                    >
                                      {tr('actions.delete', 'Удалить')}
                                    </Button>
                                  ) : null}
                                </Space>
                              </Space>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ),
                }))}
              />
              {!filteredModuleCatalogSections.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={tr('settingsWorkspace.empty.moduleCatalog', 'Модули не найдены по выбранному фильтру')}
                />
              ) : null}
            </Space>
          </Card>
          <Card
            title={tr('settingsWorkspace.marketplace.installed', 'Установленные extensions')}
            extra={(
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={loadMarketplace} loading={sectionLoading.marketplace}>
                  {tr('actions.refresh', 'Обновить')}
                </Button>
                <Button type="primary" icon={<AppstoreAddOutlined />} onClick={() => openMarketplaceModal('install')}>
                  {tr('settingsWorkspace.marketplace.installAction', 'Установить extension')}
                </Button>
              </Space>
            )}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 12 }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={tr('settingsWorkspace.marketplace.searchPlaceholder', 'Поиск по code, названию или версии')}
                  value={marketplaceSearch}
                  onChange={(event) => setMarketplaceSearch(event.target.value)}
                  style={{ width: screens.md ? 360 : '100%' }}
                />
                <Space wrap>
                  <Select
                    value={marketplaceStatusFilter}
                    options={marketplaceStatusOptions}
                    onChange={setMarketplaceStatusFilter}
                    style={{ width: screens.md ? 210 : 180 }}
                  />
                  <Button
                    onClick={() => {
                      setMarketplaceSearch('');
                      setMarketplaceStatusFilter('all');
                    }}
                  >
                    {tr('actions.reset', 'Сбросить')}
                  </Button>
                </Space>
              </Space>
              <Text type="secondary">
                {tr(
                  'settingsWorkspace.marketplace.filteredHint',
                  'Показано {visible} из {total} extensions',
                  { visible: filteredMarketplaceExtensions.length, total: marketplaceExtensions.length },
                )}
              </Text>
            </Space>
            <Table
              rowKey={(record) => record.id}
              loading={sectionLoading.marketplace}
              dataSource={filteredMarketplaceExtensions}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    description={tr('settingsWorkspace.empty.extensions', 'Extensions не найдены по выбранному фильтру')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button
                      type="primary"
                      block={!screens.md}
                      icon={<AppstoreAddOutlined />}
                      onClick={() => openMarketplaceModal('install')}
                    >
                      {tr('settingsWorkspace.marketplace.installAction', 'Установить extension')}
                    </Button>
                  </Empty>
                ),
              }}
              columns={[
                { title: tr('settingsWorkspace.table.code', 'Code'), dataIndex: 'code', key: 'code', width: 200 },
                { title: tr('settingsWorkspace.table.name', 'Название'), dataIndex: 'name', key: 'name' },
                { title: tr('settingsWorkspace.table.version', 'Версия'), dataIndex: 'installed_version', key: 'installed_version', width: 140 },
                {
                  title: tr('settingsWorkspace.table.status', 'Статус'),
                  dataIndex: 'status',
                  key: 'status',
                  width: 160,
                  render: (value) => {
                    const meta = getMarketplaceStatusMeta(value, tr);
                    return <Tag color={meta.color}>{meta.label}</Tag>;
                  },
                },
                {
                  title: tr('settingsWorkspace.table.compatible', 'Совместимость'),
                  key: 'compatible',
                  width: 180,
                  render: (_, record) => {
                    const match = resolveMarketplaceCompatibility(record, marketplaceCompatibility);
                    if (!match) return <Tag>Unknown</Tag>;
                    return match.compatible ? <Tag color="success">Compatible</Tag> : <Tag color="error">Blocked</Tag>;
                  },
                },
                {
                  title: tr('settingsWorkspace.table.actions', 'Действия'),
                  key: 'actions',
                  width: 360,
                  render: (_, record) => (
                    <Space size="small" wrap>
                      <Button size="small" onClick={() => openMarketplaceModal('upgrade', record)}>
                        {tr('actions.update', 'Обновить')}
                      </Button>
                      <Button size="small" onClick={() => handleLoadDiagnostics(record)}>
                        {tr('settingsWorkspace.marketplace.diagnostics', 'Diagnostics')}
                      </Button>
                      <Button size="small" danger disabled={record.status === 'uninstalled'} onClick={() => handleUninstallExtension(record)}>
                        {tr('actions.delete', 'Удалить')}
                      </Button>
                      <Button size="small" onClick={() => {
                        setMarketplaceSearch(record?.code || record?.name || '');
                        setActiveTab('integrations');
                      }}>
                        {tr('settingsWorkspace.actions.openIntegrations', 'Открыть интеграции')}
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
          <Card title={tr('settingsWorkspace.marketplace.compatibility', 'Compatibility matrix')}>
            {marketplaceStats.blocked > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={tr(
                  'settingsWorkspace.marketplace.compatibilityWarning',
                  'Найдено {count} несовместимых extensions',
                  { count: marketplaceStats.blocked },
                )}
                description={tr(
                  'settingsWorkspace.marketplace.compatibilityWarningDescription',
                  'Проверьте причину блокировки и обновите manifest или версию CRM перед rollout.',
                )}
              />
            )}
            <Table
              rowKey={(record) => record.id}
              dataSource={marketplaceCompatibility}
              pagination={false}
              locale={{ emptyText: tr('settingsWorkspace.empty.compatibility', 'Матрица совместимости пока пуста') }}
              columns={[
                { title: tr('settingsWorkspace.table.extension', 'Extension'), dataIndex: 'extension_name', key: 'extension_name' },
                { title: tr('settingsWorkspace.table.crmVersion', 'CRM version'), dataIndex: 'crm_version', key: 'crm_version', width: 180 },
                {
                  title: tr('settingsWorkspace.table.compatible', 'Совместимость'),
                  dataIndex: 'compatible',
                  key: 'compatible',
                  width: 160,
                  render: (value) => (value ? <Tag color="green">Compatible</Tag> : <Tag color="red">Blocked</Tag>),
                },
                { title: tr('settingsWorkspace.table.reason', 'Причина'), dataIndex: 'reason', key: 'reason' },
                { title: tr('settingsWorkspace.table.checkedAt', 'Проверено'), dataIndex: 'checked_at', key: 'checked_at', width: 200, render: formatDateTime },
              ]}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'lead-rules',
      label: tr('settingsWorkspace.tabs.leadRules', 'Лид Rules'),
      children: <LeadRulesPanel />,
    },
    {
      key: 'integrations',
      label: tr('settingsWorkspace.tabs.integrations', 'Интеграции'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type={operationsAlertType}
            showIcon
            message={tr('settingsWorkspace.integrations.registryTitle', 'Integration Registry')}
            description={tr(
              'settingsWorkspace.integrations.registryDescription',
              'Единая операционная панель интеграций: webhooks, marketplace extensions, последние ошибки и health сигнал.',
            )}
            action={(
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={loadWorkspace} loading={Object.values(sectionLoading).some(Boolean)}>
                  {tr('actions.refresh', 'Обновить')}
                </Button>
                <Button onClick={() => setActiveTab('marketplace')}>
                  {tr('settingsWorkspace.actions.openMarketplace', 'Открыть marketplace')}
                </Button>
              </Space>
            )}
          />
          <Row gutter={[12, 12]}>
            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic title={tr('settingsWorkspace.integrations.cards.registryItems', 'Registry items')} value={integrationRegistryRows.length} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic title={tr('settingsWorkspace.integrations.cards.webhooks', 'Webhooks')} value={webhooks.length} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic title={tr('settingsWorkspace.integrations.cards.extensions', 'Extensions')} value={marketplaceExtensions.length} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small">
                <Statistic title={tr('settingsWorkspace.integrations.cards.logErrors', 'Ошибки логов')} value={integrationErrorCount} />
              </Card>
            </Col>
          </Row>
          <Card title={tr('settingsWorkspace.integrations.registryTable', 'Реестр интеграций')}>
            <Table
              rowKey="key"
              dataSource={integrationRegistryRows}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              columns={[
                {
                  title: tr('settingsWorkspace.table.type', 'Тип'),
                  dataIndex: 'type',
                  key: 'type',
                  width: 120,
                  render: (value) => (
                    <Tag icon={value === 'extension' ? <AppstoreAddOutlined /> : <LinkOutlined />}>
                      {value === 'extension' ? 'Extension' : 'Webhook'}
                    </Tag>
                  ),
                },
                { title: tr('settingsWorkspace.table.name', 'Название'), dataIndex: 'provider', key: 'provider' },
                {
                  title: tr('settingsWorkspace.table.channel', 'Канал'),
                  dataIndex: 'channel',
                  key: 'channel',
                  render: (value) => renderChannelCell(value),
                },
                {
                  title: tr('settingsWorkspace.table.status', 'Статус'),
                  key: 'status',
                  width: 160,
                  render: (_, record) => {
                    const meta = getIntegrationHealthMeta(record);
                    return <Tag color={meta.color}>{meta.label}</Tag>;
                  },
                },
                {
                  title: tr('settingsWorkspace.table.failures', 'Ошибки'),
                  dataIndex: 'failure_count',
                  key: 'failure_count',
                  width: 120,
                  render: (value) => Number(value || 0),
                },
                {
                  title: tr('settingsWorkspace.table.lastRun', 'Последняя активность'),
                  dataIndex: 'recent_activity',
                  key: 'recent_activity',
                  width: 220,
                  render: (value) => formatDateTime(value),
                },
                {
                  title: tr('settingsWorkspace.table.reason', 'Причина'),
                  dataIndex: 'reason',
                  key: 'reason',
                  render: (value) => value || '-',
                },
              ]}
            />
          </Card>
          <LegacyIntegrationsPage embedded />
        </Space>
      ),
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
      <Modal
        title={
          marketplaceModal.mode === 'upgrade'
            ? tr('settingsWorkspace.marketplace.upgradeTitle', 'Обновить extension')
            : tr('settingsWorkspace.marketplace.installTitle', 'Установить extension')
        }
        open={marketplaceModal.open}
        onCancel={() => setMarketplaceModal((prev) => ({ ...prev, open: false, loading: false }))}
        onOk={handleMarketplaceSubmit}
        confirmLoading={marketplaceModal.loading}
        width={760}
        okText={marketplaceModal.mode === 'upgrade' ? tr('actions.update', 'Обновить') : tr('actions.install', 'Установить')}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('settingsWorkspace.marketplace.manifestHint', 'Параметры extension')}
            description={tr('settingsWorkspace.marketplace.manifestHintDescription', 'Заполните поля extension в структурированной форме.')}
          />
          <Upload
            accept=".json,application/json"
            showUploadList={false}
            beforeUpload={handleLoadManifestFile}
          >
            <Button icon={<UploadOutlined />}>
              {tr('settingsWorkspace.marketplace.uploadManifest', 'Загрузить manifest.json')}
            </Button>
          </Upload>
          <Form layout="vertical">
            <Row gutter={[12, 0]}>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.marketplace.formManifestVersion', 'Manifest version')}>
                  <Select
                    value={marketplaceModal.manifestVersion}
                    options={[{ label: 'v1', value: 'v1' }]}
                    onChange={(value) => setMarketplaceModal((prev) => ({ ...prev, manifestVersion: value }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.table.crmVersion', 'CRM version')}>
                  <Select
                    value={marketplaceModal.crmVersion}
                    options={[
                      { label: '2026.03', value: '2026.03' },
                      { label: '2026.04', value: '2026.04' },
                      { label: '2026.05', value: '2026.05' },
                    ]}
                    onChange={(value) => setMarketplaceModal((prev) => ({ ...prev, crmVersion: value }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.table.code', 'Code')} required>
                  <Input
                    value={marketplaceModal.code}
                    onChange={(event) => setMarketplaceModal((prev) => ({ ...prev, code: event.target.value }))}
                    placeholder="com.crm.extension.demo"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.table.name', 'Название')} required>
                  <Input
                    value={marketplaceModal.name}
                    onChange={(event) => setMarketplaceModal((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder={tr('settingsWorkspace.marketplace.formNamePlaceholder', 'Например: Demo Extension')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.table.version', 'Версия')} required>
                  <Input
                    value={marketplaceModal.version}
                    onChange={(event) => setMarketplaceModal((prev) => ({ ...prev, version: event.target.value }))}
                    placeholder="1.0.0"
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label={tr('settingsWorkspace.marketplace.manifestRaw', 'Manifest JSON (опционально)')}>
                  <Input.TextArea
                    rows={8}
                    value={marketplaceModal.manifestRaw}
                    onChange={(event) => setMarketplaceModal((prev) => ({ ...prev, manifestRaw: event.target.value }))}
                    placeholder='{"manifest_version":"v1","code":"com.crm.extension.demo","name":"Demo Extension","version":"1.0.0","compatibility":{"crm_version":"2026.03"}}'
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Space>
      </Modal>
      <Modal
        title={tr('settingsWorkspace.logs.detailsTitle', 'Детали integration log')}
        open={integrationLogModal.open}
        onCancel={() => {
          setActiveIntegrationLogId(null);
          setIntegrationLogModal({
            open: false,
            loading: false,
            record: null,
            detail: null,
            error: null,
          });
        }}
        footer={null}
        width={920}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {integrationLogModal.error && (
            <Alert
              type="error"
              showIcon
              message={tr('settingsWorkspace.logs.detailsLoadError', 'Не удалось загрузить детали лога')}
              description={integrationLogModal.error?.message || tr('settingsWorkspace.messages.loadError', 'Не удалось загрузить секцию {section}', { section: 'integrationLogs' })}
              action={(
                <Space>
                  <Button size="small" onClick={() => integrationLogModal.record && handleOpenIntegrationLog(integrationLogModal.record)}>
                    {tr('actions.retry', 'Повторить')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      setIntegrationLogModal({
                        open: false,
                        loading: false,
                        record: null,
                        detail: null,
                        error: null,
                      })
                    }
                  >
                    {tr('actions.close', 'Закрыть')}
                  </Button>
                </Space>
              )}
            />
          )}
          <Card loading={integrationLogModal.loading} size="small" title={tr('settingsWorkspace.logs.detailsSummary', 'Summary')}>
            {integrationLogDetail ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      key: 'status',
                      label: tr('settingsWorkspace.table.status', 'Статус'),
                      value: integrationLogDetail.status || '-',
                    },
                    {
                      key: 'duration',
                      label: tr('settingsWorkspace.table.duration', 'Длительность'),
                      value: integrationLogDetail.duration_ms ? `${integrationLogDetail.duration_ms} ms` : '-',
                    },
                    {
                      key: 'time',
                      label: tr('settingsWorkspace.table.timestamp', 'Время'),
                      value: formatDateTime(integrationLogDetail.timestamp),
                    },
                    {
                      key: 'user',
                      label: tr('settingsWorkspace.table.user', 'Пользователь'),
                      value: integrationLogDetail.user_email || '-',
                    },
                  ].map((item) => {
                    const isStatus = item.key === 'status';
                    const statusTone =
                      String(integrationLogDetail.status || '').toLowerCase() === 'success'
                        ? toneStyles.success
                        : ['queued', 'pending', 'warning', 'processing'].includes(String(integrationLogDetail.status || '').toLowerCase())
                          ? toneStyles.warning
                          : toneStyles.danger;
                    const tone = isStatus ? statusTone : toneStyles.default;
                    return (
                      <div
                        key={item.key}
                        style={{
                          borderRadius: token.borderRadiusLG,
                          border: `1px solid ${tone.border}`,
                          background: tone.background,
                          padding: 14,
                          minHeight: 82,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: tone.label, marginBottom: 8 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 800, color: tone.value }}>
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Descriptions column={2} size="small">
                <Descriptions.Item label={tr('settingsWorkspace.table.integration', 'Интеграция')}>
                  {integrationLogDetail.integration || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.table.action', 'Действие')}>
                  {integrationLogDetail.action || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.table.status', 'Статус')}>
                  <Space size={[4, 4]} wrap>
                    {integrationLogDetail.status ? <Tag color={String(integrationLogDetail.status).toLowerCase() === 'success' ? 'success' : 'processing'}>{integrationLogDetail.status}</Tag> : '-'}
                    {integrationLogContext.queueState && <Tag>{integrationLogContext.queueState}</Tag>}
                    {integrationLogContext.slaStatus === 'breached' && <Tag color="warning">SLA risk</Tag>}
                    {integrationLogContext.replayable && <Tag color="processing">Replay</Tag>}
                    {integrationLogContext.signatureValid === false && <Tag color="volcano">Signature</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.table.timestamp', 'Время')}>
                  {formatDateTime(integrationLogDetail.timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.table.user', 'Пользователь')}>
                  {integrationLogDetail.user_email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.table.duration', 'Длительность')}>
                  {integrationLogDetail.duration_ms ? `${integrationLogDetail.duration_ms} ms` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('settingsWorkspace.logs.archivedAt', 'Архивирован')}>
                  {integrationLogContext.archivedAt ? formatDateTime(integrationLogContext.archivedAt) : '-'}
                </Descriptions.Item>
                </Descriptions>
              </Space>
            ) : (
              <Empty description={tr('settingsWorkspace.empty.logDetails', 'Детали лога пока недоступны')} />
            )}
          </Card>

          {integrationLogDetail && (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Card size="small" title={tr('settingsWorkspace.logs.operationalContext', 'Operational context')}>
                  {integrationLogMetadataPreview.length || integrationLogContext.queueState || integrationLogContext.archivedAt ? (
                    <Descriptions column={1} size="small">
                      {integrationLogContext.queueState && (
                        <Descriptions.Item label={tr('settingsWorkspace.logs.queueState', 'Queue state')}>
                          {integrationLogContext.queueState}
                        </Descriptions.Item>
                      )}
                      {integrationLogContext.slaStatus && (
                        <Descriptions.Item label={tr('settingsWorkspace.logs.slaStatus', 'SLA')}>
                          {integrationLogContext.slaStatus}
                        </Descriptions.Item>
                      )}
                      {integrationLogContext.replayable != null && (
                        <Descriptions.Item label={tr('settingsWorkspace.logs.replayable', 'Replay')}>
                          {integrationLogContext.replayable ? tr('status.available', 'Доступен') : tr('status.unavailable', 'Недоступен')}
                        </Descriptions.Item>
                      )}
                      {integrationLogContext.signatureValid != null && (
                        <Descriptions.Item label={tr('settingsWorkspace.logs.signature', 'Signature')}>
                          {integrationLogContext.signatureValid ? tr('status.valid', 'Валидна') : tr('status.invalid', 'Невалидна')}
                        </Descriptions.Item>
                      )}
                      {integrationLogMetadataPreview.map(([key, value]) => (
                        <Descriptions.Item key={key} label={prettifyKey(key)}>
                          {formatValueForUi(value)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.logContext', 'Операционный контекст не передан')} />
                  )}
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card size="small" title={tr('settingsWorkspace.logs.errorBlock', 'Errors и processing')}>
                  {integrationLogDetail.error_message || integrationLogDetail.stack_trace ? (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {integrationLogDetail.error_message && (
                        <Alert
                          type="error"
                          showIcon
                          message={tr('settingsWorkspace.logs.errorMessage', 'Ошибка интеграции')}
                          description={integrationLogDetail.error_message}
                        />
                      )}
                      {integrationLogDetail.stack_trace && (
                        <Alert
                          type="warning"
                          showIcon
                          message={tr('settingsWorkspace.logs.stackTraceHidden', 'Технический stack trace скрыт')}
                          description={tr(
                            'settingsWorkspace.logs.stackTraceHiddenDescription',
                            'Сырые диагностические данные не показываются в UI. Используйте diagnostics/monitoring для технического разбора.',
                          )}
                        />
                      )}
                    </Space>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.logErrors', 'Критические ошибки не зафиксированы')} />
                  )}
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card size="small" title={tr('settingsWorkspace.logs.requestPreview', 'Request preview')}>
                  {integrationLogRequestPreview.length ? (
                    <Descriptions column={1} size="small">
                      {integrationLogRequestPreview.map(([key, value]) => (
                        <Descriptions.Item key={key} label={prettifyKey(key)}>
                          {formatValueForUi(value)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.requestPreview', 'Request preview отсутствует')} />
                  )}
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card size="small" title={tr('settingsWorkspace.logs.responsePreview', 'Response preview')}>
                  {integrationLogResponsePreview.length ? (
                    <Descriptions column={1} size="small">
                      {integrationLogResponsePreview.map(([key, value]) => (
                        <Descriptions.Item key={key} label={prettifyKey(key)}>
                          {formatValueForUi(value)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.responsePreview', 'Response preview отсутствует')} />
                  )}
                </Card>
              </Col>
            </Row>
          )}

        </Space>
      </Modal>
      <Modal
        title={tr('settingsWorkspace.webhooks.deliveriesTitle', 'Webhook deliveries')}
        open={webhookDeliveriesModal.open}
        onCancel={() =>
          setWebhookDeliveriesModal({
            open: false,
            loading: false,
            webhook: null,
            deliveries: [],
            selectedDeliveryId: null,
            error: null,
            retryingId: null,
          })
        }
        footer={null}
        width={1080}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {webhookDeliveriesModal.error && (
            <Alert
              type="error"
              showIcon
              message={tr('settingsWorkspace.webhooks.deliveriesLoadError', 'Не удалось загрузить deliveries')}
              description={webhookDeliveriesModal.error?.message || tr('settingsWorkspace.messages.loadError', 'Не удалось загрузить секцию {section}', { section: 'webhooks' })}
              action={(
                <Space>
                  <Button size="small" onClick={() => webhookDeliveriesModal.webhook && handleOpenWebhookDeliveries(webhookDeliveriesModal.webhook)}>
                    {tr('actions.retry', 'Повторить')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      setWebhookDeliveriesModal({
                        open: false,
                        loading: false,
                        webhook: null,
                        deliveries: [],
                        selectedDeliveryId: null,
                        error: null,
                        retryingId: null,
                      })
                    }
                  >
                    {tr('actions.close', 'Закрыть')}
                  </Button>
                </Space>
              )}
            />
          )}
          <Card loading={webhookDeliveriesModal.loading} size="small" title={tr('settingsWorkspace.webhooks.summary', 'Summary')}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {activeWebhookTestContext && (
                <Alert
                  type="success"
                  showIcon
                  message={tr(
                    'settingsWorkspace.webhooks.lastTestMessage',
                    'Последний тест: HTTP {status}, {duration} ms, {time}',
                    {
                      status: activeWebhookTestContext.statusCode || 200,
                      duration: activeWebhookTestContext.durationMs || 0,
                      time: formatDateTime(activeWebhookTestContext.testedAt),
                    },
                  )}
                  description={tr(
                    'settingsWorkspace.webhooks.lastTestDescription',
                    'Свежая test-delivery уже выделена в таблице ниже, поэтому можно сразу проверить payload, response и результат доставки.',
                  )}
                />
              )}
              <Alert
                type={webhookDeliverySummary.failed > 0 ? 'warning' : 'info'}
                showIcon
                message={tr(
                  'settingsWorkspace.webhooks.summaryMessage',
                  'Endpoint {url}: success {success}, pending {pending}, failed {failed}',
                  {
                    url: webhookDeliveriesModal.webhook?.url || '-',
                    success: webhookDeliverySummary.success,
                    pending: webhookDeliverySummary.pending,
                    failed: webhookDeliverySummary.failed,
                  },
                )}
              />
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic title={tr('settingsWorkspace.table.success', 'Успешно')} value={webhookDeliverySummary.success} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic title={tr('settingsWorkspace.webhooks.pending', 'В очереди')} value={webhookDeliverySummary.pending} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic title={tr('settingsWorkspace.table.failed', 'Ошибки')} value={webhookDeliverySummary.failed} />
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
          <Card
            loading={webhookDeliveriesModal.loading}
            size="small"
            title={tr('settingsWorkspace.webhooks.recentDeliveries', 'Recent deliveries')}
            extra={webhookDeliveriesModal.webhook ? (
              <Button icon={<ReloadOutlined />} onClick={() => handleOpenWebhookDeliveries(webhookDeliveriesModal.webhook)}>
                {tr('actions.refresh', 'Обновить')}
              </Button>
            ) : null}
          >
            <Table
              size="small"
              rowKey={(record) => record.id}
              dataSource={webhookDeliveriesModal.deliveries}
              pagination={{ pageSize: 6, hideOnSinglePage: true }}
              locale={{
                emptyText: (
                  <Empty
                    description={tr('settingsWorkspace.empty.deliveries', 'История deliveries пока недоступна')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" disabled={!webhookDeliveriesModal.webhook} onClick={() => webhookDeliveriesModal.webhook && handleTestWebhook(webhookDeliveriesModal.webhook)}>
                      {tr('settingsWorkspace.actions.testWebhook', 'Тест')}
                    </Button>
                  </Empty>
                ),
              }}
              rowClassName={(record) => {
                if (activeWebhookTestContext?.deliveryId === record.id) return 'settings-workspace-delivery-latest-test';
                if (record.id === webhookDeliveriesModal.selectedDeliveryId) return 'settings-workspace-delivery-selected';
                return '';
              }}
              onRow={(record) => ({
                onClick: () => setWebhookDeliveriesModal((prev) => ({ ...prev, selectedDeliveryId: record.id })),
              })}
              columns={[
                {
                  title: tr('settingsWorkspace.table.event', 'Событие'),
                  dataIndex: 'event',
                  key: 'event',
                  render: (value) => renderChannelCell(value || '-'),
                },
                {
                  title: tr('settingsWorkspace.table.status', 'Статус'),
                  dataIndex: 'status',
                  key: 'status',
                  width: 130,
                  render: (value) => {
                    const normalized = String(value || '').toLowerCase();
                    const color =
                      ['success', 'completed', 'ok'].includes(normalized)
                        ? 'success'
                        : ['pending', 'queued', 'processing'].includes(normalized)
                          ? 'processing'
                          : 'error';
                    return (
                      <Space size={[4, 4]} wrap>
                        <Tag color={color}>{value || '-'}</Tag>
                        {activeWebhookTestContext?.deliveryId === record.id && (
                          <Tag color="gold">{tr('settingsWorkspace.webhooks.latestTest', 'Latest test')}</Tag>
                        )}
                      </Space>
                    );
                  },
                },
                {
                  title: tr('settingsWorkspace.webhooks.statusCode', 'HTTP'),
                  dataIndex: 'status_code',
                  key: 'status_code',
                  width: 90,
                  responsive: ['sm'],
                  render: (value) => value || '-',
                },
                {
                  title: tr('settingsWorkspace.table.duration', 'Длительность'),
                  dataIndex: 'duration_ms',
                  key: 'duration_ms',
                  width: 120,
                  responsive: ['lg'],
                  render: (value) => (value ? `${value} ms` : '-'),
                },
                {
                  title: tr('settingsWorkspace.webhooks.retries', 'Retry'),
                  dataIndex: 'retry_count',
                  key: 'retry_count',
                  width: 90,
                  responsive: ['lg'],
                  render: (value) => value || 0,
                },
                {
                  title: tr('settingsWorkspace.table.timestamp', 'Время'),
                  dataIndex: 'created_at',
                  key: 'created_at',
                  width: 150,
                  responsive: ['md'],
                  render: formatDateTime,
                },
                {
                  title: tr('settingsWorkspace.table.actions', 'Действия'),
                  key: 'actions',
                  width: 150,
                  render: (_, record) => (
                    <Space size="small">
                      <Button
                        type="link"
                        onClick={(event) => {
                          event.stopPropagation();
                          setWebhookDeliveriesModal((prev) => ({ ...prev, selectedDeliveryId: record.id }));
                        }}
                      >
                        {tr('settingsWorkspace.actions.details', 'Details')}
                      </Button>
                      <Button
                        type="link"
                        disabled={['success', 'completed', 'ok'].includes(String(record.status || '').toLowerCase())}
                        loading={webhookDeliveriesModal.retryingId === record.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRetryWebhookDelivery(record);
                        }}
                      >
                        {tr('settingsWorkspace.actions.retry', 'Retry')}
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Card size="small" title={tr('settingsWorkspace.webhooks.deliveryDetails', 'Delivery details')}>
            {selectedWebhookDelivery ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {activeWebhookTestContext?.deliveryId === selectedWebhookDelivery.id && (
                  <Alert
                    type="success"
                    showIcon
                    message={tr('settingsWorkspace.webhooks.selectedLatestTest', 'Сейчас открыта свежая test-delivery')}
                    description={tr(
                      'settingsWorkspace.webhooks.selectedLatestTestDescription',
                      'Это самый последний тестовый прогон для выбранного webhook. Если нужно, можно сразу сверить request, response и повторить доставку.',
                    )}
                  />
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      key: 'status',
                      label: tr('settingsWorkspace.table.status', 'Статус'),
                      value: selectedWebhookDelivery.status || '-',
                    },
                    {
                      key: 'http',
                      label: tr('settingsWorkspace.webhooks.statusCode', 'HTTP'),
                      value: selectedWebhookDelivery.status_code || '-',
                    },
                    {
                      key: 'duration',
                      label: tr('settingsWorkspace.table.duration', 'Длительность'),
                      value: selectedWebhookDelivery.duration_ms ? `${selectedWebhookDelivery.duration_ms} ms` : '-',
                    },
                    {
                      key: 'retry',
                      label: tr('settingsWorkspace.webhooks.retries', 'Retry'),
                      value: selectedWebhookDelivery.retry_count || 0,
                    },
                  ].map((item) => {
                    const isStatus = item.key === 'status';
                    const statusTone =
                      ['success', 'completed', 'ok'].includes(String(selectedWebhookDelivery.status || '').toLowerCase())
                        ? toneStyles.success
                        : ['pending', 'queued', 'processing'].includes(String(selectedWebhookDelivery.status || '').toLowerCase())
                          ? toneStyles.warning
                          : toneStyles.danger;
                    const tone = isStatus ? statusTone : toneStyles.default;
                    return (
                      <div
                        key={item.key}
                        style={{
                          borderRadius: token.borderRadiusLG,
                          border: `1px solid ${tone.border}`,
                          background: tone.background,
                          padding: 14,
                          minHeight: 82,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: tone.label, marginBottom: 8 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 800, color: tone.value }}>
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label={tr('settingsWorkspace.table.event', 'Событие')}>
                    {renderChannelCell(selectedWebhookDelivery.event || '-')}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('settingsWorkspace.table.status', 'Статус')}>
                    <Space size={[4, 4]} wrap>
                      <Tag
                        color={
                          ['success', 'completed', 'ok'].includes(String(selectedWebhookDelivery.status || '').toLowerCase())
                            ? 'success'
                            : ['pending', 'queued', 'processing'].includes(String(selectedWebhookDelivery.status || '').toLowerCase())
                              ? 'processing'
                              : 'error'
                        }
                      >
                        {selectedWebhookDelivery.status || '-'}
                      </Tag>
                      {selectedWebhookDelivery.status_code ? <Tag>{selectedWebhookDelivery.status_code}</Tag> : null}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('settingsWorkspace.table.timestamp', 'Время')}>
                    {formatDateTime(selectedWebhookDelivery.created_at)}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('settingsWorkspace.table.duration', 'Длительность')}>
                    {selectedWebhookDelivery.duration_ms ? `${selectedWebhookDelivery.duration_ms} ms` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('settingsWorkspace.webhooks.retries', 'Retry')}>
                    {selectedWebhookDelivery.retry_count || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('settingsWorkspace.table.webhook', 'Webhook')}>
                    <Text ellipsis={{ tooltip: webhookDeliveriesModal.webhook?.url }}>
                      {webhookDeliveriesModal.webhook?.url || '-'}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>

                {selectedWebhookDelivery.error_message ? (
                  <Alert
                    type="error"
                    showIcon
                    message={tr('settingsWorkspace.webhooks.deliveryError', 'Ошибка доставки')}
                    description={selectedWebhookDelivery.error_message}
                  />
                ) : null}

                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={12}>
                    <Card size="small" title={tr('settingsWorkspace.webhooks.requestPreview', 'Request preview')}>
                      {webhookRequestPreview.length ? (
                        <Descriptions column={1} size="small">
                          {webhookRequestPreview.map(([key, value]) => (
                            <Descriptions.Item key={key} label={prettifyKey(key)}>
                              {formatValueForUi(value)}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.webhookRequestPreview', 'Request preview отсутствует')} />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} xl={12}>
                    <Card size="small" title={tr('settingsWorkspace.webhooks.responsePreview', 'Response preview')}>
                      {webhookResponsePreview.length ? (
                        <Descriptions column={1} size="small">
                          {webhookResponsePreview.map(([key, value]) => (
                            <Descriptions.Item key={key} label={prettifyKey(key)}>
                              {formatValueForUi(value)}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tr('settingsWorkspace.empty.webhookResponsePreview', 'Response preview отсутствует')} />
                      )}
                    </Card>
                  </Col>
                </Row>

                <Alert
                  type="info"
                  showIcon
                  message={tr('settingsWorkspace.webhooks.payloadHidden', 'Детали payload недоступны в UI')}
                  description={tr(
                    'settingsWorkspace.webhooks.payloadHiddenDescription',
                    'В интерфейсе показывается только структурированный preview доставки.',
                  )}
                />
              </Space>
            ) : (
              <Empty
                description={tr('settingsWorkspace.empty.deliveryDetails', 'Выберите delivery, чтобы увидеть детали')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Space>
      </Modal>
      <style>{`
        .settings-workspace-log-source-row > td {
          background: ${isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(209, 250, 229, 0.58)'} !important;
        }
        .settings-workspace-delivery-latest-test > td {
          background: ${isDark ? 'rgba(250, 204, 21, 0.14)' : 'rgba(254, 240, 138, 0.42)'} !important;
        }
        .settings-workspace-delivery-selected > td {
          background: ${isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(219, 234, 254, 0.58)'} !important;
        }
      `}</style>
    </div>
  );
}
