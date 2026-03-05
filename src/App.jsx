import { App as AntApp, ConfigProvider, Skeleton, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import uzUZ from 'antd/locale/uz_UZ';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AppLayout } from './components/AppLayout.jsx';
import TelephonyDialerModal from './components/TelephonyDialerModal.jsx';
import { clearToken, getToken, getUserFromToken, isAuthenticated } from './lib/api/auth.js';
import { getProfile } from './lib/api/user.js';
import { mergeRoles, normalizeRoles, rolesFromProfile, rolesFromTokenPayload } from './lib/roles.js';
import { useTheme } from './lib/hooks/useTheme.js';
import { setLocale } from './lib/i18n/index.js';
import {
    addIncomingCall,
    removeIncomingCall,
    setChatWsConnected,
    setChatWsReconnecting,
    setWsConnected,
    setWsReconnecting,
    subscribe,
} from './lib/store/index.js';
import sipClient from './lib/telephony/SIPClient.js';
import { loadTelephonyRuntimeConfig } from './lib/telephony/runtimeConfig.js';
import callsWebSocket from './lib/websocket/CallsWebSocket.js';
import chatWebSocket from './lib/websocket/ChatWebSocket.js';
import IncomingCallModal from './modules/calls/IncomingCallModal.jsx';
import { getRouteMeta, navigate, onRouteChange, parseHash } from './router.js';

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
const CompanyForm = lazy(() => import('./pages/companies/CompanyCreatePage'));
const CompanyEdit = lazy(() => import('./pages/companies/CompanyEditPage'));
const CompanyDetailPage = lazy(() => import('./pages/companies/CompanyDetailPage'));

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
const LandingBuilderPage = lazy(() => import('./pages/landing-builder.jsx'));

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

function normalizeLocale(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('uz')) return 'uz';
  return 'ru';
}

