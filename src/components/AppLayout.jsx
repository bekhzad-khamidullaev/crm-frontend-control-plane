import {
    BellOutlined,
    ApiOutlined,
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    CheckSquareOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    CheckOutlined,
    DollarOutlined,
    DownOutlined,
    FileTextOutlined,
    FolderOutlined,
    GlobalOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MoonOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    RobotOutlined,
    SearchOutlined,
    LoadingOutlined,
    SettingOutlined,
    SunOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  AutoComplete,
  Badge,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Grid,
  Input,
  Layout,
  Menu,
  Select,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import brandMark from '../assets/brand/favicon.svg';
import brandLogo from '../assets/brand/logo.svg';
import brandLogoDark from '../assets/brand/logo-dark.svg';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';
import { getLeads } from '../lib/api/leads.js';
import { getContacts } from '../lib/api/contacts.js';
import { getCompanies } from '../lib/api/companies.js';
import { getDeals } from '../lib/api/deals.js';
import { getTasks } from '../lib/api/tasks.js';
import { getProjects } from '../lib/api/projects.js';
import { getProducts } from '../lib/api/products.js';
import { getPayments } from '../lib/api/payments.js';
import { getMemos } from '../lib/api/memos.js';
import { getReminders } from '../lib/api/reminders.js';
import { LICENSE_RESTRICTION_EVENT } from '../lib/api/licenseRestrictionBus.js';
import {
  getLicenseRestrictionMessage,
  readStoredLicenseRestriction,
  storeLicenseRestriction,
} from '../lib/api/licenseRestrictionState.js';
import { getRouteAccessState } from '../lib/rbac.js';
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
  const [globalSearchValue, setGlobalSearchValue] = useState('');
  const [globalSearchOptions, setGlobalSearchOptions] = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [licenseRestriction, setLicenseRestriction] = useState(() => readStoredLicenseRestriction());
  const globalSearchRequestRef = useRef(0);
  const siderWidth = 256;
  const desktopTopBarHeight = 68;
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
        accentSoft: 'rgba(125, 211, 252, 0.16)',
        topStrip: 'linear-gradient(90deg, rgba(56, 189, 248, 0.24) 0%, rgba(96, 165, 250, 0.08) 60%, transparent 100%)',
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
        accentSoft: 'rgba(37, 99, 235, 0.08)',
        topStrip: 'linear-gradient(90deg, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0.04) 58%, transparent 100%)',
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
  const hasNavRestrictions = Array.isArray(allowedNavKeys);
  const allowedNavSet = new Set(hasNavRestrictions ? allowedNavKeys : []);
  const canOpenControlPlane = !hasNavRestrictions || allowedNavSet.has('control-plane');
  const canOpenSettingsWorkspace = (
    !hasNavRestrictions
    || allowedNavSet.has(SETTINGS_WORKSPACE_NAV_KEY)
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
        { key: 'chat', label: tr('nav.chat', 'Чаты'), icon: <ChannelBrandIcon channel="omnichannel" />, path: '/chat' },
        { key: 'ai-chat', label: tr('nav.aiChat', 'AI чат CRM'), icon: <RobotOutlined />, path: '/ai-chat' },
        { key: 'calls', label: tr('nav.calls', 'Звонки'), icon: <ChannelBrandIcon channel="calls" />, path: '/calls' },
        { key: 'reminders', label: tr('nav.reminders', 'Напоминания'), icon: <ClockCircleOutlined />, path: '/reminders' },
        { key: 'massmail', label: tr('nav.massmail', 'Массовые рассылки'), icon: <ChannelBrandIcon channel="massmail" />, path: '/massmail' },
        { key: 'memos', label: tr('nav.memos', 'Заметки'), icon: <FileTextOutlined />, path: '/memos' },
      ],
    },
    {
      key: 'marketing-group',
      label: tr('nav.marketingGroup', 'Маркетинг'),
      children: [
        { key: 'marketing-workspace', label: tr('nav.marketingGroup', 'Маркетинг'), icon: <CustomerServiceOutlined />, path: '/content-plans' },
      ],
    },
    {
      key: 'operations-group',
      label: tr('nav.operationsGroup', 'Операции'),
      children: [
        { key: 'payments', label: tr('nav.payments', 'Платежи'), icon: <DollarOutlined />, path: '/payments' },
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
        { key: 'control-plane', label: tr('nav.licenseWorkspace', 'License Workspace'), icon: <ApiOutlined />, path: '/license-workspace' },
        { key: 'reference-data', label: tr('nav.referenceData', 'Справочники'), icon: <AppstoreOutlined />, path: '/reference-data' },
        { key: 'landing-builder', label: tr('nav.landingBuilder', 'Конструктор лендингов'), icon: <AppstoreOutlined />, path: '/landing-builder' },
        { key: 'sites-workspace', label: tr('nav.sitesWorkspace', 'Сайты'), icon: <GlobalOutlined />, path: '/sites' },
        { key: 'users', label: tr('nav.users', 'Пользователи'), icon: <UserOutlined />, path: '/users' },
        { key: 'help-center', label: tr('nav.helpCenter', 'Справка'), icon: <QuestionCircleOutlined />, path: '/help' },
      ],
    },
  ];
  const visibleNav = hasNavRestrictions
    ? baseNav
      .map((item) => {
        const children = Array.isArray(item.children)
          ? item.children.filter((child) => {
              if (allowedNavKeys.includes(child.key)) return true;
              if (child.key !== 'massmail') return false;
              return (
                allowedNavKeys.includes('crm-emails')
                || allowedNavKeys.includes('massmail')
                || allowedNavKeys.includes('sms-center')
              );
            })
          : [];
        return children.length ? { ...item, children } : null;
      })
      .filter(Boolean)
    : baseNav;
  const isNavKeyAllowed = (key) => !hasNavRestrictions || allowedNavSet.has(key);

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
    if (normalized === 'crm-emails' || normalized === 'sms-center') return 'massmail';
    if (normalized.startsWith('campaigns')) return 'marketing-workspace';
    if (normalized === 'marketing-segments') return 'marketing-workspace';
    if (normalized === 'marketing-templates') return 'marketing-workspace';
    if (normalized === 'content-plans') return 'marketing-workspace';
    if (normalized.startsWith('memos')) return 'memos';
    if (normalized.startsWith('warehouse')) return 'warehouse';
    if (normalized.startsWith('finance-planning')) return 'finance-planning';
    if (normalized.startsWith('meetings')) return 'meetings';
    if (normalized === 'documents-workspace') return 'documents-workspace';
    if (normalized === 'backlog') return 'backlog';
    if (normalized === 'sites-workspace') return 'sites-workspace';
    if (normalized === 'functional') return 'functional';
    if (normalized === 'telephony') return 'calls';
    if (normalized === 'license-workspace') return 'control-plane';
    if (normalized === 'settings' || normalized === 'integrations' || normalized === 'onboarding') {
      return SETTINGS_WORKSPACE_NAV_KEY;
    }
    return null;
  };

  const resolveNavKeyFromHash = () => {
    if (typeof window === 'undefined') return null;
    const rawHash = String(window.location.hash || '').replace(/^#/, '');
    const [rawPath = ''] = rawHash.split('?');
    const segments = rawPath.split('/').filter(Boolean);
    const section = segments[0] || '';
    if (!section) return null;

    if (section === 'marketing') {
      return 'marketing-workspace';
    }
    if (section === 'chat') return 'chat';
    if (section === 'calls') return 'calls';
    if (section === 'warehouse') return 'warehouse';
    if (section === 'documents') return 'documents-workspace';
    if (section === 'content-plans' || section === 'campaigns') return 'marketing-workspace';
    if (section === 'backlog') return 'backlog';
    if (section === 'sites') return 'sites-workspace';
    if (section === 'functional') return 'functional';
    if (section === 'sms' || section === 'crm-emails' || section === 'massmail') return 'massmail';
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
      'telephony',
      'users',
      'landing-builder',
      'profile',
    ]);

    return directSections.has(section) ? section : null;
  };

  const routeDerivedKey = resolveNavKeyFromRouteName(routeName);
  const hashDerivedKey = resolveNavKeyFromHash();
  const effectiveSelectedKey = selectedKey || routeDerivedKey || hashDerivedKey;
  const flatNavEntries = visibleNav.flatMap((group) => (
    Array.isArray(group.children)
      ? group.children.map((child) => ({
          ...child,
          groupKey: group.key,
          groupLabel: group.label,
        }))
      : []
  ));
  const activeNavEntry = flatNavEntries.find((entry) => entry.key === effectiveSelectedKey)
    || flatNavEntries.find((entry) => entry.key === selectedKey)
    || null;
  const workspaceCandidates = [
    {
      value: 'sales',
      label: tr('appLayout.workspace.sales', 'Продажи'),
      path: '/dashboard',
      routeKeys: ['dashboard', 'leads', 'contacts', 'companies', 'deals', 'tasks', 'projects', 'products'],
    },
    {
      value: 'communications',
      label: tr('appLayout.workspace.communications', 'Коммуникации'),
      path: '/chat',
      routeKeys: ['chat', 'ai-chat', 'calls', 'reminders', 'crm-emails', 'massmail', 'sms-center', 'memos'],
    },
    {
      value: 'marketing',
      label: tr('appLayout.workspace.marketing', 'Маркетинг'),
      path: '/content-plans',
      routeKeys: ['marketing-workspace'],
    },
    {
      value: 'operations',
      label: tr('appLayout.workspace.operations', 'Операции'),
      path: '/payments',
      routeKeys: [
        'payments',
        'operations',
        'clients-workspace',
        'warehouse',
        'finance-planning',
        'business-processes',
        'meetings',
      ],
    },
    {
      value: 'system',
      label: tr('appLayout.workspace.system', 'Система'),
      path: settingsWorkspacePath,
      routeKeys: [
        SETTINGS_WORKSPACE_NAV_KEY,
        'control-plane',
        'reference-data',
        'landing-builder',
        'sites-workspace',
        'users',
        'help-center',
      ],
    },
  ];
  const workspaceOptions = workspaceCandidates
    .map((workspace) => ({
      ...workspace,
      routeKeys: workspace.routeKeys.filter((key) => isNavKeyAllowed(key)),
    }))
    .filter((workspace) => workspace.routeKeys.length > 0);
  const workspaceKey = selectedKey || activeNavEntry?.key || '';
  const activeWorkspace = workspaceOptions.find((workspace) => (
    workspace.routeKeys.includes(workspaceKey)
  )) || workspaceOptions[0] || null;
  const quickCreateActions = [
    { key: 'lead', navKey: 'leads', icon: <TeamOutlined />, label: tr('nav.newLead', 'Новый лид'), path: '/leads/new' },
    { key: 'contact', navKey: 'contacts', icon: <UserOutlined />, label: tr('nav.newContact', 'Новый контакт'), path: '/contacts/new' },
    { key: 'company', navKey: 'companies', icon: <BankOutlined />, label: tr('nav.newCompany', 'Новая компания'), path: '/companies/new' },
    { key: 'deal', navKey: 'deals', icon: <DollarOutlined />, label: tr('nav.newDeal', 'Новая сделка'), path: '/deals/new' },
    { key: 'task', navKey: 'tasks', icon: <CheckSquareOutlined />, label: tr('nav.newTask', 'Новая задача'), path: '/tasks/new' },
    { key: 'campaign', navKey: 'campaigns', icon: <CustomerServiceOutlined />, label: tr('nav.newCampaign', 'Новая кампания'), path: '/campaigns/new' },
  ].filter((action) => isNavKeyAllowed(action.navKey));
  const quickCreateMenuItems = quickCreateActions.map((action) => ({
    key: action.key,
    icon: action.icon,
    label: action.label,
    onClick: () => navigate(action.path),
  }));
  const quickCreateLabel = tr('appLayout.quickCreate', tr('actions.create', 'Создать'));
  const globalSearchPlaceholder = tr('actions.search', 'Поиск');
  const normalizeListResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    return [];
  };
  const toIdentityLabel = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };
  const searchableProviders = useMemo(() => {
    const mk = (item) => ({
      ...item,
      enabled: isNavKeyAllowed(item.navKey) && getRouteAccessState(item.routeName).allowed,
    });
    return [
      mk({
        key: 'leads',
        navKey: 'leads',
        routeName: 'leads-list',
        label: tr('nav.leads', 'Лиды'),
        listPath: '/leads',
        fetcher: getLeads,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name) || `${tr('nav.leads', 'Лиды')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.phone), toIdentityLabel(item?.email)].filter(Boolean).join(' • '),
          path: `/leads/${item?.id}`,
        }),
      }),
      mk({
        key: 'contacts',
        navKey: 'contacts',
        routeName: 'contacts-list',
        label: tr('nav.contacts', 'Контакты'),
        listPath: '/contacts',
        fetcher: getContacts,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name)
            || [toIdentityLabel(item?.first_name), toIdentityLabel(item?.last_name)].filter(Boolean).join(' ')
            || `${tr('nav.contacts', 'Контакты')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.phone), toIdentityLabel(item?.email)].filter(Boolean).join(' • '),
          path: `/contacts/${item?.id}`,
        }),
      }),
      mk({
        key: 'companies',
        navKey: 'companies',
        routeName: 'companies-list',
        label: tr('nav.companies', 'Компании'),
        listPath: '/companies',
        fetcher: getCompanies,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name) || `${tr('nav.companies', 'Компании')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.phone), toIdentityLabel(item?.email)].filter(Boolean).join(' • '),
          path: `/companies/${item?.id}`,
        }),
      }),
      mk({
        key: 'deals',
        navKey: 'deals',
        routeName: 'deals-list',
        label: tr('nav.deals', 'Сделки'),
        listPath: '/deals',
        fetcher: getDeals,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name) || `${tr('nav.deals', 'Сделки')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.company_name), toIdentityLabel(item?.status)].filter(Boolean).join(' • '),
          path: `/deals/${item?.id}`,
        }),
      }),
      mk({
        key: 'tasks',
        navKey: 'tasks',
        routeName: 'tasks-list',
        label: tr('nav.tasks', 'Задачи'),
        listPath: '/tasks',
        fetcher: getTasks,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.title) || `${tr('nav.tasks', 'Задачи')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.status), toIdentityLabel(item?.priority)].filter(Boolean).join(' • '),
          path: `/tasks/${item?.id}`,
        }),
      }),
      mk({
        key: 'projects',
        navKey: 'projects',
        routeName: 'projects-list',
        label: tr('nav.projects', 'Проекты'),
        listPath: '/projects',
        fetcher: getProjects,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name) || `${tr('nav.projects', 'Проекты')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.status), toIdentityLabel(item?.owner_name)].filter(Boolean).join(' • '),
          path: `/projects/${item?.id}`,
        }),
      }),
      mk({
        key: 'products',
        navKey: 'products',
        routeName: 'products-list',
        label: tr('nav.products', 'Продукты'),
        listPath: '/products',
        fetcher: getProducts,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.name) || `${tr('nav.products', 'Продукты')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.sku), toIdentityLabel(item?.price)].filter(Boolean).join(' • '),
          path: `/products/${item?.id}`,
        }),
      }),
      mk({
        key: 'payments',
        navKey: 'payments',
        routeName: 'payments-list',
        label: tr('nav.payments', 'Платежи'),
        listPath: '/payments',
        fetcher: getPayments,
        mapItem: (item) => ({
          title: `${tr('nav.payments', 'Платежи')} #${item?.id ?? ''}`,
          subtitle: [toIdentityLabel(item?.amount), toIdentityLabel(item?.status)].filter(Boolean).join(' • '),
          path: `/payments/${item?.id}`,
        }),
      }),
      mk({
        key: 'memos',
        navKey: 'memos',
        routeName: 'memos-list',
        label: tr('nav.memos', 'Заметки'),
        listPath: '/memos',
        fetcher: getMemos,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.subject) || toIdentityLabel(item?.title) || `${tr('nav.memos', 'Заметки')} #${item?.id ?? ''}`,
          subtitle: toIdentityLabel(item?.stage),
          path: `/memos/${item?.id}`,
        }),
      }),
      mk({
        key: 'reminders',
        navKey: 'reminders',
        routeName: 'reminders-list',
        label: tr('nav.reminders', 'Напоминания'),
        listPath: '/reminders',
        fetcher: getReminders,
        mapItem: (item) => ({
          title: toIdentityLabel(item?.subject) || `${tr('nav.reminders', 'Напоминания')} #${item?.id ?? ''}`,
          subtitle: toIdentityLabel(item?.reminder_date),
          path: `/reminders/${item?.id}`,
        }),
      }),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedNavKeys, routeName, selectedKey, locale]);
  const fallbackGlobalSearchPath = (
    searchableProviders.find((provider) => provider.enabled && provider.navKey === (activeNavEntry?.key || ''))?.listPath
    || searchableProviders.find((provider) => provider.enabled)?.listPath
    || '/dashboard'
  );
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
    sms: 'sms',
    telephony: 'telephony',
    whatsapp: 'whatsapp',
    facebook: 'facebook',
    instagram: 'instagram',
    telegram: 'telegram',
    ai: 'ai',
  };
  const hasActiveTelephony = Array.isArray(activeIntegrations)
    && activeIntegrations.some((integration) => integration?.key === 'telephony');
  const displayName = (() => {
    const toStr = (value) => (value === null || value === undefined ? '' : String(value).trim());
    const pick = (...values) => values.map(toStr).find(Boolean) || '';
    const profile = user?.profile && typeof user.profile === 'object' ? user.profile : {};
    const userProfile = user?.userprofile && typeof user.userprofile === 'object' ? user.userprofile : {};
    const nestedUser = user?.user && typeof user.user === 'object' ? user.user : {};
    const firstName = pick(
      user?.first_name,
      user?.firstName,
      profile?.first_name,
      profile?.firstName,
      nestedUser?.first_name,
      nestedUser?.firstName
    );
    const lastName = pick(
      user?.last_name,
      user?.lastName,
      profile?.last_name,
      profile?.lastName,
      nestedUser?.last_name,
      nestedUser?.lastName
    );
    const middleName = pick(
      user?.middle_name,
      user?.middleName,
      user?.patronymic,
      user?.father_name,
      profile?.middle_name,
      profile?.middleName,
      profile?.patronymic,
      nestedUser?.middle_name,
      nestedUser?.middleName,
      nestedUser?.patronymic
    );
    const fioName = [lastName, firstName, middleName].filter(Boolean).join(' ');
    const firstAndLastName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const fullName = pick(
      user?.full_name,
      user?.fullName,
      profile?.full_name,
      profile?.fullName,
      userProfile?.full_name,
      userProfile?.fullName,
      nestedUser?.full_name,
      nestedUser?.fullName
    );
    const username = pick(
      user?.username,
      user?.login,
      profile?.username,
      userProfile?.username,
      nestedUser?.username,
      nestedUser?.login
    );
    const email = pick(user?.email, profile?.email, userProfile?.email, nestedUser?.email);
    const normalizedName = pick(
      user?.name,
      user?.display_name,
      user?.displayName,
      profile?.name,
      profile?.display_name,
      nestedUser?.name,
      nestedUser?.display_name
    );
    const genericNames = new Set(['user', 'пользователь', 'foydalanuvchi']);
    const normalizedNameIsGeneric = genericNames.has(normalizedName.toLowerCase());
    const normalizedUsernameIsGeneric = genericNames.has(username.toLowerCase());
    const normalizedFullNameIsGeneric = genericNames.has(fullName.toLowerCase());
    const preferredFullName = normalizedFullNameIsGeneric ? '' : fullName;
    const preferredUsername = normalizedUsernameIsGeneric ? '' : username;
    const safeIdentityLabel = pick(email, preferredUsername);

    return (
      fioName
      || firstAndLastName
      || preferredFullName
      || safeIdentityLabel
      || (!normalizedNameIsGeneric ? normalizedName : '')
      || tr('nav.user', 'Пользователь')
    );
  })();
  const headerDisplayName = (() => {
    const toStr = (value) => (value === null || value === undefined ? '' : String(value).trim());
    const pick = (...values) => values.map(toStr).find(Boolean) || '';
    const profile = user?.profile && typeof user.profile === 'object' ? user.profile : {};
    const userProfile = user?.userprofile && typeof user.userprofile === 'object' ? user.userprofile : {};
    const nestedUser = user?.user && typeof user.user === 'object' ? user.user : {};
    const genericNames = new Set(['user', 'пользователь', 'foydalanuvchi']);

    const firstName = pick(user?.first_name, profile?.first_name, userProfile?.first_name, nestedUser?.first_name);
    const lastName = pick(user?.last_name, profile?.last_name, userProfile?.last_name, nestedUser?.last_name);
    const middleName = pick(user?.middle_name, profile?.middle_name, userProfile?.middle_name, nestedUser?.middle_name);
    const fullName = pick(
      user?.full_name,
      user?.fullName,
      profile?.full_name,
      profile?.fullName,
      userProfile?.full_name,
      userProfile?.fullName,
      nestedUser?.full_name,
      nestedUser?.fullName,
    );
    const fioName = [lastName, firstName, middleName].filter(Boolean).join(' ');
    const firstAndLastName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const username = pick(user?.username, profile?.username, userProfile?.username, nestedUser?.username);
    const email = pick(user?.email, profile?.email, userProfile?.email, nestedUser?.email);

    const candidates = [fioName, firstAndLastName, fullName, username, email];
    for (const value of candidates) {
      const normalized = String(value || '').trim();
      if (!normalized) continue;
      if (genericNames.has(normalized.toLowerCase())) continue;
      return normalized;
    }

    return displayName;
  })();
  const avatarLetter = headerDisplayName.charAt(0).toUpperCase() || 'U';
  const userSecondaryLabel = String(user?.email || user?.username || '').trim();
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
  const showGlobalLicenseBanner = (
    !!licenseRestriction
    && !String(licenseRestriction?.feature || '').trim().toLowerCase().startsWith('marketplace.')
  );

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
    if (!isMobile) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, mobileMenuOpen]);

  const handleWorkspaceChange = (nextWorkspace) => {
    const selectedWorkspace = workspaceOptions.find((workspace) => workspace.value === nextWorkspace);
    if (selectedWorkspace?.path) {
      navigate(selectedWorkspace.path);
    }
  };

  const clearGlobalSearch = () => {
    setGlobalSearchValue('');
    setGlobalSearchOptions([]);
    setGlobalSearchLoading(false);
  };

  const handleGlobalSearch = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return;
    const firstOption = globalSearchOptions[0];
    if (firstOption?.path) {
      navigate(String(firstOption.path));
      clearGlobalSearch();
      return;
    }
    const separator = fallbackGlobalSearchPath.includes('?') ? '&' : '?';
    navigate(`${fallbackGlobalSearchPath}${separator}search=${encodeURIComponent(value)}`);
    clearGlobalSearch();
  };
  const handleGlobalSearchSelect = (_value, option) => {
    const path = option?.path;
    if (!path) return;
    navigate(String(path));
    clearGlobalSearch();
  };

  useEffect(() => {
    const query = String(globalSearchValue || '').trim();
    if (query.length < 2 || isMobile) {
      setGlobalSearchOptions([]);
      setGlobalSearchLoading(false);
      return;
    }

    const requestId = globalSearchRequestRef.current + 1;
    globalSearchRequestRef.current = requestId;
    setGlobalSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      const enabledProviders = searchableProviders.filter((provider) => provider.enabled);
      if (enabledProviders.length === 0) {
        if (globalSearchRequestRef.current === requestId) {
          setGlobalSearchOptions([]);
          setGlobalSearchLoading(false);
        }
        return;
      }

      const results = await Promise.all(enabledProviders.map(async (provider) => {
        try {
          const response = await provider.fetcher({ search: query, page_size: 3 });
          const list = normalizeListResponse(response);
          return list
            .slice(0, 3)
            .map((item) => provider.mapItem(item))
            .filter((item) => item?.path && item?.title)
            .map((item) => ({
              value: item.title,
              path: item.path,
              label: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text strong style={{ lineHeight: 1.2 }}>{item.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
                    {provider.label}{item.subtitle ? ` • ${item.subtitle}` : ''}
                  </Text>
                </div>
              ),
            }));
        } catch {
          return [];
        }
      }));

      if (globalSearchRequestRef.current !== requestId) return;
      setGlobalSearchOptions(results.flat());
      setGlobalSearchLoading(false);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [globalSearchValue, isMobile, searchableProviders]);

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
      label: (
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>English</span>
          {activeLocale === 'en' ? <CheckOutlined aria-hidden /> : null}
        </Space>
      ),
      onClick: () => onLocaleChange('en'),
    },
    {
      key: 'ru',
      label: (
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>Русский</span>
          {activeLocale === 'ru' ? <CheckOutlined aria-hidden /> : null}
        </Space>
      ),
      onClick: () => onLocaleChange('ru'),
    },
    {
      key: 'uz',
      label: (
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>O'zbekcha</span>
          {activeLocale === 'uz' ? <CheckOutlined aria-hidden /> : null}
        </Space>
      ),
      onClick: () => onLocaleChange('uz'),
    },
  ];

  const themeMenuItems = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: (
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>{tr('nav.themeLight', 'Светлая')}</span>
          {theme === 'light' ? <CheckOutlined aria-hidden /> : null}
        </Space>
      ),
      onClick: () => {
        if (theme !== 'light') toggleTheme();
      },
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: (
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>{tr('nav.themeDark', 'Темная')}</span>
          {theme === 'dark' ? <CheckOutlined aria-hidden /> : null}
        </Space>
      ),
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
  const buildUserSummaryMenuLabel = () => (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
      }}
    >
      <span style={{ fontWeight: 600, color: shell.text }}>{headerDisplayName}</span>
      {userSecondaryLabel ? (
        <span style={{ fontSize: 12, color: shell.textMuted, lineHeight: 1.35 }}>
          {userSecondaryLabel}
        </span>
      ) : null}
    </span>
  );

  const userMenuItems = [
    {
      key: 'user-summary',
      disabled: true,
      label: buildUserSummaryMenuLabel(),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: tr('nav.profile', 'Профиль'),
      onClick: () => navigate('/profile'),
    },
    ...(canOpenSettingsWorkspace
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
      danger: true,
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
            overflow: 'hidden',
            height: '100vh',
            boxSizing: 'border-box',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${shell.border}`,
            background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
            boxShadow: shell.shadowStrong,
          }}
        >
          <div
            style={{
              position: 'relative',
              height: desktopTopBarHeight,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: collapsed ? 0 : '0 16px',
              borderBottom: `1px solid ${shell.border}`,
              background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
            }}
          >
            <div
              style={{
                position: 'absolute',
                insetInline: 0,
                top: 0,
                height: 3,
                background: shell.topStrip,
              }}
            />
            <Space>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                aria-label={tr('nav.dashboard', 'Дашборд')}
                style={{
                  border: 'none',
                  padding: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
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
              </button>
            </Space>
            {!collapsed && (
              <Button
                type="text"
                icon={<MenuFoldOutlined style={{ color: shell.text }} />}
                onClick={onToggleCollapsed}
              />
            )}
          </div>

          <div
            style={{
              height: `calc(100vh - ${desktopTopBarHeight}px)`,
              display: 'flex',
              flexDirection: 'column',
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
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 10px 10px',
                  background: 'transparent',
                }}
              />
            </ConfigProvider>

            {quickCreateMenuItems.length > 0 ? (
              <div
                style={{
                  padding: collapsed ? 10 : 12,
                  borderTop: `1px solid ${shell.border}`,
                  background: theme === 'dark' ? shell.surface : shell.surfaceSolid,
                }}
              >
                <ConfigProvider theme={menuTheme}>
                  <Dropdown menu={{ items: quickCreateMenuItems }} trigger={['click']} placement="topRight">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      block={!collapsed}
                      style={{ borderRadius: 12 }}
                    >
                      {collapsed ? null : quickCreateLabel}
                    </Button>
                  </Dropdown>
                </ConfigProvider>
              </div>
            ) : null}
          </div>
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
        title={(
          <button
            type="button"
            onClick={() => {
              navigate('/dashboard');
              setMobileMenuOpen(false);
            }}
            aria-label={tr('nav.dashboard', 'Дашборд')}
            style={{
              border: 'none',
              padding: 0,
              background: 'transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Space align="center" size={10}>
              <Avatar
                style={{
                  backgroundColor: shell.surfaceElevated,
                  color: shell.text,
                  border: `1px solid ${shell.border}`,
                }}
                src={brandMark}
              />
              <Text strong style={{ color: shell.text }}>Enterprise CRM</Text>
            </Space>
          </button>
        )}
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ConfigProvider theme={menuTheme}>
            <Menu
              theme={theme === 'dark' ? 'dark' : 'light'}
              mode="inline"
              selectedKeys={[effectiveSelectedKey]}
              items={menuItems}
              style={{
                borderRight: 0,
                flex: 1,
                overflowY: 'auto',
                padding: '12px 10px 12px',
                background: 'transparent',
              }}
            />
          </ConfigProvider>
          {quickCreateMenuItems.length > 0 ? (
            <div style={{ padding: 12, borderTop: `1px solid ${shell.border}` }}>
              <ConfigProvider theme={menuTheme}>
                <Dropdown menu={{ items: quickCreateMenuItems }} trigger={['click']} placement="topCenter">
                  <Button type="primary" icon={<PlusOutlined />} block>
                    {quickCreateLabel}
                  </Button>
                </Dropdown>
              </ConfigProvider>
            </div>
          ) : null}
        </div>
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
              : '0 18px',
            height: isMobile ? mobileTopBarHeight : desktopTopBarHeight,
            boxSizing: 'border-box',
            lineHeight: 'normal',
            background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
            borderBottom: `1px solid ${shell.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 900,
            boxShadow: shell.shadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              insetInline: 0,
              top: 0,
              height: 3,
              background: shell.topStrip,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, width: '100%' }}>
            <Space align="center" size={8} style={{ minWidth: 0 }}>
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                />
              )}
              {!isMobile && collapsed && (
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={onToggleCollapsed}
                />
              )}

            </Space>

            {!isMobile && (
              <AutoComplete
                value={globalSearchValue}
                options={globalSearchOptions}
                onSelect={handleGlobalSearchSelect}
                onChange={setGlobalSearchValue}
                open={String(globalSearchValue || '').trim().length >= 2 && (globalSearchLoading || globalSearchOptions.length > 0)}
                notFoundContent={globalSearchLoading ? <LoadingOutlined /> : null}
                style={{
                  flex: 1,
                  maxWidth: 390,
                  marginInlineStart: 8,
                }}
              >
                <Input
                  allowClear
                  value={globalSearchValue}
                  onChange={(event) => setGlobalSearchValue(event.target.value)}
                  onPressEnter={(event) => handleGlobalSearch(event.target.value)}
                  prefix={globalSearchLoading ? <LoadingOutlined style={{ color: shell.textMuted }} /> : <SearchOutlined style={{ color: shell.textMuted }} />}
                  placeholder={globalSearchPlaceholder}
                  style={{
                    borderRadius: 999,
                  }}
                />
              </AutoComplete>
            )}

            <Space size={isMobile ? 6 : 8} align="center" style={{ marginInlineStart: 'auto' }}>
              {!isMobile && activeWorkspace ? (
                <Select
                  value={activeWorkspace.value}
                  onChange={handleWorkspaceChange}
                  popupMatchSelectWidth={false}
                  className="workspace-switcher"
                  popupClassName="workspace-switcher-dropdown"
                  options={workspaceOptions.map((workspace) => ({
                    value: workspace.value,
                    label: workspace.label,
                  }))}
                  style={{ minWidth: 160 }}
                />
              ) : null}

              {quickCreateMenuItems.length > 0 ? (
                <ConfigProvider theme={menuTheme}>
                  <Dropdown menu={{ items: quickCreateMenuItems }} trigger={['click']} placement="bottomRight">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      {isMobile ? null : quickCreateLabel}
                    </Button>
                  </Dropdown>
                </ConfigProvider>
              ) : null}

              {hasActiveTelephony && (
                <Badge count={incomingCallsCount} size="small">
                  <Button
                    size={isMobile ? 'small' : 'middle'}
                    icon={<ChannelBrandIcon channel="telephony" size={16} />}
                    aria-label={tr('appLayout.actions.openDialer', 'Открыть набор номера')}
                    onClick={onOpenDialer}
                  />
                </Badge>
              )}

              <Badge count={unreadCount} size="small">
                <Button
                  size={isMobile ? 'small' : 'middle'}
                  icon={<BellOutlined />}
                  aria-label={tr('appLayout.actions.notifications', 'Уведомления')}
                />
              </Badge>

              <ConfigProvider theme={menuTheme}>
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottom"
                  trigger={['click']}
                  arrow={{ pointAtCenter: true }}
                  overlayStyle={{ minWidth: 280 }}
                >
                  <Space
                    align="center"
                    style={{
                      cursor: 'pointer',
                      padding: isMobile ? '6px 8px' : '8px 12px',
                      borderRadius: 999,
                      border: `1px solid ${theme === 'dark' ? shell.accentBorder : shell.border}`,
                      background: theme === 'dark' ? shell.surfaceSolid : shell.surface,
                      boxShadow: shell.shadow,
                    }}
                  >
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

                    {!isMobile && Array.isArray(activeIntegrations) && activeIntegrations.length > 0 && (
                      <Space size={8} align="center">
                        {activeIntegrations.map((integration) => {
                          const iconKey = integrationIconMap[integration.key];
                          if (!iconKey) return null;
                          return (
                            <Tooltip
                              key={integration.key}
                              title={integrationLabelMap[integration.key] || integration.key}
                            >
                              <Space size={4} align="center">
                                {iconKey === 'ai' ? (
                                  <RobotOutlined style={{ color: shell.textMuted }} />
                                ) : (
                                  <ChannelBrandIcon channel={iconKey} size={14} />
                                )}
                                <Badge status={integration.status || 'success'} />
                              </Space>
                            </Tooltip>
                          );
                        })}
                      </Space>
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
                    {!isMobile && <Text style={{ color: shell.text, fontWeight: 500 }}>{headerDisplayName}</Text>}
                    <DownOutlined style={{ color: shell.textMuted, fontSize: 12 }} aria-hidden />
                  </Space>
                </Dropdown>
              </ConfigProvider>
            </Space>
          </div>
        </Header>

        <Content
          style={{
            margin: isMobile ? '12px clamp(10px, 3vw, 14px) calc(12px + env(safe-area-inset-bottom))' : '20px',
            minHeight: 280,
            overflowX: 'hidden',
            maxWidth: '100%',
            background: theme === 'dark' ? shell.surfaceSolid : 'transparent',
            borderRadius: theme === 'dark' ? 24 : 0,
          }}
        >
          {showGlobalLicenseBanner ? (
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
                message={(
                  <Text strong style={{ color: licenseShell.title }}>
                    {licenseRestrictionCopy.message}
                  </Text>
                )}
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
                      <Button size="small" type="primary" onClick={() => navigate('/license-workspace')}>
                        {t('license.banner.openLicenseWorkspace', 'Open License Workspace')}
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
