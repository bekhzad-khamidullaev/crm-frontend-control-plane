/**
 * CallsCharts Component
 * Reusable charts for call analytics
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Card, Empty } from 'antd';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplayPercent(value) {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  if (Math.abs(parsed) > 0 && Math.abs(parsed) <= 1) {
    return parsed * 100;
  }
  return parsed;
}

function getFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function normalizeTrendItem(item, index) {
  if (!item || typeof item !== 'object') {
    const value = toNumber(item);
    return {
      key: index,
      label: `#${index + 1}`,
      total: value,
    };
  }

  return {
    key: item.key ?? item.id ?? item.date ?? item.day ?? item.label ?? index,
    label:
      item.label ??
      item.date ??
      item.day ??
      item.period ??
      item.bucket ??
      item.slot ??
      `#${index + 1}`,
    total: toNumber(
      getFirstDefined(
        item.total,
        item.total_calls,
        item.calls_total,
        item.calls,
        item.count,
        item.value,
        item.volume
      )
    ),
    answered: toNumber(item.answered ?? item.completed ?? item.connected ?? item.answer_count),
    missed: toNumber(item.missed ?? item.no_answer ?? item.missed_calls),
    abandoned: toNumber(item.abandoned ?? item.abandon ?? item.abandoned_calls),
    answerRate: toDisplayPercent(item.answer_rate ?? item.answerRate ?? item.rate),
    fcrRate: toDisplayPercent(item.fcr_rate ?? item.fcrRate),
    ahtSeconds: toNumber(item.aht_seconds ?? item.ahtSeconds ?? item.aht),
    asaSeconds: toNumber(item.asa_seconds ?? item.asaSeconds ?? item.asa),
  };
}

function normalizeTrendPayload(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeTrendItem(item, index));
  }

  if (value && Array.isArray(value.results)) {
    return value.results.map((item, index) => normalizeTrendItem(item, index));
  }

  if (value && Array.isArray(value.labels)) {
    const labels = value.labels;
    return labels.map((label, index) =>
      normalizeTrendItem(
        {
          key: value.keys?.[index] ?? value.dates?.[index] ?? label ?? index,
          label,
          total: getFirstDefined(
            value.total?.[index],
            value.calls?.[index],
            value.count?.[index],
            value.value?.[index],
            value.volume?.[index]
          ),
          answered: getFirstDefined(
            value.answered?.[index],
            value.completed?.[index],
            value.connected?.[index]
          ),
          missed: getFirstDefined(
            value.missed?.[index],
            value.no_answer?.[index],
            value.missed_calls?.[index]
          ),
          abandoned: getFirstDefined(
            value.abandoned?.[index],
            value.abandon?.[index],
            value.abandoned_calls?.[index]
          ),
          answer_rate: getFirstDefined(
            value.answer_rate?.[index],
            value.answerRate?.[index],
            value.rate?.[index]
          ),
          fcr_rate: getFirstDefined(value.fcr_rate?.[index], value.fcrRate?.[index]),
          aht_seconds: getFirstDefined(
            value.aht_seconds?.[index],
            value.ahtSeconds?.[index],
            value.aht?.[index]
          ),
          asa_seconds: getFirstDefined(
            value.asa_seconds?.[index],
            value.asaSeconds?.[index],
            value.asa?.[index]
          ),
        },
        index
      )
    );
  }

  return [];
}

function buildTrendChartData(currentSeries, previousSeries, metricKey, title, color) {
  const sourceSeries = currentSeries.length > 0 ? currentSeries : previousSeries;
  const labels = sourceSeries.map((row, index) => row.label ?? row.key ?? `#${index + 1}`);
  const currentValues = labels.map((_, index) => currentSeries[index]?.[metricKey] ?? null);
  const previousValues = labels.map((_, index) => previousSeries[index]?.[metricKey] ?? null);
  const hasCurrent = currentValues.some((value) => value !== null && value !== undefined);
  const hasPrevious = previousValues.some((value) => value !== null && value !== undefined);

  if (!hasCurrent && !hasPrevious) {
    return null;
  }

  const datasets = [];
  if (hasCurrent) {
    datasets.push({
      label: title,
      data: currentValues,
      borderColor: color,
      backgroundColor: color.replace('1)', '0.1)'),
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  }

  if (hasPrevious) {
    datasets.push({
      label: 'Previous period',
      data: previousValues,
      borderColor: 'rgba(140, 140, 140, 0.9)',
      backgroundColor: 'rgba(140, 140, 140, 0.08)',
      borderDash: [6, 4],
      fill: false,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 4,
    });
  }

  return {
    labels,
    datasets,
  };
}

function buildTrendOptions(valueFormatter, yTickFormatter) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${label}: -`;
            }
            return `${label}: ${valueFormatter(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          callback(value) {
            return yTickFormatter ? yTickFormatter(value) : value;
          },
        },
      },
    },
  };
}

/**
 * Line chart showing call activity over time
 */