function normalizeUser(raw, fallback = {}) {
  const firstName = raw?.first_name || fallback?.first_name || '';
  const lastName = raw?.last_name || fallback?.last_name || '';
  const fullName =
    raw?.full_name ||
    raw?.name ||
    raw?.display_name ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    '';
  const username = raw?.username || fallback?.username || '';
  const name = fullName || username || fallback?.name || 'User';

  return {
    id: raw?.id ?? raw?.user_id ?? fallback?.id ?? null,
    username: username || name,
    name,
    email: raw?.email || fallback?.email || '',
  };
}

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
  const [dialerVisible, setDialerVisible] = useState(false);

  useEffect(() => {
    // Initialize locale on mount
    const savedLocale = normalizeLocale(localStorage.getItem('contora_locale') || 'ru');
    handleLocaleChange(savedLocale).finally(() => setLocaleInitialized(true));

    // Check auth on mount
    const authenticated = isAuthenticated();

    if (authenticated) {
      const token = getToken();
      const tokenUser = normalizeUser(getUserFromToken() || {});
      setUser(tokenUser);

      // Hydrate full user profile from API (stable after page reload)
      (async () => {
        try {
          const me = await getProfile();
          const roles = mergeRoles(
            rolesFromProfile(me),
            rolesFromTokenPayload(getUserFromToken() || {}),
          );
          sessionStorage.setItem('contora_roles', JSON.stringify(roles));
          setUser((prev) => normalizeUser(me || {}, prev || tokenUser));
          // Sync locale from profile only when user did not explicitly choose one in localStorage.
          if (!localStorage.getItem('contora_locale') && me?.language_code) {
            const profileLocale = normalizeLocale(me.language_code);
            if (profileLocale !== savedLocale) {
              handleLocaleChange(profileLocale);
            }
          }
        } catch (e) {
          console.warn('Failed to preload user profile/roles:', e);
        }
      })();

      // Initialize WebSocket connections if we have a token
      if (token) {
        initializeWebSocket(token);
        initializeChatWebSocket(token);
        initializeSipClient();
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
      sipClient.stop();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;
    if (route.name === 'login' || route.name === 'forbidden' || route.name === 'not-found') return;
    if (!canAccessRoute(route.name)) {
      navigate('/forbidden');
    }
  }, [route.name]);

  const initializeSipClient = async () => {
    try {
      const runtime = await loadTelephonyRuntimeConfig().catch(() => null);
      const sip = runtime?.sipConfig;
      if (!sip?.username || !sip?.realm || !sip?.password || !sip?.websocketProxyUrl) {
        console.warn('[App] SIP config incomplete. Skipping SIP registration.');
        return;
      }

      sipClient.configure({
        realm: sip.realm,
        impi: sip.username,
        impu: sip.impu,
        password: sip.password,
        display_name: sip.displayName,
        websocket_proxy_url: sip.websocketProxyUrl,
        ice_servers: sip.iceServers,
      });

      await sipClient.init();
      if (!sipClient.isRegistered) {
        await sipClient.register(sip.username, sip.password);
      }
    } catch (error) {
      console.error('[App] SIP initialization failed:', error);
    }
  };

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
    const nextLocale = normalizeLocale(lang);
    await setLocale(nextLocale);
    setLocaleState(nextLocale);
    localStorage.setItem('contora_locale', nextLocale);
    window.dispatchEvent(new CustomEvent('contora:locale-change', { detail: nextLocale }));
  };

  const handleLogout = () => {
    clearToken();
    callsWebSocket.disconnect();
    chatWebSocket.disconnect();
    sipClient.stop();
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

  const getCurrentRoles = () => {
    const tokenRoles = rolesFromTokenPayload(getUserFromToken() || {});
    let storedRoles = [];
    try {
      const raw = sessionStorage.getItem('contora_roles') || localStorage.getItem('contora_roles');
      if (raw) {
        const parsed = JSON.parse(raw);
        storedRoles = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.roles) ? parsed.roles : [];
      }
    } catch {
      storedRoles = [];
    }
    return mergeRoles(tokenRoles, storedRoles);
  };

  const canAccessRoute = (routeName) => {
    const meta = getRouteMeta(routeName);
    if (!meta || meta.auth === false) return true;
    if (!isAuthenticated()) return false;
    const required = normalizeRoles(Array.isArray(meta.roles) ? meta.roles : []);
    if (required.length === 0) return true;
    const currentRoles = getCurrentRoles();
    return currentRoles.some((role) => required.includes(role));
  };

  const navAccessMap = {
    dashboard: 'dashboard',
    leads: 'leads-list',
    contacts: 'contacts-list',
    companies: 'companies-list',
    deals: 'deals-list',
    tasks: 'tasks-list',
    projects: 'projects-list',
    products: 'products-list',
    chat: 'chat-list',
    calls: 'calls-list',
    payments: 'payments-list',
    reminders: 'reminders-list',
    campaigns: 'campaigns-list',
    segments: 'marketing-segments',
    templates: 'marketing-templates',
    memos: 'memos-list',
    'crm-emails': 'crm-emails',
    massmail: 'massmail',
    'sms-center': 'sms-center',
    operations: 'operations',
    'reference-data': 'reference-data',
    analytics: 'analytics',
    'help-center': 'help-center',
    telephony: 'telephony',
    users: 'users',
    settings: 'settings',
    integrations: 'integrations',
    'landing-builder': 'landing-builder',
  };

  const allowedNavKeys = Object.entries(navAccessMap)
    .filter(([, routeName]) => canAccessRoute(routeName))
    .map(([key]) => key);

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
    if (name.startsWith('campaigns')) return 'campaigns';
    if (name === 'marketing-segments') return 'segments';
    if (name === 'marketing-templates') return 'templates';
    if (name.startsWith('memos')) return 'memos';
    if (name === 'crm-emails' || name === 'massmail' || name === 'sms-center') return name;
    if (name === 'operations') return 'operations';
    if (name === 'reference-data') return 'reference-data';
    if (name === 'analytics') return 'analytics';
    if (name === 'help-center') return 'help-center';
    if (name === 'telephony') return 'telephony';
    if (name === 'users') return 'users';
    if (name === 'landing-builder') return 'landing-builder';
    return name;
  };

  const renderContent = () => {
    if (route.name === 'forbidden') {
      return (
        <div style={{ padding: 24 }}>
          <h2>Access denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      );
    }
    if (route.name === 'not-found') {
      return (
        <div style={{ padding: 24 }}>
          <h2>Page not found</h2>
          <p>The page you are looking for does not exist.</p>
        </div>
      );
    }
    if (!canAccessRoute(route.name)) {
      return null;
    }

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
        return <CompanyEdit id={Number(route.params.id)} />;
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
      case 'landing-builder':
        return <LandingBuilderPage />;
      default:
        return null;
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
      allowedNavKeys={allowedNavKeys}
      user={user}
      wsConnected={wsConnected}
      incomingCallsCount={incomingCalls.length}
      unreadCount={unreadCount}
      onOpenDialer={() => setDialerVisible(true)}
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

      <TelephonyDialerModal
        visible={dialerVisible}
        onClose={() => setDialerVisible(false)}
      />
    </AppLayout>
  );
}

