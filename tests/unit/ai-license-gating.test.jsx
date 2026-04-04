import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AIAssistantPanel from '../../src/components/AIAssistantPanel.jsx';

vi.mock('../../src/lib/rbac.js', () => ({
  hasAnyFeature: vi.fn(),
}));

vi.mock('../../src/lib/api/integrations/ai.js', () => ({
  getAIAssistProviders: vi.fn(),
  runAIAssist: vi.fn(),
}));

describe('AI license gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load AI providers and disables panel controls without ai.assist', async () => {
    const { hasAnyFeature } = await import('../../src/lib/rbac.js');
    const { getAIAssistProviders } = await import('../../src/lib/api/integrations/ai.js');

    hasAnyFeature.mockReturnValue(false);

    render(
      <AIAssistantPanel
        entityType="lead"
        entityId={42}
        contextData={{ lead_status: 'new' }}
        initialInput="Summarize lead"
      />
    );

    expect(screen.getByText('AI ассистент недоступен')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeDisabled();
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toBeDisabled();
    expect(comboboxes[1]).toBeDisabled();
    expect(
      screen.getByPlaceholderText('Опишите задачу: что проанализировать или сгенерировать')
    ).toBeDisabled();

    await waitFor(() => {
      expect(getAIAssistProviders).not.toHaveBeenCalled();
    });
  });

  it('loads AI providers when ai.assist is available', async () => {
    const { hasAnyFeature } = await import('../../src/lib/rbac.js');
    const { getAIAssistProviders } = await import('../../src/lib/api/integrations/ai.js');

    hasAnyFeature.mockReturnValue(true);
    getAIAssistProviders.mockResolvedValue([
      { id: 'provider-1', name: 'Default AI', is_default: true, model: 'gpt-test' },
    ]);

    render(<AIAssistantPanel entityType="deal" entityId={7} initialInput="Analyze deal" />);

    await waitFor(() => {
      expect(getAIAssistProviders).toHaveBeenCalledTimes(1);
    });
  });
});
