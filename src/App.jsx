import { App as AntApp, Button, ConfigProvider, Empty, Result, Skeleton, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import uzUZ from 'antd/locale/uz_UZ';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AppLayout } from './components/AppLayout.jsx';
import { clearToken, getToken, getUserFromToken, isAuthenticated } from './lib/api/auth.js';
import { getAIProviders } from './lib/api/integrations/ai.js';
import { getFacebookPages } from './lib/api/integrations/facebook.js';
import { getInstagramAccounts } from './lib/api/integrations/instagram.js';
import { getTelegramBots } from './lib/api/integrations/telegram.js';
import { getWhatsAppAccounts } from './lib/api/integrations/whatsapp.js';
import { canAccessRoute as canAccessRouteByPolicy } from './lib/rbac.js';
import smsApi from './lib/api/sms.js';
import { getVoIPConnections } from './lib/api/telephony.js';
import { getProfile } from './lib/api/user.js';
import { mergeRoles, rolesFromProfile, rolesFromTokenPayload } from './lib/roles.js';
import { getFrontendVersionInfo } from './shared/version.js';
import { useTheme } from './lib/hooks/useTheme.js';
import { applyLegacyContentLocalization } from './lib/i18n/legacy-content-dom.js';
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
import { navigate, onRouteChange, parseHash } from './router.js';

// Lazy load all page components for better code splitting
const Dashboard = lazy(() => import('./pages/dashboard.jsx'));
const LoginPage = lazy(() => import('./pages/login.jsx'));
const TelephonyDialerModal = lazy(() => import('./components/TelephonyDialerModal.jsx'));
const IncomingCallModal = lazy(() => import('./modules/calls/IncomingCallModal.jsx'));

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
const PublicLandingPage = lazy(() => import('./pages/public-landing.jsx'));
const CrmSalesLandingPage = lazy(() => import('./pages/crm-sales-landing.jsx'));

const PUBLIC_ROUTE_NAMES = new Set(['landing-public', 'landing-preview', 'crm-landing']);

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
const EnterpriseCRMEmailsPage = lazy(() => import('./pages/crm-emails.jsx'));
const MassmailPage = lazy(() => import('./pages/massmail.jsx'));
const OperationsPage = lazy(() => import('./pages/operations.jsx'));
const ReferenceDataPage = lazy(() => import('./pages/reference-data.jsx'));
const HelpCenterPage = lazy(() => import('./pages/help-center.jsx'));
const AnalyticsPage = lazy(() => import('./pages/analytics.jsx'));
const SmsCenterPage = lazy(() => import('./pages/sms-center.jsx'));
const TelephonyPage = lazy(() => import('./pages/telephony.jsx'));
const UsersPage = lazy(() => import('./pages/users.jsx'));
const ControlPlaneAdminPage = lazy(() => import('./pages/control-plane-admin.jsx'));

function normalizeLocale(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('uz')) return 'uz';
  return 'ru';
}

function getProfileLocale(profile) {
  const raw =
    profile?.language_code
    || profile?.language
    || profile?.locale
    || profile?.ui_language
    || profile?.preferred_language
    || null;
  if (!raw) return null;
  return normalizeLocale(raw);
}

