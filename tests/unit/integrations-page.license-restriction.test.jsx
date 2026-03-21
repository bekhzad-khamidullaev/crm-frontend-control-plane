import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationsPage from '../../src/pages/integrations.jsx';
import { LICENSE_RESTRICTION_EVENT } from '../../src/lib/api/licenseRestrictionBus.js';

vi.mock('../../src/lib/api/compliance.js', () => ({
  getOmnichannelTimeline: vi.fn().mockResolvedValue({ count: 0, results: [] }),
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
  });

  it('shows warning and disables refresh on restriction event', async () => {
    render(<IntegrationsPage />);

    window.dispatchEvent(
      new CustomEvent(LICENSE_RESTRICTION_EVENT, {
        detail: {
          code: 'LICENSE_FEATURE_DISABLED',
          feature: 'integrations.core',
          message: 'Integrations are not available for this license',
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/ограничивает доступ к интеграциям/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Integrations are not available/i).length).toBeGreaterThan(0);
    });

    const refreshBtn = screen.getByRole('button', { name: /обновить|refresh/i });
    expect(refreshBtn).toBeDisabled();
  });
});
