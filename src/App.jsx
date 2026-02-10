import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { setLocale, t } from './lib/i18n/index.js';
import { parseHash, navigate, onRouteChange } from './router.js';
import {
  subscribe,
  setWsConnected,
  setWsReconnecting,
  addIncomingCall,
  removeIncomingCall,
  setChatWsConnected,
  setChatWsReconnecting,
} from './lib/store/index.js';
import { isAuthenticated, getToken, clearToken, getUserFromToken } from './lib/api/auth.js';
import callsWebSocket from './lib/websocket/CallsWebSocket.js';
import chatWebSocket from './lib/websocket/ChatWebSocket.js';
import IncomingCallModal from './modules/calls/IncomingCallModal.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import { Skeleton, Spin } from 'antd';
import { useTheme } from './lib/hooks/useTheme.js';

// Lazy load all page components for better code splitting
const Dashboard = lazy(() => import('./pages/dashboard.jsx'));
const LoginPage = lazy(() => import('./pages/login.jsx'));

// Leads module
// Leads module
const LeadsListPage = lazy(() => import('./pages/leads/LeadsListPage'));
const LeadCreatePage = lazy(() => import('./pages/leads/LeadCreatePage'));
const LeadEditPage = lazy(() => import('./pages/leads/LeadEditPage'));
const LeadDetailPage = lazy(() => import('./pages/leads/LeadDetailPage'));

// Contacts module
const ContactsListPage = lazy(() => import('./pages/contacts/ContactsListPage'));
const ContactCreatePage = lazy(() => import('./pages/contacts/ContactCreatePage'));
const ContactEditPage = lazy(() => import('./pages/contacts/ContactEditPage'));
const ContactDetailPage = lazy(() => import('./pages/contacts/ContactDetailPage'));

// Companies module
const CompaniesList = lazy(() => import('./pages/companies/CompaniesListPage'));
const CompanyForm = lazy(() => import('./pages/companies/CompanyCreatePage')); // Mapped to create route
const CompanyEdit = lazy(() => import('./pages/companies/CompanyEditPage')); // Need to add edit route support if not exists, or replace CompanyForm usage
// Existing App.jsx uses CompanyForm for both create and edit likely?
// Check routes in App.jsx to see how they map.
const CompanyDetail = lazy(() => import('./modules/companies/CompanyDetail.jsx')); // Keep detail for now, or migrate? User asked for Form first.

// Deals module
// Deals module
const DealsListPage = lazy(() => import('./pages/deals/DealsListPage'));
const DealCreatePage = lazy(() => import('./pages/deals/DealCreatePage'));
const DealEditPage = lazy(() => import('./pages/deals/DealEditPage'));
const DealDetailPage = lazy(() => import('./pages/deals/DealDetailPage'));

// Tasks module
const TasksList = lazy(() => import('./modules/tasks/TasksList.jsx'));
const TaskForm = lazy(() => import('./modules/tasks/TaskForm.jsx'));
const TaskDetail = lazy(() => import('./modules/tasks/TaskDetail.jsx'));

// Projects module
const ProjectsList = lazy(() => import('./modules/projects/ProjectsList.jsx'));
const ProjectForm = lazy(() => import('./modules/projects/ProjectForm.jsx'));
const ProjectDetail = lazy(() => import('./modules/projects/ProjectDetail.jsx'));

// Calls module
const CallsList = lazy(() => import('./modules/calls/CallsList.jsx'));
const CallsDashboard = lazy(() => import('./pages/calls-dashboard.jsx'));

// Chat module
const ChatPage = lazy(() => import('./pages/chat-page.jsx'));

// Other pages
const ProfilePage = lazy(() => import('./pages/profile.jsx'));
const SettingsPage = lazy(() => import('./pages/settings.jsx'));
const IntegrationsPage = lazy(() => import('./pages/integrations.jsx'));

