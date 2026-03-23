import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationsPage from '../../src/pages/integrations.jsx';
import { LICENSE_RESTRICTION_EVENT } from '../../src/lib/api/licenseRestrictionBus.js';

const REPLAY_EVENT = {
  id: 42,
  channel_type: 'telegram',
  queue_state: 'new',
  replayable: true,
  text: 'Replay me',
  external_id: 'tg-diag-1',
  created_at: '2026-03-22T08:00:00Z',
};

const ARCHIVED_EVENT = {
  id: 43,
  channel_type: 'facebook',
  queue_state: 'resolved',
  replayable: false,
  text: 'Archived thread',
  external_id: 'fb-archived-1',
  created_at: '2026-03-21T08:00:00Z',
};

const buildDiagnosticsResponse = (params = {}) => {
  const scope = String(params?.scope || 'all');
  const channel = String(params?.channel || 'all').toLowerCase();
  const query = String(params?.q || '').toLowerCase();
  const needsAction = String(params?.needs_action || '') === '1';
  const allRows = [REPLAY_EVENT, ARCHIVED_EVENT];

  let filtered = allRows;
  if (scope === 'replayable') filtered = filtered.filter((row) => row.replayable);
  if (scope === 'failures') filtered = [];
  if (scope === 'archived') filtered = [ARCHIVED_EVENT];
  if (channel !== 'all') filtered = filtered.filter((row) => String(row.channel_type || '').toLowerCase() === channel);
  if (needsAction) filtered = filtered.filter((row) => row.replayable);
  if (query) {
    filtered = filtered.filter((row) =>
      [row.external_id, row.text, row.channel_type].filter(Boolean).join(' ').toLowerCase().includes(query)
    );
  }

  return {
    summary: {
      failed_events: 1,
      replayable_events: 1,
      unassigned_events: 0,
      breached_sla: 0,
      transport_health: 'degraded',
      business_health: 'healthy',
    },
    channels: [{ channel: 'telegram', total: 1, failed: 0, replayable: 1, health: 'healthy' }],
    recent_failures: [],
    replay_candidates: [REPLAY_EVENT],
    recent_archived: [ARCHIVED_EVENT],
    filtered_scope: scope,
    filtered_count: filtered.length,
    filtered_events: filtered,
  };
};

