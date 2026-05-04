import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from '../../src/pages/analytics.jsx';
import * as analyticsApi from '../../src/lib/api/analytics.js';
import { api } from '../../src/lib/api/client.js';
import mockPredictions from '../../src/lib/api/predictions.js';

const originalGetComputedStyle = window.getComputedStyle;

beforeAll(() => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => originalGetComputedStyle(element));
});

vi.mock('chart.js/auto', () => ({}));

vi.mock('../../src/lib/i18n', () => ({
  t: (key) => key,
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../src/components/analytics', async () => {
  const actual = await vi.importActual('../../src/components/analytics');
  return {
    ...actual,
    AnimatedChart: () => <div data-testid="animated-chart" />,
    PredictionChart: () => <div data-testid="prediction-chart" />,
  };
});

vi.mock('../../src/lib/api/analytics.js', () => ({
  getOverview: vi.fn(),
  getDashboardAnalytics: vi.fn(),
  getFunnelData: vi.fn(),
  getActivityFeed: vi.fn(),
  getLeadChannels: vi.fn(),
  getMarketingCampaigns: vi.fn(),
}));

vi.mock('../../src/lib/api/client.js', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../../src/lib/api/predictions.js', () => ({
  __esModule: true,
  default: {
    status: vi.fn(),
    revenue: { forecast: vi.fn() },
    leads: { forecast: vi.fn() },
    clients: { forecast: vi.fn() },
    nextActions: {
      clients: vi.fn(),
      deals: vi.fn(),
    },
    predictAll: vi.fn(),
  },
}));

function mockBaseResponses() {
  analyticsApi.getOverview.mockResolvedValue({
    total_leads: 20,
    total_contacts: 5,
    total_deals: 4,
    total_revenue: 9000,
    conversion_rate: 20,
  });
  analyticsApi.getDashboardAnalytics.mockResolvedValue({
    tasks_by_status: {},
    monthly_growth: null,
  });
  analyticsApi.getFunnelData.mockResolvedValue([]);
  analyticsApi.getActivityFeed.mockResolvedValue([]);
  analyticsApi.getLeadChannels.mockResolvedValue({
    rows: [
      {
        key: 'telegram',
        channel: 'Telegram',
        leads: 12,
        deals: 3,
        conversion_rate: 25,
        revenue: 2500,
        currency_code: 'RUB',
      },
      {
        key: 'ads',
        channel: 'Paid Ads',
        leads: 8,
        deals: 1,
        conversion_rate: 12.5,
        revenue: 1500,
        currency_code: 'RUB',
      },
    ],
    summary: {
      total_leads: 20,
      total_deals: 4,
      conversion_rate: 20,
      total_revenue: 4000,
    },
  });
  analyticsApi.getMarketingCampaigns.mockResolvedValue({
    rows: [
      {
        key: 'spring',
        campaign: 'Spring Push',
        cost: 3000,
        cpl: 150,
        conversion_rate: 25,
        revenue: 8000,
        currency_code: 'RUB',
      },
    ],
    summary: {
      total_cost: 3000,
      cpl: 150,
      conversion_rate: 25,
      total_revenue: 8000,
    },
  });

  mockPredictions.status.mockResolvedValue({ status: 'ready' });
  mockPredictions.revenue.forecast.mockResolvedValue(null);
  mockPredictions.leads.forecast.mockResolvedValue(null);
  mockPredictions.clients.forecast.mockResolvedValue(null);
  mockPredictions.nextActions.clients.mockResolvedValue([]);
  mockPredictions.nextActions.deals.mockResolvedValue([]);

  api.get.mockResolvedValue({
    summary: {},
    user_adoption: {},
    top_endpoints: [],
    top_users: [],
    daily_breakdown: [],
    failed_attempts: [],
  });
}

