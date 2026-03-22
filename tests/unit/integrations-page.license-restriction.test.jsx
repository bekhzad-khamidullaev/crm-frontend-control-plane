import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationsPage from '../../src/pages/integrations.jsx';
import { LICENSE_RESTRICTION_EVENT } from '../../src/lib/api/licenseRestrictionBus.js';

const {
  getOmnichannelTimeline,
  getOmnichannelDiagnostics,
  replayOmnichannelEvent,
} = vi.hoisted(() => ({
  getOmnichannelTimeline: vi.fn().mockResolvedValue({ count: 0, results: [] }),
  getOmnichannelDiagnostics: vi.fn().mockResolvedValue({
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
    replay_candidates: [
      {
        id: 42,
        channel_type: 'telegram',
        queue_state: 'new',
        replayable: true,
        text: 'Replay me',
        created_at: '2026-03-22T08:00:00Z',
      },
    ],
  }),
  replayOmnichannelEvent: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../src/lib/api/compliance.js', () => ({
  getOmnichannelTimeline,
  getOmnichannelDiagnostics,
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
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [] });
    getOmnichannelDiagnostics.mockResolvedValue({
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
      replay_candidates: [
        {
          id: 42,
          channel_type: 'telegram',
          queue_state: 'new',
          replayable: true,
          text: 'Replay me',
          created_at: '2026-03-22T08:00:00Z',
        },
      ],
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
});