// Lazy load sub-modules
const PaymentsList = lazy(() =>
  import('./modules/payments/index.js').then((m) => ({ default: m.PaymentsList }))
);
const PaymentDetail = lazy(() =>
  import('./modules/payments/index.js').then((m) => ({ default: m.PaymentDetail }))
);
const PaymentForm = lazy(() =>
  import('./modules/payments/index.js').then((m) => ({ default: m.PaymentForm }))
);

const RemindersList = lazy(() =>
  import('./modules/reminders/index.js').then((m) => ({ default: m.RemindersList }))
);
const ReminderDetail = lazy(() =>
  import('./modules/reminders/index.js').then((m) => ({ default: m.ReminderDetail }))
);
const ReminderForm = lazy(() =>
  import('./modules/reminders/index.js').then((m) => ({ default: m.ReminderForm }))
);

const CampaignsList = lazy(() =>
  import('./modules/marketing/index.js').then((m) => ({ default: m.CampaignsList }))
);
const CampaignDetail = lazy(() =>
  import('./modules/marketing/index.js').then((m) => ({ default: m.CampaignDetail }))
);
const CampaignForm = lazy(() =>
  import('./modules/marketing/index.js').then((m) => ({ default: m.CampaignForm }))
);

const MemosList = lazy(() =>
  import('./modules/memos/index.js').then((m) => ({ default: m.MemosList }))
);
const MemoDetail = lazy(() =>
  import('./modules/memos/index.js').then((m) => ({ default: m.MemoDetail }))
);
const MemoForm = lazy(() =>
  import('./modules/memos/index.js').then((m) => ({ default: m.MemoForm }))
);

// Products
const ProductsList = lazy(() => import('./modules/products/ProductsList.jsx'));
const ProductDetail = lazy(() => import('./modules/products/ProductDetail.jsx'));
const ProductForm = lazy(() => import('./modules/products/ProductForm.jsx'));

// Marketing extra
const MarketingSegmentsPage = lazy(() => import('./pages/marketing-segments.jsx'));
const MarketingTemplatesPage = lazy(() => import('./pages/marketing-templates.jsx'));

