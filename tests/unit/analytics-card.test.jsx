import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnalyticsCard from '../../src/components/analytics/AnalyticsCard.jsx';

describe('AnalyticsCard', () => {
  it('shows retry action for error state when handler is provided', () => {
    const onRetry = vi.fn();

    render(
      <AnalyticsCard
        title="Card title"
        error={new Error('load failed')}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
  });
});
