import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Grid,
  Input,
  List,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  ReloadOutlined,
  SettingOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import settingsApi from '../lib/api/settings.js';
import { importCrmDataExcel } from '../lib/api/crmData.js';
import { getFacebookPages } from '../lib/api/integrations/facebook.js';
import { getInstagramAccounts } from '../lib/api/integrations/instagram.js';
import { getTelegramBots } from '../lib/api/integrations/telegram.js';
import { getWhatsAppAccounts } from '../lib/api/integrations/whatsapp.js';
import { getStages } from '../lib/api/reference.js';
import { getVoIPConnections } from '../lib/api/telephony.js';
import { getProfiles, getUsers } from '../lib/api/user.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { navigate } from '../router.js';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';
import {
  bootstrapOnboardingTemplate,
  getOnboardingState,
  getOmnichannelDiagnostics,
  restartOnboarding,
  saveOnboardingProgress,
} from '../lib/api/onboarding.js';

const { Title, Text } = Typography;

const ONBOARDING_STORAGE_KEY = 'enterprise_crm_onboarding_wizard';
const DEFAULT_TEMPLATE_CODE = 'sales_team';
const DEFAULT_PROGRESS = {
  activeStep: 0,
  companyDraft: {},
  importCompletedAt: '',
  importResult: null,
  dashboardOpenedAt: '',
};

const STEP_KEYS = [
  'company',
  'team',
  'pipeline',
  'import',
  'channels',
  'telephony',
  'dashboard',
];

const LANGUAGE_OPTIONS = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
  { label: "O'zbek", value: 'uz' },
];

const TIMEZONE_OPTIONS = [
  'Asia/Tashkent',
  'UTC',
  'Europe/Moscow',
  'Europe/Berlin',
  'Europe/London',
  'Asia/Dubai',
  'America/New_York',
  'America/Chicago',
  'Asia/Almaty',
];

function normalizeList(response) {
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  return [];
}

function readSavedProgress() {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PROGRESS };
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      companyDraft: {
        ...DEFAULT_PROGRESS.companyDraft,
        ...(parsed.companyDraft && typeof parsed.companyDraft === 'object' ? parsed.companyDraft : {}),
      },
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function persistProgress(progress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage failures
  }
}

function stageName(stage) {
  return (
    stage?.name_ru ||
    stage?.name_en ||
    stage?.name_uz ||
    stage?.name ||
    stage?.title ||
    'Stage'
  );
}

function resolveUserRoles(user) {
  if (Array.isArray(user?.roles) && user.roles.length) return user.roles;
  const roles = [];
  if (user?.is_superuser) roles.push('admin');
  if (user?.is_staff) roles.push('staff');
  return roles;
}

function mergeUserRecords(usersResponse, profilesResponse) {
  const users = normalizeList(usersResponse);
  const profiles = normalizeList(profilesResponse);
  if (!users.length && !profiles.length) return [];

  const profileById = new Map(profiles.map((profile) => [String(profile?.id), profile]));
  const merged = users.map((user) => {
    const profile =
      profileById.get(String(user?.id)) ||
      profiles.find((item) => String(item?.user || item?.user_id || item?.id) === String(user?.id)) ||
      null;
    return {
      ...profile,
      ...user,
      id: user?.id ?? profile?.id ?? profile?.user ?? profile?.user_id,
      email: user?.email || profile?.email || '',
      username: user?.username || profile?.username || '',
      name:
        user?.name ||
        profile?.name ||
        [user?.first_name || profile?.first_name, user?.last_name || profile?.last_name].filter(Boolean).join(' ') ||
        user?.username ||
        profile?.username ||
        user?.email ||
        profile?.email ||
        'User',
      roles: resolveUserRoles(user).length ? resolveUserRoles(user) : resolveUserRoles(profile),
    };
  });

  if (!merged.length) {
    return profiles.map((profile) => ({
      ...profile,
      id: profile?.id ?? profile?.user ?? profile?.user_id,
      email: profile?.email || '',
      username: profile?.username || '',
      name:
        profile?.name ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
        profile?.username ||
        profile?.email ||
        'User',
      roles: resolveUserRoles(profile),
    }));
  }

  return merged;
}

