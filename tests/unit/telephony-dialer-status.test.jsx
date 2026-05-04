import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('renders compact WS/CALL/SIP status tags', async () => {
    const { default: TelephonyDialerModal } = await import('../../src/components/TelephonyDialerModal.jsx');

    render(<TelephonyDialerModal visible onClose={() => {}} />);

    await waitFor(() => {
      expect(loadTelephonyRuntimeConfig).toHaveBeenCalled();
    });

    expect(await screen.findByText('WS')).toBeInTheDocument();
    expect(screen.getByText('CALL')).toBeInTheDocument();
    expect(screen.getByText('SIP')).toBeInTheDocument();
  });

  it('does not start SIP registration when runtime has no credentials', async () => {
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

    await waitFor(() => {
      expect(loadTelephonyRuntimeConfig).toHaveBeenCalled();
    });
    expect(await screen.findByText('SIP')).toBeInTheDocument();
    expect(sipClient.register).not.toHaveBeenCalled();
  });

  it('attempts SIP registration when runtime has credentials and sipReady=true', async () => {
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

    await waitFor(() => {
      expect(sipClient.register).toHaveBeenCalledWith('200', 'secret');
    });
    expect(screen.getByText('SIP')).toBeInTheDocument();
  });

  it('uses bridge originate and bridge hangup in bridge mode', async () => {
    loadTelephonyRuntimeConfig.mockResolvedValue({
      sipConfig: {
        routeMode: 'bridge',
        extension: '200',
      },
      telephonyCredentials: null,
      sipReady: false,
    });
    initiateCall.mockResolvedValue({
      session_id: 'sess-1',
      to_number: '200',
      from_number: '200',
      call_status: 'ringing',
    });
    hangupActiveCall.mockResolvedValue({ ok: true });

    const { default: TelephonyDialerModal } = await import('../../src/components/TelephonyDialerModal.jsx');
    render(<TelephonyDialerModal visible onClose={() => {}} />);

    const dialInput = await screen.findByPlaceholderText('Введите номер');
    fireEvent.change(dialInput, { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /Позвонить/i }));

    await waitFor(() => {
      expect(initiateCall).toHaveBeenCalledWith({
        to_number: '200',
        from_number: '200',
      });
    });
    expect(sipClient.call).not.toHaveBeenCalled();

    const hangupButton = screen.getByRole('button', { name: 'stop' });
    expect(hangupButton).toBeTruthy();
    fireEvent.click(hangupButton);

    await waitFor(() => {
      expect(hangupActiveCall).toHaveBeenCalledWith('sess-1');
    });
  });
});