const {
  getOmnichannelTimeline,
  getOmnichannelDiagnostics,
  getOmnichannelEventPayload,
  replayOmnichannelEvent,
} = vi.hoisted(() => ({
  getOmnichannelTimeline: vi.fn().mockResolvedValue({ count: 0, results: [] }),
  getOmnichannelDiagnostics: vi.fn(),
  getOmnichannelEventPayload: vi.fn().mockResolvedValue({
    id: 42,
    channel_type: 'telegram',
    queue_state: 'new',
    replayable: true,
    text: 'Replay me',
    external_id: 'tg-diag-1',
    processing_status: 'processed',
    replay_status: 'available',
    replay_count: 0,
    raw_preview: { message_id: 77 },
    raw: { message: { text: 'Replay me' } },
  }),
  replayOmnichannelEvent: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../src/lib/api/compliance.js', () => ({
  getOmnichannelTimeline,
  getOmnichannelDiagnostics,
  getOmnichannelEventPayload,
  replayOmnichannelEvent,
}));
vi.mock('../../src/lib/api/sms.js', () => ({
  default: {
    providers: vi.fn().mockResolvedValue({ results: [] }),
    status: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../src/lib/api/telephony', () => ({
  getTelephonyStats: vi.fn().mockResolvedValue({}),
  getVoIPConnections: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock('../../src/lib/api/integrations/facebook.js', () => ({
  getFacebookPages: vi.fn().mockResolvedValue({ results: [] }),
  disconnectFacebook: vi.fn(),
  testFacebookPage: vi.fn(),
  updateFacebookPage: vi.fn(),
}));
vi.mock('../../src/lib/api/integrations/instagram.js', () => ({
  getInstagramAccounts: vi.fn().mockResolvedValue({ results: [] }),
  disconnectInstagram: vi.fn(),
  testInstagramAccount: vi.fn(),
  updateInstagramAccount: vi.fn(),
}));
vi.mock('../../src/lib/api/integrations/telegram.js', () => ({
  getTelegramBots: vi.fn().mockResolvedValue({ results: [] }),
  disconnectTelegramBot: vi.fn(),
  testTelegramBot: vi.fn(),
  setTelegramWebhook: vi.fn(),
  updateTelegramBot: vi.fn(),
}));
vi.mock('../../src/lib/api/integrations/whatsapp.js', () => ({
  getWhatsAppAccounts: vi.fn().mockResolvedValue({ results: [] }),
  testWhatsAppAccount: vi.fn(),
  disconnectWhatsAppAccount: vi.fn(),
  updateWhatsAppAccount: vi.fn(),
}));
vi.mock('../../src/lib/api/integrations/ai.js', () => ({
  getAIProviders: vi.fn().mockResolvedValue({ results: [] }),
  createAIProvider: vi.fn(),
  updateAIProvider: vi.fn(),
  deleteAIProvider: vi.fn(),
  testAIProviderConnection: vi.fn(),
}));

describe('IntegrationsPage license restriction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/#/integrations');
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [] });
    getOmnichannelDiagnostics.mockImplementation((params = {}) => Promise.resolve(buildDiagnosticsResponse(params)));
    getOmnichannelEventPayload.mockResolvedValue({
      id: 42,
      channel_type: 'telegram',
      queue_state: 'new',
      replayable: true,
      text: 'Replay me',
      external_id: 'tg-diag-1',
      processing_status: 'processed',
      replay_status: 'available',
      replay_count: 0,
      raw_preview: { message_id: 77 },
      raw: { message: { text: 'Replay me' } },
    });
    replayOmnichannelEvent.mockResolvedValue({ success: true });
  });

  it('shows warning and disables refresh on restriction event', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(getOmnichannelDiagnostics).toHaveBeenCalled();
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(LICENSE_RESTRICTION_EVENT, {
          detail: {
            code: 'LICENSE_FEATURE_DISABLED',
            feature: 'integrations.core',
            message: 'Integrations are not available for this license',
          },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/ограничивает доступ к интеграциям/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Integrations are not available/i).length).toBeGreaterThan(0);
    });

    const refreshButtons = screen.getAllByRole('button', { name: /обновить|refresh/i });
    expect(refreshButtons.every((button) => button.hasAttribute('disabled'))).toBe(true);
  });

  it('shows diagnostics row and triggers replay action', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Meta and Inbox Diagnostics/i)).toBeInTheDocument();
      expect(screen.getByText(/Replay me/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /Replay/i })[0]);
    });

    await waitFor(() => {
      expect(replayOmnichannelEvent).toHaveBeenCalledWith(42);
    });
  });

  it('loads event payload and refreshes modal details after replay', async () => {
    replayOmnichannelEvent.mockResolvedValue({
      success: true,
      event: {
        id: 42,
        channel_type: 'telegram',
        queue_state: 'resolved',
        replayable: true,
        text: 'Replay me',
        external_id: 'tg-diag-1',
        processing_status: 'processed',
        replay_status: 'replayed',
        replay_count: 1,
        raw_preview: { message_id: 77 },
        raw: { message: { text: 'Replay me' } },
      },
    });

    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Meta and Inbox Diagnostics/i)).toBeInTheDocument();
      expect(screen.getByText(/Replay me/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /Детали|details/i })[0]);
    });

    const dialogTitle = await screen.findByText(/Детали omnichannel события/i);
    const dialog = dialogTitle.closest('.ant-modal-content') || dialogTitle.parentElement;

    expect(dialog).toBeTruthy();

    await waitFor(() => {
      expect(getOmnichannelEventPayload).toHaveBeenCalledWith(42);
      expect(within(dialog).getByText('External ID').closest('tr')).toHaveTextContent('tg-diag-1');
      expect(within(dialog).getByText('Replay status').closest('tr')).toHaveTextContent('available');
    });

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /Replay/i }));
    });

    await waitFor(() => {
      expect(replayOmnichannelEvent).toHaveBeenCalledWith(42);
      expect(within(dialog).getByText('Replay status').closest('tr')).toHaveTextContent('replayed');
      expect(within(dialog).getByText('Replay count').closest('tr')).toHaveTextContent('1');
    });
  });

  it('filters archived diagnostics rows and copies event identifier', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Meta and Inbox Diagnostics/i)).toBeInTheDocument();
      expect(screen.getByText(/Replay me/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Archived sample/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Archived thread/i)).toBeInTheDocument();
      expect(screen.queryByText(/Replay me/i)).not.toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/external ID, message ID/i), {
        target: { value: 'fb-archived-1' },
      });
    });

    const archivedRow = screen.getByText(/Archived thread/i).closest('tr');
    expect(archivedRow).toBeTruthy();

    await act(async () => {
      fireEvent.click(within(archivedRow).getByTitle(/Скопировать ID/i));
    });

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('fb-archived-1');
    });

    expect(getOmnichannelDiagnostics).toHaveBeenCalledWith(expect.objectContaining({ scope: 'archived' }));
  });

  it('hydrates diagnostics filters from URL hash and queries backend with them', async () => {
    window.history.replaceState(
      null,
      '',
      '/#/integrations?diag_scope=archived&diag_channel=facebook&diag_q=fb-archived-1'
    );

    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(getOmnichannelDiagnostics).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'archived',
          channel: 'facebook',
          q: 'fb-archived-1',
        })
      );
      expect(screen.getByText(/Archived thread/i)).toBeInTheDocument();
      expect(screen.queryByText(/Replay me/i)).not.toBeInTheDocument();
    });
  });
});