describe('AnalyticsPage BI blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaseResponses();
  });

  it('renders lead channels and campaign KPIs with table data', async () => {
    render(<AnalyticsPage />);

    await screen.findByText('BI analytics');
    await screen.findByText('Telegram');
    await screen.findByText('Spring Push');

    expect(analyticsApi.getLeadChannels).toHaveBeenCalledWith({ period: '30d' });
    expect(analyticsApi.getMarketingCampaigns).toHaveBeenCalledWith({ period: '30d' });

    const leadCard = screen.getByText('Leads by channel').closest('.ant-card');
    const campaignCard = screen.getByText('Marketing campaigns').closest('.ant-card');

    expect(leadCard).toBeTruthy();
    expect(campaignCard).toBeTruthy();
    expect(leadCard).toHaveTextContent('Telegram');
    expect(leadCard).toHaveTextContent('20%');
    expect(campaignCard).toHaveTextContent('Spring Push');
    expect(campaignCard).toHaveTextContent(/3\s?000/);
    expect(campaignCard).toHaveTextContent('25%');
  });

  it('shows empty states when BI endpoints return no rows', async () => {
    analyticsApi.getLeadChannels.mockResolvedValue({ rows: [], summary: {} });
    analyticsApi.getMarketingCampaigns.mockResolvedValue({ rows: [], summary: {} });

    render(<AnalyticsPage />);

    await screen.findByText('BI analytics');
    expect(screen.getByText('No lead channels data')).toBeInTheDocument();
    expect(screen.getByText('No marketing campaigns data')).toBeInTheDocument();
  });

  it('keeps the other BI block visible when one endpoint fails', async () => {
    analyticsApi.getLeadChannels.mockRejectedValue(new Error('Lead channels failed'));
    analyticsApi.getMarketingCampaigns.mockResolvedValue({
      rows: [
        {
          key: 'spring',
          campaign: 'Spring Push',
          cost: 3000,
          cpl: 150,
          conversion_rate: 25,
          revenue: 8000,
        },
      ],
      summary: {
        total_cost: 3000,
        cpl: 150,
        conversion_rate: 25,
        total_revenue: 8000,
      },
    });

    render(<AnalyticsPage />);

    await screen.findByText('BI analytics');
    await screen.findByText('Spring Push');
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
    expect(screen.getByText('Spring Push')).toBeInTheDocument();
  });

  it('shows breakdowns instead of single-currency totals for mixed campaign currencies', async () => {
    analyticsApi.getMarketingCampaigns.mockResolvedValue({
      rows: [
        {
          key: 'spring-rub',
          campaign: 'Spring Push',
          cost: 3000,
          cpl: 150,
          conversion_rate: 25,
          revenue: 8000,
          currency_code: 'RUB',
        },
        {
          key: 'spring-usd',
          campaign: 'USD Retargeting',
          cost: 100,
          cpl: 25,
          conversion_rate: 18,
          revenue: 500,
          currency_code: 'USD',
        },
      ],
      summary: {
        total_cost: 3100,
        cpl: 93,
        conversion_rate: 22,
        total_revenue: 8500,
      },
    });

    render(<AnalyticsPage />);

    await screen.findByText('USD Retargeting');
    const campaignCard = screen.getByText('Marketing campaigns').closest('.ant-card');

    expect(campaignCard).toBeTruthy();
    expect(campaignCard.textContent).toMatch(/3\s?000.*₽/);
    expect(campaignCard.textContent).toMatch(/100.*\$/);
    expect(campaignCard.textContent).toMatch(/8\s?000.*₽/);
    expect(campaignCard.textContent).toMatch(/500.*\$/);
    expect(campaignCard).toHaveTextContent('Mixed currencies');
  });

  it('does not invent default app currency for overview revenue without currency metadata', async () => {
    analyticsApi.getLeadChannels.mockResolvedValue({ rows: [], summary: {} });
    analyticsApi.getMarketingCampaigns.mockResolvedValue({ rows: [], summary: {} });

    render(<AnalyticsPage />);

    await screen.findAllByText('Key metrics');

    expect(document.body.textContent).toMatch(/9\s?000/);
    expect(document.body.textContent).not.toContain('₽');
    expect(document.body.textContent).not.toContain('$');
  });

  it('shows an explicit mixed-currency hint for overview revenue when backend marks raw totals', async () => {
    analyticsApi.getOverview.mockResolvedValue({
      total_leads: 20,
      total_contacts: 5,
      total_deals: 4,
      total_revenue: 9000,
      conversion_rate: 20,
      amount_currency: null,
      amount_currency_codes: ['RUB', 'USD'],
      amount_is_mixed_currency: true,
      amount_display_mode: 'mixed_currency_unscaled',
    });
    analyticsApi.getLeadChannels.mockResolvedValue({ rows: [], summary: {} });
    analyticsApi.getMarketingCampaigns.mockResolvedValue({ rows: [], summary: {} });

    render(<AnalyticsPage />);

    await screen.findByText(/analyticsPage\.summary\.mixedRevenueHint|Revenue combines multiple currencies/i);

    expect(document.body.textContent).toMatch(/9\s?000/);
    expect(document.body.textContent).not.toContain('₽');
    expect(document.body.textContent).not.toContain('$');
  });
});