function normalizeUser(raw, fallback = {}) {
  const toStr = (value) => {
    if (value === null || value === undefined) return '';
    const normalized = String(value).trim();
    return normalized;
  };

  const pick = (...values) => values.map(toStr).find(Boolean) || '';
  const rawUser = raw?.user && typeof raw.user === 'object' ? raw.user : {};
  const fallbackUser = fallback?.user && typeof fallback.user === 'object' ? fallback.user : {};

  const firstName = pick(
    raw?.first_name,
    raw?.firstName,
    raw?.given_name,
    rawUser?.first_name,
    rawUser?.firstName,
    fallback?.first_name,
    fallback?.firstName,
    fallbackUser?.first_name,
    fallbackUser?.firstName,
  );

  const lastName = pick(
    raw?.last_name,
    raw?.lastName,
    raw?.family_name,
    rawUser?.last_name,
    rawUser?.lastName,
    fallback?.last_name,
    fallback?.lastName,
    fallbackUser?.last_name,
    fallbackUser?.lastName,
  );

  const fullName = pick(
    raw?.full_name,
    raw?.fullName,
    raw?.name,
    raw?.display_name,
    raw?.displayName,
    rawUser?.full_name,
    rawUser?.fullName,
    rawUser?.name,
    rawUser?.display_name,
    [firstName, lastName].filter(Boolean).join(' '),
    fallback?.full_name,
    fallback?.fullName,
    fallback?.name,
    fallback?.display_name,
  );

  const username = pick(
    raw?.username,
    raw?.login,
    rawUser?.username,
    rawUser?.login,
    fallback?.username,
    fallbackUser?.username,
  );

  const email = pick(
    raw?.email,
    rawUser?.email,
    fallback?.email,
    fallbackUser?.email,
  );

  const name = pick(fullName, username, email.split('@')[0], 'User');

  return {
    id: raw?.id ?? raw?.user_id ?? rawUser?.id ?? fallback?.id ?? fallbackUser?.id ?? null,
    username: username || name,
    name,
    email,
    roles: Array.isArray(raw?.roles)
      ? raw.roles
      : (Array.isArray(rawUser?.roles) ? rawUser.roles : (Array.isArray(fallback?.roles) ? fallback.roles : [])),
    is_staff: Boolean(
      raw?.is_staff ?? rawUser?.is_staff ?? fallback?.is_staff ?? fallbackUser?.is_staff,
    ),
    is_superuser: Boolean(
      raw?.is_superuser ?? rawUser?.is_superuser ?? fallback?.is_superuser ?? fallbackUser?.is_superuser,
    ),
    system_version:
      raw?.system_version && typeof raw.system_version === 'object'
        ? raw.system_version
        : (fallback?.system_version && typeof fallback.system_version === 'object'
            ? fallback.system_version
            : null),
  };
}

function readStoredRoles() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.roles)) return parsed.roles;
  } catch {
    // ignore malformed storage and fallback to token/profile roles
  }
  return [];
}

