import {
    ApiOutlined,
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    CheckSquareOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DollarOutlined,
    FacebookOutlined,
    FileTextOutlined,
    FolderOutlined,
    GlobalOutlined,
    InstagramOutlined,
    LogoutOutlined,
    MailOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    MoonOutlined,
    PhoneOutlined,
    QuestionCircleOutlined,
    RobotOutlined,
    SendOutlined,
    SettingOutlined,
    SunOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    UserOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Badge, Button, ConfigProvider, Drawer, Dropdown, Grid, Layout, Menu, Space, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import brandMark from '../assets/brand/favicon.svg';
import brandLogo from '../assets/brand/logo.svg';
import brandLogoDark from '../assets/brand/logo-dark.svg';
import { LICENSE_RESTRICTION_EVENT } from '../lib/api/licenseRestrictionBus.js';
import {
  getLicenseRestrictionMessage,
  readStoredLicenseRestriction,
  storeLicenseRestriction,
} from '../lib/api/licenseRestrictionState.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { getLocale, t } from '../lib/i18n/index.js';
import { SETTINGS_WORKSPACE_NAV_KEY } from '../lib/settingsWorkspaceNavigation.js';
import { navigate } from '../router.js';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export function AppLayout({
  collapsed,
  onToggleCollapsed,
  locale,
  onLocaleChange,
  selectedKey,
  routeName,
  user,
  frontendVersion,
  wsConnected,
  wsReconnecting,
  activeIntegrations,
  incomingCallsCount,
  unreadCount,
  allowedNavKeys,
  settingsWorkspacePath = '/settings',
  onOpenDialer,
  onLogout,
  children,
}) {
  const { theme, toggleTheme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [licenseRestriction, setLicenseRestriction] = useState(() => readStoredLicenseRestriction());
  const siderWidth = 256;
  const desktopTopBarHeight = 64;
  const mobileTopBarHeight = 56;
  const drawerWidth = screens.sm ? 300 : '86vw';
  const shell = theme === 'dark'
    ? {
        pageBg: 'var(--crm-app-body-bg, #08111f)',
        surface: 'var(--crm-app-surface, rgba(12, 19, 32, 0.94))',
        surfaceSolid: 'var(--crm-app-surface-solid, #0c1523)',
        surfaceElevated: 'var(--crm-app-surface-elevated, #132033)',
        border: 'var(--crm-app-border, rgba(148, 163, 184, 0.28))',
        text: 'var(--crm-app-text, #e5eef8)',
        textMuted: 'var(--crm-app-text-muted, #cad6e2)',
        shadow: 'var(--crm-app-shadow, 0 18px 40px rgba(2, 6, 23, 0.42))',
        shadowStrong: 'var(--crm-app-shadow-strong, 0 24px 52px rgba(2, 6, 23, 0.58))',
        menuSelected: 'var(--crm-app-menu-selected, linear-gradient(135deg, rgba(125, 211, 252, 0.3), rgba(96, 165, 250, 0.18)))',
        menuHover: 'var(--crm-app-menu-hover, rgba(148, 163, 184, 0.14))',
        accentBorder: 'var(--crm-app-accent-border, rgba(226, 232, 240, 0.34))',
      }
    : {
        pageBg: 'var(--crm-app-body-bg, #f8fafc)',
        surface: 'var(--crm-app-surface, rgba(255, 255, 255, 0.88))',
        surfaceSolid: 'var(--crm-app-surface-solid, #ffffff)',
        surfaceElevated: 'var(--crm-app-surface-elevated, #ffffff)',
        border: 'var(--crm-app-border, #e2e8f0)',
        text: 'var(--crm-app-text, #0f172a)',
        textMuted: 'var(--crm-app-text-muted, #64748b)',
        shadow: 'var(--crm-app-shadow, 0 12px 30px rgba(15, 23, 42, 0.08))',
        shadowStrong: 'var(--crm-app-shadow-strong, 0 18px 40px rgba(15, 23, 42, 0.12))',
        menuSelected: 'var(--crm-app-menu-selected, #eef6ff)',
        menuHover: 'var(--crm-app-menu-hover, #f8fafc)',
        accentBorder: 'var(--crm-app-accent-border, #dbeafe)',
      };
  const licenseShell = theme === 'dark'
    ? {
        border: 'rgba(245, 158, 11, 0.42)',
        background: 'linear-gradient(180deg, rgba(69, 43, 12, 0.96), rgba(33, 22, 8, 0.94))',
        title: '#fff7ed',
        text: '#fde68a',
        meta: '#fbbf24',
        shadow: '0 16px 32px rgba(0, 0, 0, 0.34)',
      }
    : {
        border: 'rgba(217, 119, 6, 0.28)',
        background: 'linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 214, 0.94))',
        title: '#7c2d12',
        text: '#9a3412',
        meta: '#b45309',
        shadow: '0 14px 28px rgba(217, 119, 6, 0.12)',
      };
  const menuTheme = {
    components: {
      Menu: theme === 'dark'
        ? {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemColor: shell.textMuted,
            darkItemHoverColor: shell.text,
            darkItemSelectedColor: shell.text,
            darkItemSelectedBg: shell.menuSelected,
            darkItemHoverBg: shell.menuHover,
            darkGroupTitleColor: '#64748b',
          }
        : {
            itemBg: 'transparent',
            itemColor: shell.textMuted,
            itemHoverColor: shell.text,
            itemSelectedColor: shell.text,
            itemSelectedBg: shell.menuSelected,
            itemHoverBg: shell.menuHover,
            groupTitleColor: shell.textMuted,
          },
    },
  };
  const tr = (key, fallback) => {
    const localized = t(key);
    return localized === key ? fallback : localized;
  };
  const i18nLocale = getLocale();
  const activeLocale = i18nLocale === 'ru' || i18nLocale === 'en' || i18nLocale === 'uz'
    ? i18nLocale
    : locale;
  const allowedNavSet = new Set(Array.isArray(allowedNavKeys) ? allowedNavKeys : []);
  const canOpenControlPlane = allowedNavSet.has('control-plane');
  const canOpenSettingsWorkspace = (
    allowedNavSet.has(SETTINGS_WORKSPACE_NAV_KEY)
    || allowedNavSet.has('settings')
    || allowedNavSet.has('integrations')
  );
  // Build nav labels at render time so they react to locale changes.
  const baseNav = [
    {
      key: 'sales-group',
      label: tr('nav.salesGroup', 'Продажи'),
      children: [
        { key: 'dashboard', label: tr('nav.dashboard', 'Дашборд'), icon: <BarChartOutlined />, path: '/dashboard' },
        { key: 'leads', label: tr('nav.leads', 'Лиды'), icon: <TeamOutlined />, path: '/leads' },
        { key: 'contacts', label: tr('nav.contacts', 'Контакты'), icon: <UserOutlined />, path: '/contacts' },
        { key: 'companies', label: tr('nav.companies', 'Компании'), icon: <BankOutlined />, path: '/companies' },
        { key: 'deals', label: tr('nav.deals', 'Сделки'), icon: <DollarOutlined />, path: '/deals' },
        { key: 'tasks', label: tr('nav.tasks', 'Задачи'), icon: <CheckSquareOutlined />, path: '/tasks' },
        { key: 'projects', label: tr('nav.projects', 'Проекты'), icon: <FolderOutlined />, path: '/projects' },
        { key: 'products', label: tr('nav.products', 'Продукты'), icon: <AppstoreOutlined />, path: '/products' },
      ],
    },
    {
      key: 'communications-group',
      label: tr('nav.communicationsGroup', 'Коммуникации'),
      children: [
        { key: 'chat', label: tr('nav.chat', 'Чаты'), icon: <MessageOutlined />, path: '/chat' },
        { key: 'ai-chat', label: tr('nav.aiChat', 'AI чат CRM'), icon: <RobotOutlined />, path: '/ai-chat' },
        { key: 'calls', label: tr('nav.calls', 'Звонки'), icon: <PhoneOutlined />, path: '/calls' },
        { key: 'reminders', label: tr('nav.reminders', 'Напоминания'), icon: <ClockCircleOutlined />, path: '/reminders' },
        { key: 'crm-emails', label: tr('nav.crmEmails', 'CRM Email'), icon: <MailOutlined />, path: '/crm-emails' },
        { key: 'massmail', label: tr('nav.massmail', 'Массовые рассылки'), icon: <FileTextOutlined />, path: '/massmail' },
        { key: 'sms-center', label: tr('nav.smsCenter', 'SMS'), icon: <MessageOutlined />, path: '/sms' },
        { key: 'memos', label: tr('nav.memos', 'Заметки'), icon: <FileTextOutlined />, path: '/memos' },
      ],
    },
    {
      key: 'marketing-group',
      label: tr('nav.marketingGroup', 'Маркетинг'),
      children: [
        { key: 'campaigns', label: tr('nav.campaigns', 'Кампании'), icon: <CustomerServiceOutlined />, path: '/campaigns' },
        { key: 'content-plans', label: tr('nav.contentPlans', 'Контент планы'), icon: <FileTextOutlined />, path: '/content-plans' },
        { key: 'segments', label: tr('nav.segments', 'Сегменты'), icon: <TeamOutlined />, path: '/marketing/segments' },
        { key: 'templates', label: tr('nav.templates', 'Шаблоны'), icon: <FileTextOutlined />, path: '/marketing/templates' },
        { key: 'analytics', label: tr('nav.analytics', 'Аналитика'), icon: <BarChartOutlined />, path: '/analytics' },
      ],
    },
    {
      key: 'operations-group',
      label: tr('nav.operationsGroup', 'Операции'),
      children: [
        { key: 'payments', label: tr('nav.payments', 'Платежи'), icon: <DollarOutlined />, path: '/payments' },
        { key: 'telephony', label: tr('nav.telephony', 'Телефония'), icon: <PhoneOutlined />, path: '/telephony' },
        { key: 'operations', label: tr('nav.operations', 'Операции'), icon: <SettingOutlined />, path: '/operations' },
        {
          key: 'clients-workspace',
          label: tr('nav.clientsWorkspace', 'Клиенты и договоры'),
          icon: <BankOutlined />,
          path: '/clients-workspace',
        },
        {
          key: 'warehouse',
          label: tr('nav.warehouseWorkspace', 'Склад'),
          icon: <AppstoreOutlined />,
          path: '/warehouse',
        },
        {
          key: 'finance-planning',
          label: tr('nav.financePlanning', 'Финплан'),
          icon: <DollarOutlined />,
          path: '/finance-planning',
        },
        {
          key: 'business-processes',
          label: tr('nav.businessProcesses', 'Бизнес-процессы'),
          icon: <SettingOutlined />,
          path: '/business-processes',
        },
        {
          key: 'meetings',
          label: tr('nav.meetings', 'Встречи'),
          icon: <ClockCircleOutlined />,
          path: '/meetings',
        },
        {
          key: 'documents-workspace',
          label: tr('nav.documentsWorkspace', 'Документы'),
          icon: <FileTextOutlined />,
          path: '/documents',
        },
        {
          key: 'backlog',
          label: tr('nav.backlog', 'Беклог'),
          icon: <AppstoreOutlined />,
          path: '/backlog',
        },
        {
          key: 'functional',
          label: tr('nav.functional', 'Функционал'),
          icon: <SettingOutlined />,
          path: '/functional',
        },
      ],
    },
    {
      key: 'system-group',
      label: tr('nav.systemGroup', 'Система'),
      children: [
        {
          key: SETTINGS_WORKSPACE_NAV_KEY,
          label: tr('nav.settingsWorkspace', 'Настройки и интеграции'),
          icon: <SettingOutlined />,
          path: settingsWorkspacePath,
        },
        { key: 'control-plane', label: tr('nav.controlPlane', 'Control Plane'), icon: <ApiOutlined />, path: '/control-plane' },
        { key: 'reference-data', label: tr('nav.referenceData', 'Справочники'), icon: <AppstoreOutlined />, path: '/reference-data' },
        { key: 'landing-builder', label: tr('nav.landingBuilder', 'Конструктор лендингов'), icon: <AppstoreOutlined />, path: '/landing-builder' },
        { key: 'sites-workspace', label: tr('nav.sitesWorkspace', 'Сайты'), icon: <GlobalOutlined />, path: '/sites' },
        { key: 'users', label: tr('nav.users', 'Пользователи'), icon: <UserOutlined />, path: '/users' },
        { key: 'help-center', label: tr('nav.helpCenter', 'Справка'), icon: <QuestionCircleOutlined />, path: '/help' },
      ],
    },
  ];
  const visibleNav = Array.isArray(allowedNavKeys) && allowedNavKeys.length
    ? baseNav
      .map((item) => {
        const children = Array.isArray(item.children)
          ? item.children.filter((child) => allowedNavKeys.includes(child.key))
          : [];
        return children.length ? { ...item, children } : null;
      })
      .filter(Boolean)
    : baseNav;

  const findNavLabel = (items, key) => {
    for (const item of items) {
      if (item.key === key) return item.label;
      if (Array.isArray(item.children)) {
        const childLabel = findNavLabel(item.children, key);
        if (childLabel) return childLabel;
      }
    }
    return null;
  };

  const resolveNavKeyFromRouteName = (name) => {
    const normalized = String(name || '').trim();
    if (!normalized) return null;
    if (normalized.startsWith('leads')) return 'leads';
    if (normalized.startsWith('contacts')) return 'contacts';
    if (normalized.startsWith('companies')) return 'companies';
    if (normalized.startsWith('deals')) return 'deals';
    if (normalized.startsWith('tasks')) return 'tasks';
    if (normalized.startsWith('projects')) return 'projects';
    if (normalized.startsWith('products')) return 'products';
    if (normalized.startsWith('chat')) return 'chat';
    if (normalized === 'ai-chat') return 'ai-chat';
    if (normalized.startsWith('calls')) return 'calls';
    if (normalized.startsWith('payments')) return 'payments';
    if (normalized.startsWith('reminders')) return 'reminders';
    if (normalized.startsWith('campaigns')) return 'campaigns';
    if (normalized === 'marketing-segments') return 'segments';
    if (normalized === 'marketing-templates') return 'templates';
    if (normalized === 'content-plans') return 'content-plans';
    if (normalized.startsWith('memos')) return 'memos';
    if (normalized === 'warehouse-workspace') return 'warehouse';
    if (normalized === 'documents-workspace') return 'documents-workspace';
    if (normalized === 'backlog') return 'backlog';
    if (normalized === 'sites-workspace') return 'sites-workspace';
    if (normalized === 'functional') return 'functional';
    if (normalized === 'settings' || normalized === 'integrations' || normalized === 'onboarding') {
      return SETTINGS_WORKSPACE_NAV_KEY;
    }
    return normalized;
  };

  const resolveNavKeyFromHash = () => {
    if (typeof window === 'undefined') return null;
    const rawHash = String(window.location.hash || '').replace(/^#/, '');
    const [rawPath = ''] = rawHash.split('?');
    const segments = rawPath.split('/').filter(Boolean);
    const section = segments[0] || '';
    if (!section) return null;

    if (section === 'marketing') {
      if (segments[1] === 'segments') return 'segments';
      if (segments[1] === 'templates') return 'templates';
      return null;
    }
    if (section === 'chat') return 'chat';
    if (section === 'calls') return 'calls';
    if (section === 'warehouse') return 'warehouse';
    if (section === 'documents') return 'documents-workspace';
    if (section === 'content-plans') return 'content-plans';
    if (section === 'backlog') return 'backlog';
    if (section === 'sites') return 'sites-workspace';
    if (section === 'functional') return 'functional';
    if (section === 'sms') return 'sms-center';
    if (section === 'help') return 'help-center';
    if (section === 'settings' || section === 'integrations' || section === 'onboarding' || section === 'setup') {
      return SETTINGS_WORKSPACE_NAV_KEY;
    }
    if (section === 'licensing' || section === 'license' || section === 'control-plane') {
      return 'control-plane';
    }

    const directSections = new Set([
      'dashboard',
      'leads',
      'contacts',
      'companies',
      'deals',
      'tasks',
      'projects',
      'products',
      'ai-chat',
      'payments',
      'reminders',
      'campaigns',
      'memos',
      'crm-emails',
      'massmail',
      'operations',
      'clients-workspace',
      'finance-planning',
      'business-processes',
      'meetings',
      'documents',
      'content-plans',
      'backlog',
      'sites',
      'functional',
      'reference-data',
      'analytics',
      'telephony',
      'users',
      'landing-builder',
      'profile',
    ]);

    return directSections.has(section) ? section : null;
  };

  const [hashDerivedKey, setHashDerivedKey] = useState(() => resolveNavKeyFromHash());

  const routeDerivedKey = resolveNavKeyFromRouteName(routeName);
  const effectiveSelectedKey = hashDerivedKey || routeDerivedKey || selectedKey;
  const selectedNavLabel =
    findNavLabel(baseNav, effectiveSelectedKey) ||
    findNavLabel(baseNav, selectedKey) ||
    tr('nav.dashboard', 'Дашборд');
  const integrationLabelMap = {
    sms: activeLocale === 'ru' ? 'SMS' : 'SMS',
    telephony: activeLocale === 'ru' ? 'Телефония' : activeLocale === 'uz' ? 'Telefoniya' : 'Telephony',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    telegram: 'Telegram',
    ai: 'AI',
  };
  const integrationIconMap = {
    sms: MessageOutlined,
    telephony: PhoneOutlined,
    whatsapp: WhatsAppOutlined,
    facebook: FacebookOutlined,
    instagram: InstagramOutlined,
    telegram: SendOutlined,
    ai: RobotOutlined,
  };
  const hasActiveTelephony = Array.isArray(activeIntegrations)
    && activeIntegrations.some((integration) => integration?.key === 'telephony');
  const displayName = (() => {
    const firstAndLastName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    const fullName = String(user?.full_name || '').trim();
    const username = String(user?.username || '').trim();
    const normalizedName = String(user?.name || '').trim();
    const genericNames = new Set(['user', 'пользователь', 'foydalanuvchi']);
    const normalizedNameIsGeneric = genericNames.has(normalizedName.toLowerCase());

    return (
      firstAndLastName
      || fullName
      || username
      || (!normalizedNameIsGeneric ? normalizedName : '')
      || 'User'
    );
  })();
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const userIsAdmin = Boolean(
    user?.is_superuser
      || userRoles.some((role) => String(role || '').toLowerCase() === 'admin'),
  );
  const backendVersion = user?.system_version?.backend_version || null;
  const frontendVersionText = frontendVersion?.frontend_version || null;
  const [wsIndicatorStatus, setWsIndicatorStatus] = useState(
    wsConnected ? 'success' : (wsReconnecting ? 'processing' : 'error')
  );
  const wsIndicatorColor = wsIndicatorStatus === 'success'
    ? '#52c41a'
    : wsIndicatorStatus === 'processing'
      ? '#faad14'
      : '#ff4d4f';
  const licenseRestrictionCopy = getLicenseRestrictionMessage(licenseRestriction, t);

  useEffect(() => {
    if (wsConnected) {
      setWsIndicatorStatus('success');
      return undefined;
    }
    if (wsReconnecting) {
      setWsIndicatorStatus('processing');
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setWsIndicatorStatus('error');
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [wsConnected, wsReconnecting]);

  useEffect(() => {
    const handleLicenseRestriction = (event) => {
      const detail = event?.detail || {};
      const nextRestriction = {
        code: detail.code || 'LICENSE_FEATURE_DISABLED',
        feature: String(detail.feature || 'unknown.feature'),
        message: String(detail.message || ''),
      };
      setLicenseRestriction(nextRestriction);
      storeLicenseRestriction(nextRestriction);
    };

    window.addEventListener(LICENSE_RESTRICTION_EVENT, handleLicenseRestriction);
    return () => window.removeEventListener(LICENSE_RESTRICTION_EVENT, handleLicenseRestriction);
  }, []);

  const handleCloseLicenseRestriction = () => {
    setLicenseRestriction(null);
    storeLicenseRestriction(null);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [effectiveSelectedKey, isMobile]);

  useEffect(() => {
    const syncFromHash = () => {
      setHashDerivedKey(resolveNavKeyFromHash());
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, mobileMenuOpen]);

  // Convert baseNav to Ant Design Menu items (with nested groups)
  const menuItems = visibleNav.map((item) => {
    return {
      key: item.key,
      type: 'group',
      label: item.label,
      children: item.children.map((child) => ({
        key: child.key,
        icon: child.icon,
        label: child.label,
        onClick: () => {
          navigate(child.path);
          if (isMobile) {
            setMobileMenuOpen(false);
          }
        },
      })),
    };
  });

  // User dropdown menu items
  // Locale dropdown menu items
  const localeMenuItems = [
    {
      key: 'en',
      label: activeLocale === 'en' ? 'English ✓' : 'English',
      onClick: () => onLocaleChange('en'),
    },
    {
      key: 'ru',
      label: activeLocale === 'ru' ? 'Русский ✓' : 'Русский',
      onClick: () => onLocaleChange('ru'),
    },
    {
      key: 'uz',
      label: activeLocale === 'uz' ? "O'zbekcha ✓" : "O'zbekcha",
      onClick: () => onLocaleChange('uz'),
    },
  ];

  const themeMenuItems = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: theme === 'light'
        ? `${tr('nav.themeLight', 'Светлая')} ✓`
        : tr('nav.themeLight', 'Светлая'),
      onClick: () => {
        if (theme !== 'light') toggleTheme();
      },
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: theme === 'dark'
        ? `${tr('nav.themeDark', 'Темная')} ✓`
        : tr('nav.themeDark', 'Темная'),
      onClick: () => {
        if (theme !== 'dark') toggleTheme();
      },
    },
  ];

  const buildUserMenuGroupLabel = (title, value) => (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
      }}
    >
      <span>{title}</span>
      <span
        style={{
          fontSize: 12,
          color: shell.textMuted,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        {value}
      </span>
    </span>
  );

  const buildVersionMenuLabel = () => (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        opacity: 0.88,
      }}
    >
      <span style={{ fontWeight: 500 }}>{tr('nav.version', 'Версия CRM')}</span>
      <span style={{ fontSize: 12, color: shell.textMuted, lineHeight: 1.45 }}>
        {[
          frontendVersionText ? `FE ${frontendVersionText}` : 'FE —',
          backendVersion ? `BE ${backendVersion}` : 'BE —',
        ].join(' | ')}
      </span>
    </span>
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: tr('nav.profile', 'Профиль'),
      onClick: () => navigate('/profile'),
    },
    ...(Array.isArray(allowedNavKeys) && allowedNavKeys.includes(SETTINGS_WORKSPACE_NAV_KEY)
      ? [{
          key: SETTINGS_WORKSPACE_NAV_KEY,
          icon: <SettingOutlined />,
          label: tr('nav.settingsWorkspace', 'Настройки и интеграции'),
          onClick: () => navigate(settingsWorkspacePath),
        }]
      : []),
    {
      key: 'language-group',
      type: 'group',
      label: buildUserMenuGroupLabel(tr('nav.language', 'Язык'), activeLocale.toUpperCase()),
      children: localeMenuItems,
    },
    {
      key: 'theme-group',
      type: 'group',
      label: buildUserMenuGroupLabel(
        tr('nav.theme', 'Тема'),
        theme === 'dark' ? tr('nav.themeDark', 'Темная') : tr('nav.themeLight', 'Светлая')
      ),
      children: themeMenuItems,
    },
    ...(userIsAdmin
      ? [{
          key: 'system-version',
          icon: <ApiOutlined />,
          disabled: true,
          label: buildVersionMenuLabel(),
        }]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: tr('nav.logout', 'Выход'),
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100dvh', background: 'transparent' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={onToggleCollapsed}
          trigger={null}
          width={256}
          theme={theme === 'dark' ? 'dark' : 'light'}
          style={{
            overflow: 'auto',
            height: '100vh',
            boxSizing: 'border-box',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${shell.border}`,
            background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
            boxShadow: shell.shadowStrong,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
        <div
          style={{
            height: desktopTopBarHeight,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 16px',
            borderBottom: `1px solid ${shell.border}`,
            background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
          }}
        >
          <Space>
            {collapsed ? (
              <Avatar
                style={{
                  backgroundColor: shell.surfaceElevated,
                  color: shell.text,
                  border: `1px solid ${shell.border}`,
                  verticalAlign: 'middle',
                  boxShadow: theme === 'dark' ? '0 8px 18px rgba(2, 6, 23, 0.28)' : 'none',
                }}
                size="large"
                src={brandMark}
              >
                E
              </Avatar>
            ) : (
              <img
                src={theme === 'dark' ? brandLogoDark : brandLogo}
                alt="Enterprise CRM"
                style={{ width: 168, height: 'auto' }}
              />
            )}
          </Space>
          {!collapsed && (
            <Button
              type="text"
              icon={<MenuFoldOutlined style={{ color: shell.text }} />}
              onClick={onToggleCollapsed}
            />
          )}
        </div>

        <ConfigProvider theme={menuTheme}>
          <Menu
            theme={theme === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[effectiveSelectedKey]}
            items={menuItems}
            style={{
              borderRight: 0,
              height: `calc(100vh - ${desktopTopBarHeight}px)`,
              overflowY: 'auto',
              padding: '12px 10px 18px',
              background: 'transparent',
            }}
          />
        </ConfigProvider>
      </Sider>
      )}

      <Drawer
        placement="left"
        width={drawerWidth}
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        maskClosable
        keyboard
        destroyOnClose
        zIndex={1400}
        styles={{
          header: {
            background: shell.surfaceSolid,
            borderBottom: `1px solid ${shell.border}`,
            paddingTop: 'env(safe-area-inset-top)',
          },
          body: {
            background: shell.surfaceSolid,
            padding: 0,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <ConfigProvider theme={menuTheme}>
          <Menu
            theme={theme === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[effectiveSelectedKey]}
            items={menuItems}
            style={{
              borderRight: 0,
              height: '100%',
              overflowY: 'auto',
              padding: '12px 10px 18px',
              background: 'transparent',
            }}
          />
        </ConfigProvider>
      </Drawer>

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : siderWidth,
          transition: 'all 0.2s',
          background: 'transparent',
        }}
      >
        <Header
          style={{
            padding: isMobile
              ? '0 calc(12px + env(safe-area-inset-right)) 0 calc(12px + env(safe-area-inset-left))'
              : '0 24px',
            height: isMobile ? mobileTopBarHeight : desktopTopBarHeight,
            boxSizing: 'border-box',
            lineHeight: 'normal',
            background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
            borderBottom: `1px solid ${shell.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            boxShadow: shell.shadow,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          <Space align="center">
            {isMobile && (
              <Button type="text" icon={<MenuUnfoldOutlined />} onClick={() => setMobileMenuOpen(true)} />
            )}
            {!isMobile && collapsed && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={onToggleCollapsed}
              />
            )}
            <Text
              ellipsis
              style={{
                maxWidth: isMobile ? 160 : 'none',
                lineHeight: 1.2,
                color: shell.textMuted,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              {selectedNavLabel}
            </Text>
          </Space>

          <Space size={isMobile ? 'small' : 'middle'} wrap={false} align="center">
            {/* User Menu */}
            {hasActiveTelephony && (
              <Button
                size={isMobile ? 'small' : 'middle'}
                icon={<PhoneOutlined />}
                onClick={onOpenDialer}
              />
            )}

            <ConfigProvider theme={menuTheme}>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space
                align="center"
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${theme === 'dark' ? shell.accentBorder : shell.border}`,
                  background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
                  boxShadow: shell.shadow,
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                }}
              >
                <Space size={6} align="center">
                  <Tooltip
                    title={wsIndicatorStatus === 'error'
                      ? tr('appLayout.status.controlPlaneOffline', 'Control Plane недоступен')
                      : tr('appLayout.status.controlPlaneOnline', 'Control Plane синхронизирован')}
                  >
                    <Space size={4} align="center">
                      <ThunderboltOutlined style={{ color: wsIndicatorColor }} />
                      <Badge status={wsIndicatorStatus} />
                    </Space>
                  </Tooltip>
                </Space>
                {Array.isArray(activeIntegrations) && activeIntegrations.length > 0 && (
                  <Space size={8} align="center">
                    {activeIntegrations.map((integration) => {
                      const IconComponent = integrationIconMap[integration.key];
                      if (!IconComponent) return null;
                      return (
                        <Tooltip
                          key={integration.key}
                          title={integrationLabelMap[integration.key] || integration.key}
                        >
                          <Space size={4} align="center">
                            <IconComponent style={{ color: shell.textMuted }} />
                            <Badge status={integration.status || 'success'} />
                          </Space>
                        </Tooltip>
                      );
                    })}
                  </Space>
                )}
                {incomingCallsCount > 0 && (
                  <Badge count={incomingCallsCount}>
                    <PhoneOutlined />
                  </Badge>
                )}
                {unreadCount > 0 && (
                  <Badge count={unreadCount}>
                    <MessageOutlined />
                  </Badge>
                )}
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: shell.surfaceElevated,
                    color: shell.text,
                    border: `1px solid ${shell.border}`,
                  }}
                >
                  {avatarLetter}
                </Avatar>
                {!isMobile && <Text style={{ color: shell.text, fontWeight: 500 }}>{displayName}</Text>}
              </Space>
              </Dropdown>
            </ConfigProvider>
          </Space>
        </Header>

        <Content
          style={{
            margin: isMobile ? '12px clamp(10px, 3vw, 14px) calc(12px + env(safe-area-inset-bottom))' : '24px',
            minHeight: 280,
            overflowX: 'hidden',
            maxWidth: '100%',
            background: theme === 'dark' ? shell.surfaceSolid : 'transparent',
            borderRadius: theme === 'dark' ? 24 : 0,
          }}
        >
          {licenseRestriction ? (
            <div
              style={{
                marginBottom: 12,
                padding: 1,
                borderRadius: 16,
                border: `1px solid ${licenseShell.border}`,
                background: licenseShell.background,
                boxShadow: licenseShell.shadow,
              }}
            >
              <Alert
                type="warning"
                showIcon
                closable
                onClose={handleCloseLicenseRestriction}
                message={
                  <Text strong style={{ color: licenseShell.title }}>
                    {licenseRestrictionCopy.message}
                  </Text>
                }
                description={(
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text style={{ color: licenseShell.text, lineHeight: 1.55 }}>
                      {licenseRestrictionCopy.description}
                    </Text>
                    <Text style={{ color: licenseShell.meta, fontSize: 12, lineHeight: 1.45 }}>
                      {t(
                        'license.banner.helper',
                        'Разделы, ограниченные лицензией, будут недоступны до снятия ограничения.',
                      )}
                    </Text>
                  </Space>
                )}
                action={(
                  <Space wrap>
                    {canOpenControlPlane ? (
                      <Button size="small" type="primary" onClick={() => navigate('/control-plane')}>
                        {t('license.banner.openControlPlane', 'Open Control Plane')}
                      </Button>
                    ) : null}
                    {canOpenSettingsWorkspace ? (
                      <Button size="small" onClick={() => navigate(settingsWorkspacePath)}>
                        {t('license.banner.openSettings', 'Open Settings Workspace')}
                      </Button>
                    ) : null}
                  </Space>
                )}
                style={{ background: 'transparent', border: 'none' }}
              />
            </div>
          ) : null}
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
