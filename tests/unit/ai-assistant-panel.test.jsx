import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AIAssistantPanel from '../../src/components/AIAssistantPanel.jsx';
import * as aiApi from '../../src/lib/api/integrations/ai.js';
import * as rbac from '../../src/lib/rbac.js';

vi.mock('../../src/lib/api/integrations/ai.js', () => ({
  getAIAssistProviders: vi.fn(),
  runAIAssist: vi.fn(),
}));

vi.mock('../../src/lib/rbac.js', () => ({
  hasAnyFeature: vi.fn(),
}));

describe('AIAssistantPanel ai.assist gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load AI providers when ai.assist is unavailable', () => {
    rbac.hasAnyFeature.mockReturnValue(false);

    render(<AIAssistantPanel entityType="lead" entityId={101} />);

    expect(screen.getByText('AI ассистент недоступен')).toBeInTheDocument();
    expect(aiApi.getAIAssistProviders).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeDisabled();
  });

  it('loads AI providers only when ai.assist is available', async () => {
    rbac.hasAnyFeature.mockReturnValue(true);
    aiApi.getAIAssistProviders.mockResolvedValue([
      { id: 'provider-1', name: 'Gemini', model: 'gemini-2.5-flash', is_default: true },
    ]);

    render(<AIAssistantPanel entityType="lead" entityId={101} />);

    await waitFor(() => {
      expect(aiApi.getAIAssistProviders).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('AI ассистент недоступен')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeEnabled();
  });
});