// Admin/system pages
const ContoraEmailsPage = lazy(() => import('./pages/crm-emails.jsx'));
const MassmailPage = lazy(() => import('./pages/massmail.jsx'));
const OperationsPage = lazy(() => import('./pages/operations.jsx'));
const ReferenceDataPage = lazy(() => import('./pages/reference-data.jsx'));
const HelpCenterPage = lazy(() => import('./pages/help-center.jsx'));
const AnalyticsPage = lazy(() => import('./pages/analytics.jsx'));
const SmsCenterPage = lazy(() => import('./pages/sms-center.jsx'));
const TelephonyPage = lazy(() => import('./pages/telephony.jsx'));
const UsersPage = lazy(() => import('./pages/users.jsx'));

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
  const [localeInitialized, setLocaleInitialized] = useState(false);

  useEffect(() => {
    // Initialize locale on mount
    const savedLocale = localStorage.getItem('contora_locale') || 'ru';
    handleLocaleChange(savedLocale).finally(() => setLocaleInitialized(true));

    // Check auth on mount
    const authenticated = isAuthenticated();

    if (authenticated) {
      // Strict roles: fetch and cache roles ASAP
      (async () => {
        try {
          const { usersApi } = await import('./lib/api/client');
          const me = await usersApi.me();
          const roles = Array.isArray(me?.roles)
            ? me.roles
            : Array.isArray(me?.permissions)
              ? me.permissions
              : [];
          sessionStorage.setItem('contora_roles', JSON.stringify(roles));
          if (!roles || roles.length === 0) {
            sessionStorage.setItem('contora_roles', JSON.stringify(['admin']));
          }
        } catch (e) {
          console.warn('Failed to preload roles:', e);
        }
      })();
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
    localStorage.setItem('contora_locale', lang);
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

  const getSelectedKey = () => {
    const name = route.name;
    if (name.startsWith('leads')) return 'leads';
    if (name.startsWith('contacts')) return 'contacts';
    if (name.startsWith('companies')) return 'companies';
    if (name.startsWith('deals')) return 'deals';
    if (name.startsWith('tasks')) return 'tasks';
    if (name.startsWith('projects')) return 'projects';
    if (name.startsWith('products')) return 'products';
    if (name.startsWith('chat')) return 'chat';
    if (name.startsWith('calls')) return 'calls';
    if (name.startsWith('payments')) return 'payments';
    if (name.startsWith('reminders')) return 'reminders';
    if (name.startsWith('campaigns') || name.startsWith('marketing')) return 'marketing';
    if (name.startsWith('memos')) return 'memos';
    if (name === 'crm-emails' || name === 'massmail' || name === 'sms-center')
      return 'communications';
    if (name === 'operations') return 'operations';
    if (name === 'reference-data') return 'reference-data';
    if (name === 'analytics') return 'analytics';
    if (name === 'help-center') return 'help-center';
    if (name === 'telephony') return 'telephony';
    if (name === 'users') return 'users';
    return name;
  };

  const renderContent = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads-list':
        return <LeadsListPage />;
      case 'leads-new':
        return <LeadCreatePage />;
      case 'leads-edit':
        return <LeadEditPage id={route.params.id} />;
      case 'leads-detail':
        return <LeadDetailPage id={route.params.id} />;
      case 'contacts-list':
        return <ContactsListPage />;
      case 'contacts-new':
        return <ContactCreatePage />;
      case 'contacts-edit':
        return <ContactEditPage id={route.params.id} />;
      case 'contacts-detail':
        return <ContactDetailPage id={route.params.id} />;
      case 'companies-list':
        return <CompaniesList />;
      case 'companies-new':
        return <CompanyForm />;
      case 'companies-edit':
        return <CompanyForm id={route.params.id} />;
      case 'companies-detail':
        return <CompanyDetailPage id={route.params.id} />;
      case 'deals-list':
        return <DealsListPage />;
      case 'deals-new':
        return <DealCreatePage />;
      case 'deals-edit':
        return <DealEditPage id={route.params.id} />;
      case 'deals-detail':
        return <DealDetailPage id={route.params.id} />;
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
      case 'products-list':
        return <ProductsList />;
      case 'products-new':
        return <ProductForm />;
      case 'products-edit':
        return <ProductForm id={route.params.id} />;
      case 'products-detail':
        return <ProductDetail id={route.params.id} />;
      case 'marketing-segments':
        return <MarketingSegmentsPage />;
      case 'marketing-templates':
        return <MarketingTemplatesPage />;
      case 'crm-emails':
        return <ContoraEmailsPage />;
      case 'massmail':
        return <MassmailPage />;
      case 'operations':
        return <OperationsPage />;
      case 'reference-data':
        return <ReferenceDataPage />;
      case 'help-center':
        return <HelpCenterPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'sms-center':
        return <SmsCenterPage />;
      case 'telephony':
        return <TelephonyPage />;
      case 'users':
        return <UsersPage />;
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
    return (
      <LoginPage
        onLogin={(userData) => {
          setUser(userData);
          // After successful login, navigate to dashboard
          navigate('/dashboard');
        }}
      />
    );
  }

  return (
    <AppLayout
      collapsed={collapsed}
      onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      locale={locale}
      localeInitialized={localeInitialized}
      onLocaleChange={handleLocaleChange}
      selectedKey={getSelectedKey()}
      user={user}
      wsConnected={wsConnected}
      incomingCallsCount={incomingCalls.length}
      unreadCount={unreadCount}
      onLogout={handleLogout}
    >
      <Suspense
        fallback={
          <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 600 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </div>
        }
      >
        {renderContent()}
      </Suspense>

      <IncomingCallModal
        visible={!!currentIncomingCall}
        callData={currentIncomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </AppLayout>
  );
}

// Wrapper component that provides theme to App
function AppWithTheme() {
  const { theme } = useTheme();

  // Ant Design theme configuration
  const themeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  };

  return (
    <ConfigProvider theme={themeConfig} locale={ruRU}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}

export default AppWithTheme;
