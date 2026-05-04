import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DealAnalyticsCard from '../../src/components/analytics/DealAnalyticsCard.jsx';

vi.mock('../../src/components/analytics/AnimatedChart.jsx', () => ({
  default: ({ data }) => <div data-testid="animated-chart">{JSON.stringify(data?.datasets?.map((item) => item.label) || [])}</div>,
}));

describe('DealAnalyticsCard', () => {
  it('shows breakdown and switches manager chart to count mode for mixed currencies', () => {
    render(
      <DealAnalyticsCard
        deals={[
          { id: 1, amount: 3000, currency_code: 'RUB', assigned_to_name: 'Alice', stage: 'won' },
          { id: 2, amount: 100, currency_code: 'USD', assigned_to_name: 'Bob', stage: 'proposal' },
        ]}
        showStageChart={false}
        showSourceChart={false}
      />,
    );

    expect(screen.getByText(/3\s?000.*₽/)).toBeInTheDocument();
    expect(screen.getByText(/100.*\$/)).toBeInTheDocument();
    expect(screen.getByTestId('animated-chart')).toHaveTextContent('Количество сделок');
    expect(screen.getByTestId('animated-chart')).not.toHaveTextContent('Сумма сделок');
  });

  it('keeps money formatting when all deals share one currency', () => {
    render(
      <DealAnalyticsCard
        deals={[
          { id: 1, amount: 3000, currency_code: 'RUB', assigned_to_name: 'Alice', stage: 'won' },
          { id: 2, amount: 1000, currency_code: 'RUB', assigned_to_name: 'Bob', stage: 'proposal' },
        ]}
        showStageChart={false}
        showSourceChart={false}
      />,
    );

    expect(screen.getByText(/4\s?000.*₽/)).toBeInTheDocument();
    expect(screen.getByText(/2\s?000.*₽/)).toBeInTheDocument();
    expect(screen.getByTestId('animated-chart')).toHaveTextContent('Сумма сделок');
  });
});
