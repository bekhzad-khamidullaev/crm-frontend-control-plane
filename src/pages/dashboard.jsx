import Chart from 'chart.js/auto';
import {
    AlertTriangle,
    BarChart3,
    CalendarClock,
    ChevronUp,
    DollarSign,
    LineChart,
    Timer,
    Trophy,
    User,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CampaignsWidget, MemosWidget, RevenueChart } from '../components';
import { AnalyticsWrapper, ContactAnalyticsCard, DealAnalyticsCard, LeadAnalyticsCard } from '../components/analytics';
import AnalyticsCard from '../components/analytics/AnalyticsCard.jsx';
import AnalyticsStatusBanner from '../components/analytics/AnalyticsStatusBanner.jsx';
import PredictionChart from '../components/analytics/PredictionChart.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip.jsx';
import { getActivityFeed, getDashboardAnalytics, getFunnelData, getOverview, normalizeOverview } from '../lib/api/analytics.js';
import { getContacts, getDeals, getLeads } from '../lib/api/client.js';
import { t } from '../lib/i18n';
import { formatCurrency } from '../lib/utils/format.js';
import { navigate } from '../router.js';

function Dashboard() {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [activity, setActivity] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leadsLastUpdate, setLeadsLastUpdate] = useState(null);
  const [contactsLastUpdate, setContactsLastUpdate] = useState(null);
  const [dealsLastUpdate, setDealsLastUpdate] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [funnelError, setFunnelError] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [leadsError, setLeadsError] = useState(null);
  const [contactsError, setContactsError] = useState(null);
  const [dealsError, setDealsError] = useState(null);

  const chartRefs = {
    leadSource: useRef(null),
    leadStatus: useRef(null),
    revenue: useRef(null),
    funnelChart: useRef(null),
    monthlyGrowth: useRef(null),
  };
  const chartInstances = useRef({});

  useEffect(() => {
    if (window.location.hash.includes('/login')) {
      return;
    }
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setOverviewError(null);
    setAnalyticsError(null);
    setFunnelError(null);
    setActivityError(null);
    setLeadsError(null);
    setContactsError(null);
    setDealsError(null);
    setLoadingOverview(true);
    setLoadingAnalytics(true);
    setLoadingFunnel(true);
    setLoadingActivity(true);
    setLoadingLeads(true);
    setLoadingContacts(true);
    setLoadingDeals(true);
    await Promise.allSettled([
      (async () => {
        try {
          const res = await getOverview();
          setOverview(normalizeOverview(res));
        } catch (e) {
          setOverviewError(e);
        } finally {
          setLoadingOverview(false);
        }
      })(),
      (async () => {
        try {
          const res = await getDashboardAnalytics({ period });
          setAnalytics(res);
        } catch (e) {
          setAnalyticsError(e);
        } finally {
          setLoadingAnalytics(false);
        }
      })(),
      (async () => {
        try {
          const res = await getFunnelData({ period });
          setFunnel(res || []);
        } catch (e) {
          setFunnelError(e);
        } finally {
          setLoadingFunnel(false);
        }
      })(),
      (async () => {
        try {
          const res = await getActivityFeed({ period });
          setActivity(res || []);
        } catch (e) {
          setActivityError(e);
        } finally {
          setLoadingActivity(false);
        }
      })(),
      (async () => {
        try {
          const res = await getLeads();
          setLeads(res?.results || []);
          setLeadsLastUpdate(new Date());
        } catch (e) {
          setLeadsError(e);
        } finally {
          setLoadingLeads(false);
        }
      })(),
      (async () => {
        try {
          const res = await getContacts();
          setContacts(res?.results || []);
          setContactsLastUpdate(new Date());
        } catch (e) {
          setContactsError(e);
        } finally {
          setLoadingContacts(false);
        }
      })(),
      (async () => {
        try {
          const res = await getDeals();
          setDeals(res?.results || []);
          setDealsLastUpdate(new Date());
        } catch (e) {
          setDealsError(e);
        } finally {
          setLoadingDeals(false);
        }
      })(),
    ]);
  };

  useEffect(() => {
    if (loadingAnalytics || !analytics) return;
    if (loadingLeads || loadingDeals) return;
    Object.keys(chartInstances.current).forEach((key) => {
      if (chartInstances.current[key]) {
        chartInstances.current[key].destroy();
      }
    });

    buildCharts();

    return () => {
      Object.keys(chartInstances.current).forEach((key) => {
        if (chartInstances.current[key]) {
          chartInstances.current[key].destroy();
        }
      });
    };
  }, [loadingAnalytics, analytics, loadingLeads, leads, loadingDeals, deals]);

  const buildCharts = () => {
    const normalizeBuckets = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) {
        return data
          .map((item) => ({
            label: item.label || item.name || item.source || item.status || item.key || '',
            value: item.value ?? item.count ?? item.total ?? 0,
          }))
          .filter((item) => item.label);
      }
      if (typeof data === 'object') {
        return Object.entries(data).map(([label, value]) => ({
          label,
          value: typeof value === 'number' ? value : Number(value) || 0,
        }));
      }
      return [];
    };

    if (chartRefs.revenue.current && analytics?.monthly_growth && !analytics.monthly_growth._isSummary && analytics.monthly_growth.revenue?.length) {
      const ctx = chartRefs.revenue.current.getContext('2d');
      chartInstances.current.revenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: analytics.monthly_growth.labels,
          datasets: [
            {
              label: 'Выручка',
              data: analytics.monthly_growth.revenue,
              borderColor: 'rgb(22, 119, 255)',
              backgroundColor: 'rgba(22, 119, 255, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
    }

    if (chartRefs.monthlyGrowth.current && analytics?.monthly_growth) {
      const ctx = chartRefs.monthlyGrowth.current.getContext('2d');
      const isSummary = analytics.monthly_growth._isSummary;
      const datasets = isSummary
        ? [
            {
              label: 'Итого',
              data: analytics.monthly_growth.leads,
              backgroundColor: [
                'rgba(82, 196, 26, 0.6)',
                'rgba(22, 119, 255, 0.6)',
                'rgba(250, 140, 22, 0.6)',
              ],
              borderWidth: 1,
            },
          ]
        : [
            {
              label: 'Лиды',
              data: analytics.monthly_growth.leads,
              backgroundColor: 'rgba(82, 196, 26, 0.6)',
              borderColor: 'rgb(82, 196, 26)',
              borderWidth: 1,
            },
            {
              label: 'Сделки',
              data: analytics.monthly_growth.deals,
              backgroundColor: 'rgba(22, 119, 255, 0.6)',
              borderColor: 'rgb(22, 119, 255)',
              borderWidth: 1,
            },
          ];
      chartInstances.current.monthlyGrowth = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: analytics.monthly_growth.labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // Compute lead sources from leads array if not in analytics
    let leadSources = normalizeBuckets(
      analytics?.lead_sources || analytics?.leads_by_source || analytics?.sources
    );
    if (!leadSources.length && leads.length) {
      const sourceLabels = { web: 'Сайт', referral: 'Реферал', call: 'Звонок', email: 'Email', social: 'Соцсети' };
      const counts = {};
      leads.forEach(l => {
        const src = l.lead_source?.name || (typeof l.lead_source === 'string' ? l.lead_source : null) || l.source || 'Другое';
        counts[src] = (counts[src] || 0) + 1;
      });
      leadSources = Object.entries(counts).map(([label, value]) => ({ label: sourceLabels[label] || label, value }));
    }

    if (chartRefs.leadSource.current && leadSources.length) {
      const ctx = chartRefs.leadSource.current.getContext('2d');
      chartInstances.current.leadSource = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: leadSources.map((s) => s.label),
          datasets: [
            {
              data: leadSources.map((s) => s.value),
              backgroundColor: [
                'rgba(22, 119, 255, 0.8)',
                'rgba(82, 196, 26, 0.8)',
                'rgba(250, 140, 22, 0.8)',
                'rgba(114, 46, 209, 0.8)',
                'rgba(255, 77, 79, 0.8)',
              ],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
      });
    }

    // Compute lead statuses from leads array if not in analytics
    let leadStatus = normalizeBuckets(
      analytics?.lead_statuses || analytics?.leads_by_status || analytics?.statuses
    );
    if (!leadStatus.length && leads.length) {
      const statusLabels = { active: 'Активный', disqualified: 'Дисквалиф.', converted: 'Конвертирован' };
      const counts = {};
      leads.forEach(l => {
        const st = l.disqualified ? 'disqualified' : (l.was_in_touch ? 'converted' : 'active');
        const label = statusLabels[st] || st;
        counts[label] = (counts[label] || 0) + 1;
      });
      leadStatus = Object.entries(counts).map(([label, value]) => ({ label, value }));
    }

    if (chartRefs.leadStatus.current && leadStatus.length) {
      const ctx = chartRefs.leadStatus.current.getContext('2d');
      chartInstances.current.leadStatus = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: leadStatus.map((s) => s.label),
          datasets: [
            {
              label: 'Количество',
              data: leadStatus.map((s) => s.value),
              backgroundColor: [
                'rgba(24, 144, 255, 0.6)',
                'rgba(250, 173, 20, 0.6)',
                'rgba(255, 77, 79, 0.6)',
                'rgba(82, 196, 26, 0.6)',
              ],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
      });
    }

    if (chartRefs.funnelChart.current && funnel.length > 0) {
      const ctx = chartRefs.funnelChart.current.getContext('2d');
      chartInstances.current.funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: funnel.map((f) => f.label),
          datasets: [
            {
              label: 'Сумма',
              data: funnel.map((f) => f.value),
              backgroundColor: 'rgba(22, 119, 255, 0.6)',
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
    }
  };


  const getActivityIcon = (type) => {
    switch (type) {
      case 'lead_created':
        return <User className="h-4 w-4" />;
      case 'deal_won':
        return <Trophy className="h-4 w-4" />;
      case 'contact_updated':
        return <Users className="h-4 w-4" />;
      default:
        return <Timer className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LineChart className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Аналитика и дашборд</h1>
          {analyticsError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Частично доступен
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{t('dashboard.analytics.partialTooltip')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Период:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="90d">90 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData}>Обновить</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" /> Обзор
          </TabsTrigger>
          <TabsTrigger value="leads">
            <User className="mr-2 h-4 w-4" /> Лиды
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="mr-2 h-4 w-4" /> Контакты
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Trophy className="mr-2 h-4 w-4" /> Сделки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsError && (
            <AnalyticsStatusBanner
              message="Аналитика временно недоступна (ошибка сервера)"
              details={analyticsError?.message}
              onRetry={loadDashboardData}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Всего лидов"
              value={overview?.total_leads || 0}
              icon={<User className="h-4 w-4" />}
              suffix={overview?.leads_growth > 0 ? `+${overview.leads_growth}%` : null}
              loading={loadingOverview}
            />
            <StatCard
              title="Всего контактов"
              value={overview?.total_contacts || 0}
              icon={<Users className="h-4 w-4" />}
              loading={loadingOverview}
            />
            <StatCard
              title="Всего сделок"
              value={overview?.total_deals || 0}
              icon={<Trophy className="h-4 w-4" />}
              suffix={overview?.deals_growth > 0 ? `+${overview.deals_growth}%` : null}
              loading={loadingOverview}
            />
            <StatCard
              title="Выручка"
              value={formatCurrency(overview?.total_revenue || 0)}
              icon={<DollarSign className="h-4 w-4" />}
              suffix={overview?.revenue_growth > 0 ? `+${overview.revenue_growth}%` : null}
              loading={loadingOverview}
            />
          </div>

          {!analyticsError && (
            <div className="grid gap-4 lg:grid-cols-2">
              <AnalyticsCard title="Динамика выручки" loading={loadingAnalytics} error={undefined}>
                <div className="h-[300px]">
                  <canvas ref={chartRefs.revenue}></canvas>
                </div>
              </AnalyticsCard>
              <AnalyticsCard title="Рост лидов и сделок" loading={loadingAnalytics} error={undefined}>
                <div className="h-[300px]">
                  <canvas ref={chartRefs.monthlyGrowth}></canvas>
                </div>
              </AnalyticsCard>
            </div>
          )}

          {!analyticsError && (
            <AnalyticsCard
              title={
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span>{t('dashboard.analytics.predictionTitle')}</span>
                </div>
              }
              loading={loadingAnalytics}
              error={undefined}
            >
              {analytics?.prediction && (
                <PredictionChart
                  labels={analytics.prediction.labels}
                  predictedData={analytics.prediction.predicted_revenue}
                  confidenceLower={analytics.prediction.confidence_lower}
                  confidenceUpper={analytics.prediction.confidence_upper}
                  title="Прогнозируемая выручка на следующие 6 месяцев"
                  height={350}
                />
              )}
            </AnalyticsCard>
          )}

          {!analyticsError && (
            <div className="grid gap-4 lg:grid-cols-3">
              <AnalyticsCard title="Источники лидов" loading={loadingAnalytics} error={undefined}>
                <div className="h-[300px]">
                  <canvas ref={chartRefs.leadSource}></canvas>
                </div>
              </AnalyticsCard>
              <AnalyticsCard title="Статус лидов" loading={loadingAnalytics} error={undefined}>
                <div className="h-[300px]">
                  <canvas ref={chartRefs.leadStatus}></canvas>
                </div>
              </AnalyticsCard>
              <AnalyticsCard title="Воронка продаж" loading={loadingFunnel} error={funnelError}>
                <div className="h-[300px]">
                  <canvas ref={chartRefs.funnelChart}></canvas>
                </div>
              </AnalyticsCard>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <MemosWidget />
            <CampaignsWidget />
            <RevenueChart />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsCard title="Последняя активность" loading={loadingActivity} error={activityError}>
              <div className="space-y-4">
                {activity.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">Нет активности</div>
              )}
              {activity.map((item) => (
                  <div key={item.id || item.timestamp} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getActivityIcon(item.type)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium">{item.title || item.message || item.type}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {item.user ? `${item.user} • ` : ''}{formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Статистика задач" loading={loadingAnalytics} error={analyticsError}>
              {!analyticsError && analytics?.tasks_by_status && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatBadge label="В ожидании" value={analytics.tasks_by_status.pending} />
                    <StatBadge label="В работе" value={analytics.tasks_by_status.in_progress} />
                    <StatBadge label="Завершено" value={analytics.tasks_by_status.completed} />
                    <StatBadge label="Просрочено" value={analytics.tasks_by_status.overdue} />
                  </div>
                  <Separator />
                  <div className="text-center text-sm font-medium">
                    Конверсия: {overview?.conversion_rate ?? 0}%
                  </div>
                </div>
              )}
            </AnalyticsCard>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <AnalyticsWrapper
            title=""
            onPeriodChange={(periodValue, customRange) => {
              console.log('Period changed:', periodValue, customRange);
            }}
            onRefresh={() => loadDashboardData()}
            exportData={leads.map((l) => ({
              Статус: l.status,
              Имя: l.name,
              Email: l.email,
              Телефон: l.phone,
              Источник: l.source,
              Создан: l.created_at,
            }))}
            loading={loadingLeads}
            showFilters={true}
            showExport={true}
            enableRealTime={true}
            realTimeInterval={30000}
            lastUpdate={leadsLastUpdate}
            onRealTimeToggle={(enabled) => {
              console.log('Real-time toggle:', enabled);
            }}
            extra={
              <Button variant="link" onClick={() => navigate('/leads')}>
                Перейти к лидам →
              </Button>
            }
          >
            {leadsError ? (
              <div className="text-center text-sm text-muted-foreground">Не удалось загрузить данные о лидах</div>
            ) : (
              <LeadAnalyticsCard
                leads={leads}
                showStatistics={true}
                showStatusChart={true}
                showSourceChart={true}
                showFunnelChart={true}
                size="small"
                chartHeight={320}
                enableDrillDown={true}
                onLeadClick={(lead) => {
                  navigate(`/leads/${lead.id}`);
                }}
              />
            )}
          </AnalyticsWrapper>
        </TabsContent>

        <TabsContent value="contacts">
          <AnalyticsWrapper
            title=""
            onPeriodChange={(periodValue, customRange) => {
              console.log('Period changed:', periodValue, customRange);
            }}
            onRefresh={() => loadDashboardData()}
            exportData={contacts.map((c) => ({
              Имя: c.name,
              Email: c.email,
              Телефон: c.phone,
              Компания: c.company,
              Тип: c.type,
              Создан: c.created_at,
            }))}
            loading={loadingContacts}
            showFilters={true}
            showExport={true}
            enableRealTime={true}
            realTimeInterval={30000}
            lastUpdate={contactsLastUpdate}
            extra={
              <Button variant="link" onClick={() => navigate('/contacts')}>
                Перейти к контактам →
              </Button>
            }
          >
            {contactsError ? (
              <div className="text-center text-sm text-muted-foreground">Не удалось загрузить данные о контактах</div>
            ) : (
              <ContactAnalyticsCard
                contacts={contacts}
                showStatistics={true}
                showTypeChart={true}
                showSourceChart={true}
                showActivityChart={true}
                size="small"
                chartHeight={320}
              />
            )}
          </AnalyticsWrapper>
        </TabsContent>

        <TabsContent value="deals">
          <AnalyticsWrapper
            title=""
            onPeriodChange={(periodValue, customRange) => {
              console.log('Period changed:', periodValue, customRange);
            }}
            onRefresh={() => loadDashboardData()}
            exportData={deals.map((d) => ({
              Название: d.title,
              Сумма: d.amount,
              Стадия: d.stage,
              Контакт: d.contact,
              Компания: d.company,
              Ответственный: d.owner,
              Создан: d.created_at,
            }))}
            loading={loadingDeals}
            showFilters={true}
            showExport={true}
            enableRealTime={true}
            realTimeInterval={30000}
            lastUpdate={dealsLastUpdate}
            extra={
              <Button variant="link" onClick={() => navigate('/deals')}>
                Перейти к сделкам →
              </Button>
            }
          >
            {dealsError ? (
              <div className="text-center text-sm text-muted-foreground">Не удалось загрузить данные о сделках</div>
            ) : (
              <DealAnalyticsCard
                deals={deals}
                showStatistics={true}
                showStageChart={true}
                showManagerChart={true}
                showSourceChart={true}
                size="small"
                chartHeight={320}
              />
            )}
          </AnalyticsWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon, suffix, loading }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-lg font-semibold">
            {loading ? '...' : value}
          </div>
          {suffix && (
            <Badge variant="secondary" className="mt-1">
              <ChevronUp className="mr-1 h-3 w-3" />
              {suffix}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value ?? 0}</div>
    </div>
  );
}

export default Dashboard;
