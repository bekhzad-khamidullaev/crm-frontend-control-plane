import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AIChatPage from '../../src/pages/ai-chat-page.jsx';

vi.mock('../../src/lib/rbac.js', () => ({
  hasAnyFeature: vi.fn(),
}));

vi.mock('../../src/lib/api/integrations/ai.js', () => ({
  getAIAssistProviders: vi.fn(),
  runAIAssist: vi.fn(),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../src/lib/i18n/index.js', () => ({
  getLocale: () => 'ru',
  t: (key, params = {}) => {
    if (key === 'dashboardPage.errors.licenseFeatureDisabledDescription') {
      return `Функция недоступна по лицензии: ${params.feature}`;
    }
    return key;
  },
}));

vi.mock('../../src/lib/api/licenseFeatureName.ts', () => ({
  default: () => 'AI Chat',
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          error: vi.fn(),
          warning: vi.fn(),
          success: vi.fn(),
        },
      }),
    },
  };
});

describe('AI Chat page license gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '#/ai-chat';
  });

  it('keeps AI Chat non-interactive and skips provider loading without ai.assist', async () => {
    const { hasAnyFeature } = await import('../../src/lib/rbac.js');
    const { getAIAssistProviders } = await import('../../src/lib/api/integrations/ai.js');

    hasAnyFeature.mockReturnValue(false);

    render(<AIChatPage />);

    expect(screen.getByText('AI Chat CRM')).toBeInTheDocument();
    expect(
      screen.getByText('Функция недоступна по лицензии: AI Chat')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Например: Покажи краткий срез по моим активным сделкам и рискам на эту неделю'
      )
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Отправить/i })).toBeDisabled();

    await waitFor(() => {
      expect(getAIAssistProviders).not.toHaveBeenCalled();
    });
  });
});
