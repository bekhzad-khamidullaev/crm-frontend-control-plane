import { DollarOutlined, FallOutlined, RiseOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic } from 'antd';
import {
  buildCurrencyTotals,
  countDistinctCurrencies,
  formatCurrency,
  formatCurrencyBreakdownFromItems,
  formatNumber,
} from '../../lib/utils/format';
import AnimatedChart from './AnimatedChart';

/**
 * DealAnalyticsCard - компонент аналитики сделок
 * @param {Array} deals - массив сделок
 * @param {boolean} showStatistics - показывать статистику
 * @param {boolean} showStageChart - показывать воронку по стадиям
 * @param {boolean} showManagerChart - показывать график по менеджерам
 * @param {boolean} showSourceChart - показывать график по источникам
 * @param {string} size - размер карточек
 * @param {number} chartHeight - высота графиков
 */
function DealAnalyticsCard({
  deals = [],
  showStatistics = true,
  showStageChart = true,
  showManagerChart = true,
  showSourceChart = true,
  size = 'small',
  chartHeight = 300,
}) {
  const dealsWithCurrency = deals.map((deal) => ({
    ...deal,
    analytics_currency_code: deal.currency_code || deal.currency_name || null,
  }));
  const totalAmount = deals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
  const wonDeals = deals.filter((d) => d.stage === 'won' || d.status === 'won');
  const lostDeals = deals.filter((d) => d.stage === 'lost' || d.status === 'lost');
  const distinctCurrencies = countDistinctCurrencies(dealsWithCurrency, {
    amountKey: 'amount',
    currencyKey: 'analytics_currency_code',
  });
  const knownCurrencyTotals = buildCurrencyTotals(dealsWithCurrency, {
    amountKey: 'amount',
    currencyKey: 'analytics_currency_code',
  }).filter(({ currencyCode }) => currencyCode !== 'UNKNOWN');
  const isMixedCurrency = distinctCurrencies > 1;
  const singleCurrencyCode =
    distinctCurrencies === 1 && knownCurrencyTotals.length === 1
      ? knownCurrencyTotals[0].currencyCode
      : null;
  const formatDealAmount = (value) =>
    singleCurrencyCode ? formatCurrency(value, singleCurrencyCode) : formatNumber(value);

  const stats = {
    total: deals.length,
    totalAmount,
    averageAmount: deals.length > 0 ? totalAmount / deals.length : 0,
    winRate: deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : 0,
    won: wonDeals.length,
    lost: lostDeals.length,
  };
  const totalAmountDisplay = isMixedCurrency
    ? formatCurrencyBreakdownFromItems(dealsWithCurrency, {
        amountKey: 'amount',
        currencyKey: 'analytics_currency_code',
      })
    : formatDealAmount(stats.totalAmount);
  const averageAmountDisplay = isMixedCurrency
    ? 'Мультивалютно'
    : formatDealAmount(stats.averageAmount);

  const stageCount = deals.reduce((acc, deal) => {
    const stage = deal.stage || 'new';
    acc[stage] = acc[stage] || { count: 0, amount: 0 };
    acc[stage].count++;
    acc[stage].amount += parseFloat(deal.amount) || 0;
    return acc;
  }, {});

  const stageLabels = {
    new: 'Новые',
    qualification: 'Квалификация',
    proposal: 'Предложение',
    negotiation: 'Переговоры',
    won: 'Выиграно',
    lost: 'Проиграно',
  };

  const stageOrder = ['new', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
  const orderedStages = stageOrder.filter((stage) => stageCount[stage]);

  const stageData = {
    labels: orderedStages.map((stage) => stageLabels[stage] || 'Без этапа'),
    datasets: [
      {
        label: 'Количество сделок',
        data: orderedStages.map((stage) => stageCount[stage]?.count || 0),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
        valueType: 'count',
      },
      ...(!isMixedCurrency
        ? [
            {
              label: 'Сумма сделок',
              data: orderedStages.map((stage) => stageCount[stage]?.amount || 0),
              backgroundColor: 'rgba(82, 196, 26, 0.6)',
              borderColor: 'rgba(82, 196, 26, 1)',
              borderWidth: 2,
              valueType: 'currency',
            },
          ]
        : []),
    ],
  };

  const managerCount = deals.reduce((acc, deal) => {
    const manager = deal.assigned_to_name || deal.owner_name || 'Не назначен';
    acc[manager] = acc[manager] || { count: 0, amount: 0 };
    acc[manager].count++;
    acc[manager].amount += parseFloat(deal.amount) || 0;
    return acc;
  }, {});

  const topManagers = Object.entries(managerCount)
    .sort((a, b) => (isMixedCurrency ? b[1].count - a[1].count : b[1].amount - a[1].amount))
    .slice(0, 5);

  const managerData = {
    labels: topManagers.map(([name]) => name),
    datasets: [
      {
        label: isMixedCurrency ? 'Количество сделок' : 'Сумма сделок',
        data: topManagers.map(([, data]) => (isMixedCurrency ? data.count : data.amount)),
        backgroundColor: [
          'rgba(24, 144, 255, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(114, 46, 209, 0.6)',
          'rgba(19, 194, 194, 0.6)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(114, 46, 209, 1)',
          'rgba(19, 194, 194, 1)',
        ],
        borderWidth: 2,
        valueType: isMixedCurrency ? 'count' : 'currency',
      },
    ],
  };

  // Сделки по источникам
  const sourceCount = deals.reduce((acc, deal) => {
    const source = deal.source || 'direct';
    acc[source] = acc[source] || { count: 0, amount: 0 };
    acc[source].count++;
    acc[source].amount += parseFloat(deal.amount) || 0;
    return acc;
  }, {});

  const sourceLabels = {
    website: 'Веб-сайт',
    referral: 'Рекомендации',
    advertisement: 'Реклама',
    direct: 'Прямые продажи',
    partner: 'Партнеры',
    other: 'Другое',
  };

  const sourceData = {
    labels: Object.keys(sourceCount).map((key) => sourceLabels[key] || key),
    datasets: [
      {
        label: 'Сделки по источникам',
        data: Object.values(sourceCount).map((v) => v.count),
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(82, 196, 26, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(114, 46, 209, 0.8)',
          'rgba(19, 194, 194, 0.8)',
          'rgba(189, 189, 189, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(114, 46, 209, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(189, 189, 189, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const parsedValue =
              typeof context.parsed === 'object'
                ? (context.parsed?.x ?? context.parsed?.y ?? context.parsed?.r ?? 0)
                : (context.parsed ?? 0);

            if (context.dataset.valueType === 'currency') {
              return `${context.dataset.label}: ${formatDealAmount(parsedValue)}`;
            }
            return `${context.dataset.label}: ${formatNumber(parsedValue)}`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const managerChartTitle = isMixedCurrency
    ? 'Топ-5 менеджеров по количеству сделок'
    : 'Топ-5 менеджеров по сумме';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Статистика */}
      {showStatistics && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Всего сделок"
                value={stats.total}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Общая сумма"
                value={stats.totalAmount}
                prefix={<DollarOutlined />}
                formatter={() => totalAmountDisplay}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Средний чек"
                value={stats.averageAmount}
                prefix={<RiseOutlined />}
                formatter={() => averageAmountDisplay}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Win Rate"
                value={stats.winRate}
                suffix="%"
                prefix={stats.winRate > 50 ? <RiseOutlined /> : <FallOutlined />}
                valueStyle={{ color: stats.winRate > 50 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Графики */}
      <Row gutter={16}>
        {showStageChart && (
          <Col xs={24}>
            <Card title="Воронка продаж по стадиям" size={size} className="chart-container">
              <AnimatedChart
                type="bar"
                data={stageData}
                options={{
                  ...barOptions,
                  indexAxis: 'y',
                }}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        {showManagerChart && (
          <Col xs={24} lg={showSourceChart ? 12 : 24}>
            <Card title={managerChartTitle} size={size} className="chart-container">
              <AnimatedChart
                type="bar"
                data={managerData}
                options={barOptions}
                height={chartHeight}
                animationType="bounce"
              />
            </Card>
          </Col>
        )}
        {showSourceChart && (
          <Col xs={24} lg={showManagerChart ? 12 : 24}>
            <Card title="Сделки по источникам" size={size} className="chart-container">
              <AnimatedChart
                type="doughnut"
                data={sourceData}
                options={chartOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
      </Row>
    </Space>
  );
}

export default DealAnalyticsCard;
