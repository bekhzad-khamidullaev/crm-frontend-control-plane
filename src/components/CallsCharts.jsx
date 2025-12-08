/**
 * CallsCharts Component
 * Reusable charts for call analytics
 */

import React from 'react';
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
import { Card } from 'antd';

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
        backgroundColor: [
          'rgba(82, 196, 145, 0.8)',
          'rgba(24, 144, 255, 0.8)',
        ],
        borderColor: [
          'rgb(82, 196, 145)',
          'rgb(24, 144, 255)',
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
        position: 'bottom',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
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
        data: [
          data?.completed || 0,
          data?.missed || 0,
          data?.busy || 0,
          data?.failed || 0,
        ],
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
          label: function(context) {
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
          label: function(context) {
            return `${context.parsed.y.toFixed(1)} мин`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
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
