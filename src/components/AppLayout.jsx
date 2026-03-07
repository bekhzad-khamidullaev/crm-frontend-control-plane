import {
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    CheckSquareOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DisconnectOutlined,
    DollarOutlined,
    FileTextOutlined,
    FolderOutlined,
    LogoutOutlined,
    MailOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    MoonOutlined,
    PhoneOutlined,
    QuestionCircleOutlined,
    SettingOutlined,
    SunOutlined,
    TeamOutlined,
    UserOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, ConfigProvider, Drawer, Dropdown, Grid, Layout, Menu, Space, Switch, Typography } from 'antd';
import { useEffect, useState } from 'react';
import brandMark from '../assets/brand/favicon.svg';
import brandLogo from '../assets/brand/logo.svg';
import brandLogoDark from '../assets/brand/logo-dark.svg';
import { useTheme } from '../lib/hooks/useTheme.js';
import { t } from '../lib/i18n/index.js';
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
  wsConnected,
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
  // Build nav labels at render time so they react to locale changes.
  const baseNav = [
    {
      key: 'sales-group',
      label: 'Продажи',
      children: [
        { key: 'dashboard', label: t('nav.dashboard') || 'Dashboard', icon: <BarChartOutlined />, path: '/dashboard' },
        { key: 'leads', label: t('nav.leads') || 'Leads', icon: <TeamOutlined />, path: '/leads' },
        { key: 'contacts', label: t('nav.contacts') || 'Контакты', icon: <UserOutlined />, path: '/contacts' },
        { key: 'companies', label: t('nav.companies') || 'Компании', icon: <BankOutlined />, path: '/companies' },
        { key: 'deals', label: t('nav.deals') || 'Сделки', icon: <DollarOutlined />, path: '/deals' },
        { key: 'tasks', label: t('nav.tasks') || 'Задачи', icon: <CheckSquareOutlined />, path: '/tasks' },
        { key: 'projects', label: t('nav.projects') || 'Проекты', icon: <FolderOutlined />, path: '/projects' },
        { key: 'products', label: t('nav.products') || 'Продукты', icon: <AppstoreOutlined />, path: '/products' },
      ],
    },
    {
      key: 'communications-group',
      label: 'Коммуникации',
      children: [
        { key: 'chat', label: t('nav.chat') || 'Чат', icon: <MessageOutlined />, path: '/chat' },
        { key: 'calls', label: t('nav.calls') || 'Звонки', icon: <PhoneOutlined />, path: '/calls' },
        { key: 'reminders', label: t('nav.reminders') || 'Напоминания', icon: <ClockCircleOutlined />, path: '/reminders' },
        { key: 'crm-emails', label: t('nav.crmEmails') || 'Emails', icon: <MailOutlined />, path: '/crm-emails' },
        { key: 'massmail', label: t('nav.massmail') || 'Massmail', icon: <FileTextOutlined />, path: '/massmail' },
        { key: 'sms-center', label: t('nav.smsCenter') || 'SMS', icon: <MessageOutlined />, path: '/sms' },
        { key: 'memos', label: t('nav.memos') || 'Заметки', icon: <FileTextOutlined />, path: '/memos' },
      ],
    },
    {
      key: 'marketing-group',
      label: 'Маркетинг',
      children: [
        { key: 'campaigns', label: t('nav.campaigns') || 'Кампании', icon: <CustomerServiceOutlined />, path: '/campaigns' },
        { key: 'segments', label: t('nav.segments') || 'Сегменты', icon: <TeamOutlined />, path: '/marketing/segments' },
        { key: 'templates', label: t('nav.templates') || 'Шаблоны', icon: <FileTextOutlined />, path: '/marketing/templates' },
        { key: 'analytics', label: t('nav.analytics') || 'Аналитика', icon: <BarChartOutlined />, path: '/analytics' },
      ],
    },
    {
      key: 'operations-group',
      label: 'Операции',
      children: [
        { key: 'payments', label: t('nav.payments') || 'Платежи', icon: <DollarOutlined />, path: '/payments' },
        { key: 'integrations', label: t('nav.integrations') || 'Интеграции', icon: <SettingOutlined />, path: '/integrations' },
        { key: 'telephony', label: t('nav.telephony') || 'Телефония', icon: <PhoneOutlined />, path: '/telephony' },
        { key: 'operations', label: t('nav.operations') || 'Операции', icon: <SettingOutlined />, path: '/operations' },
      ],
    },
    {
      key: 'system-group',
      label: 'Система',
      children: [
        { key: 'settings', label: t('nav.settings') || 'Настройки', icon: <SettingOutlined />, path: '/settings' },
        { key: 'reference-data', label: t('nav.referenceData') || 'Справочники', icon: <AppstoreOutlined />, path: '/reference-data' },
        { key: 'landing-builder', label: t('nav.landingBuilder') || 'Landing Builder', icon: <AppstoreOutlined />, path: '/landing-builder' },
        { key: 'users', label: t('nav.users') || 'Пользователи', icon: <UserOutlined />, path: '/users' },
        { key: 'help-center', label: t('nav.helpCenter') || 'Справка', icon: <QuestionCircleOutlined />, path: '/help' },
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

  const selectedNavLabel = findNavLabel(baseNav, selectedKey) || t('nav.dashboard') || 'Dashboard';

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
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выход',
      onClick: onLogout,
    },
  ];

  // Locale dropdown menu items
  const localeMenuItems = [
    {
      key: 'en',
      label: 'English',
      onClick: () => onLocaleChange('en'),
    },
    {
      key: 'ru',
      label: 'Русский',
      onClick: () => onLocaleChange('ru'),
    },
    {
      key: 'uz',
      label: "O'zbekcha",
      onClick: () => onLocaleChange('uz'),
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
            {/* Theme Toggle */}
            <Space size="small">
              {!isMobile && <SunOutlined style={{ color: theme === 'light' ? '#1890ff' : '#999' }} />}
              <Switch checked={theme === 'dark'} onChange={toggleTheme} size="small" />
              {!isMobile && <MoonOutlined style={{ color: theme === 'dark' ? '#1890ff' : '#999' }} />}
            </Space>

            {/* Locale Selector */}
            <Dropdown menu={{ items: localeMenuItems }} placement="bottomRight">
              <Button size={isMobile ? 'small' : 'middle'}>{locale.toUpperCase()}</Button>
            </Dropdown>

            {/* User Menu */}
            <Button
              size={isMobile ? 'small' : 'middle'}
              icon={<PhoneOutlined />}
              onClick={onOpenDialer}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Badge dot={wsConnected} color={wsConnected ? 'green' : 'red'}>
                  {wsConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                </Badge>
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
