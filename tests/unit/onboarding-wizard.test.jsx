import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingWizardPage from '../../src/pages/onboarding-wizard.jsx';

const { updateGeneralMock, generalMock } = vi.hoisted(() => ({
  updateGeneralMock: vi.fn().mockResolvedValue({}),
  generalMock: vi.fn().mockResolvedValue({
    company_name: 'ACME CRM',
    company_email: 'team@acme.test',
    company_phone: '+998 90 000 00 00',
    default_language: 'ru',
    timezone: 'Asia/Tashkent',
  }),
}));

const {
  getOnboardingStateMock,
  saveOnboardingProgressMock,
  bootstrapOnboardingTemplateMock,
  restartOnboardingMock,
} = vi.hoisted(() => ({
  getOnboardingStateMock: vi.fn().mockResolvedValue({
    progress: {
      active_step: 0,
      company_draft: {},
      import_result: {},
      selected_template: 'sales_team',
    },
    checklist: [],
    health_score: 0,
    completed_count: 0,
    total_steps: 7,
    next_required_index: 0,
    next_required_key: 'company',
    next_required_title: 'Компания и часовой пояс',
    templates: [{ code: 'sales_team', name: 'Sales Team' }],
  }),
  saveOnboardingProgressMock: vi.fn().mockResolvedValue({}),
  bootstrapOnboardingTemplateMock: vi.fn().mockResolvedValue({ demo_bootstrap: { created_leads: 0, skipped: true } }),
  restartOnboardingMock: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../src/lib/api/settings.js', () => ({
  default: {
    general: generalMock,
    updateGeneral: updateGeneralMock,
  },
}));

vi.mock('../../src/lib/api/onboarding.js', () => ({
  getOnboardingState: getOnboardingStateMock,
  saveOnboardingProgress: saveOnboardingProgressMock,
  bootstrapOnboardingTemplate: bootstrapOnboardingTemplateMock,
  restartOnboarding: restartOnboardingMock,
}));

vi.mock('../../src/lib/api/user.js', () => ({
  getUsers: vi.fn().mockResolvedValue({
    results: [
      { id: 1, username: 'admin', email: 'admin@example.com', roles: ['admin'], is_staff: true, is_superuser: true },
    ],
  }),
  getProfiles: vi.fn().mockResolvedValue({ results: [] }),
}));

vi.mock('../../src/lib/api/reference.js', () => ({
  getStages: vi.fn().mockResolvedValue({
    results: [
      { id: 1, name: 'new' },
      { id: 2, name: 'qualified' },
    ],
  }),
}));

vi.mock('../../src/lib/api/crmData.js', () => ({
  importCrmDataExcel: vi.fn(),
}));

vi.mock('../../src/lib/api/telephony.js', () => ({
  getVoIPConnections: vi.fn().mockResolvedValue({
    results: [{ id: 1, name: 'Main PBX', provider: 'asterisk', active: true }],
  }),
}));

vi.mock('../../src/lib/api/integrations/whatsapp.js', () => ({
  getWhatsAppAccounts: vi.fn().mockResolvedValue({ results: [{ id: 1 }] }),
}));

vi.mock('../../src/lib/api/integrations/instagram.js', () => ({
  getInstagramAccounts: vi.fn().mockResolvedValue({ results: [] }),
}));

vi.mock('../../src/lib/api/integrations/facebook.js', () => ({
  getFacebookPages: vi.fn().mockResolvedValue({ results: [] }),
}));

vi.mock('../../src/lib/api/integrations/telegram.js', () => ({
  getTelegramBots: vi.fn().mockResolvedValue({ results: [] }),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../src/router.js', () => ({
  navigate: vi.fn(),
}));

describe('OnboardingWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders resumable onboarding wizard with checklist and health score', async () => {
    render(<OnboardingWizardPage />);

    await waitFor(() => {
      expect(screen.getByText(/First Run Wizard/i)).toBeInTheDocument();
      expect(screen.getByText(/Onboarding Checklist/i)).toBeInTheDocument();
      expect(screen.getByText(/Health Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Шаг 1\. Компания и часовой пояс/i)).toBeInTheDocument();
    });
  });

  it('saves company settings through the real general settings endpoint wrapper', async () => {
    render(<OnboardingWizardPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('ACME CRM')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('ACME CRM'), {
      target: { value: 'Next CRM' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Сохранить и продолжить/i }));

    await waitFor(() => {
      expect(updateGeneralMock).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Next CRM',
          timezone: 'Asia/Tashkent',
        }),
      );
      expect(saveOnboardingProgressMock).toHaveBeenCalled();
    });
  });
});
