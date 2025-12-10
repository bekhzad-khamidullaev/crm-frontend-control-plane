import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Tooltip, Select, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { setLocale, t, getLocale } from './lib/i18n/index.js';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BarChartOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  FolderOutlined,
  MessageOutlined,
  PhoneOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  WifiOutlined,
  DisconnectOutlined,
  PhoneFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { parseHash, navigate, onRouteChange } from './router.js';
import { subscribe, getIncomingCalls, setWsConnected, setWsReconnecting, addIncomingCall, removeIncomingCall, setChatWsConnected, setChatWsReconnecting, getUnreadCount } from './lib/store/index.js';
import { isAuthenticated, getToken, clearToken, getUserFromToken } from './lib/api/auth.js';
import callsWebSocket from './lib/websocket/CallsWebSocket.js';
import chatWebSocket from './lib/websocket/ChatWebSocket.js';
import IncomingCallModal from './modules/calls/IncomingCallModal.jsx';
import Dashboard from './pages/dashboard.jsx';
import AnalyticsPage from './pages/analytics-page.jsx';
import LoginPage from './pages/login.jsx';
import LeadsList from './modules/leads/LeadsList.jsx';
import LeadForm from './modules/leads/LeadForm.jsx';
import LeadDetail from './modules/leads/LeadDetail.jsx';
import ContactsList from './modules/contacts/ContactsList.jsx';
import ContactForm from './modules/contacts/ContactForm.jsx';
import ContactDetail from './modules/contacts/ContactDetail.jsx';
import CompaniesList from './modules/companies/CompaniesList.jsx';
import CompanyForm from './modules/companies/CompanyForm.jsx';
import CompanyDetail from './modules/companies/CompanyDetail.jsx';
import DealsList from './modules/deals/DealsList.jsx';
import DealForm from './modules/deals/DealForm.jsx';
import DealDetail from './modules/deals/DealDetail.jsx';
import TasksList from './modules/tasks/TasksList.jsx';
import TaskForm from './modules/tasks/TaskForm.jsx';
import TaskDetail from './modules/tasks/TaskDetail.jsx';
import ProjectsList from './modules/projects/ProjectsList.jsx';
import ProjectForm from './modules/projects/ProjectForm.jsx';
import ProjectDetail from './modules/projects/ProjectDetail.jsx';
import CallsList from './modules/calls/CallsList.jsx';
import CallsDashboard from './pages/calls-dashboard.jsx';
import ChatPage from './pages/chat-page.jsx';
import ProfilePage from './pages/profile.jsx';
import SettingsPage from './pages/settings.jsx';
import IntegrationsPage from './pages/integrations.jsx';
import { PaymentsList, PaymentDetail, PaymentForm } from './modules/payments/index.js';
import { RemindersList, ReminderDetail, ReminderForm } from './modules/reminders/index.js';
import { CampaignsList, CampaignDetail, CampaignForm } from './modules/marketing/index.js';
import { MemosList, MemoDetail, MemoForm } from './modules/memos/index.js';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [route, setRoute] = useState(parseHash());
  const [user, setUser] = useState(null);
  const [wsConnected, setWsConnectedState] = useState(false);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [currentIncomingCall, setCurrentIncomingCall] = useState(null);
  const [chatWsConnected, setChatWsConnectedState] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [locale, setLocaleState] = useState('ru');
  const [antdLocale, setAntdLocale] = useState(ruRU);

  useEffect(() => {
    // Initialize locale on mount
    const savedLocale = localStorage.getItem('crm_locale') || 'ru';
    handleLocaleChange(savedLocale);
    
    // Check auth on mount
    const authenticated = isAuthenticated();
    
    if (authenticated) {
      const token = getToken();
      const userInfo = getUserFromToken();
      
      setUser(userInfo || { name: 'User', email: 'user@example.com' });
      
      // Initialize WebSocket connections if we have a token
      if (token) {
        initializeWebSocket(token);
        initializeChatWebSocket(token);
      }
    } else {
      // Not authenticated, redirect to login if not already there
      if (route.name !== 'login') {
        navigate('/login');
      }
    }

    // Subscribe to route changes
    const unsubscribeRoute = onRouteChange((newRoute) => {
      setRoute(newRoute);
      
      // Check auth on every route change
      const authenticated = isAuthenticated();
      
      // If trying to access protected route without authentication
      if (newRoute.name !== 'login' && !authenticated) {
        console.warn('Unauthorized access attempt, redirecting to login');
        navigate('/login');
        return;
      }
      
      // If trying to access login while authenticated, redirect to dashboard
      if (newRoute.name === 'login' && authenticated) {
        navigate('/dashboard');
        return;
      }
    });

    // Subscribe to store changes for incoming calls and chats
    const unsubscribeStore = subscribe((state) => {
      setWsConnectedState(state.telephony.wsConnected);
      setIncomingCalls(state.telephony.incomingCalls);
      setChatWsConnectedState(state.chat.chatWsConnected);
      setUnreadCount(state.chat.unreadCount);
      
      // Show modal for first incoming call
      if (state.telephony.incomingCalls.length > 0) {
        setCurrentIncomingCall(state.telephony.incomingCalls[0]);
      }
    });

    return () => {
      unsubscribeRoute();
      unsubscribeStore();
      callsWebSocket.disconnect();
      chatWebSocket.disconnect();
    };
  }, []);

  const initializeWebSocket = (token) => {
    // Setup event listeners
    callsWebSocket.on('connected', () => {
      console.log('[App] WebSocket connected');
      setWsConnected(true);
    });

    callsWebSocket.on('disconnected', () => {
      console.log('[App] WebSocket disconnected');
      setWsConnected(false);
    });

    callsWebSocket.on('reconnecting', (data) => {
      console.log('[App] WebSocket reconnecting:', data);
      setWsReconnecting(true);
    });

    callsWebSocket.on('incomingCall', (callData) => {
      console.log('[App] Incoming call:', callData);
      addIncomingCall(callData);
    });

    callsWebSocket.on('callEnded', (data) => {
      console.log('[App] Call ended:', data);
      removeIncomingCall(data.callId);
    });

    // Connect to WebSocket
    callsWebSocket.connect(token);
  };

  const initializeChatWebSocket = (token) => {
    // Setup event listeners
    chatWebSocket.on('connected', () => {
      console.log('[App] Chat WebSocket connected');
      setChatWsConnected(true);
    });

    chatWebSocket.on('disconnected', () => {
      console.log('[App] Chat WebSocket disconnected');
      setChatWsConnected(false);
    });

    chatWebSocket.on('reconnecting', (data) => {
      console.log('[App] Chat WebSocket reconnecting:', data);
      setChatWsReconnecting(true);
    });

    // Connect to Chat WebSocket
    chatWebSocket.connect(token);
  };

  const handleLocaleChange = async (lang) => {
    await setLocale(lang);
    setLocaleState(lang);
    localStorage.setItem('crm_locale', lang);
    
    // Update Ant Design locale
    const localeMap = {
      en: enUS,
      ru: ruRU,
      uz: ruRU, // Fallback to Russian for Uzbek
    };
    setAntdLocale(localeMap[lang] || ruRU);
  };

  const handleLogout = () => {
    clearToken();
    callsWebSocket.disconnect();
    chatWebSocket.disconnect();
    setUser(null);
    navigate('/login');
  };

  const handleAnswerCall = (callData) => {
    console.log('[App] Answering call:', callData);
    removeIncomingCall(callData.callId);
    setCurrentIncomingCall(null);
    // Additional answer logic would be handled by SIPClient
  };

  const handleRejectCall = (callData) => {
    console.log('[App] Rejecting call:', callData);
    removeIncomingCall(callData.callId);
    setCurrentIncomingCall(null);
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') navigate('/profile');
    else if (key === 'settings') navigate('/settings');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: t('nav.profile') || 'Профиль',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      label: t('nav.settings') || 'Настройки',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: t('nav.logout') || 'Выход',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard') || 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: t('nav.analytics') || 'Аналитика',
      onClick: () => navigate('/analytics'),
    },
    {
      key: 'leads',
      icon: <UserOutlined />,
      label: t('nav.leads') || 'Leads',
      onClick: () => navigate('/leads'),
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: t('nav.contacts') || 'Контакты',
      onClick: () => navigate('/contacts'),
    },
    {
      key: 'companies',
      icon: <ShopOutlined />,
      label: t('nav.companies') || 'Компании',
      onClick: () => navigate('/companies'),
    },
    {
      key: 'deals',
      icon: <DollarOutlined />,
      label: t('nav.deals') || 'Сделки',
      onClick: () => navigate('/deals'),
    },
    {
      key: 'tasks',
      icon: <CheckSquareOutlined />,
      label: t('nav.tasks') || 'Задачи',
      onClick: () => navigate('/tasks'),
    },
    {
      key: 'projects',
      icon: <FolderOutlined />,
      label: t('nav.projects') || 'Проекты',
      onClick: () => navigate('/projects'),
    },
    {
      key: 'chat',
      icon: unreadCount > 0 ? <Badge count={unreadCount} size="small"><MessageOutlined /></Badge> : <MessageOutlined />,
      label: t('nav.chat') || 'Чат',
      onClick: () => navigate('/chat'),
    },
    {
      key: 'calls',
      icon: <PhoneOutlined />,
      label: t('nav.calls') || 'Звонки',
      children: [
        {
          key: 'calls-dashboard',
          label: t('nav.callsDashboard') || 'Дашборд',
          onClick: () => navigate('/calls/dashboard'),
        },
        {
          key: 'calls-list',
          label: t('nav.callsHistory') || 'История звонков',
          onClick: () => navigate('/calls'),
        },
      ],
    },
    {
      key: 'payments',
      icon: <DollarOutlined />,
      label: t('nav.payments') || 'Платежи',
      onClick: () => navigate('/payments'),
    },
    {
      key: 'reminders',
      icon: <ClockCircleOutlined />,
      label: t('nav.reminders') || 'Напоминания',
      onClick: () => navigate('/reminders'),
    },
    {
      key: 'campaigns',
      icon: <FileTextOutlined />,
      label: t('nav.campaigns') || 'Кампании',
      onClick: () => navigate('/campaigns'),
    },
    {
      key: 'memos',
      icon: <FileTextOutlined />,
      label: t('nav.memos') || 'Заметки',
      onClick: () => navigate('/memos'),
    },
    {
      type: 'divider',
    },
    {
      key: 'integrations',
      icon: <SettingOutlined />,
      label: t('nav.integrations') || 'Интеграции',
      onClick: () => navigate('/integrations'),
    },
  ];

  const getSelectedKey = () => {
    const name = route.name;
    if (name === 'analytics') return 'analytics';
    if (name.startsWith('leads')) return 'leads';
    if (name.startsWith('contacts')) return 'contacts';
    if (name.startsWith('companies')) return 'companies';
    if (name.startsWith('deals')) return 'deals';
    if (name.startsWith('tasks')) return 'tasks';
    if (name.startsWith('projects')) return 'projects';
    if (name.startsWith('chat')) return 'chat';
    if (name.startsWith('calls')) return 'calls';
    if (name.startsWith('payments')) return 'payments';
    if (name.startsWith('reminders')) return 'reminders';
    if (name.startsWith('campaigns')) return 'campaigns';
    if (name.startsWith('memos')) return 'memos';
    return name;
  };

  const renderContent = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'leads-list':
        return <LeadsList />;
      case 'leads-new':
        return <LeadForm />;
      case 'leads-edit':
        return <LeadForm id={route.params.id} />;
      case 'leads-detail':
        return <LeadDetail id={route.params.id} />;
      case 'contacts-list':
        return <ContactsList />;
      case 'contacts-new':
        return <ContactForm />;
      case 'contacts-edit':
        return <ContactForm id={route.params.id} />;
      case 'contacts-detail':
        return <ContactDetail id={route.params.id} />;
      case 'companies-list':
        return <CompaniesList />;
      case 'companies-new':
        return <CompanyForm />;
      case 'companies-edit':
        return <CompanyForm id={route.params.id} />;
      case 'companies-detail':
        return <CompanyDetail id={route.params.id} />;
      case 'deals-list':
        return <DealsList />;
      case 'deals-new':
        return <DealForm />;
      case 'deals-edit':
        return <DealForm id={route.params.id} />;
      case 'deals-detail':
        return <DealDetail id={route.params.id} />;
      case 'tasks-list':
        return <TasksList />;
      case 'tasks-new':
        return <TaskForm />;
      case 'tasks-edit':
        return <TaskForm id={route.params.id} />;
      case 'tasks-detail':
        return <TaskDetail id={route.params.id} />;
      case 'projects-list':
        return <ProjectsList />;
      case 'projects-new':
        return <ProjectForm />;
      case 'projects-edit':
        return <ProjectForm id={route.params.id} />;
      case 'projects-detail':
        return <ProjectDetail id={route.params.id} />;
      case 'calls-list':
        return <CallsList />;
      case 'calls-dashboard':
        return <CallsDashboard />;
      case 'payments-list':
        return <PaymentsList />;
      case 'payments-new':
        return <PaymentForm />;
      case 'payments-edit':
        return <PaymentForm id={route.params.id} />;
      case 'payments-detail':
        return <PaymentDetail id={route.params.id} />;
      case 'reminders-list':
        return <RemindersList />;
      case 'reminders-new':
        return <ReminderForm />;
      case 'reminders-edit':
        return <ReminderForm id={route.params.id} />;
      case 'reminders-detail':
        return <ReminderDetail id={route.params.id} />;
      case 'campaigns-list':
        return <CampaignsList />;
      case 'campaigns-new':
        return <CampaignForm />;
      case 'campaigns-edit':
        return <CampaignForm id={route.params.id} />;
      case 'campaigns-detail':
        return <CampaignDetail id={route.params.id} />;
      case 'memos-list':
        return <MemosList />;
      case 'memos-new':
        return <MemoForm />;
      case 'memos-edit':
        return <MemoForm id={route.params.id} />;
      case 'memos-detail':
        return <MemoDetail id={route.params.id} />;
      case 'chat':
      case 'chat-list':
        return <ChatPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'integrations':
        return <IntegrationsPage />;
      default:
        return <Dashboard />;
    }
  };

  // Show login page without layout if not authenticated or on login route
  if (!isAuthenticated() || route.name === 'login') {
    return <LoginPage onLogin={(userData) => {
      setUser(userData);
      // After successful login, navigate to dashboard
      navigate('/dashboard');
    }} />;
  }

  return (
    <ConfigProvider locale={antdLocale}>
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'CRM' : 'Enterprise CRM'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: 18, cursor: 'pointer' },
          })}
          <Space>
            {/* Language selector */}
            <Select 
              size="small" 
              value={locale} 
              style={{ width: 110 }} 
              onChange={handleLocaleChange}
            >
              <Option value="en">English</Option>
              <Option value="ru">Русский</Option>
              <Option value="uz">O'zbekcha</Option>
            </Select>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                {/* WebSocket Status Indicator */}
                <Tooltip title={wsConnected ? 'WebSocket подключен' : 'WebSocket отключен'}>
                  <Badge dot={wsConnected} color={wsConnected ? 'green' : 'red'}>
                    {wsConnected ? (
                      <WifiOutlined style={{ fontSize: 18 }} />
                    ) : (
                      <DisconnectOutlined style={{ fontSize: 18 }} />
                    )}
                  </Badge>
                </Tooltip>
                
                {/* Incoming calls indicator */}
                {incomingCalls.length > 0 && (
                  <Badge count={incomingCalls.length}>
                    <PhoneFilled style={{ color: '#52c41a', fontSize: 18 }} />
                  </Badge>
                )}
                
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.name || 'Guest'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        visible={!!currentIncomingCall}
        callData={currentIncomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </Layout>
    </ConfigProvider>
  );
}

export default App;
