import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ControlPlaneAdminPage from '../../src/pages/control-plane-admin/ControlPlaneAdminPage.jsx';
import {
  getCpOverview,
  getLicenseMe,
  getLicenseOperationsSummary,
} from '../../src/lib/api/licenseControl.js';

vi.mock('../../src/lib/api/licenseControl.js', () => ({
  getCpOverview: vi.fn(),
  getLicenseMe: vi.fn(),
  getLicenseOperationsSummary: vi.fn(),
}));

vi.mock('../../src/components/LicenseRestrictedResult.jsx', () => ({
  default: ({ restriction }) => (
    <div data-testid="license-restricted-result">
      <span>{restriction.code}</span>
      <span>{restriction.feature}</span>
    </div>
  ),
}));

vi.mock('../../src/pages/control-plane-admin/sections/CustomersSection.jsx', () => ({
  default: () => <div data-testid="customers-section" />,
}));
vi.mock('../../src/pages/control-plane-admin/sections/DeploymentsSection.jsx', () => ({
  default: () => <div data-testid="deployments-section" />,
}));
vi.mock('../../src/pages/control-plane-admin/sections/SubscriptionsSection.jsx', () => ({
  default: () => <div data-testid="subscriptions-section" />,
}));
vi.mock('../../src/pages/control-plane-admin/sections/PlansFeaturesSection.jsx', () => ({
  default: () => <div data-testid="plans-features-section" />,
}));
vi.mock('../../src/pages/control-plane-admin/sections/QueueSection.jsx', () => ({
  default: () => <div data-testid="queue-section" />,
}));
vi.mock('../../src/pages/control-plane-admin/sections/AuditSection.jsx', () => ({
  default: () => <div data-testid="audit-section" />,
}));

describe('ControlPlaneAdminPage license restriction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLicenseMe.mockResolvedValue({
      installed: true,
      status: 'active',
      seat_usage: { used: 3, limit: 25 },
      max_active_users: 25,
      plan_code: 'pro',
    });
    getLicenseOperationsSummary.mockResolvedValue({
      source: 'runtime',
      window_hours: 24,
      generated_at: '2026-04-03T12:00:00Z',
      totals: {
        total_denials: 3,
        unique_codes: 2,
        unique_features: 2,
        unique_correlations: 2,
      },
      by_code: [
        { code: 'LICENSE_FEATURE_DISABLED', count: 2 },
        { code: 'LICENSE_SEAT_LIMIT_EXCEEDED', count: 1 },
      ],
      by_feature: [
        { feature: 'crm.leads', count: 2, top_code: 'LICENSE_FEATURE_DISABLED' },
        { feature: 'integrations.core', count: 1, top_code: 'LICENSE_FEATURE_DISABLED' },
      ],
      trend: [
        {
          bucket_start: '2026-04-03T10:00:00Z',
          total: 2,
          top_code: 'LICENSE_FEATURE_DISABLED',
          codes: [{ code: 'LICENSE_FEATURE_DISABLED', count: 2 }],
        },
        {
          bucket_start: '2026-04-03T11:00:00Z',
          total: 1,
          top_code: 'LICENSE_SEAT_LIMIT_EXCEEDED',
          codes: [{ code: 'LICENSE_SEAT_LIMIT_EXCEEDED', count: 1 }],
        },
      ],
    });
  });

  it('renders license restricted result instead of generic api unavailable state', async () => {
    getCpOverview.mockRejectedValue({
      code: 'LICENSE_FEATURE_DISABLED',
      message: 'Feature is not included in the current license.',
      details: { feature: 'settings.core' },
    });

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('license-restricted-result')).toBeInTheDocument();
    });

    expect(screen.getByText('LICENSE_FEATURE_DISABLED')).toBeInTheDocument();
    expect(screen.getByText('settings.core')).toBeInTheDocument();
    expect(screen.queryByText('Control-plane API unavailable')).not.toBeInTheDocument();
  });

  it('renders trial status and over-limit summary from the compatibility payload', async () => {
    getCpOverview.mockResolvedValue({
      customers: { total: 1 },
      licenses: { active_non_revoked: 1 },
      runtime_queue: { pending_review: 0 },
      deployments: { unlicensed: 0 },
    });
    getLicenseMe.mockResolvedValue({
      installed: true,
      status: 'trial',
      over_limit: true,
      seat_usage: { used: 26, limit: 25, over_limit: true },
      max_active_users: 25,
      plan_code: 'pro',
    });

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('TRIAL')).toBeInTheDocument();
    });

    expect(screen.getByText('OVER LIMIT')).toBeInTheDocument();
    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('renders grace status from the compatibility payload', async () => {
    getCpOverview.mockResolvedValue({
      customers: { total: 1 },
      licenses: { active_non_revoked: 1 },
      runtime_queue: { pending_review: 0 },
      deployments: { unlicensed: 0 },
    });
    getLicenseMe.mockResolvedValue({
      installed: true,
      status: 'grace',
      over_limit: false,
      seat_usage: { used: 25, limit: 25, over_limit: false },
      max_active_users: 25,
      plan_code: 'pro',
    });

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('GRACE')).toBeInTheDocument();
    });
  });

  it('renders recent license denials summary from control-plane overview', async () => {
    getCpOverview.mockResolvedValue({
      customers: { total: 1 },
      licenses: { active_non_revoked: 1 },
      runtime_queue: { pending_review: 0 },
      deployments: { unlicensed: 0 },
      license_denials: {
        last_24h_total: 4,
        top_codes: [{ code: 'LICENSE_FEATURE_DISABLED', count: 3 }],
        recent: [
          {
            id: 11,
            details: {
              code: 'LICENSE_FEATURE_DISABLED',
              correlation_id: 'corr-cp-ui-1',
              path: '/api/cp/overview/',
            },
          },
        ],
      },
    });

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent license denials')).toBeInTheDocument();
    });

    expect(screen.getByText(/24h total:/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('corr-cp-ui-1'))).toBeInTheDocument();
    expect(screen.getAllByText('LICENSE_FEATURE_DISABLED').length).toBeGreaterThan(0);
  });

  it('renders runtime operations summary cards and breakdown tables', async () => {
    getCpOverview.mockResolvedValue({
      customers: { total: 1 },
      licenses: { active_non_revoked: 1 },
      runtime_queue: { pending_review: 0 },
      deployments: { unlicensed: 0 },
    });

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Runtime denial trend (24h)')).toBeInTheDocument();
    });

    expect(screen.getByText('Feature breakdown')).toBeInTheDocument();
    expect(screen.getByText('Top denial codes')).toBeInTheDocument();
    expect(screen.getAllByText('LICENSE_FEATURE_DISABLED').length).toBeGreaterThan(0);
    expect(screen.getByText('crm.leads')).toBeInTheDocument();
    expect(screen.getByText('Runtime denials')).toBeInTheDocument();
  });

  it('shows unavailable state without misleading zero stats for generic overview failures', async () => {
    getCpOverview.mockRejectedValue(new Error('cp endpoint unavailable'));

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Control-plane API unavailable')).toBeInTheDocument();
    });

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });
});
