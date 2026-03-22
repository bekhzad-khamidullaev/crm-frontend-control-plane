import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ControlPlaneAdminPage from '../../src/pages/control-plane-admin/ControlPlaneAdminPage.jsx';
import { getCpOverview, getLicenseMe } from '../../src/lib/api/licenseControl.js';

vi.mock('../../src/lib/api/licenseControl.js', () => ({
  getCpOverview: vi.fn(),
  getLicenseMe: vi.fn(),
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

  it('shows unavailable state without misleading zero stats for generic overview failures', async () => {
    getCpOverview.mockRejectedValue(new Error('cp endpoint unavailable'));

    render(<ControlPlaneAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Control-plane API unavailable')).toBeInTheDocument();
    });

    const customersTitle = screen
      .getAllByText('Customers')
      .find((node) => node.classList.contains('ant-statistic-title'));
    const customersCard = customersTitle?.closest('.ant-card');
    expect(customersCard).not.toBeNull();
    expect(within(customersCard).getByText('—')).toBeInTheDocument();
    expect(within(customersCard).queryByText('0')).not.toBeInTheDocument();
  });
});
