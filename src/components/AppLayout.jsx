import {
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    CheckSquareOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DashboardOutlined,
    DatabaseOutlined,
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
    ToolOutlined,
    UserOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, ConfigProvider, Drawer, Dropdown, Grid, Layout, Menu, Space, Switch, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTheme } from '../lib/hooks/useTheme.js';
import { t } from '../lib/i18n/index.js';
import { navigate } from '../router.js';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const baseNav = [
  { key: 'dashboard', label: t('nav.dashboard') || 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard' },
  { key: 'leads', label: t('nav.leads') || 'Leads', icon: <TeamOutlined />, path: '/leads' },
  { key: 'contacts', label: t('nav.contacts') || 'Контакты', icon: <UserOutlined />, path: '/contacts' },
  { key: 'companies', label: t('nav.companies') || 'Компании', icon: <BankOutlined />, path: '/companies' },
  { key: 'deals', label: t('nav.deals') || 'Сделки', icon: <DollarOutlined />, path: '/deals' },
  { key: 'tasks', label: t('nav.tasks') || 'Задачи', icon: <CheckSquareOutlined />, path: '/tasks' },
  { key: 'projects', label: t('nav.projects') || 'Проекты', icon: <FolderOutlined />, path: '/projects' },
  { key: 'products', label: 'Продукты', icon: <AppstoreOutlined />, path: '/products' },
  { key: 'chat', label: t('nav.chat') || 'Чат', icon: <MessageOutlined />, path: '/chat' },
  { key: 'calls', label: t('nav.calls') || 'Звонки', icon: <PhoneOutlined />, path: '/calls' },
  { key: 'payments', label: t('nav.payments') || 'Платежи', icon: <DollarOutlined />, path: '/payments' },
  { key: 'reminders', label: t('nav.reminders') || 'Напоминания', icon: <ClockCircleOutlined />, path: '/reminders' },
  { key: 'campaigns', label: t('nav.campaigns') || 'Кампании', icon: <CustomerServiceOutlined />, path: '/campaigns' },
  { key: 'segments', label: 'Сегменты', icon: <TeamOutlined />, path: '/marketing/segments' },
  { key: 'templates', label: 'Шаблоны', icon: <FileTextOutlined />, path: '/marketing/templates' },
  { key: 'memos', label: t('nav.memos') || 'Заметки', icon: <FileTextOutlined />, path: '/memos' },
  { key: 'crm-emails', label: 'Emails', icon: <MailOutlined />, path: '/crm-emails' },
  { key: 'massmail', label: 'Massmail', icon: <MailOutlined />, path: '/massmail' },
  { key: 'sms-center', label: 'SMS', icon: <MessageOutlined />, path: '/sms' },
  { key: 'operations', label: 'Операции', icon: <ToolOutlined />, path: '/operations' },
  { key: 'reference-data', label: 'Справочники', icon: <DatabaseOutlined />, path: '/reference-data' },
  { key: 'analytics', label: 'Аналитика', icon: <BarChartOutlined />, path: '/analytics' },
  { key: 'help-center', label: 'Справка', icon: <QuestionCircleOutlined />, path: '/help' },
  { key: 'telephony', label: 'Телефония', icon: <CustomerServiceOutlined />, path: '/telephony' },
  { key: 'users', label: 'Пользователи', icon: <TeamOutlined />, path: '/users' },
  { key: 'integrations', label: t('nav.integrations') || 'Интеграции', icon: <SettingOutlined />, path: '/integrations' },
];

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
  onLogout,
  children,
}) {
  const { theme, toggleTheme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const siderWidth = 256;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [selectedKey, isMobile]);

  // Convert baseNav to Ant Design Menu items
  const menuItems = baseNav.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => {
      navigate(item.path);
      if (isMobile) {
        setMobileMenuOpen(false);
      }
    },
  }));

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
    <Layout style={{ minHeight: '100vh' }}>
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
            <Avatar
              style={{
                backgroundColor: theme === 'dark' ? '#2d3343' : '#f1f5f9',
                color: theme === 'dark' ? '#f1f5f9' : '#09090b',
                verticalAlign: 'middle',
              }}
              size="large"
            >
              E
            </Avatar>
            {!collapsed && (
              <Text strong style={{ color: theme === 'dark' ? '#f1f5f9' : '#09090b', fontSize: 16 }}>
                Enterprise CRM
              </Text>
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
            style={{ borderRight: 0 }}
          />
        </ConfigProvider>
      </Sider>
      )}

      <Drawer
        placement="left"
        width={siderWidth}
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        bodyStyle={{ padding: 0 }}
        styles={{
          header: {
            background: theme === 'dark' ? '#161b22' : '#ffffff',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
          },
          body: {
            background: theme === 'dark' ? '#161b22' : '#ffffff',
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
            style={{ borderRight: 0 }}
          />
        </ConfigProvider>
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : siderWidth), transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: isMobile ? '0 12px' : '0 24px',
            background: theme === 'dark' ? '#161b22' : '#ffffff',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d3343' : '#e4e4e7'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
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
            <Text type="secondary">{t('nav.dashboard') || 'Dashboard'}</Text>
          </Space>

          <Space size="middle">
            {/* Theme Toggle */}
            <Space>
              <SunOutlined style={{ color: theme === 'light' ? '#1890ff' : '#999' }} />
              <Switch checked={theme === 'dark'} onChange={toggleTheme} size="small" />
              <MoonOutlined style={{ color: theme === 'dark' ? '#1890ff' : '#999' }} />
            </Space>

            {/* Locale Selector */}
            <Dropdown menu={{ items: localeMenuItems }} placement="bottomRight">
              <Button>{locale.toUpperCase()}</Button>
            </Dropdown>

            {/* User Menu */}
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
                <Avatar size="small">{(user?.name || user?.username || 'U').charAt(0).toUpperCase()}</Avatar>
                {!isMobile && <Text>{user?.name || user?.username || 'User'}</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: isMobile ? '12px' : '24px', minHeight: 280, overflowX: 'hidden' }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