function channelSummaryRows(channelState) {
  return [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      color: 'green',
      count: channelState.whatsapp?.count || 0,
      connected: Boolean(channelState.whatsapp?.count),
      path: '/integrations',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      color: 'magenta',
      count: channelState.instagram?.count || 0,
      connected: Boolean(channelState.instagram?.count),
      path: '/integrations',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      color: 'geekblue',
      count: channelState.facebook?.count || 0,
      connected: Boolean(channelState.facebook?.count),
      path: '/integrations',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      color: 'blue',
      count: channelState.telegram?.count || 0,
      connected: Boolean(channelState.telegram?.count),
      path: '/integrations',
    },
  ];
}

export default function OnboardingWizardPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [form] = Form.useForm();
  const [progressState, setProgressState] = useState(() => readSavedProgress());
  const [generalSettings, setGeneralSettings] = useState({});
  const [userRows, setUserRows] = useState([]);
  const [stages, setStages] = useState([]);
  const [channelState, setChannelState] = useState({});
  const [telephonyRows, setTelephonyRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(() => readSavedProgress().importResult || null);
  const [onboardingTemplates, setOnboardingTemplates] = useState([]);
  const [serverChecklist, setServerChecklist] = useState([]);
  const [serverSummary, setServerSummary] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE_CODE);
  const [bootstrappingTemplate, setBootstrappingTemplate] = useState(false);
  const [diagnosticsSummary, setDiagnosticsSummary] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const bg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const bgMuted = theme === 'dark' ? '#111827' : '#f8fafc';
  const border = theme === 'dark' ? '#263244' : '#e2e8f0';

  const patchProgress = (patch) => {
    setProgressState((prev) => {
      const next = {
        ...prev,
        ...patch,
        companyDraft: {
          ...(prev.companyDraft || {}),
          ...(patch.companyDraft || {}),
        },
      };
      persistProgress(next);
      return next;
    });
  };

  const loadAll = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [
      onboardingStateResult,
      generalResult,
      usersResult,
      profilesResult,
      stagesResult,
      whatsappResult,
      instagramResult,
      facebookResult,
      telegramResult,
      telephonyResult,
      diagnosticsResult,
    ] = await Promise.allSettled([
      getOnboardingState(),
      settingsApi.general(),
      getUsers({ page_size: 25 }),
      getProfiles({ page_size: 25 }),
      getStages({ page_size: 50 }),
      getWhatsAppAccounts({ page_size: 20 }),
      getInstagramAccounts({ page_size: 20 }),
      getFacebookPages({ page_size: 20 }),
      getTelegramBots({ page_size: 20 }),
      getVoIPConnections({ page_size: 25 }),
      getOmnichannelDiagnostics(),
    ]);

    if (onboardingStateResult.status === 'fulfilled') {
      const onboardingPayload = onboardingStateResult.value || {};
      const progress = onboardingPayload.progress || {};
      const mergedProgress = {
        ...DEFAULT_PROGRESS,
        ...readSavedProgress(),
        ...progress,
      };
      setProgressState(mergedProgress);
      setImportResult(progress.import_result || mergedProgress.importResult || null);
      setServerChecklist(Array.isArray(onboardingPayload.checklist) ? onboardingPayload.checklist : []);
      setServerSummary({
        health_score: Number(onboardingPayload.health_score || 0),
        completed_count: Number(onboardingPayload.completed_count || 0),
        total_steps: Number(onboardingPayload.total_steps || 0),
        next_required_index: Number(onboardingPayload.next_required_index || 0),
        next_required_key: onboardingPayload.next_required_key || '',
        next_required_title: onboardingPayload.next_required_title || '',
      });
      const templates = Array.isArray(onboardingPayload.templates) ? onboardingPayload.templates : [];
      setOnboardingTemplates(templates);
      setSelectedTemplate(progress.selected_template || templates[0]?.code || DEFAULT_TEMPLATE_CODE);
      persistProgress(mergedProgress);
    }

    if (generalResult.status === 'fulfilled') {
      setGeneralSettings(generalResult.value || {});
    }

    setUserRows(
      mergeUserRecords(
        usersResult.status === 'fulfilled' ? usersResult.value : [],
        profilesResult.status === 'fulfilled' ? profilesResult.value : [],
      ),
    );

    setStages(stagesResult.status === 'fulfilled' ? normalizeList(stagesResult.value) : []);
    setChannelState({
      whatsapp: {
        count: normalizeList(whatsappResult.status === 'fulfilled' ? whatsappResult.value : []).length,
      },
      instagram: {
        count: normalizeList(instagramResult.status === 'fulfilled' ? instagramResult.value : []).length,
      },
      facebook: {
        count: normalizeList(facebookResult.status === 'fulfilled' ? facebookResult.value : []).length,
      },
      telegram: {
        count: normalizeList(telegramResult.status === 'fulfilled' ? telegramResult.value : []).length,
      },
    });
    setTelephonyRows(telephonyResult.status === 'fulfilled' ? normalizeList(telephonyResult.value) : []);
    setDiagnosticsSummary(
      diagnosticsResult.status === 'fulfilled'
        ? diagnosticsResult.value?.summary || null
        : null
    );

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      company_name: progressState.companyDraft?.company_name ?? generalSettings.company_name ?? '',
      company_email: progressState.companyDraft?.company_email ?? generalSettings.company_email ?? '',
      company_phone: progressState.companyDraft?.company_phone ?? generalSettings.company_phone ?? '',
      default_language: progressState.companyDraft?.default_language ?? generalSettings.default_language ?? 'ru',
      timezone: progressState.companyDraft?.timezone ?? generalSettings.timezone ?? 'Asia/Tashkent',
    });
  }, [form, generalSettings, progressState.companyDraft]);

  const channelRows = useMemo(() => channelSummaryRows(channelState), [channelState]);
  const connectedChannelsCount = useMemo(
    () => channelRows.filter((row) => row.connected).length,
    [channelRows],
  );
  const activeTelephonyCount = useMemo(
    () => telephonyRows.filter((row) => Boolean(row?.active || row?.is_active)).length,
    [telephonyRows],
  );
  const adminUsersCount = useMemo(
    () =>
      userRows.filter((user) =>
        resolveUserRoles(user).some((role) => String(role || '').toLowerCase() === 'admin'),
      ).length,
    [userRows],
  );

  const localChecklist = useMemo(() => {
    return [
      {
        key: 'company',
        title: 'Компания и часовой пояс',
        description: 'Заполните базовые реквизиты инстанса и рабочую timezone.',
        complete: Boolean(generalSettings.company_name && generalSettings.timezone),
      },
      {
        key: 'team',
        title: 'Пользователи и роли',
        description: 'Проверьте команду и убедитесь, что в системе есть хотя бы один администратор.',
        complete: userRows.length > 0,
      },
      {
        key: 'pipeline',
        title: 'Воронка и стадии',
        description: 'Проверьте, что базовая воронка продаж уже загружена.',
        complete: stages.length > 0,
      },
      {
        key: 'import',
        title: 'Импорт лидов и контактов',
        description: 'Загрузите стартовый Excel-файл или вернитесь к этому шагу позже.',
        complete: Boolean(progressState.importCompletedAt),
      },
      {
        key: 'channels',
        title: 'Подключение каналов',
        description: 'Подключите хотя бы один messenger-канал для unified inbox.',
        complete: connectedChannelsCount > 0,
      },
      {
        key: 'telephony',
        title: 'Телефония',
        description: 'Проверьте active VoIP connection или настройте её через telephony workspace.',
        complete: activeTelephonyCount > 0,
      },
      {
        key: 'dashboard',
        title: 'Первый dashboard',
        description: 'Откройте главный dashboard после базовой настройки.',
        complete: Boolean(progressState.dashboardOpenedAt),
      },
    ];
  }, [
    activeTelephonyCount,
    connectedChannelsCount,
    generalSettings.company_name,
    generalSettings.timezone,
    progressState.dashboardOpenedAt,
    progressState.importCompletedAt,
    stages.length,
    userRows.length,
  ]);

  const checklist = useMemo(() => {
    if (!serverChecklist.length) return localChecklist;
    const localByKey = new Map(localChecklist.map((item) => [item.key, item]));
    return serverChecklist.map((item) => ({
      ...(localByKey.get(item.key) || {}),
      ...item,
      complete: Boolean(item.complete),
    }));
  }, [localChecklist, serverChecklist]);

  const completedCount = Number(
    serverSummary?.completed_count ?? checklist.filter((step) => step.complete).length
  );
  const healthScore = Number(
    serverSummary?.health_score ?? Math.round((completedCount / checklist.length) * 100)
  );
  const nextRequiredIndex = Number(
    serverSummary?.next_required_index ?? checklist.findIndex((step) => !step.complete)
  );
  const safeNextIndex = nextRequiredIndex === -1 ? checklist.length - 1 : nextRequiredIndex;
  const activeStepIndex = Math.min(progressState.activeStep || 0, checklist.length - 1);
  const activeStep = checklist[activeStepIndex];
  const templateOptions = onboardingTemplates.length
    ? onboardingTemplates.map((item) => ({ value: item.code, label: item.name }))
    : [{ value: DEFAULT_TEMPLATE_CODE, label: 'Sales Team' }];

  const goToStep = (index) => {
    patchProgress({ activeStep: index });
    saveOnboardingProgress({ active_step: index }).catch(() => {});
  };

  const handleCompanySave = async (values) => {
    setSavingCompany(true);
    try {
      const payload = {
        company_name: values.company_name,
        company_email: values.company_email,
        company_phone: values.company_phone,
        default_language: values.default_language,
        timezone: values.timezone,
      };
      await settingsApi.updateGeneral(payload);
      patchProgress({
        companyDraft: values,
        activeStep: Math.max(activeStepIndex, 1),
      });
      await saveOnboardingProgress({
        active_step: Math.max(activeStepIndex, 1),
        company_draft: values,
        selected_template: selectedTemplate,
      });
      message.success('Базовые настройки компании сохранены');
      await loadAll({ silent: true });
      goToStep(Math.max(1, safeNextIndex));
    } catch (error) {
      console.error('Failed to save onboarding general settings:', error);
      message.error(error?.details?.message || error?.message || 'Не удалось сохранить настройки компании');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      message.warning('Сначала выберите Excel-файл для импорта');
      return;
    }
    setImporting(true);
    try {
      const result = await importCrmDataExcel(importFile);
      setImportResult(result || null);
      patchProgress({
        importCompletedAt: new Date().toISOString(),
        importResult: result || null,
        activeStep: Math.max(activeStepIndex, 4),
      });
      await saveOnboardingProgress({
        active_step: Math.max(activeStepIndex, 4),
        import_result: result || {},
        mark_import_completed: true,
      });
      setImportFile(null);
      message.success('Импорт CRM-данных завершён');
      goToStep(Math.max(4, safeNextIndex));
    } catch (error) {
      console.error('Failed to import onboarding data:', error);
      message.error(error?.details?.message || error?.message || 'Не удалось выполнить импорт');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenDashboard = () => {
    patchProgress({
      dashboardOpenedAt: new Date().toISOString(),
      activeStep: checklist.length - 1,
    });
    saveOnboardingProgress({
      active_step: checklist.length - 1,
      mark_dashboard_opened: true,
    }).catch(() => {});
    navigate('/dashboard');
  };

  const handleBootstrapTemplate = async () => {
    setBootstrappingTemplate(true);
    try {
      const response = await bootstrapOnboardingTemplate({
        template_code: selectedTemplate,
        bootstrap_demo_data: true,
      });
      const createdLeads = Number(response?.demo_bootstrap?.created_leads || 0);
      const skipped = Boolean(response?.demo_bootstrap?.skipped);
      if (skipped) {
        message.info('Template уже применён, повторный demo bootstrap не требуется');
      } else {
        message.success(`Шаблон применён, демо-лидов создано: ${createdLeads}`);
      }
      await loadAll({ silent: true });
    } catch (error) {
      message.error(error?.details?.message || error?.message || 'Не удалось применить onboarding template');
    } finally {
      setBootstrappingTemplate(false);
    }
  };

  const handleRestartWizard = async () => {
    try {
      await restartOnboarding();
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setProgressState({ ...DEFAULT_PROGRESS });
      setImportResult(null);
      message.success('Onboarding прогресс сброшен');
      await loadAll({ silent: true });
    } catch (error) {
      message.error(error?.details?.message || error?.message || 'Не удалось сбросить onboarding прогресс');
    }
  };

  const handleRunDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const response = await getOmnichannelDiagnostics();
      setDiagnosticsSummary(response?.summary || null);
      message.success('Integration diagnostics обновлены');
    } catch (error) {
      message.error(error?.details?.message || error?.message || 'Не удалось запустить integration diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const importSheetRows = Object.entries(importResult?.sheets || {}).map(([name, stats]) => ({
    key: name,
    name,
    created: stats?.created || 0,
    updated: stats?.updated || 0,
    errors: stats?.errors || 0,
  }));

  const renderStepContent = () => {
    if (!activeStep) {
      return (
        <Card>
          <Empty description="Шаг onboarding не найден" />
        </Card>
      );
    }

    if (activeStep.key === 'company') {
      return (
        <Card title="Шаг 1. Компания и часовой пояс">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="Этот шаг сохраняет реальные system settings"
              description="Wizard не использует локальную заглушку: данные пишутся в `/api/settings/general/` и могут быть безопасно продолжены позже."
            />
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCompanySave}
              onValuesChange={(_, values) => patchProgress({ companyDraft: values })}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Название компании"
                    name="company_name"
                    rules={[{ required: true, message: 'Введите название компании' }]}
                  >
                    <Input placeholder="ACME CRM" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Рабочий email"
                    name="company_email"
                    rules={[{ type: 'email', message: 'Введите корректный email' }]}
                  >
                    <Input placeholder="team@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Телефон компании" name="company_phone">
                    <Input placeholder="+998 90 123 45 67" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Язык по умолчанию" name="default_language">
                    <Input
                      list="onboarding-language-options"
                      placeholder="ru"
                    />
                  </Form.Item>
                  <datalist id="onboarding-language-options">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </datalist>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Timezone"
                    name="timezone"
                    rules={[{ required: true, message: 'Выберите timezone' }]}
                  >
                    <Input list="onboarding-timezone-options" placeholder="Asia/Tashkent" />
                  </Form.Item>
                  <datalist id="onboarding-timezone-options">
                    {TIMEZONE_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </Col>
              </Row>
              <Space>
                <Button type="primary" htmlType="submit" loading={savingCompany}>
                  Сохранить и продолжить
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => loadAll({ silent: true })} loading={refreshing}>
                  Обновить
                </Button>
              </Space>
            </Form>
          </Space>
        </Card>
      );
    }

    if (activeStep.key === 'team') {
      return (
        <Card title="Шаг 2. Пользователи и роли">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type={userRows.length ? 'success' : 'warning'}
              showIcon
              message={userRows.length ? 'Команда уже создана' : 'Команда ещё не настроена'}
              description="Wizard показывает текущее состояние команды и ведёт в полноценный users workspace для CRUD и ролей."
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title="Пользователей" value={userRows.length} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Администраторов" value={adminUsersCount} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="Статус шага"
                  value={userRows.length ? 'Готово' : 'Нужно действие'}
                />
              </Col>
            </Row>
            <Table
              size="small"
              rowKey={(record) => record.id || record.email || record.username}
              pagination={false}
              locale={{ emptyText: 'Пока нет пользователей' }}
              dataSource={userRows.slice(0, 8)}
              columns={[
                {
                  title: 'Пользователь',
                  key: 'name',
                  render: (_, record) => record.name || record.username || record.email || 'Пользователь',
                },
                {
                  title: 'Email',
                  dataIndex: 'email',
                  key: 'email',
                  render: (value) => value || '-',
                },
                {
                  title: 'Роли',
                  key: 'roles',
                  render: (_, record) =>
                    resolveUserRoles(record).length ? (
                      <Space wrap>
                        {resolveUserRoles(record).map((role) => (
                          <Tag key={role}>{role}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">Не заданы</Text>
                    ),
                },
              ]}
            />
            <Space>
              <Button type="primary" icon={<TeamOutlined />} onClick={() => navigate('/users')}>
                Открыть пользователей
              </Button>
              <Button onClick={() => goToStep(Math.max(2, safeNextIndex))}>Следующий шаг</Button>
            </Space>
          </Space>
        </Card>
      );
    }

    if (activeStep.key === 'pipeline') {
      return (
        <Card title="Шаг 3. Воронка и стадии">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type={stages.length ? 'success' : 'warning'}
              showIcon
              message={stages.length ? 'Базовая воронка найдена' : 'Стадии ещё не настроены'}
              description="На этом шаге wizard проверяет, что reference data для воронки уже загружены, и даёт быстрый переход в управление стадиями."
            />
            {stages.length ? (
              <Space wrap>
                {stages.slice(0, 12).map((stage) => (
                  <Tag key={stage.id || stage.name} color="processing">
                    {stageName(stage)}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty description="Стадии сделок ещё не загружены" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            <Space>
              <Button type="primary" icon={<ApartmentOutlined />} onClick={() => navigate('/reference-data')}>
                Открыть справочники
              </Button>
              <Button onClick={() => goToStep(Math.max(3, safeNextIndex))}>Следующий шаг</Button>
            </Space>
          </Space>
        </Card>
      );
    }

    if (activeStep.key === 'import') {
      return (
        <Card title="Шаг 4. Импорт лидов и контактов">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type={progressState.importCompletedAt ? 'success' : 'info'}
              showIcon
              message={progressState.importCompletedAt ? 'Импорт уже выполнен' : 'Загрузите стартовый Excel-файл'}
              description="Wizard использует тот же `/api/crm-data/import/`, что и unified settings workspace. Прогресс шага сохраняется и после паузы."
            />
            <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle" style={{ width: '100%' }}>
              <Upload
                beforeUpload={(file) => {
                  setImportFile(file);
                  return false;
                }}
                onRemove={() => setImportFile(null)}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Выбрать Excel-файл</Button>
              </Upload>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleImport}
                loading={importing}
              >
                Импортировать
              </Button>
            </Space>
            {importFile ? <Text type="secondary">Выбран файл: {importFile.name}</Text> : null}
            {importResult ? (
              <Card size="small" title="Результат последнего импорта">
                <Row gutter={[16, 16]}>
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
                {importSheetRows.length ? (
                  <Table
                    style={{ marginTop: 16 }}
                    size="small"
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
                ) : null}
              </Card>
            ) : null}
          </Space>
        </Card>
      );
    }

    if (activeStep.key === 'channels') {
      return (
        <Card title="Шаг 5. Подключение каналов">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type={connectedChannelsCount ? 'success' : 'warning'}
              showIcon
              message={connectedChannelsCount ? 'Есть подключённые каналы' : 'Подключите хотя бы один канал'}
              description="Для первого inbox-сценария достаточно одного messenger-канала. Wizard показывает фактическое состояние Meta и Telegram интеграций."
            />
            <Row gutter={[16, 16]}>
              {channelRows.map((row) => (
                <Col xs={24} md={12} xl={6} key={row.key}>
                  <Card size="small">
                    <Space direction="vertical" size={8}>
                      <Tag color={row.color}>
                        <Space size={6}>
                          <ChannelBrandIcon channel={row.key} size={14} />
                          <span>{row.label}</span>
                        </Space>
                      </Tag>
                      <Statistic title="Подключено" value={row.count} />
                      <Tag color={row.connected ? 'success' : 'default'}>
                        {row.connected ? 'Готово' : 'Не подключено'}
                      </Tag>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
            <Space>
              <Button type="primary" icon={<ChannelBrandIcon channel="omnichannel" size={16} />} onClick={() => navigate('/integrations')}>
                Открыть интеграции
              </Button>
              <Button onClick={() => goToStep(Math.max(5, safeNextIndex))}>Следующий шаг</Button>
            </Space>
          </Space>
        </Card>
      );
    }

    if (activeStep.key === 'telephony') {
      return (
        <Card title="Шаг 6. Телефония">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              type={activeTelephonyCount ? 'success' : 'warning'}
              showIcon
              message={activeTelephonyCount ? 'Есть активная телефония' : 'Телефония ещё не активирована'}
              description="Проверьте active VoIP connection. Если её нет, wizard ведёт в telephony workspace без потери прогресса."
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title="Всего коннекторов" value={telephonyRows.length} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Активных" value={activeTelephonyCount} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Статус шага" value={activeTelephonyCount ? 'Готово' : 'Нужно действие'} />
              </Col>
            </Row>
            <Table
              size="small"
              pagination={false}
              rowKey={(record) => record.id || record.name}
              locale={{ emptyText: 'VoIP connections пока не созданы' }}
              dataSource={telephonyRows.slice(0, 8)}
              columns={[
                { title: 'Название', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                { title: 'Провайдер', dataIndex: 'provider', key: 'provider', render: (value) => value || '-' },
                {
                  title: 'Статус',
                  key: 'status',
                  render: (_, record) => (
                    <Tag color={record?.active || record?.is_active ? 'success' : 'default'}>
                      {record?.active || record?.is_active ? 'Активен' : 'Неактивен'}
                    </Tag>
                  ),
                },
              ]}
            />
            <Space>
              <Button type="primary" icon={<ChannelBrandIcon channel="telephony" size={16} />} onClick={() => navigate('/telephony')}>
                Открыть телефонию
              </Button>
              <Button onClick={() => goToStep(Math.max(6, safeNextIndex))}>Следующий шаг</Button>
            </Space>
          </Space>
        </Card>
      );
    }

    return (
      <Card title="Шаг 7. Первый dashboard">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type={completedCount === checklist.length ? 'success' : 'info'}
            showIcon
            message={
              completedCount === checklist.length
                ? 'Базовый onboarding завершён'
                : 'Откройте dashboard, чтобы завершить первый запуск'
            }
            description="Этот шаг фиксирует, что оператор или администратор уже перешёл в рабочий dashboard после базовой настройки."
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Statistic title="Health score" value={healthScore} suffix="%" />
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="Готовых шагов" value={completedCount} suffix={`/ ${checklist.length}`} />
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="Каналов подключено" value={connectedChannelsCount} />
            </Col>
          </Row>
          <Card size="small" title="One-click Integration Diagnostics">
            {diagnosticsSummary ? (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={8}>
                    <Statistic title="Transport health" value={diagnosticsSummary.transport_health || 'unknown'} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title="Failed events" value={Number(diagnosticsSummary.failed_events || 0)} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title="Replayable" value={Number(diagnosticsSummary.replayable_events || 0)} />
                  </Col>
                </Row>
                <Alert
                  type={Number(diagnosticsSummary.failed_events || 0) > 0 ? 'warning' : 'success'}
                  showIcon
                  message={
                    Number(diagnosticsSummary.failed_events || 0) > 0
                      ? 'Есть failed события: проверьте integration diagnostics'
                      : 'Интеграции выглядят стабильно'
                  }
                />
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Диагностика пока не запускалась или недоступна по лицензии"
              />
            )}
            <Button
              style={{ marginTop: 12 }}
              icon={<ReloadOutlined />}
              loading={diagnosticsLoading}
              onClick={handleRunDiagnostics}
            >
              Запустить one-click diagnostics
            </Button>
          </Card>
          <Button type="primary" icon={<DashboardOutlined />} onClick={handleOpenDashboard}>
            Открыть dashboard
          </Button>
        </Space>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant="borderless" style={{ background: bg }}>
        <div style={{ padding: 64, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        variant="borderless"
        style={{ background: bg }}
        extra={
          <Space>
            <Select
              value={selectedTemplate}
              style={{ width: 220 }}
              onChange={setSelectedTemplate}
              options={templateOptions}
            />
            <Button loading={bootstrappingTemplate} onClick={handleBootstrapTemplate}>
              Применить template + demo
            </Button>
            <Button danger onClick={handleRestartWizard}>
              Сбросить onboarding
            </Button>
            <Button onClick={() => goToStep(safeNextIndex)}>Следующий обязательный шаг</Button>
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadAll({ silent: true })}>
              Обновить
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            First Run Wizard
          </Title>
          <Text type="secondary">
            Resumable onboarding для первого запуска CRM: компания, команда, воронка, импорт, каналы, телефония и первый dashboard.
          </Text>
          <Alert
            type="info"
            showIcon
            message="Прогресс wizard сохраняется"
            description="Можно безопасно прервать настройку и продолжить позже. Следующий обязательный шаг вычисляется из фактического состояния backend и сохранённого прогресса."
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={16}>
          <Card variant="borderless" style={{ background: bg }}>
            <Steps
              direction="vertical"
              size="small"
              current={activeStepIndex}
              onChange={goToStep}
              items={checklist.map((step) => ({
                title: step.title,
                description: step.description,
                status:
                  step.complete ? 'finish' : step.key === activeStep?.key ? 'process' : 'wait',
                icon: step.complete ? <CheckCircleOutlined /> : undefined,
              }))}
            />
          </Card>
          <div style={{ marginTop: 16 }}>
            {renderStepContent()}
          </div>
        </Col>

        <Col xs={24} xl={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card variant="borderless" style={{ background: bgMuted, border: `1px solid ${border}` }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space align="center">
                  <SettingOutlined />
                  <Title level={5} style={{ margin: 0 }}>
                    Onboarding Checklist
                  </Title>
                </Space>
                <Progress percent={healthScore} status={healthScore === 100 ? 'success' : 'active'} />
                <Text type="secondary">
                  {completedCount} из {checklist.length} шагов готовы
                </Text>
                <List
                  size="small"
                  dataSource={checklist}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button key={`goto-${item.key}`} type="link" onClick={() => goToStep(index)}>
                          Открыть
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            <span>{item.title}</span>
                            <Tag color={item.complete ? 'success' : index === safeNextIndex ? 'warning' : 'default'}>
                              {item.complete ? 'Готово' : index === safeNextIndex ? 'Следующий' : 'В ожидании'}
                            </Tag>
                          </Space>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Space>
            </Card>

            <Card variant="borderless" style={{ background: bgMuted, border: `1px solid ${border}` }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>
                  Health Score
                </Title>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Statistic title="Пользователи" value={userRows.length} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Стадии" value={stages.length} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Каналы" value={connectedChannelsCount} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Телефония" value={activeTelephonyCount} />
                  </Col>
                </Row>
                <Alert
                  type={healthScore === 100 ? 'success' : 'warning'}
                  showIcon
                  message={
                    healthScore === 100
                      ? 'Базовый запуск готов'
                      : `Следующий обязательный шаг: ${checklist[safeNextIndex]?.title || 'завершить wizard'}`
                  }
                />
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
