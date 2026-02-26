/**
 * Calls Dashboard Page
 * Shows telephony statistics and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  DatePicker,
  Select,
  Table,
  Tag,
  Empty,
  message,
} from 'antd';
import {
  PhoneOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  PhoneTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { getCallStatistics, getVoipCallLogs } from '../lib/api/calls.js';
import {
  CallsActivityChart,
  CallsDistributionChart,
  CallsStatusChart,
  CallsDurationChart,
} from '../components/CallsCharts.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function CallsDashboard() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState('week'); // week, month, year

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const params = {};
      if (dateRange && dateRange.length === 2) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      }

      const stats = await getCallStatistics(params);
      setStatistics(stats);

      // Load recent calls
      const callsResponse = await getVoipCallLogs({
        ...params,
        limit: 10,
      });
      const recent = callsResponse?.results || callsResponse || [];
      setRecentCalls(recent);

      // Load all calls for chart data
      const allCallsResponse = await getVoipCallLogs({
        ...params,
        limit: 1000,
      });
      
      // Process data for charts
      const allCalls = allCallsResponse?.results || allCallsResponse || [];
      processChartData(allCalls);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('Не удалось загрузить данные телефонии');
      setStatistics(null);
      setRecentCalls([]);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const now = dayjs();
    let startDate;

    switch (value) {
      case 'today':
        startDate = now.startOf('day');
        break;
      case 'week':
        startDate = now.subtract(7, 'days');
        break;
      case 'month':
        startDate = now.subtract(30, 'days');
        break;
      case 'year':
        startDate = now.subtract(365, 'days');
        break;
      default:
        startDate = now.subtract(7, 'days');
    }

    setDateRange([startDate, now]);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${mins}м`;
  };

  const calculateSuccessRate = () => {
    if (!statistics) return 0;
    const total = statistics.total || 0;
    const completed = statistics.completed ?? statistics.answered ?? statistics.connected ?? 0;
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  const processChartData = (calls) => {
    // Group by date
    const dateGroups = {};
    calls.forEach(call => {
      const date = dayjs(call.started_at || call.timestamp).format('DD.MM');
      if (!dateGroups[date]) {
        dateGroups[date] = { inbound: 0, outbound: 0, durations: [] };
      }
      if (call.direction === 'inbound') {
        dateGroups[date].inbound++;
      } else {
        dateGroups[date].outbound++;
      }
      if (call.duration) {
        dateGroups[date].durations.push(call.duration);
      }
    });

    const labels = Object.keys(dateGroups).sort((a, b) => {
      const [dayA, monthA] = a.split('.').map(Number);
      const [dayB, monthB] = b.split('.').map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

    const activityData = {
      labels,
      inbound: labels.map(date => dateGroups[date].inbound),
      outbound: labels.map(date => dateGroups[date].outbound),
    };

    const durationData = {
      labels,
      averageDuration: labels.map(date => {
        const durations = dateGroups[date].durations;
        if (durations.length === 0) return 0;
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        return (avg / 60).toFixed(2); // Convert to minutes
      }),
    };

    setChartData({
      activity: activityData,
      duration: durationData,
    });
  };

  const recentCallsColumns = [
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      width: 120,
      render: (direction) => (
        <Space>
          <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
          {direction === 'inbound' ? 'Входящий' : 'Исходящий'}
        </Space>
      ),
    },
    {
      title: 'Номер',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone, record) => phone || record.number,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          completed: { color: 'success', text: 'Завершен', icon: <CheckCircleOutlined /> },
          answered: { color: 'success', text: 'Отвечен', icon: <CheckCircleOutlined /> },
          missed: { color: 'error', text: 'Пропущен', icon: <CloseCircleOutlined /> },
          no_answer: { color: 'error', text: 'Нет ответа', icon: <CloseCircleOutlined /> },
          busy: { color: 'warning', text: 'Занято', icon: <CloseCircleOutlined /> },
          failed: { color: 'error', text: 'Ошибка', icon: <CloseCircleOutlined /> },
        };
        const style = config[status] || config.completed;
        return (
          <Tag color={style.color} icon={style.icon}>
            {style.text}
          </Tag>
        );
      },
    },
    {
      title: 'Время',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date, record) => dayjs(date || record.timestamp).format('HH:mm'),
    },
    {
      title: 'Длительность',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Дашборд телефонии</Title>
        <Space>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: 150 }}
          >
            <Option value="today">Сегодня</Option>
            <Option value="week">Неделя</Option>
            <Option value="month">Месяц</Option>
            <Option value="year">Год</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD.MM.YYYY"
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Обновить
          </Button>
        </Space>
      </div>

      {/* Main Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Всего звонков"
              value={statistics?.total || 0}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Входящие"
              value={statistics?.inbound || 0}
              prefix={<PhoneTwoTone twoToneColor="#52c41a" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Исходящие"
              value={statistics?.outbound || 0}
              prefix={<PhoneTwoTone twoToneColor="#1890ff" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Успешность"
              value={calculateSuccessRate()}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Завершенные"
              value={statistics?.completed ?? statistics?.answered ?? statistics?.connected ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Пропущенные"
              value={statistics?.missed ?? statistics?.missed_calls ?? statistics?.no_answer ?? 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Общее время"
              value={statistics ? formatTotalDuration(statistics.totalDuration || statistics.total_duration || 0) : '0ч 0м'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Средняя длительность"
              value={statistics ? formatDuration(Math.round(statistics.averageDuration || statistics.average_duration || 0)) : '0:00'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <CallsActivityChart data={chartData?.activity} loading={loading} />
        </Col>
        <Col xs={24} lg={12}>
          <CallsDistributionChart data={statistics} loading={loading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <CallsStatusChart data={statistics} loading={loading} />
        </Col>
        <Col xs={24} lg={12}>
          <CallsDurationChart data={chartData?.duration} loading={loading} />
        </Col>
      </Row>

      {/* Recent Calls */}
      <Card title="Последние звонки" loading={loading}>
        <Table
          dataSource={recentCalls}
          columns={recentCallsColumns}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="Нет данных о звонках"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}

export default CallsDashboard;
