import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Row,
  Skeleton,
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
  message,
} from 'antd';
import {
  BellOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import settingsApi from '../lib/api/settings.js';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';
import { useTheme } from '../lib/hooks/useTheme.js';
import { exportCrmDataExcel, importCrmDataExcel } from '../lib/api/crmData.js';
import {
  executeDsrRequest,
  getComplianceReport,
  getDsrRequests,
  getRetentionPolicies,
  runRetentionPolicies,
} from '../lib/api/compliance.js';
import { formatValueForUi, isPlainObject as isPlainObjectValue } from '../lib/utils/value-display.js';
import { t } from '../lib/i18n/index.js';

const { Text } = Typography;

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
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeForForm(item, key)])
    );
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
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeForSubmit(item, key)])
    );
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
              <Text type="secondary">{tr('settingsPage.field.groupDescription', 'Настройка группы параметров.')}</Text>
            </div>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(value).map(([childKey, childValue]) => (
              <Col xs={24} md={12} key={[...path, childKey].join('.')}>
                <SettingField
                  fieldKey={childKey}
                  path={[...path, childKey]}
                  value={childValue}
                  isDark={isDark}
                />
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
          mode="tags"
          open={false}
          placeholder={tr('settingsPage.field.addValues', 'Добавьте значения')}
          tokenSeparators={[',']}
        />
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
        <Input.TextArea rows={4} placeholder={`${tr('settingsPage.field.enter', 'Введите')} ${label.toLowerCase()}`} />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={label} name={path}>
      <Input
        type={type === 'url' ? 'url' : 'text'}
        placeholder={`${tr('settingsPage.field.enter', 'Введите')} ${label.toLowerCase()}`}
      />
    </Form.Item>
  );
}