export function CallsActivityChart({ data, loading }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Входящие',
        data: data?.inbound || [],
        borderColor: 'rgb(82, 196, 145)',
        backgroundColor: 'rgba(82, 196, 145, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Исходящие',
        data: data?.outbound || [],
        borderColor: 'rgb(24, 144, 255)',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <Card title="Активность звонков" loading={loading}>
      <div style={{ height: 300 }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Pie chart showing call distribution by type
 */
export function CallsDistributionChart({ data, loading }) {
  const chartData = {
    labels: ['Входящие', 'Исходящие'],
    datasets: [
      {
        data: [data?.inbound || 0, data?.outbound || 0],
        backgroundColor: ['rgba(82, 196, 145, 0.8)', 'rgba(24, 144, 255, 0.8)'],
        borderColor: ['rgb(82, 196, 145)', 'rgb(24, 144, 255)'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card title="Распределение звонков" loading={loading}>
      <div style={{ height: 300 }}>
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Bar chart showing call statistics by status
 */
export function CallsStatusChart({ data, loading }) {
  const chartData = {
    labels: ['Завершенные', 'Пропущенные', 'Занято', 'Ошибка'],
    datasets: [
      {
        label: 'Количество звонков',
        data: [data?.completed || 0, data?.missed || 0, data?.busy || 0, data?.failed || 0],
        backgroundColor: [
          'rgba(82, 196, 145, 0.8)',
          'rgba(255, 77, 79, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(140, 140, 140, 0.8)',
        ],
        borderColor: [
          'rgb(82, 196, 145)',
          'rgb(255, 77, 79)',
          'rgb(250, 173, 20)',
          'rgb(140, 140, 140)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.parsed.y} звонков`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <Card title="Статистика по статусам" loading={loading}>
      <div style={{ height: 300 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Bar chart showing average call duration by day
 */
export function CallsDurationChart({ data, loading }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Средняя длительность (мин)',
        data: data?.averageDuration || [],
        backgroundColor: 'rgba(114, 46, 209, 0.8)',
        borderColor: 'rgb(114, 46, 209)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.parsed.y.toFixed(1)} мин`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value + ' мин';
          },
        },
      },
    },
  };

  return (
    <Card title="Средняя длительность звонков" loading={loading}>
      <div style={{ height: 300 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Line chart showing daily trend comparison for current and previous periods
 */
export function CallsDailyTrendChart({ data, previousData, loading }) {
  const normalizedCurrent = useMemo(() => normalizeTrendPayload(data), [data]);
  const normalizedPrevious = useMemo(() => normalizeTrendPayload(previousData), [previousData]);

  const volumeChartData = useMemo(
    () =>
      buildTrendChartData(
        normalizedCurrent,
        normalizedPrevious,
        'total',
        'Daily calls',
        'rgba(24, 144, 255, 1)'
      ),
    [normalizedCurrent, normalizedPrevious]
  );
  const answerRateChartData = useMemo(
    () =>
      buildTrendChartData(
        normalizedCurrent,
        normalizedPrevious,
        'answerRate',
        'Answer rate',
        'rgba(82, 196, 26, 1)'
      ),
    [normalizedCurrent, normalizedPrevious]
  );
  const hasData = Boolean(volumeChartData || answerRateChartData);

  const renderChart = (chartData, tooltipFormatter, yTickFormatter, height = 260) => {
    if (!chartData) return null;

    return (
      <div style={{ height }}>
        <Line data={chartData} options={buildTrendOptions(tooltipFormatter, yTickFormatter)} />
      </div>
    );
  };

  return (
    <Card title="Daily trend" loading={loading} size="default">
      {!hasData ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет данных для построения дневного тренда"
        />
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {renderChart(
            volumeChartData,
            (value) => `${Number(value).toFixed(0)} звонков`,
            (value) => Number(value).toFixed(0)
          )}
          {answerRateChartData
            ? renderChart(
                answerRateChartData,
                (value) => `${Number(value).toFixed(1)}%`,
                (value) => `${Number(value).toFixed(0)}%`,
                220
              )
            : null}
        </div>
      )}
    </Card>
  );
}