function normalizePermissions(rawPermissions = []) {
  if (!Array.isArray(rawPermissions)) return [];
  const normalized = new Set();
  rawPermissions.forEach((permission) => {
    const value = String(permission || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

function persistPermissions(rawPermissions = []) {
  const permissions = normalizePermissions(rawPermissions);
  const serialized = JSON.stringify(permissions);
  sessionStorage.setItem('enterprise_crm_permissions', serialized);
  localStorage.removeItem('enterprise_crm_permissions');
}

function normalizeList(response) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [route, setRoute] = useState(parseHash());
  const [user, setUser] = useState(null);
  const [wsConnected, setWsConnectedState] = useState(false);
  const [wsReconnecting, setWsReconnectingState] = useState(false);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [currentIncomingCall, setCurrentIncomingCall] = useState(null);
  const [chatWsConnected, setChatWsConnectedState] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState([]);
  const [locale, setLocaleState] = useState('ru');
  const [localeInitialized, setLocaleInitialized] = useState(false);
  const [dialerVisible, setDialerVisible] = useState(false);
  const frontendVersion = getFrontendVersionInfo();
  const telephonyModulesRef = useRef({
    loaded: false,
    sipClient: null,
    loadTelephonyRuntimeConfig: null,
    callsWebSocket: null,
    chatWebSocket: null,
  });

  const ensureTelephonyModules = async () => {
    if (telephonyModulesRef.current.loaded) {
      return telephonyModulesRef.current;
    }
    const [
      { default: sipClient },
      { loadTelephonyRuntimeConfig },
      { default: callsWebSocket },
      { default: chatWebSocket },
    ] = await Promise.all([
      import('./lib/telephony/SIPClient.js'),
      import('./lib/telephony/runtimeConfig.js'),
      import('./lib/websocket/CallsWebSocket.js'),
      import('./lib/websocket/ChatWebSocket.js'),
    ]);
    telephonyModulesRef.current = {
      loaded: true,
      sipClient,
      loadTelephonyRuntimeConfig,
      callsWebSocket,
      chatWebSocket,
    };
    return telephonyModulesRef.current;
  };

  const disconnectTelephony = () => {
    const runtime = telephonyModulesRef.current;
    runtime.callsWebSocket?.disconnect?.();
    runtime.chatWebSocket?.disconnect?.();
    runtime.sipClient?.stop?.();
  };

  const loadActiveIntegrations = async () => {
    const [
      smsResult,
      telephonyResult,
      whatsappResult,
      facebookResult,
      instagramResult,
      telegramResult,
      aiResult,
    ] = await Promise.allSettled([
      smsApi.providers(),
      getVoIPConnections({ page_size: 100 }),
      getWhatsAppAccounts({ page_size: 100 }),
      getFacebookPages({ page_size: 100 }),
      getInstagramAccounts({ page_size: 100 }),
      getTelegramBots({ page_size: 100 }),
      getAIProviders({ page_size: 100 }),
    ]);

    const next = [];

    if (smsResult.status === 'fulfilled') {
      const items = normalizeList(smsResult.value);
      if (items.some((item) => item?.configured === true)) {
        next.push({ key: 'sms', status: 'success' });
      }
    }

    if (telephonyResult.status === 'fulfilled') {
      const items = normalizeList(telephonyResult.value);
      if (items.some((item) => item?.active === true || item?.is_active === true)) {
        next.push({ key: 'telephony', status: 'success' });
      }
    }

    if (whatsappResult.status === 'fulfilled') {
      const items = normalizeList(whatsappResult.value);
      if (items.some((item) => item?.is_active === true)) {
        next.push({ key: 'whatsapp', status: 'success' });
      }
    }

    if (facebookResult.status === 'fulfilled') {
      const items = normalizeList(facebookResult.value);
      if (items.some((item) => item?.is_active === true)) {
        next.push({ key: 'facebook', status: 'success' });
      }
    }

    if (instagramResult.status === 'fulfilled') {
      const items = normalizeList(instagramResult.value);
      if (items.some((item) => item?.is_active === true)) {
        next.push({ key: 'instagram', status: 'success' });
      }
    }

    if (telegramResult.status === 'fulfilled') {
      const items = normalizeList(telegramResult.value);
      if (items.some((item) => item?.is_active === true)) {
        next.push({ key: 'telegram', status: 'success' });
      }
    }

    if (aiResult.status === 'fulfilled') {
      const items = normalizeList(aiResult.value);
      if (items.some((item) => item?.is_active === true)) {
        next.push({ key: 'ai', status: 'success' });
      }
    }

    setActiveIntegrations(next);
  };

  useEffect(() => {
    // Initialize locale on mount
    const persistedLocaleRaw = localStorage.getItem('enterprise_crm_locale') || localStorage.getItem('locale');
    const hasPersistedLocale = Boolean(persistedLocaleRaw);
    const savedLocale = normalizeLocale(persistedLocaleRaw || 'ru');
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
          const profileLocale = getProfileLocale(me);
          // Preserve explicit local user choice across page reloads.
          if (!hasPersistedLocale && profileLocale) {
            await handleLocaleChange(profileLocale);
          }
          const roles = mergeRoles(
            readStoredRoles(),
            rolesFromProfile(me),
            rolesFromTokenPayload(getUserFromToken() || {}),
          );
          if (roles.length > 0) {
            const serializedRoles = JSON.stringify(roles);
            sessionStorage.setItem('enterprise_crm_roles', serializedRoles);
            localStorage.removeItem('enterprise_crm_roles');
          }
          persistPermissions(me?.permissions || []);
          setUser((prev) => normalizeUser(me || {}, prev || tokenUser));
        } catch (e) {
          console.warn('Failed to preload user profile/roles:', e);
        }
      })();

      // Initialize WebSocket connections if we have a token
      if (token) {
        (async () => {
          try {
            const runtime = await ensureTelephonyModules();
            initializeWebSocket(runtime.callsWebSocket, token);
            initializeChatWebSocket(runtime.chatWebSocket, token);
            initializeSipClient(runtime.sipClient, runtime.loadTelephonyRuntimeConfig);
          } catch (error) {
            console.error('[App] Failed to initialize telephony runtime:', error);
          }
        })();
        loadActiveIntegrations().catch((error) => {
          console.warn('Failed to load active integrations:', error);
        });
      }
    } else {
      // Not authenticated, redirect to login if not already there
      if (route.name !== 'login' && !PUBLIC_ROUTE_NAMES.has(route.name)) {
        navigate('/login');
      }
    }

    // Subscribe to route changes
    const unsubscribeRoute = onRouteChange((newRoute) => {
      setRoute(newRoute);

      // Check auth on every route change
      const authenticated = isAuthenticated();

      // If trying to access protected route without authentication
      if (newRoute.name !== 'login' && !PUBLIC_ROUTE_NAMES.has(newRoute.name) && !authenticated) {
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
      setWsReconnectingState(state.telephony.wsReconnecting);
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
      disconnectTelephony();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return undefined;

    const intervalId = window.setInterval(() => {
      loadActiveIntegrations().catch((error) => {
        console.warn('Failed to refresh active integrations:', error);
      });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const syncLocaleState = (raw) => {
      setLocaleState(normalizeLocale(raw));
    };

    const onLocaleChanged = (event) => {
      syncLocaleState(event?.detail);
    };

    const onStorage = (event) => {
      if (event.key === 'enterprise_crm_locale' || event.key === 'locale') {
        syncLocaleState(event.newValue);
      }
    };

    window.addEventListener('enterprise_crm:locale-change', onLocaleChanged);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('enterprise_crm:locale-change', onLocaleChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;
    if (PUBLIC_ROUTE_NAMES.has(route.name)) return;
    if (route.name === 'login' || route.name === 'forbidden' || route.name === 'not-found') return;
    if (!canAccessRoute(route.name)) {
      navigate('/forbidden');
    }
  }, [route.name]);

  const initializeSipClient = async (sipClient, loadTelephonyRuntimeConfig) => {
    try {
      const runtime = await loadTelephonyRuntimeConfig({ includeSystemSettings: false }).catch(() => null);
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

  const shouldDismissIncomingOnUpdate = (data) => {
    if (!data?.callId) return false;
    const status = String(data.status || '').toLowerCase();
    if (['busy', 'no_answer', 'failed', 'abandoned', 'ended', 'rejected'].includes(status)) {
      return true;
    }
    // Backend can still emit answered as call_updated on final CDR/hangup path.
    if (status === 'answered' && Number(data.duration || 0) > 0) {
      return true;
    }
    return false;
  };

  const initializeWebSocket = (callsWebSocket, token) => {
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

    callsWebSocket.on('callUpdated', (data) => {
      console.log('[App] Call updated:', data);
      if (shouldDismissIncomingOnUpdate(data)) {
        removeIncomingCall(data.callId);
      }
    });

    callsWebSocket.on('callEnded', (data) => {
      console.log('[App] Call ended:', data);
      removeIncomingCall(data.callId);
    });

    // Connect to WebSocket
    callsWebSocket.connect(token);
  };

  const initializeChatWebSocket = (chatWebSocket, token) => {
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
    localStorage.setItem('enterprise_crm_locale', nextLocale);
    localStorage.setItem('locale', nextLocale);
    window.dispatchEvent(new CustomEvent('enterprise_crm:locale-change', { detail: nextLocale }));
  };

  const handleLogout = () => {
    clearToken();
    sessionStorage.removeItem('enterprise_crm_roles');
    localStorage.removeItem('enterprise_crm_roles');
    sessionStorage.removeItem('enterprise_crm_permissions');
    localStorage.removeItem('enterprise_crm_permissions');
    disconnectTelephony();
    setUser(null);
    setActiveIntegrations([]);
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

  const handleDismissIncomingCall = (callData) => {
    if (!callData?.callId) {
      setCurrentIncomingCall(null);
      return;
    }
    removeIncomingCall(callData.callId);
    setCurrentIncomingCall(null);
  };

  const canAccessRoute = (routeName) => {
    return canAccessRouteByPolicy(routeName);
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
    'control-plane': 'control-plane',
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
    if (name === 'control-plane') return 'control-plane';
    if (name === 'landing-builder') return 'landing-builder';
    return name;
  };

  const renderContent = () => {
    if (route.name === 'forbidden') {
      return (
        <Result
          status="403"
          title="Access denied"
          subTitle="You do not have permission to view this page."
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        />
      );
    }
    if (route.name === 'not-found') {
      return (
        <Result
          status="404"
          title="Page not found"
          subTitle="The page you are looking for does not exist."
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          }
        />
      );
    }
    if (!PUBLIC_ROUTE_NAMES.has(route.name) && !canAccessRoute(route.name)) {
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
        return <EnterpriseCRMEmailsPage />;
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
      case 'licensing':
        return <ControlPlaneAdminPage />;
      case 'control-plane':
        return <ControlPlaneAdminPage />;
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
      case 'landing-public':
      case 'landing-preview':
        return <PublicLandingPage />;
      case 'crm-landing':
        return <CrmSalesLandingPage />;
      default:
        return null;
    }
  };

  const isPublicRoute = PUBLIC_ROUTE_NAMES.has(route.name);

  // Show login page without layout when protected route is opened by anonymous user.
  if ((!isAuthenticated() && !isPublicRoute) || route.name === 'login') {
    return (
      <Suspense
        fallback={
          <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          </div>
        }
      >
        <LoginPage
          onLogin={(userData) => {
            setUser(userData);
            // After successful login, navigate to dashboard
            navigate('/dashboard');
          }}
        />
      </Suspense>
    );
  }

  if (isPublicRoute) {
    return (
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
      frontendVersion={frontendVersion}
      wsConnected={wsConnected}
      wsReconnecting={wsReconnecting}
      activeIntegrations={activeIntegrations}
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

      <Suspense fallback={null}>
        <IncomingCallModal
          visible={!!currentIncomingCall}
          callData={currentIncomingCall}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
          onDismiss={handleDismissIncomingCall}
        />

        <TelephonyDialerModal
          visible={dialerVisible}
          onClose={() => setDialerVisible(false)}
        />
      </Suspense>
    </AppLayout>
  );
}

// Wrapper component that provides theme to App
function AppWithTheme() {
  const { theme } = useTheme();
  const [activeLocale, setActiveLocale] = useState(() => normalizeLocale(localStorage.getItem('enterprise_crm_locale') || 'ru'));
  useEffect(() => {
    const onLocaleChanged = (event) => {
      setActiveLocale(normalizeLocale(event?.detail));
    };
    const onStorage = (event) => {
      if (event.key === 'enterprise_crm_locale') {
        setActiveLocale(normalizeLocale(event.newValue));
      }
    };
    window.addEventListener('enterprise_crm:locale-change', onLocaleChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('enterprise_crm:locale-change', onLocaleChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    // Keep i18n locale and persisted keys in sync with the visible locale switcher.
    setLocale(activeLocale);
    localStorage.setItem('enterprise_crm_locale', activeLocale);
    localStorage.setItem('locale', activeLocale);
  }, [activeLocale]);

  useEffect(() => {
    applyLegacyContentLocalization(activeLocale);
  }, [activeLocale]);

  const antdLocale = activeLocale === 'en' ? enUS : activeLocale === 'uz' ? uzUZ : ruRU;
  const emptyDescription = activeLocale === 'en' ? 'No data' : activeLocale === 'uz' ? "Ma'lumot yo'q" : 'Нет данных';

  // Ant Design theme configuration
  const themeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme === 'dark' ? '#fafafa' : '#18181b', // zinc-50 : zinc-900
      colorInfo: theme === 'dark' ? '#8ab4f8' : '#4285f4', // Better blue visibility in dark
      colorSuccess: theme === 'dark' ? '#4ade80' : '#16a34a', // green-400 : green-600
      colorWarning: theme === 'dark' ? '#fbbf24' : '#d97706', // amber-400 : amber-600
      colorError: theme === 'dark' ? '#f87171' : '#dc2626',   // red-400 : red-600
      zIndexPopupBase: 1200, // Keep dropdowns/selects above sticky header (z-index: 1100)
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
      controlHeight: 38,
      controlHeightLG: 42,
      padding: 16,
      paddingLG: 20,
    },
    components: {
      Card: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        colorBorderSecondary: theme === 'dark' ? '#2d3343' : '#e4e4e7',
        borderRadiusLG: 18,
        headerFontSize: 18,
        headerFontSizeSM: 16,
        paddingLG: 20,
      },
      Button: {
        colorPrimaryHover: theme === 'dark' ? '#cbd5e1' : '#27272a',
        colorPrimaryActive: theme === 'dark' ? '#94a3b8' : '#3f3f46',
        colorBgTextHover: theme === 'dark' ? '#2d3343' : '#f4f4f5',
        colorBgTextActive: theme === 'dark' ? '#3b4358' : '#e4e4e7',
        borderRadius: 12,
        controlHeight: 38,
        fontWeight: 500,
        paddingInline: 16,
      },
      Table: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        headerBg: theme === 'dark' ? '#11151c' : '#f8fafc',
        headerColor: theme === 'dark' ? '#cbd5e1' : '#71717a',
        rowHoverBg: theme === 'dark' ? '#1e232e' : '#f1f5f9',
        borderColor: theme === 'dark' ? '#2d3343' : '#e4e4e7',
        headerSplitColor: theme === 'dark' ? '#2d3343' : '#e5e7eb',
        cellPaddingBlock: 14,
        cellPaddingInline: 16,
        cellPaddingBlockSM: 12,
        cellPaddingInlineSM: 14,
      },
      Descriptions: {
        colorTextSecondary: theme === 'dark' ? '#cbd5e1' : '#52525b',
        labelBg: theme === 'dark' ? '#11151c' : '#f8fafc',
        itemPaddingBottom: 14,
      },
      Tag: {
        borderRadiusSM: 999,
        defaultBg: theme === 'dark' ? '#1f2937' : '#f4f4f5',
        defaultColor: theme === 'dark' ? '#e5e7eb' : '#3f3f46',
        fontSizeSM: 12,
      },
      Tabs: {
        itemColor: theme === 'dark' ? '#cbd5e1' : '#52525b',
        itemSelectedColor: theme === 'dark' ? '#f8fafc' : '#18181b',
        itemHoverColor: theme === 'dark' ? '#f8fafc' : '#09090b',
        inkBarColor: theme === 'dark' ? '#f8fafc' : '#18181b',
        cardBg: theme === 'dark' ? '#161b22' : '#ffffff',
        horizontalItemGutter: 24,
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
        controlHeight: 38,
      },
      Select: {
        colorBgContainer: theme === 'dark' ? '#161b22' : '#ffffff',
        colorBorder: theme === 'dark' ? '#2d3343' : '#e4e4e7',
        colorPrimaryHover: theme === 'dark' ? '#46506b' : '#d4d4d8',
        colorPrimary: theme === 'dark' ? '#f1f5f9' : '#18181b',
        optionSelectedBg: theme === 'dark' ? '#2d3343' : '#f1f5f9',
        controlHeight: 38,
      },
      Dropdown: {
        colorBgElevated: theme === 'dark' ? '#1e232e' : '#ffffff',
        colorText: theme === 'dark' ? '#f1f5f9' : '#09090b',
        controlItemBgHover: theme === 'dark' ? '#2d3343' : '#f1f5f9',
      }
    }
  };

  return (
    <ConfigProvider
      theme={themeConfig}
      locale={antdLocale}
      renderEmpty={() => <Empty description={emptyDescription} />}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}

export default AppWithTheme;
