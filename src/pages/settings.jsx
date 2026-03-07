import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
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
  message,
} from 'antd';
import {
  BellOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  GlobalOutlined,
  MailOutlined,
  ReloadOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import settingsApi from '../lib/api/settings.js';
import { exportCrmDataExcel, importCrmDataExcel } from '../lib/api/crmData.js';
import {
  executeDsrRequest,
  getComplianceReport,
  getDsrRequests,
  getRetentionPolicies,
  runRetentionPolicies,
} from '../lib/api/compliance.js';

const { Text } = Typography;

function prettifyKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !dayjs.isDayjs(value);
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

function SettingField({ fieldKey, path, value }) {
  const type = inferFieldType(fieldKey, value);
  const label = prettifyKey(fieldKey);

  if (type === 'group') {
    return (
      <Card
        size="small"
        variant="borderless"
        styles={{ body: { padding: 16 } }}
        style={{ background: '#fafafa', marginBottom: 16 }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Text strong>{label}</Text>
            <div>
              <Text type="secondary">Настройка группы параметров.</Text>
            </div>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(value).map(([childKey, childValue]) => (
              <Col xs={24} md={12} key={[...path, childKey].join('.')}>
                <SettingField
                  fieldKey={childKey}
                  path={[...path, childKey]}
                  value={childValue}
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
          placeholder="Добавьте значения"
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
        <Input.TextArea rows={4} placeholder={`Введите ${label.toLowerCase()}`} />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={label} name={path}>
      <Input
        type={type === 'url' ? 'url' : 'text'}
        placeholder={`Введите ${label.toLowerCase()}`}
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
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(normalizeForForm(data || {}));
  }, [data, form]);

  const fieldEntries = useMemo(() => Object.entries(data || {}), [data]);

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
        <Empty description="Сервер ещё не вернул параметры для этой секции" />
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
                <SettingField fieldKey={fieldKey} path={[fieldKey]} value={normalizeForForm(value, fieldKey)} />
              </Col>
            ))}
          </Row>

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Сохранить
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
              Обновить
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}

function ComplianceSummary({ report }) {
  if (!report || !Object.keys(report).length) {
    return <Empty description="Нет данных по compliance-отчёту" />;
  }

  const scalarEntries = Object.entries(report).filter(([, value]) => !isPlainObject(value) && !Array.isArray(value));
  const objectEntries = Object.entries(report).filter(([, value]) => isPlainObject(value));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {scalarEntries.length ? (
        <Row gutter={[16, 16]}>
          {scalarEntries.map(([key, value]) => (
            <Col xs={24} md={8} key={key}>
              <Card size="small">
                <Statistic title={prettifyKey(key)} value={typeof value === 'number' ? value : undefined} />
                {typeof value !== 'number' ? <Text strong>{String(value || '-')}</Text> : null}
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {objectEntries.map(([key, value]) => (
        <Card key={key} size="small" title={prettifyKey(key)}>
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            {Object.entries(value).map(([childKey, childValue]) => (
              <Descriptions.Item key={childKey} label={prettifyKey(childKey)}>
                {typeof childValue === 'boolean'
                  ? childValue
                    ? 'Да'
                    : 'Нет'
                  : String(childValue ?? '-')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      ))}
    </Space>
  );
}

function SettingsPage() {
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
      message.error('Не удалось загрузить настройки рассылок');
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
      message.error('Не удалось загрузить настройки напоминаний');
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
      message.error('Не удалось загрузить список доменов');
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
      message.error('Не удалось загрузить compliance данные');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleExecuteDsr = async (record) => {
    try {
      await executeDsrRequest(record.id);
      message.success('DSR выполнен');
      loadComplianceData();
    } catch (error) {
      console.error('Error executing DSR:', error);
      message.error('Не удалось выполнить DSR');
    }
  };

  const handleRunRetention = async () => {
    try {
      setComplianceLoading(true);
      const result = await runRetentionPolicies();
      message.success(`Retention выполнен: ${result?.count || 0} политик`);
      await loadComplianceData();
    } catch (error) {
      console.error('Error running retention:', error);
      message.error('Не удалось выполнить retention политики');
    } finally {
      setComplianceLoading(false);
    }
  };

  const saveSettings = async (key, payload, request, reload) => {
    setSettingsSavingState(key, true);
    try {
      await request(payload);
      message.success('Настройки сохранены');
      await reload();
    } catch (error) {
      console.error(`Error saving ${key} settings:`, error);
      message.error('Ошибка сохранения настроек');
    } finally {
      setSettingsSavingState(key, false);
    }
  };

  const domainColumns = [
    {
      title: 'Домен',
      dataIndex: 'domain',
      key: 'domain',
      render: (value, record) => value || record,
    },
    {
      title: 'Статус',
      key: 'status',
      width: 160,
      render: () => <Tag color="blue">Публичный</Tag>,
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
          <MailOutlined />
          Рассылки
        </span>
      ),
      children: (
        <SettingsConfigurator
          title="Настройки массовых рассылок"
          description="Параметры рассылок редактируются через визуальные контролы, без JSON."
          icon={<MailOutlined />}
          data={massmailSettings}
          loading={settingsLoading.massmail}
          saving={settingsSaving.massmail}
          onReload={loadMassmailSettings}
          onSave={(payload) =>
            saveSettings('massmail', payload, settingsApi.updateMassmail, loadMassmailSettings)
          }
        />
      ),
    },
    {
      key: 'reminders',
      label: (
        <span>
          <BellOutlined />
          Напоминания
        </span>
      ),
      children: (
        <SettingsConfigurator
          title="Настройки напоминаний"
          description="Параметры напоминаний редактируются через переключатели, поля времени и лимиты."
          icon={<BellOutlined />}
          data={remindersSettings}
          loading={settingsLoading.reminders}
          saving={settingsSaving.reminders}
          onReload={loadReminderSettings}
          onSave={(payload) =>
            saveSettings('reminders', payload, settingsApi.updateReminders, loadReminderSettings)
          }
        />
      ),
    },
    {
      key: 'crm-data',
      label: (
        <span>
          <DatabaseOutlined />
          Данные CRM
        </span>
      ),
      children: (
        <Card title="Импорт и экспорт CRM">
          <Alert
            message="Обмен данными через Excel"
            description="Экспорт формирует Excel-файл по всем сущностям CRM. Для импорта используйте тот же формат."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Text strong>Экспорт данных</Text>
                    <Text type="secondary">Скачать полный Excel-файл с текущими данными CRM.</Text>
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
                          message.success('Экспорт CRM завершён');
                        } catch (error) {
                          console.error('Error exporting CRM data:', error);
                          message.error('Не удалось экспортировать данные CRM');
                        } finally {
                          setDataExchangeLoading(false);
                        }
                      }}
                    >
                      Экспортировать в Excel
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Text strong>Импорт данных</Text>
                    <Text type="secondary">Загрузите подготовленный Excel-файл и запустите обработку.</Text>
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
                        <Button icon={<UploadOutlined />}>Выбрать Excel файл</Button>
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
                            message.success('Импорт CRM завершён');
                          } catch (error) {
                            console.error('Error importing CRM data:', error);
                            message.error('Ошибка импорта CRM данных');
                          } finally {
                            setDataExchangeLoading(false);
                          }
                        }}
                      >
                        Импортировать
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>

            {importResult ? (
              <Card size="small" title="Результат последнего импорта">
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} md={8}>
                    <Statistic title="Создано" value={importResult.created || 0} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title="Обновлено" value={importResult.updated || 0} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title="Ошибок" value={importResult.errors || 0} />
                  </Col>
                </Row>
                <Table
                  pagination={false}
                  dataSource={importSheetRows}
                  columns={[
                    { title: 'Лист', dataIndex: 'name', key: 'name' },
                    { title: 'Создано', dataIndex: 'created', key: 'created' },
                    { title: 'Обновлено', dataIndex: 'updated', key: 'updated' },
                    {
                      title: 'Ошибки',
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
          Домены
        </span>
      ),
      children: (
        <Card
          title="Публичные домены email"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadPublicDomains}>
              Обновить
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
          Compliance
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            title="Compliance overview"
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                Обновить
              </Button>
            }
          >
            <Alert
              type="info"
              showIcon
              message="Сводка по согласию, DSR и retention"
              description="Показатели представлены в виде карточек и таблиц без сырого JSON."
              style={{ marginBottom: 16 }}
            />
            <ComplianceSummary report={complianceReport} />
          </Card>

          <Card
            title="DSR Requests"
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                Обновить
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
                { title: 'Тип', dataIndex: 'request_type', key: 'request_type', render: prettifyKey },
                {
                  title: 'Статус',
                  dataIndex: 'status',
                  key: 'status',
                  render: (value) => {
                    const color = value === 'completed' ? 'green' : value === 'failed' ? 'red' : 'blue';
                    return <Tag color={color}>{prettifyKey(value)}</Tag>;
                  },
                },
                { title: 'Причина', dataIndex: 'reason', key: 'reason', render: (value) => value || '-' },
                {
                  title: 'Действия',
                  key: 'actions',
                  render: (_, record) => (
                    <Button
                      type="link"
                      disabled={record.status === 'completed' || record.status === 'in_progress'}
                      onClick={() => handleExecuteDsr(record)}
                    >
                      Выполнить
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
                  Обновить
                </Button>
                <Button type="primary" onClick={handleRunRetention} loading={complianceLoading}>
                  Запустить retention
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
                { title: 'Название', dataIndex: 'name', key: 'name' },
                { title: 'Сущность', dataIndex: 'entity', key: 'entity', render: prettifyKey },
                { title: 'Действие', dataIndex: 'action', key: 'action', render: prettifyKey },
                { title: 'Срок хранения (дни)', dataIndex: 'retention_days', key: 'retention_days' },
                {
                  title: 'Активность',
                  dataIndex: 'is_active',
                  key: 'is_active',
                  render: (value) => (value ? <Tag color="green">Активна</Tag> : <Tag>Неактивна</Tag>),
                },
                {
                  title: 'Последний запуск',
                  dataIndex: 'last_run_at',
                  key: 'last_run_at',
                  render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
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
      <Card title={<><SettingOutlined /> Настройки системы</>}>
        <Tabs defaultActiveKey="massmail" items={tabItems} />
      </Card>
    </div>
  );
}

export default SettingsPage;
