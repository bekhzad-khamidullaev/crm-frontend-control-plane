import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as licenseApi from '../../src/lib/api/license.js';
import LicenseWorkspacePage from '../../src/pages/license-workspace.jsx';

vi.mock('../../src/lib/api/license.js', () => ({
  getLicenseChallenge: vi.fn(),
  getLicenseEntitlements: vi.fn(),
  getLicenseEvents: vi.fn(),
  getLicenseUxSummary: vi.fn(),
  installLicenseBundle: vi.fn(),
  installLicenseArtifact: vi.fn(),
  requestLicenseFromControlPlane: vi.fn(),
  verifyLicenseArtifact: vi.fn(),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../src/lib/i18n/index.js', () => ({
  t: (key) => key,
}));

const baseEntitlements = {
  status: 'active',
  installed: true,
  license_id: 'LIC-2025',
  customer_name: 'Acme Corp',
  instance_id: 'crm-instance-001',
  plan_code: 'PRO-001',
  valid_from: '2025-01-01T00:00:00Z',
  valid_to: '2026-06-30T00:00:00Z',
  grace_until: '2026-07-15T00:00:00Z',
  last_validation_at: '2026-03-21T12:00:00Z',
  last_heartbeat_at: '2026-03-22T08:30:00Z',
  seat_usage: {
    used: 4,
    limit: 10,
    available: 6,
    utilization_percent: 40,
    over_limit: false,
  },
};

const updatedEntitlements = {
  ...baseEntitlements,
  license_id: 'LIC-2026',
  plan_code: 'PRO-002',
  seat_usage: {
    used: 5,
    limit: 12,
    available: 7,
    utilization_percent: 42,
    over_limit: false,
  },
};

const challengeResponse = {
  runtime_instance_id: 'crm-instance-001',
  nonce: 'challenge-nonce-123',
  features: ['platform.core', 'contacts'],
};

const signedArtifact = {
  payload: {
    license_id: 'LIC-2026',
    features: ['platform.core', 'contacts'],
  },
  signature: 'signed-artifact-signature',
};

async function openManualInstallMode() {
  fireEvent.click(screen.getByText('Расширенные детали (для поддержки)'));
  fireEvent.click(await screen.findByRole('button', { name: /Открыть ручной режим/i }));
}

function renderPage() {
  return render(<LicenseWorkspacePage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  licenseApi.getLicenseEntitlements.mockResolvedValue(baseEntitlements);
  licenseApi.getLicenseUxSummary.mockResolvedValue({
    permissions: { can_manage_license: true },
    auto_request: { control_plane_host: '' },
    recommended_flow: null,
    blocking_reasons: [],
  });
});

describe('LicenseWorkspacePage', () => {
  it('renders the license summary after loading entitlements', async () => {
    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Лицензия компании')).toBeInTheDocument();
    expect(screen.getByText('PRO-001')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('generates and shows a challenge in the activation workflow', async () => {
    licenseApi.getLicenseChallenge.mockResolvedValueOnce(challengeResponse);

    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Сформировать код запроса/i }));

    await waitFor(() => {
      expect(licenseApi.getLicenseChallenge).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: /Скопировать код/i })).not.toBeDisabled();
  });

  it('verifies the signed artifact from the activation modal', async () => {
    licenseApi.verifyLicenseArtifact.mockResolvedValueOnce({ valid_signature: true });

    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    await openManualInstallMode();

    const payloadField = await screen.findByLabelText('Payload JSON');
    const signatureField = screen.getByLabelText('Signature');

    fireEvent.change(payloadField, {
      target: { value: JSON.stringify(signedArtifact.payload, null, 2) },
    });
    fireEvent.change(signatureField, {
      target: { value: signedArtifact.signature },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(licenseApi.verifyLicenseArtifact).toHaveBeenCalledWith(
        signedArtifact.payload,
        signedArtifact.signature,
      );
    });
  });

  it('installs bundle file and refreshes entitlements', async () => {
    licenseApi.getLicenseEntitlements
      .mockResolvedValueOnce(baseEntitlements)
      .mockResolvedValueOnce(updatedEntitlements);
    licenseApi.installLicenseBundle.mockResolvedValueOnce({
      license_id: updatedEntitlements.license_id,
    });

    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const bundleFile = new File(['bundle-content'], 'license-bundle.licb', {
      type: 'application/octet-stream',
    });
    fireEvent.change(fileInput, { target: { files: [bundleFile] } });
    fireEvent.click(screen.getByRole('button', { name: /Установить bundle файл/i }));

    await waitFor(() => {
      expect(licenseApi.installLicenseBundle).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText('PRO-002')).toBeInTheDocument();
  });

  it('requires re-verification when payload changes after successful verify', async () => {
    licenseApi.verifyLicenseArtifact.mockResolvedValueOnce({ valid_signature: true });

    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    await openManualInstallMode();

    const payloadField = await screen.findByLabelText('Payload JSON');
    const signatureField = screen.getByLabelText('Signature');
    fireEvent.change(payloadField, {
      target: { value: JSON.stringify(signedArtifact.payload, null, 2) },
    });
    fireEvent.change(signatureField, {
      target: { value: signedArtifact.signature },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(licenseApi.verifyLicenseArtifact).toHaveBeenCalledWith(
        signedArtifact.payload,
        signedArtifact.signature,
      );
    });

    fireEvent.change(payloadField, {
      target: {
        value: JSON.stringify(
          {
            ...signedArtifact.payload,
            license_id: 'LIC-CHANGED',
          },
          null,
          2,
        ),
      },
    });

    expect(
      await screen.findByText('Artifact changed. Re-verify before install.')
    ).toBeInTheDocument();
  });

  it('shows rejected request state when control-plane declines online request', async () => {
    licenseApi.requestLicenseFromControlPlane.mockRejectedValueOnce({
      details: {
        code: 'LICENSE_REQUEST_REJECTED',
        request_status: 'rejected',
        request_id: 'req-77',
        control_plane_message: 'Domain is not linked to an approved deployment.',
      },
      message: 'License request was rejected by control-plane.',
    });

    renderPage();

    await waitFor(() => {
      expect(licenseApi.getLicenseEntitlements).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Продлить автоматически/i }));

    expect(
      await screen.findByText('Заявка отклонена')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Domain is not linked to an approved deployment.')
    ).toBeInTheDocument();
  });
});
