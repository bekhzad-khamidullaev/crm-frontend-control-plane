import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();
const onRouteChange = vi.fn(() => () => {});
const getProfile = vi.fn();
const getLicenseEntitlements = vi.fn();
const getAIProviders = vi.fn();
const getVoIPConnections = vi.fn();
const getWhatsAppAccounts = vi.fn();
const getFacebookPages = vi.fn();
const getInstagramAccounts = vi.fn();
const getTelegramBots = vi.fn();
const smsProviders = vi.fn();
const sipClient = {
  configure: vi.fn(),
  init: vi.fn(async () => {}),
  register: vi.fn(async () => {}),
  stop: vi.fn(),
  isRegistered: false,
};
const loadTelephonyRuntimeConfig = vi.fn(async () => null);
const callsWebSocket = {
  on: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};
const chatWebSocket = {
  on: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    App: ({ children }) => <div data-testid="antd-app-shell">{children}</div>,
  };
});

vi.mock('../../src/components/AppLayout.jsx', () => ({
  AppLayout: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('../../src/pages/dashboard.jsx', () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock('../../src/pages/login.jsx', () => ({
  default: () => <div>Login</div>,
}));

vi.mock('../../src/components/TelephonyDialerModal.jsx', () => ({
  default: () => null,
}));

vi.mock('../../src/modules/calls/IncomingCallModal.jsx', () => ({
  default: () => null,
}));

vi.mock('../../src/lib/api/auth.js', () => ({
  clearToken: vi.fn(),
  getToken: vi.fn(() => 'test-token'),
  getUserFromToken: vi.fn(() => ({ username: 'admin', roles: ['admin'] })),
  isAuthenticated: vi.fn(() => true),
}));

vi.mock('../../src/lib/api/license.js', () => ({
  getLicenseEntitlements,
}));

vi.mock('../../src/lib/api/user.js', () => ({
  getProfile,
}));

vi.mock('../../src/lib/api/integrations/ai.js', () => ({
  getAIProviders,
}));

vi.mock('../../src/lib/api/integrations/facebook.js', () => ({
  getFacebookPages,
}));

vi.mock('../../src/lib/api/integrations/instagram.js', () => ({
  getInstagramAccounts,
}));

vi.mock('../../src/lib/api/integrations/telegram.js', () => ({
  getTelegramBots,
}));

vi.mock('../../src/lib/api/integrations/whatsapp.js', () => ({
  getWhatsAppAccounts,
}));

vi.mock('../../src/lib/api/sms.js', () => ({
  default: {
    providers: smsProviders,
  },
}));

vi.mock('../../src/lib/api/telephony.js', () => ({
  getActiveCalls: vi.fn(),
  getVoIPConnections,
}));

vi.mock('../../src/lib/telephony/SIPClient.js', () => ({
  default: sipClient,
}));

vi.mock('../../src/lib/telephony/runtimeConfig.js', () => ({
  loadTelephonyRuntimeConfig,
}));

vi.mock('../../src/lib/websocket/CallsWebSocket.js', () => ({
  default: callsWebSocket,
}));

vi.mock('../../src/lib/websocket/ChatWebSocket.js', () => ({
  default: chatWebSocket,
}));

vi.mock('../../src/lib/rbac.js', async () => {
  const actual = await vi.importActual('../../src/lib/rbac.js');
  return {
    ...actual,
    canAccessRoute: vi.fn(() => true),
    getRouteAccessState: vi.fn(() => ({
      allowed: true,
      reason: null,
      feature: null,
      code: null,
      message: '',
      permissions: [],
      roles: [],
    })),
  };
});

vi.mock('../../src/shared/version.js', () => ({
  getFrontendVersionInfo: vi.fn(async () => ({ version: 'test' })),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../../src/lib/i18n/legacy-content-dom.js', () => ({
  applyLegacyContentLocalization: vi.fn(),
}));

vi.mock('../../src/lib/i18n/index.js', () => ({
  setLocale: vi.fn(),
}));

vi.mock('../../src/lib/store/index.js', () => ({
  addIncomingCall: vi.fn(),
  removeActiveCall: vi.fn(),
  removeIncomingCall: vi.fn(),
  setActiveCalls: vi.fn(),
  setChatWsConnected: vi.fn(),
  setChatWsReconnecting: vi.fn(),
  upsertActiveCall: vi.fn(),
  setWsConnected: vi.fn(),
  setWsReconnecting: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}));

vi.mock('../../src/router.js', () => ({
  navigate,
  onRouteChange,
  parseHash: vi.fn(() => ({ name: 'dashboard', params: {} })),
}));

describe('App AI provider polling gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    getProfile.mockResolvedValue({ username: 'admin', roles: ['admin'], permissions: ['*'] });
    getLicenseEntitlements.mockResolvedValue({ features: [] });
    getAIProviders.mockResolvedValue([]);
    getVoIPConnections.mockResolvedValue([]);
    getWhatsAppAccounts.mockResolvedValue([]);
    getFacebookPages.mockResolvedValue([]);
    getInstagramAccounts.mockResolvedValue([]);
    getTelegramBots.mockResolvedValue([]);
    smsProviders.mockResolvedValue([]);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('does not poll AI providers without ai.assist license', async () => {
    getLicenseEntitlements.mockResolvedValue({ features: ['communications.chat'] });
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['communications.chat']));
    const { default: AppWithTheme } = await import('../../src/App.jsx');

    render(<AppWithTheme />);

    await waitFor(() => {
      expect(smsProviders).toHaveBeenCalledTimes(1);
      expect(getVoIPConnections).toHaveBeenCalledTimes(1);
    });

    expect(getAIProviders).not.toHaveBeenCalled();
  });

  it('polls AI providers when ai.assist license is present', async () => {
    getLicenseEntitlements.mockResolvedValue({ features: ['ai.assist'] });
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['ai.assist']));
    const { default: AppWithTheme } = await import('../../src/App.jsx');

    render(<AppWithTheme />);

    await waitFor(() => {
      expect(getAIProviders).toHaveBeenCalledTimes(1);
    });
  });

  it('does not poll AI providers when ai.assist is cached but license state is expired', async () => {
    getLicenseEntitlements.mockResolvedValue({
      features: ['ai.assist'],
      installed: true,
      status: 'expired',
      over_limit: false,
    });
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['ai.assist']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({ installed: true, status: 'expired', over_limit: false, features: ['ai.assist'] })
    );
    const { default: AppWithTheme } = await import('../../src/App.jsx');

    render(<AppWithTheme />);

    await waitFor(() => {
      expect(smsProviders).toHaveBeenCalledTimes(1);
      expect(getVoIPConnections).toHaveBeenCalledTimes(1);
    });

    expect(getAIProviders).not.toHaveBeenCalled();
  });
});