// Wrapper component that provides theme to App
function AppWithTheme() {
  const { theme } = useTheme();
  const [locale, setLocale] = useState(() => normalizeLocale(localStorage.getItem('contora_locale') || 'ru'));
  useEffect(() => {
    const onLocaleChanged = (event) => {
      setLocale(normalizeLocale(event?.detail));
    };
    const onStorage = (event) => {
      if (event.key === 'contora_locale') {
        setLocale(normalizeLocale(event.newValue));
      }
    };
    window.addEventListener('contora:locale-change', onLocaleChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('contora:locale-change', onLocaleChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const antdLocale = locale === 'en' ? enUS : locale === 'uz' ? uzUZ : ruRU;

  // Ant Design theme configuration for Radix UI aesthetic
  const themeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme === 'dark' ? '#fafafa' : '#18181b', // zinc-50 : zinc-900
      colorInfo: theme === 'dark' ? '#8ab4f8' : '#4285f4', // Better blue visibility in dark
      colorSuccess: theme === 'dark' ? '#4ade80' : '#16a34a', // green-400 : green-600
      colorWarning: theme === 'dark' ? '#fbbf24' : '#d97706', // amber-400 : amber-600
      colorError: theme === 'dark' ? '#f87171' : '#dc2626',   // red-400 : red-600
      borderRadius: 6,
      colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff', // softer dark container
      colorBgElevated: theme === 'dark' ? '#1e232e' : '#ffffff', // elevated dark
      colorBgLayout: theme === 'dark' ? 'transparent' : '#f8fafc', // transparent to show body gradient
      colorBorderSecondary: theme === 'dark' ? '#2d3343' : '#e4e4e7',
      colorBorder: theme === 'dark' ? '#2d3343' : '#e4e4e7',
      colorTextBase: theme === 'dark' ? '#f1f5f9' : '#09090b',
      colorTextSecondary: theme === 'dark' ? '#d4d4d8' : '#71717a', // Adjusted for dark mode: zinc-300 : zinc-500
      colorTextLightSolid: theme === 'dark' ? '#18181b' : '#fafafa', // inverted text for primary buttons
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxShadow: theme === 'dark' ? '0 1px 2px 0 rgba(0, 0, 0, 0.5)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      boxShadowSecondary: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
    components: {
      Card: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        colorBorderSecondary: theme === 'dark' ? '#2d3343' : '#e4e4e7',
      },
      Button: {
        colorPrimaryHover: theme === 'dark' ? '#cbd5e1' : '#27272a',
        colorPrimaryActive: theme === 'dark' ? '#94a3b8' : '#3f3f46',
        colorBgTextHover: theme === 'dark' ? '#2d3343' : '#f4f4f5',
        colorBgTextActive: theme === 'dark' ? '#3b4358' : '#e4e4e7',
      },
      Table: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        headerBg: theme === 'dark' ? '#11151c' : '#f8fafc',
        headerColor: theme === 'dark' ? '#cbd5e1' : '#71717a',
        rowHoverBg: theme === 'dark' ? '#1e232e' : '#f1f5f9',
        borderColor: theme === 'dark' ? '#2d3343' : '#e4e4e7',
      },
      Layout: {
        siderBg: theme === 'dark' ? '#161b22' : '#ffffff',
        headerBg: theme === 'dark' ? '#161b22' : '#ffffff',
        bodyBg: theme === 'dark' ? 'transparent' : '#f8fafc',
      },
      Menu: {
        itemBg: theme === 'dark' ? '#161b22' : '#ffffff',
        activeBarBorderWidth: 0,
        itemSelectedBg: theme === 'dark' ? '#2d3343' : '#f1f5f9',
        itemSelectedColor: theme === 'dark' ? '#f1f5f9' : '#18181b', // Bright white for selected in dark
        itemColor: theme === 'dark' ? '#cbd5e1' : '#71717a', // Bright white for items in dark
        itemHoverColor: theme === 'dark' ? '#f1f5f9' : '#18181b',
        itemHoverBg: theme === 'dark' ? '#1e232e' : '#f8fafc',
      },
      Input: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        colorBorder: theme === 'dark' ? '#2d3343' : '#e4e4e7',
        activeBorderColor: theme === 'dark' ? '#f1f5f9' : '#18181b',
        hoverBorderColor: theme === 'dark' ? '#46506b' : '#d4d4d8',
      },
      Select: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        colorBorder: theme === 'dark' ? '#2d3343' : '#e4e4e7',
        colorPrimaryHover: theme === 'dark' ? '#46506b' : '#d4d4d8',
        colorPrimary: theme === 'dark' ? '#f1f5f9' : '#18181b',
        optionSelectedBg: theme === 'dark' ? '#2d3343' : '#f1f5f9',
      },
      Dropdown: {
        colorBgElevated: theme === 'dark' ? '#1e232e' : '#ffffff',
        colorText: theme === 'dark' ? '#f1f5f9' : '#09090b',
        controlItemBgHover: theme === 'dark' ? '#2d3343' : '#f1f5f9',
      }
    }
  };

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocale}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}

export default AppWithTheme;
