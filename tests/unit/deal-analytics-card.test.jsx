import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DealAnalyticsCard from '../../src/components/analytics/DealAnalyticsCard.jsx';

const chartCalls = vi.hoisted(() => []);

vi.mock('../../src/components/analytics/AnimatedChart.jsx', () => ({
  default: (props) => {
    chartCalls.push(props);
    return <div data-testid={`chart-${props.type}`} />;
  },
}));

describe('DealAnalyticsCard', () => {
  beforeEach(() => {
    chartCalls.length = 0;
  });

  it('switches to count-based charts for mixed currencies', () => {
    render(
      <DealAnalyticsCard
        deals={[
          {
            amount: '100',
            currency_code: 'USD',
            stage: 'won',
            assigned_to_name: 'Alice',
            source: 'website',
          },
          {
            amount: '200',
            currency_code: 'EUR',
            stage: 'lost',
            assigned_to_name: 'Bob',
            source: 'referral',
          },
          {
            amount: '50',
            currency_code: 'USD',
            stage: 'won',
            assigned_to_name: 'Alice',
            source: 'website',
          },
        ]}
      />
    );

    expect(screen.getByText('Топ-5 менеджеров по количеству сделок')).toBeInTheDocument();
    expect(screen.getByText('Мультивалютно')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes(' + '))).toBeInTheDocument();
    expect(chartCalls[0].data.datasets).toHaveLength(1);
    expect(chartCalls[1].data.datasets[0].label).toBe('Количество сделок');
    expect(chartCalls[1].data.datasets[0].data).toEqual([2, 1]);
  });

  it('keeps amount-based charts for a single currency', () => {
    render(
      <DealAnalyticsCard
        deals={[
          {
            amount: '1000',
            currency_name: 'RUB',
            stage: 'won',
            assigned_to_name: 'Alice',
            source: 'website',
          },
          {
            amount: '2500',
            currency_name: 'RUB',
            stage: 'proposal',
            assigned_to_name: 'Bob',
            source: 'direct',
          },
        ]}
      />
    );

    expect(screen.getByText('Топ-5 менеджеров по сумме')).toBeInTheDocument();
    expect(chartCalls[0].data.datasets).toHaveLength(2);
    expect(chartCalls[1].data.datasets[0].label).toBe('Сумма сделок');
    expect(chartCalls[1].data.datasets[0].data).toEqual([2500, 1000]);
  });
});
