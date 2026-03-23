import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Dashboard from '../../src/pages/dashboard.jsx';
import { getActivityFeed, getOverview, normalizeOverview } from '../../src/lib/api/analytics.js';

vi.mock('../../src/lib/api/analytics.js', () => ({
  getOverview: vi.fn(),
  getActivityFeed: vi.fn(),
  normalizeOverview: vi.fn((value) => value),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActivityFeed.mockResolvedValue([]);
  });

  it('explains why summary metrics are hidden when overview access is restricted', async () => {
    getOverview.mockRejectedValue({ status: 403 });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Сводные метрики недоступны')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Текущая лицензия или права доступа ограничивают сводную аналитику дашборда.'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(normalizeOverview).not.toHaveBeenCalled();
  });
});
