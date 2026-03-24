import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsIntegrationsWorkspace from '../../src/pages/settings-integrations-workspace.jsx';

vi.mock('../../src/pages/integrations.jsx', () => ({
  default: ({ embedded }) => <div>{embedded ? 'Embedded integrations surface' : 'Standalone integrations'}</div>,
}));

vi.mock('../../src/lib/api/settings.js', () => ({
  default: {
    general: vi.fn().mockResolvedValue({ company_name: 'ACME CRM', timezone: 'Asia/Tashkent' }),
    updateGeneral: vi.fn().mockResolvedValue({}),
    notifications: vi.fn().mockResolvedValue({ notify_new_leads: true }),
    updateNotifications: vi.fn().mockResolvedValue({}),
    userNotifications: vi.fn().mockResolvedValue({ notify_message_received: true }),
    updateUserNotifications: vi.fn().mockResolvedValue({}),
    security: vi.fn().mockResolvedValue({ session_timeout_minutes: 30 }),
    updateSecurity: vi.fn().mockResolvedValue({}),
    massmail: vi.fn().mockResolvedValue({ emails_per_day: 100 }),
    updateMassmail: vi.fn().mockResolvedValue({}),
    reminders: vi.fn().mockResolvedValue({ check_interval: 15 }),
    updateReminders: vi.fn().mockResolvedValue({}),
    publicEmailDomains: vi.fn().mockResolvedValue({ domains: ['gmail.com'] }),
    webhooks: {
      list: vi.fn().mockResolvedValue({ results: [] }),
      test: vi.fn().mockResolvedValue({}),
    },
    integrationLogs: {
      list: vi.fn().mockResolvedValue({ results: [] }),
      stats: vi.fn().mockResolvedValue({ by_status: { success: 2 } }),
    },
    securitySessions: vi.fn().mockResolvedValue({ results: [] }),
    securityAuditLog: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('../../src/lib/api/crmData.js', () => ({
  exportCrmDataExcel: vi.fn(),
  importCrmDataExcel: vi.fn(),
}));

vi.mock('../../src/lib/api/compliance.js', () => ({
  executeDsrRequest: vi.fn(),
  getComplianceReport: vi.fn().mockResolvedValue({ consent_rate: 95 }),
  getDsrRequests: vi.fn().mockResolvedValue({ results: [] }),
  getRetentionPolicies: vi.fn().mockResolvedValue({ results: [] }),
  runRetentionPolicies: vi.fn(),
}));

vi.mock('../../src/lib/api/plugins.js', () => ({
  default: {
    listExtensions: vi.fn().mockResolvedValue({
      results: [
        {
          id: 'ext-1',
          code: 'com.crm.extension.demo',
          name: 'Demo Extension',
          installed_version: '1.0.0',
          status: 'installed',
          manifest: { manifest_version: 'v1', code: 'com.crm.extension.demo', name: 'Demo Extension', version: '1.0.0' },
        },
      ],
    }),
    compatibilityMatrix: vi.fn().mockResolvedValue([
      { id: 'cmp-1', extension_name: 'Demo Extension', crm_version: '2026.03', compatible: true, reason: 'OK', checked_at: '2026-03-23T00:00:00Z' },
    ]),
    installExtension: vi.fn(),
    upgradeExtension: vi.fn(),
    uninstallExtension: vi.fn(),
    extensionDiagnostics: vi.fn().mockResolvedValue({ diagnostics: { status: 'installed' } }),
  },
}));

describe('SettingsIntegrationsWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unified system workspace by default', async () => {
    render(<SettingsIntegrationsWorkspace defaultTab="system" />);

    await waitFor(() => {
      expect(screen.getByText(/Settings and Integrations Workspace/i)).toBeInTheDocument();
      expect(screen.getByText(/General settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Global notifications/i)).toBeInTheDocument();
    });
  });

  it('switches to embedded integrations tab', async () => {
    render(<SettingsIntegrationsWorkspace defaultTab="system" />);

    fireEvent.click(screen.getByRole('tab', { name: /Интеграции|integrations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Embedded integrations surface/i)).toBeInTheDocument();
    });
  });

  it('renders marketplace tab with extension registry row', async () => {
    render(<SettingsIntegrationsWorkspace defaultTab="marketplace" />);

    await waitFor(() => {
      expect(screen.getByText(/Marketplace Registry/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Demo Extension/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/com\.crm\.extension\.demo/i)).toBeInTheDocument();
    });
  });
});
