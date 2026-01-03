import { useState, useEffect } from 'react';
import { Card, Select, Space, Spin, Empty } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getDashboardAnalytics } from '../lib/api/analytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const analytics = await getDashboardAnalytics({ period });
      const series = analytics?.monthly_growth || analytics?.revenue || analytics?.data;

      let labels = [];
      let values = [];

      if (series?.labels && Array.isArray(series?.revenue)) {
        labels = series.labels;
        values = series.revenue;
      } else if (Array.isArray(series)) {
        labels = series.map((item) => item.label || item.date || item.name || '');
        values = series.map((item) => item.value || item.amount || item.total || 0);
      }

      if (!labels.length) {
        setData(null);
        return;
      }

      setData({
        labels,
        datasets: [
          {
            label: 'Выручка',
            data: values,
            borderColor: 'rgb(22, 119, 255)',
            backgroundColor: 'rgba(22, 119, 255, 0.12)',
            fill: true,
            tension: 0.4,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
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
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          <span>Динамика выручки</span>
        </Space>
      }
      extra={
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 120 }}
          options={[
            { value: '7d', label: '7 дней' },
            { value: '30d', label: '30 дней' },
            { value: '90d', label: '90 дней' },
          ]}
        />
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Spin size="large" />
        </div>
      ) : !data ? (
        <Empty description="Нет данных" style={{ padding: '80px' }} />
      ) : (
        <div style={{ height: '300px' }}>
          <Line options={options} data={data} />
        </div>
      )}
    </Card>
  );
}