function SettingsConfigurator({
  title,
  description,
  icon,
  data,
  loading,
  onReload,
  onSave,
  saving,
  isDark = false,
}) {
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const normalizedData = useMemo(() => normalizeForForm(data || {}), [data]);
  const formValues = Form.useWatch([], form);

  useEffect(() => {
    form.setFieldsValue(normalizedData);
  }, [normalizedData, form]);

  const fieldEntries = useMemo(() => Object.entries(data || {}), [data]);
  const hasUnsavedChanges = useMemo(() => {
    if (!formValues) return false;

    try {
      const initialPayload = serializeForSubmit(normalizedData);
      const currentPayload = serializeForSubmit(formValues);
      return JSON.stringify(initialPayload) !== JSON.stringify(currentPayload);
    } catch (error) {
      return false;
    }
  }, [formValues, normalizedData]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card>
      <Alert
        type="info"
        showIcon
        icon={icon}
        message={title}
        description={description}
        style={{ marginBottom: 16 }}
      />

      {!fieldEntries.length ? (
        <Empty description={tr('settingsPage.empty.section', 'Сервер ещё не вернул параметры для этой секции')} />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => onSave(serializeForSubmit(values))}
        >
          <Row gutter={[16, 16]}>
            {fieldEntries.map(([fieldKey, value]) => (
              <Col
                xs={24}
                md={inferFieldType(fieldKey, value) === 'group' ? 24 : 12}
                key={fieldKey}
              >
                <SettingField fieldKey={fieldKey} path={[fieldKey]} value={normalizeForForm(value, fieldKey)} isDark={isDark} />
              </Col>
            ))}
          </Row>

          <Divider style={{ margin: '12px 0 16px' }} />

          <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text type={hasUnsavedChanges ? 'warning' : 'secondary'}>
              {hasUnsavedChanges
                ? tr('settingsPage.field.unsavedChanges', 'Есть несохраненные изменения')
                : tr('settingsPage.field.allChangesSaved', 'Изменения сохранены')}
            </Text>
            <Space direction={screens.xs ? 'vertical' : 'horizontal'} style={{ width: screens.xs ? '100%' : 'auto' }}>
              <Button
                onClick={() => form.setFieldsValue(normalizedData)}
                disabled={!hasUnsavedChanges || saving}
                block={!!screens.xs}
              >
                {tr('actions.reset', 'Сбросить')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading} block={!!screens.xs}>
                {tr('actions.refresh', 'Обновить')}
              </Button>
              <Button type="primary" htmlType="submit" loading={saving} disabled={!hasUnsavedChanges} block={!!screens.xs}>
                {tr('actions.save', 'Сохранить')}
              </Button>
            </Space>
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
    return <Empty description={tr('settingsPage.empty.complianceReport', 'Нет данных по compliance-отчёту')} />;
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

function SettingsPage() {
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [massmailSettings, setMassmailSettings] = useState({});
  const [remindersSettings, setRemindersSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState({ massmail: false, reminders: false });
  const [settingsSaving, setSettingsSaving] = useState({ massmail: false, reminders: false });
  const [domains, setDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [dataExchangeLoading, setDataExchangeLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [globalRefreshing, setGlobalRefreshing] = useState(false);
  const [complianceReport, setComplianceReport] = useState(null);
  const [dsrItems, setDsrItems] = useState([]);
  const [retentionItems, setRetentionItems] = useState([]);

  useEffect(() => {
    loadMassmailSettings();
    loadReminderSettings();
    loadPublicDomains();
    loadComplianceData();
  }, []);

  const setSettingsLoadingState = (key, value) => {
    setSettingsLoading((prev) => ({ ...prev, [key]: value }));
  };

  const setSettingsSavingState = (key, value) => {
    setSettingsSaving((prev) => ({ ...prev, [key]: value }));
  };

  const loadMassmailSettings = async () => {
    setSettingsLoadingState('massmail', true);
    try {
      const data = await settingsApi.massmail();
      setMassmailSettings(data ?? {});
    } catch (error) {
      console.error('Error loading massmail settings:', error);
      message.error(tr('settingsPage.messages.massmailLoadError', 'Не удалось загрузить настройки рассылок'));
    } finally {
      setSettingsLoadingState('massmail', false);
    }
  };

  const loadReminderSettings = async () => {
    setSettingsLoadingState('reminders', true);
    try {
      const data = await settingsApi.reminders();
      setRemindersSettings(data ?? {});
    } catch (error) {
      console.error('Error loading reminder settings:', error);
      message.error(tr('settingsPage.messages.remindersLoadError', 'Не удалось загрузить настройки напоминаний'));
    } finally {
      setSettingsLoadingState('reminders', false);
    }
  };

  const loadPublicDomains = async () => {
    setDomainsLoading(true);
    try {
      const data = await settingsApi.publicEmailDomains();
      const list = data?.domains || data?.results || data || [];
      setDomains(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading public domains:', error);
      message.error(tr('settingsPage.messages.domainsLoadError', 'Не удалось загрузить список доменов'));
      setDomains([]);
    } finally {
      setDomainsLoading(false);
    }
  };

  const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    return Array.isArray(response?.results) ? response.results : [];
  };

  const loadComplianceData = async () => {
    setComplianceLoading(true);
    try {
      const [reportResp, dsrResp, retentionResp] = await Promise.all([
        getComplianceReport(),
        getDsrRequests({ page_size: 50 }),
        getRetentionPolicies({ page_size: 50 }),
      ]);
      setComplianceReport(reportResp || null);
      setDsrItems(normalizeList(dsrResp));
      setRetentionItems(normalizeList(retentionResp));
    } catch (error) {
      console.error('Error loading compliance data:', error);
      message.error(tr('settingsPage.messages.complianceLoadError', 'Не удалось загрузить compliance данные'));
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleExecuteDsr = async (record) => {
    try {
      await executeDsrRequest(record.id);
      message.success(tr('settingsPage.messages.dsrExecuted', 'DSR выполнен'));
      loadComplianceData();
    } catch (error) {
      console.error('Error executing DSR:', error);
      message.error(tr('settingsPage.messages.dsrExecuteError', 'Не удалось выполнить DSR'));
    }
  };

  const handleRunRetention = async () => {
    try {
      setComplianceLoading(true);
      const result = await runRetentionPolicies();
      message.success(tr('settingsPage.messages.retentionExecuted', 'Retention выполнен: {count} политик', { count: result?.count || 0 }));
      await loadComplianceData();
    } catch (error) {
      console.error('Error running retention:', error);
      message.error(tr('settingsPage.messages.retentionExecuteError', 'Не удалось выполнить retention политики'));
    } finally {
      setComplianceLoading(false);
    }
  };

  const saveSettings = async (key, payload, request, reload) => {
    setSettingsSavingState(key, true);
    try {
      await request(payload);
      message.success(tr('settingsPage.messages.saved', 'Настройки сохранены'));
      await reload();
    } catch (error) {
      console.error(`Error saving ${key} settings:`, error);
      message.error(tr('settingsPage.messages.saveError', 'Ошибка сохранения настроек'));
    } finally {
      setSettingsSavingState(key, false);
    }
  };

  const handleRefreshAll = async () => {
    setGlobalRefreshing(true);
    try {
      await Promise.all([
        loadMassmailSettings(),
        loadReminderSettings(),
        loadPublicDomains(),
        loadComplianceData(),
      ]);
      message.success(tr('settingsPage.messages.refreshed', 'Данные обновлены'));
    } catch (error) {
      message.error(tr('settingsPage.messages.refreshError', 'Не удалось обновить часть данных'));
    } finally {
      setGlobalRefreshing(false);
    }
  };

  const pendingDsrCount = dsrItems.filter((item) => item?.status && !['completed', 'failed'].includes(item.status)).length;
  const activeRetentionCount = retentionItems.filter((item) => Boolean(item?.is_active)).length;

  const domainColumns = [
    {
      title: tr('settingsPage.table.domain', 'Домен'),
      dataIndex: 'domain',
      key: 'domain',
      render: (value, record) => value || record,
    },
    {
      title: tr('settingsPage.table.status', 'Статус'),
      key: 'status',
      width: 160,
      render: () => <Tag color="blue">{tr('settingsPage.domains.public', 'Публичный')}</Tag>,
    },
  ];

  const importSheetRows = Object.entries(importResult?.sheets || {}).map(([name, stats]) => ({
    key: name,
    name,
    created: stats?.created || 0,
    updated: stats?.updated || 0,
    errors: stats?.errors || 0,
  }));

  const tabItems = [
    {
      key: 'massmail',
      label: (
        <span>
          <ChannelBrandIcon channel="crm-email" size={14} />
          {tr('settingsPage.tabs.massmail', 'Рассылки')}
        </span>
      ),
      children: (
        <SettingsConfigurator
          title={tr('settingsPage.massmail.title', 'Настройки массовых рассылок')}
          description={tr('settingsPage.massmail.description', 'Параметры рассылок редактируются через визуальные контролы, без JSON.')}
          icon={<ChannelBrandIcon channel="crm-email" size={16} />}
          data={massmailSettings}
          loading={settingsLoading.massmail}
          saving={settingsSaving.massmail}
          onReload={loadMassmailSettings}
          onSave={(payload) =>
            saveSettings('massmail', payload, settingsApi.updateMassmail, loadMassmailSettings)
          }
          isDark={isDark}
        />
      ),
    },
    {
      key: 'reminders',
      label: (
        <span>
          <BellOutlined />
          {tr('settingsPage.tabs.reminders', 'Напоминания')}
        </span>
      ),
      children: (
        <SettingsConfigurator
          title={tr('settingsPage.reminders.title', 'Настройки напоминаний')}
          description={tr('settingsPage.reminders.description', 'Параметры напоминаний редактируются через переключатели, поля времени и лимиты.')}
          icon={<BellOutlined />}
          data={remindersSettings}
          loading={settingsLoading.reminders}
          saving={settingsSaving.reminders}
          onReload={loadReminderSettings}
          onSave={(payload) =>
            saveSettings('reminders', payload, settingsApi.updateReminders, loadReminderSettings)
          }
          isDark={isDark}
        />
      ),
    },
    {
      key: 'crm-data',
      label: (
        <span>
          <DatabaseOutlined />
          {tr('settingsPage.tabs.crmData', 'Данные CRM')}
        </span>
      ),
      children: (
        <Card title={tr('settingsPage.crmData.title', 'Импорт и экспорт CRM')}>
          <Alert
            message={tr('settingsPage.crmData.alertTitle', 'Обмен данными через Excel')}
            description={tr('settingsPage.crmData.alertDescription', 'Экспорт формирует Excel-файл по всем сущностям CRM. Для импорта используйте тот же формат.')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Text strong>{tr('settingsPage.crmData.export.title', 'Экспорт данных')}</Text>
                    <Text type="secondary">{tr('settingsPage.crmData.export.description', 'Скачать полный Excel-файл с текущими данными CRM.')}</Text>
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
                          message.success(tr('settingsPage.messages.exportDone', 'Экспорт CRM завершён'));
                        } catch (error) {
                          console.error('Error exporting CRM data:', error);
                          message.error(tr('settingsPage.messages.exportError', 'Не удалось экспортировать данные CRM'));
                        } finally {
                          setDataExchangeLoading(false);
                        }
                      }}
                    >
                      {tr('settingsPage.crmData.export.action', 'Экспортировать в Excel')}
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Text strong>{tr('settingsPage.crmData.import.title', 'Импорт данных')}</Text>
                    <Text type="secondary">{tr('settingsPage.crmData.import.description', 'Загрузите подготовленный Excel-файл и запустите обработку.')}</Text>
                    <Space wrap>
                      <Upload
                        maxCount={1}
                        beforeUpload={(file) => {
                          setImportFile(file);
                          return false;
                        }}
                        onRemove={() => {
                          setImportFile(null);
                        }}
                        accept=".xlsx"
                      >
                        <Button icon={<UploadOutlined />}>{tr('settingsPage.crmData.import.selectFile', 'Выбрать Excel файл')}</Button>
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
                            message.success(tr('settingsPage.messages.importDone', 'Импорт CRM завершён'));
                          } catch (error) {
                            console.error('Error importing CRM data:', error);
                            message.error(tr('settingsPage.messages.importError', 'Ошибка импорта CRM данных'));
                          } finally {
                            setDataExchangeLoading(false);
                          }
                        }}
                      >
                        {tr('settingsPage.crmData.import.action', 'Импортировать')}
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>

            {importResult ? (
              <Card size="small" title={tr('settingsPage.crmData.lastImport', 'Результат последнего импорта')}>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} md={8}>
                    <Statistic title={tr('settingsPage.crmData.stats.created', 'Создано')} value={importResult.created || 0} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title={tr('settingsPage.crmData.stats.updated', 'Обновлено')} value={importResult.updated || 0} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title={tr('settingsPage.crmData.stats.errors', 'Ошибок')} value={importResult.errors || 0} />
                  </Col>
                </Row>
                <Table
                  pagination={false}
                  dataSource={importSheetRows}
                  columns={[
                    { title: tr('settingsPage.crmData.table.sheet', 'Лист'), dataIndex: 'name', key: 'name' },
                    { title: tr('settingsPage.crmData.table.created', 'Создано'), dataIndex: 'created', key: 'created' },
                    { title: tr('settingsPage.crmData.table.updated', 'Обновлено'), dataIndex: 'updated', key: 'updated' },
                    {
                      title: tr('settingsPage.crmData.table.errors', 'Ошибки'),
                      dataIndex: 'errors',
                      key: 'errors',
                      render: (value) => <Tag color={value ? 'red' : 'green'}>{value}</Tag>,
                    },
                  ]}
                />
              </Card>
            ) : null}
          </Space>
        </Card>
      ),
    },
    {
      key: 'domains',
      label: (
        <span>
          <GlobalOutlined />
          {tr('settingsPage.tabs.domains', 'Домены')}
        </span>
      ),
      children: (
        <Card
          title={tr('settingsPage.domains.title', 'Публичные домены email')}
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadPublicDomains}>
              {tr('actions.refresh', 'Обновить')}
            </Button>
          }
        >
          <Table
            columns={domainColumns}
            dataSource={domains}
            rowKey={(record) => record.domain || record}
            loading={domainsLoading}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </Card>
      ),
    },
    {
      key: 'compliance',
      label: (
        <span>
          <SettingOutlined />
          {tr('settingsPage.tabs.compliance', 'Compliance')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            title={tr('settingsPage.compliance.overviewTitle', 'Compliance overview')}
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                {tr('actions.refresh', 'Обновить')}
              </Button>
            }
          >
            <Alert
              type="info"
              showIcon
              message={tr('settingsPage.compliance.summaryTitle', 'Сводка по согласию, DSR и retention')}
              description={tr('settingsPage.compliance.summaryDescription', 'Показатели представлены в виде карточек и таблиц без сырого JSON.')}
              style={{ marginBottom: 16 }}
            />
            <ComplianceSummary report={complianceReport} />
          </Card>

          <Card
            title={tr('settingsPage.compliance.dsrTitle', 'DSR Requests')}
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                {tr('actions.refresh', 'Обновить')}
              </Button>
            }
          >
            <Table
              rowKey={(record) => record.id}
              loading={complianceLoading}
              dataSource={dsrItems}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id', width: 220 },
                { title: tr('settingsPage.table.type', 'Тип'), dataIndex: 'request_type', key: 'request_type', render: prettifyKey },
                {
                  title: tr('settingsPage.table.status', 'Статус'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (value) => {
                    const color = value === 'completed' ? 'green' : value === 'failed' ? 'red' : 'blue';
                    return <Tag color={color}>{prettifyKey(value)}</Tag>;
                  },
                },
                { title: tr('settingsPage.table.reason', 'Причина'), dataIndex: 'reason', key: 'reason', render: (value) => value || '-' },
                {
                  title: tr('settingsPage.table.actions', 'Действия'),
                  key: 'actions',
                  render: (_, record) => (
                    <Button
                      type="link"
                      disabled={record.status === 'completed' || record.status === 'in_progress'}
                      onClick={() => handleExecuteDsr(record)}
                    >
                      {tr('settingsPage.compliance.execute', 'Выполнить')}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>

          <Card
            title="Retention Policies"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                {tr('actions.refresh', 'Обновить')}
                </Button>
                <Button type="primary" onClick={handleRunRetention} loading={complianceLoading}>
                  {tr('settingsPage.compliance.runRetention', 'Запустить retention')}
                </Button>
              </Space>
            }
          >
            <Table
              rowKey={(record) => record.id}
              loading={complianceLoading}
              dataSource={retentionItems}
              pagination={false}
              columns={[
                { title: tr('settingsPage.table.name', 'Название'), dataIndex: 'name', key: 'name' },
                { title: tr('settingsPage.table.entity', 'Сущность'), dataIndex: 'entity', key: 'entity', render: prettifyKey },
                { title: tr('settingsPage.table.action', 'Действие'), dataIndex: 'action', key: 'action', render: prettifyKey },
                { title: tr('settingsPage.table.retentionDays', 'Срок хранения (дни)'), dataIndex: 'retention_days', key: 'retention_days' },
                {
                  title: tr('settingsPage.table.activity', 'Активность'),
                  dataIndex: 'is_active',
                  key: 'is_active',
                  render: (value) => (value ? <Tag color="green">{tr('settingsPage.status.active', 'Активна')}</Tag> : <Tag>{tr('settingsPage.status.inactive', 'Неактивна')}</Tag>),
                },
                {
                  title: tr('settingsPage.table.lastRun', 'Последний запуск'),
                  dataIndex: 'last_run_at',
                  key: 'last_run_at',
                  render: (value) => {
                    const localeMap = { ru: 'ru-RU', en: 'en-US', uz: 'uz-UZ' };
                    const activeLocale = String(localStorage.getItem('enterprise_crm_locale') || 'ru').slice(0, 2);
                    return value ? new Date(value).toLocaleString(localeMap[activeLocale] || 'ru-RU') : '-';
                  },
                },
              ]}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <SettingOutlined />
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {tr('settingsPage.title', 'Настройки системы')}
                </Typography.Title>
              </Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefreshAll} loading={globalRefreshing}>
                {tr('actions.refreshAll', 'Обновить все')}
              </Button>
            </Space>
            <Typography.Text type="secondary">
              {tr(
                'settingsPage.subtitle',
                'Управляйте параметрами массовых рассылок, напоминаний, доменов и compliance в одном месте.'
              )}
            </Typography.Text>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title={tr('settingsPage.kpi.publicDomains', 'Публичные домены')} value={domains.length} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title={tr('settingsPage.kpi.pendingDsr', 'DSR в работе')} value={pendingDsrCount} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title={tr('settingsPage.kpi.activeRetention', 'Активные retention')} value={activeRetentionCount} />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        <Card>
          <Tabs defaultActiveKey="massmail" items={tabItems} />
        </Card>
      </Space>
    </div>
  );
}

export default SettingsPage;
