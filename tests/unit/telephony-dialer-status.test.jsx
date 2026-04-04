import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadTelephonyRuntimeConfig = vi.fn();
const getActiveCalls = vi.fn(async () => ({ results: [] }));
const hangupActiveCall = vi.fn();
const initiateCall = vi.fn();

const listeners = new Map();
const sipClient = {
  ua: null,
  isRegistered: false,
  callSession: null,
  configure: vi.fn(),
  init: vi.fn(async () => {}),
  register: vi.fn(async () => true),
  call: vi.fn(async () => {}),
  hangup: vi.fn(),
  toggleMute: vi.fn(() => false),
  sendDTMF: vi.fn(),
  on: vi.fn((event, handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
  }),
  off: vi.fn((event, handler) => {
    listeners.get(event)?.delete(handler);
  }),
};

vi.mock('../../src/lib/telephony/runtimeConfig.js', () => ({
  loadTelephonyRuntimeConfig,
}));

vi.mock('../../src/lib/api/telephony.js', () => ({
  getActiveCalls,
  hangupActiveCall,
  initiateCall,
  normalizeTelephonyCallPayload: (payload) => payload,
}));

vi.mock('../../src/lib/telephony/SIPClient.js', () => ({
  default: sipClient,
}));

describe('TelephonyDialerModal status tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    sipClient.ua = null;
    sipClient.isRegistered = false;
    sipClient.register.mockResolvedValue(true);
    loadTelephonyRuntimeConfig.mockResolvedValue({
      sipConfig: {
        routeMode: 'bridge',
        extension: '200',
      },
      telephonyCredentials: null,
      sipReady: false,
    });
  });

  it('renders bridge-only transport and SIP tags for bridge mode', async () => {
    const { default: TelephonyDialerModal } = await import('../../src/components/TelephonyDialerModal.jsx');

    render(<TelephonyDialerModal visible onClose={() => {}} />);

    await waitFor(() => {
      expect(loadTelephonyRuntimeConfig).toHaveBeenCalled();
    });

    expect(await screen.findByText('Транспорт: bridge-only')).toBeInTheDocument();
    expect(screen.getByText('SIP: bridge-only')).toBeInTheDocument();
    expect(screen.getByText('Вызов: ожидание')).toBeInTheDocument();
  });

  it('shows missing credentials when embedded runtime is incomplete', async () => {
    loadTelephonyRuntimeConfig.mockResolvedValue({
      sipConfig: {
        routeMode: 'embedded',
        extension: '200',
      },
      telephonyCredentials: null,
      sipReady: false,
    });

    const { default: TelephonyDialerModal } = await import('../../src/components/TelephonyDialerModal.jsx');

    render(<TelephonyDialerModal visible onClose={() => {}} />);

    expect(await screen.findByText('SIP: no credentials')).toBeInTheDocument();
    expect(screen.getByText('Транспорт: оффлайн')).toBeInTheDocument();
  });

  it('shows registration error when SIP registration times out', async () => {
    loadTelephonyRuntimeConfig.mockResolvedValue({
      sipConfig: {
        routeMode: 'embedded',
        extension: '200',
        username: '200',
        realm: 'pbx.example.local',
        password: 'secret',
        websocketProxyUrl: 'wss://pbx.example.local/ws',
      },
      telephonyCredentials: null,
      sipReady: true,
    });
    sipClient.register.mockRejectedValue(new Error('SIP registration timeout'));

    const { default: TelephonyDialerModal } = await import('../../src/components/TelephonyDialerModal.jsx');

    render(<TelephonyDialerModal visible onClose={() => {}} />);

    expect(await screen.findByText('SIP: registration error')).toBeInTheDocument();
    expect(screen.getByText('Транспорт: оффлайн')).toBeInTheDocument();
  });
});
