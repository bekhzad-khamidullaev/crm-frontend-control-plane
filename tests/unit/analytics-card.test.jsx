import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnalyticsCard from '../../src/components/analytics/AnalyticsCard.jsx';

describe('AnalyticsCard', () => {
  it('shows retry action for recoverable errors', () => {
    const onRetry = vi.fn();

    render(
      <AnalyticsCard
        title="Revenue dynamics"
        error={{ details: { message: 'Analytics endpoint unavailable' } }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
    expect(screen.getByText('Analytics endpoint unavailable')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a simple empty state when there is no content', () => {
    render(<AnalyticsCard title="Empty card" />);
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });
});
