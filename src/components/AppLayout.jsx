import {
    ApiOutlined,
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    CheckSquareOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DisconnectOutlined,
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
    TeamOutlined,
    UserOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, ConfigProvider, Drawer, Dropdown, Grid, Layout, Menu, Space, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import brandMark from '../assets/brand/favicon.svg';
import brandLogo from '../assets/brand/logo.svg';
import brandLogoDark from '../assets/brand/logo-dark.svg';
import { useTheme } from '../lib/hooks/useTheme.js';
import { getLocale, t } from '../lib/i18n/index.js';
import { navigate } from '../router.js';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export function AppLayout({
  collapsed,
  onToggleCollapsed,
  locale,
  onLocaleChange,
  selectedKey,
  user,
  frontendVersion,
  wsConnected,
  wsReconnecting,
  activeIntegrations,
  incomingCallsCount,
  unreadCount,
  allowedNavKeys,
  onOpenDialer,
  onLogout,
  children,
}) {
  const { theme, toggleTheme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const siderWidth = 256;
  const drawerWidth = screens.sm ? 300 : '86vw';
  const tr = (key, fallback) => {
    const localized = t(key);
    return localized === key ? fallback : localized;
  };
  const i18nLocale = getLocale();
  const activeLocale = i18nLocale === 'ru' || i18nLocale === 'en' || i18nLocale === 'uz'
    ? i18nLocale
    : locale;
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
        { key: 'integrations', label: tr('nav.integrations', 'Интеграции'), icon: <SettingOutlined />, path: '/integrations' },
        { key: 'telephony', label: tr('nav.telephony', 'Телефония'), icon: <PhoneOutlined />, path: '/telephony' },
        { key: 'operations', label: tr('nav.operations', 'Операции'), icon: <SettingOutlined />, path: '/operations' },
      ],
    },
    {
      key: 'system-group',
      label: tr('nav.systemGroup', 'Система'),
      children: [
        { key: 'settings', label: tr('nav.settings', 'Настройки'), icon: <SettingOutlined />, path: '/settings' },
        { key: 'reference-data', label: tr('nav.referenceData', 'Справочники'), icon: <AppstoreOutlined />, path: '/reference-data' },
        { key: 'landing-builder', label: tr('nav.landingBuilder', 'Конструктор лендингов'), icon: <AppstoreOutlined />, path: '/landing-builder' },
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

  const selectedNavLabel = findNavLabel(baseNav, selectedKey) || tr('nav.dashboard', 'Дашборд');
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
    setMobileMenuOpen(false);
  }, [selectedKey, isMobile]);

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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: tr('nav.profile', 'Профиль'),
      onClick: () => navigate('/profile'),
    },
    ...(Array.isArray(allowedNavKeys) && allowedNavKeys.includes('settings')
      ? [{
          key: 'settings',
          icon: <SettingOutlined />,
          label: tr('nav.settings', 'Настройки'),
          onClick: () => navigate('/settings'),
        }]
      : []),
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: `${tr('nav.language', 'Язык')} (${activeLocale.toUpperCase()})`,
      children: localeMenuItems,
    },
    {
      key: 'theme',
      icon: theme === 'dark' ? <MoonOutlined /> : <SunOutlined />,
      label: `${tr('nav.theme', 'Тема')} (${theme === 'dark' ? tr('nav.themeDark', 'Темная') : tr('nav.themeLight', 'Светлая')})`,
      children: themeMenuItems,
    },
    ...(userIsAdmin
      ? [{
          key: 'system-version',
          icon: <ApiOutlined />,
          disabled: true,
          label: [
            tr('nav.version', 'Версия CRM'),
            frontendVersionText ? `FE ${frontendVersionText}` : 'FE —',
            backendVersion ? `BE ${backendVersion}` : 'BE —',
          ].join(' | '),
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
    <Layout style={{ minHeight: '100dvh' }}>
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
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
          background: theme === 'dark' ? '#161b22' : '#ffffff',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 16px',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
          }}
        >
          <Space>
            {collapsed ? (
              <Avatar
                style={{
                  backgroundColor: theme === 'dark' ? '#2d3343' : '#f1f5f9',
                  color: theme === 'dark' ? '#f1f5f9' : '#09090b',
                  verticalAlign: 'middle',
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
              icon={<MenuFoldOutlined style={{ color: theme === 'dark' ? '#f1f5f9' : '#09090b' }} />}
              onClick={onToggleCollapsed}
            />
          )}
        </div>

        <ConfigProvider
          theme={{
            components: {
              Menu: theme === 'dark' ? {
                darkItemBg: '#161b22',
                darkSubMenuItemBg: '#161b22',
                darkItemColor: '#cbd5e1',
                darkItemHoverColor: '#ffffff',
                darkItemSelectedColor: '#ffffff',
                darkItemSelectedBg: '#2d3343',
                darkItemHoverBg: '#1e232e',
              } : {
                itemBg: '#ffffff',
                itemColor: '#52525b',
                itemHoverColor: '#09090b',
                itemSelectedColor: '#09090b',
                itemSelectedBg: '#f4f4f5',
                itemHoverBg: '#f4f4f5',
              },
            },
          }}
        >
          <Menu
            theme={theme === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ borderRight: 0, height: 'calc(100vh - 64px)', overflowY: 'auto', paddingBottom: 16 }}
          />
        </ConfigProvider>
      </Sider>
      )}

      <Drawer
        placement="left"
        width={drawerWidth}
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{
          header: {
            background: theme === 'dark' ? '#161b22' : '#ffffff',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
            paddingTop: 'env(safe-area-inset-top)',
          },
          body: {
            background: theme === 'dark' ? '#161b22' : '#ffffff',
            padding: 0,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: theme === 'dark'
                ? {
                  darkItemBg: '#161b22',
                  darkSubMenuItemBg: '#161b22',
                  darkItemColor: '#cbd5e1',
                  darkItemHoverColor: '#ffffff',
                  darkItemSelectedColor: '#ffffff',
                  darkItemSelectedBg: '#2d3343',
                  darkItemHoverBg: '#1e232e',
                }
                : {
                  itemBg: '#ffffff',
                  itemColor: '#52525b',
                  itemHoverColor: '#09090b',
                  itemSelectedColor: '#09090b',
                  itemSelectedBg: '#f4f4f5',
                  itemHoverBg: '#f4f4f5',
                },
            },
          }}
        >
          <Menu
            theme={theme === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ borderRight: 0, height: '100%', overflowY: 'auto', paddingBottom: 16 }}
          />
        </ConfigProvider>
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : siderWidth), transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: isMobile
              ? '0 calc(12px + env(safe-area-inset-right)) 0 calc(12px + env(safe-area-inset-left))'
              : '0 24px',
            background: theme === 'dark' ? '#161b22' : '#ffffff',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            boxShadow: theme === 'dark' ? '0 1px 4px rgba(0,0,0,.5)' : '0 1px 4px rgba(0,0,0,.08)',
          }}
        >
          <Space>
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
            <Text type="secondary" ellipsis style={{ maxWidth: isMobile ? 160 : 'none' }}>
              {selectedNavLabel}
            </Text>
          </Space>

          <Space size={isMobile ? 'small' : 'middle'} wrap={false}>
            {/* User Menu */}
            {hasActiveTelephony && (
              <Button
                size={isMobile ? 'small' : 'middle'}
                icon={<PhoneOutlined />}
                onClick={onOpenDialer}
              />
            )}

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Space size={6}>
                  {wsIndicatorStatus === 'error'
                    ? <DisconnectOutlined style={{ color: theme === 'dark' ? '#cbd5e1' : '#52525b' }} />
                    : <ApiOutlined style={{ color: theme === 'dark' ? '#cbd5e1' : '#52525b' }} />}
                  <Badge status={wsIndicatorStatus} />
                </Space>
                {Array.isArray(activeIntegrations) && activeIntegrations.length > 0 && (
                  <Space size={8}>
                    {activeIntegrations.map((integration) => {
                      const IconComponent = integrationIconMap[integration.key];
                      if (!IconComponent) return null;
                      return (
                        <Tooltip
                          key={integration.key}
                          title={integrationLabelMap[integration.key] || integration.key}
                        >
                          <Space size={4}>
                            <IconComponent style={{ color: theme === 'dark' ? '#cbd5e1' : '#52525b' }} />
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
                <Avatar size="small">{(user?.name || user?.username || 'U').charAt(0).toUpperCase()}</Avatar>
                {!isMobile && <Text>{user?.name || user?.username || 'User'}</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: isMobile ? '12px clamp(10px, 3vw, 14px) calc(12px + env(safe-area-inset-bottom))' : '24px',
            minHeight: 280,
            overflowX: 'hidden',
            maxWidth: '100%',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
