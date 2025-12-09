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
import dayjs from 'dayjs';

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
  const [period, setPeriod] = useState('month'); // day, week, month, year

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const labels = generateLabels(period);
      const mockData = {
        labels,
        datasets: [
          {
            label: 'USD',
            data: labels.map(() => Math.floor(Math.random() * 50000) + 10000),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'EUR',
            data: labels.map(() => Math.floor(Math.random() * 30000) + 5000),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'UZS',
            data: labels.map(() => Math.floor(Math.random() * 100000000) + 50000000),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLabels = (period) => {
    const now = dayjs();
    let labels = [];
    
    switch (period) {
      case 'day':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          labels.push(now.subtract(i, 'day').format('DD MMM'));
        }
        break;
      case 'week':
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
          labels.push(now.subtract(i, 'week').format('DD MMM'));
        }
        break;
      case 'month':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          labels.push(now.subtract(i, 'month').format('MMM YYYY'));
        }
        break;
      case 'year':
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          labels.push(now.subtract(i, 'year').format('YYYY'));
        }
        break;
      default:
        labels = [];
    }
    
    return labels;
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
          <span>Revenue Overview</span>
        </Space>
      }
      extra={
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 120 }}
          options={[
            { value: 'day', label: 'Last 7 Days' },
            { value: 'week', label: 'Last 8 Weeks' },
            { value: 'month', label: 'Last 12 Months' },
            { value: 'year', label: 'Last 5 Years' },
          ]}
        />
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Spin size="large" />
        </div>
      ) : !data ? (
        <Empty description="No data available" style={{ padding: '80px' }} />
      ) : (
        <div style={{ height: '300px' }}>
          <Line options={options} data={data} />
        </div>
      )}
    </Card>
  );
}
