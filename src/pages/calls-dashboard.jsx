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
  Modal,
  Form,
  Input,
  InputNumber,
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
  ReloadOutlined,
  PhoneTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  getCallStatistics,
  getVoipCallLogs,
  getContactCenterKpi,
  getContactCenterDrilldown,
  getCallQaSummary,
  getCallQaScores,
  upsertCallQaScore,
  generatePilotWeeklyReport,
  getPilotWeeklyReports,
  exportPilotWeeklyReport,
  getPilotReportAutomationHealth,
  runPilotReportAutomationNow,
} from '../lib/api/calls.js';
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
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [contactCenterKpi, setContactCenterKpi] = useState(null);
  const [contactCenterDrilldown, setContactCenterDrilldown] = useState({ teams: [], agents: [] });
  const [qaSummary, setQaSummary] = useState(null);
  const [qaScores, setQaScores] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [automationHealth, setAutomationHealth] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [qaModalVisible, setQaModalVisible] = useState(false);
  const [selectedQaCall, setSelectedQaCall] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState('week'); // week, month, year
  const [qaForm] = Form.useForm();

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
      const [kpiResponse, drilldownResponse, qaSummaryResponse, qaScoresResponse, reportsResponse, automationHealthResponse, callsResponse, allCallsResponse] = await Promise.all([
        getContactCenterKpi({ ...params, period }),
        getContactCenterDrilldown({ ...params, period }),
        getCallQaSummary({ ...params, period }),
        getCallQaScores({ ...params, period, limit: 50 }),
        getPilotWeeklyReports({ limit: 20 }),
        getPilotReportAutomationHealth({ limit: 10 }),
        getVoipCallLogs({ ...params, limit: 10 }),
        getVoipCallLogs({ ...params, limit: 1000 }),
      ]);
      setStatistics(stats);
      setContactCenterKpi(kpiResponse);
      setContactCenterDrilldown(drilldownResponse || { teams: [], agents: [] });
      setQaSummary(qaSummaryResponse || null);
      setQaScores(qaScoresResponse?.results || []);
      setWeeklyReports(reportsResponse?.results || []);
      setAutomationHealth(automationHealthResponse || null);

      const recent = callsResponse?.results || callsResponse || [];
      setRecentCalls(recent);
      
      // Process data for charts
      const allCalls = allCallsResponse?.results || allCallsResponse || [];
      processChartData(allCalls);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('Не удалось загрузить данные телефонии');
      setStatistics(null);
      setContactCenterKpi(null);
      setContactCenterDrilldown({ teams: [], agents: [] });
      setQaSummary(null);
      setQaScores([]);
      setWeeklyReports([]);
      setAutomationHealth(null);
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

  const formatSeconds = (seconds) => {
    if (!seconds) return '0 c';
    return `${Math.round(seconds)} c`;
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
    {
      title: 'QA',
      key: 'qa_action',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => openQaModal(record)}
        >
          Оценить
        </Button>
      ),
    },
  ];

  const teamColumns = [
    { title: 'Команда', dataIndex: 'group_name', key: 'group_name' },
    { title: 'Всего', dataIndex: 'total_calls', key: 'total_calls', width: 90 },
    { title: 'Answer rate', dataIndex: 'answer_rate', key: 'answer_rate', width: 110, render: (v) => `${v}%` },
    { title: 'Abandon rate', dataIndex: 'abandon_rate', key: 'abandon_rate', width: 120, render: (v) => `${v}%` },
    { title: 'AHT', dataIndex: 'aht_seconds', key: 'aht_seconds', width: 100, render: formatSeconds },
    { title: 'ASA', dataIndex: 'asa_seconds', key: 'asa_seconds', width: 100, render: formatSeconds },
    { title: 'SLA breach', dataIndex: 'sla_breach_rate', key: 'sla_breach_rate', width: 120, render: (v) => `${v}%` },
  ];

  const agentColumns = [
    { title: 'Агент', dataIndex: 'agent_name', key: 'agent_name' },
    { title: 'Ext', dataIndex: 'extension', key: 'extension', width: 100 },
    { title: 'Всего', dataIndex: 'total_calls', key: 'total_calls', width: 90 },
    { title: 'Answer rate', dataIndex: 'answer_rate', key: 'answer_rate', width: 110, render: (v) => `${v}%` },
    { title: 'Abandon rate', dataIndex: 'abandon_rate', key: 'abandon_rate', width: 120, render: (v) => `${v}%` },
    { title: 'AHT', dataIndex: 'aht_seconds', key: 'aht_seconds', width: 100, render: formatSeconds },
    { title: 'ASA', dataIndex: 'asa_seconds', key: 'asa_seconds', width: 100, render: formatSeconds },
    { title: 'SLA breach', dataIndex: 'sla_breach_rate', key: 'sla_breach_rate', width: 120, render: (v) => `${v}%` },
  ];

  const currentKpi = contactCenterKpi?.current || null;
  const previousKpi = contactCenterKpi?.previous || null;
  const currentQaSummary = qaSummary?.summary || null;
  const answerRateDelta = currentKpi && previousKpi
    ? (currentKpi.answer_rate - previousKpi.answer_rate).toFixed(2)
    : null;

  const outcomeLabelMap = {
    converted: 'Converted',
    follow_up: 'Follow-up',
    escalated: 'Escalated',
    callback_scheduled: 'Callback',
    unresolved: 'Unresolved',
    wrong_number: 'Wrong Number',
    do_not_call: 'Do Not Call',
  };

  const qaColumns = [
    {
      title: 'Сессия',
      dataIndex: 'call_session_id',
      key: 'call_session_id',
      width: 180,
    },
    {
      title: 'Reviewer',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 130,
    },
    {
      title: 'Outcome',
      dataIndex: 'outcome_tag',
      key: 'outcome_tag',
      render: (value) => outcomeLabelMap[value] || value,
    },
    {
      title: 'Total',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 90,
    },
    {
      title: 'Status',
      dataIndex: 'qa_passed',
      key: 'qa_passed',
      width: 120,
      render: (value) => (
        <Tag color={value ? 'success' : 'error'}>
          {value ? 'Passed' : 'Failed'}
        </Tag>
      ),
    },
    {
      title: 'Дата',
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      width: 160,
      render: (value) => dayjs(value).format('DD.MM HH:mm'),
    },
  ];

  const openQaModal = (call) => {
    setSelectedQaCall(call);
    qaForm.setFieldsValue({
      script_adherence_score: 80,
      communication_score: 80,
      resolution_quality_score: 80,
      outcome_tag: 'follow_up',
      strengths: '',
      improvements: '',
    });
    setQaModalVisible(true);
  };

  const closeQaModal = () => {
    setQaModalVisible(false);
    setSelectedQaCall(null);
    qaForm.resetFields();
  };

  const handleSubmitQa = async () => {
    try {
      const values = await qaForm.validateFields();
      if (!selectedQaCall?.id) {
        message.error('Не выбран звонок для QA');
        return;
      }
      setQaSubmitting(true);
      await upsertCallQaScore({
        call_log: selectedQaCall.id,
        ...values,
      });
      message.success('QA оценка сохранена');
      closeQaModal();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error('Failed to save QA score', error);
      message.error('Не удалось сохранить QA оценку');
    } finally {
      setQaSubmitting(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      setReportGenerating(true);
      const payload = {
        period: 'week',
        baseline_weeks: 4,
      };
      if (dateRange && dateRange.length === 2) {
        payload.date_from = dateRange[0].format('YYYY-MM-DD');
        payload.date_to = dateRange[1].format('YYYY-MM-DD');
      }
      await generatePilotWeeklyReport(payload);
      message.success('Weekly board report сгенерирован');
      loadData();
    } catch (error) {
      console.error('Failed to generate weekly report', error);
      message.error('Не удалось сгенерировать weekly report');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleExportWeeklyReport = async (reportId) => {
    try {
      const data = await exportPilotWeeklyReport(reportId, { export_format: 'md' });
      const markdown = data?.markdown || '';
      const title = (data?.title || `weekly-report-${reportId}`).replace(/[^\w.-]+/g, '_');
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export weekly report', error);
      message.error('Не удалось экспортировать weekly report');
    }
  };

  const handleRunAutomationNow = async () => {
    try {
      setAutomationRunning(true);
      await runPilotReportAutomationNow({ async: false });
      message.success('Automation run completed');
      loadData();
    } catch (error) {
      console.error('Failed to run automation now', error);
      message.error('Не удалось запустить automation');
    } finally {
      setAutomationRunning(false);
    }
  };

  const weeklyReportColumns = [
    {
      title: 'Период',
      key: 'period',
      render: (_, record) => `${record.week_start_date} - ${record.week_end_date}`,
    },
    {
      title: 'Answer Δ',
      key: 'answer_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.answer_rate ?? 0} pp`,
    },
    {
      title: 'Abandon Δ',
      key: 'abandon_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.abandon_rate ?? 0} pp`,
    },
    {
      title: 'QA Pass Δ',
      key: 'qa_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.qa_pass_rate ?? 0} pp`,
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Экспорт',
      key: 'export',
      width: 130,
      render: (_, record) => (
        <Button size="small" onClick={() => handleExportWeeklyReport(record.id)}>
          Markdown
        </Button>
      ),
    },
  ];

  const automationRunColumns = [
    {
      title: 'Старт',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => (
        <Tag color={value === 'success' ? 'success' : 'error'}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_reports',
      key: 'created_reports',
      width: 90,
    },
    {
      title: 'Notified',
      dataIndex: 'notified',
      key: 'notified',
      width: 100,
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      title: 'TG Sent',
      key: 'telegram_sent',
      width: 90,
      render: (_, record) => record?.run_context?.telegram?.sent ?? 0,
    },
    {
      title: 'Ошибка',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (value) => value || '-',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Дашборд телефонии</Title>
        <Space>
          <Button type="primary" loading={reportGenerating} onClick={handleGenerateWeeklyReport}>
            Weekly Report
          </Button>
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

      {/* QA Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="QA Pass Rate"
              value={currentQaSummary?.pass_rate || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Avg Script Adherence"
              value={currentQaSummary?.avg_script_adherence || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Avg Communication"
              value={currentQaSummary?.avg_communication || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Avg Resolution Quality"
              value={currentQaSummary?.avg_resolution_quality || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* Contact Center KPI Economics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="AHT"
              value={formatSeconds(currentKpi?.aht_seconds || 0)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="ASA"
              value={formatSeconds(currentKpi?.asa_seconds || 0)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="FCR"
              value={currentKpi?.fcr_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Abandon Rate"
              value={currentKpi?.abandon_rate || 0}
              suffix="%"
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="SLA Breach Rate"
              value={currentKpi?.sla_breach_rate || 0}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="Answer Rate Delta vs Previous"
              value={answerRateDelta ?? 0}
              suffix="%"
              valueStyle={{ color: Number(answerRateDelta || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card loading={loading} title="Conversion by Direction">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Inbound: {contactCenterKpi?.conversion_by_direction?.inbound?.conversion_rate || 0}%</Text>
              <Text>Outbound: {contactCenterKpi?.conversion_by_direction?.outbound?.conversion_rate || 0}%</Text>
              <Text>Internal: {contactCenterKpi?.conversion_by_direction?.internal?.conversion_rate || 0}%</Text>
            </Space>
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Drilldown по командам" loading={loading}>
            <Table
              dataSource={contactCenterDrilldown?.teams || []}
              columns={teamColumns}
              rowKey="group_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Drilldown по агентам" loading={loading}>
            <Table
              dataSource={contactCenterDrilldown?.agents || []}
              columns={agentColumns}
              rowKey="agent_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="Automation Health"
            loading={loading}
            extra={
              <Button loading={automationRunning} onClick={handleRunAutomationNow}>
                Run Now
              </Button>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title="Total Runs" value={automationHealth?.summary?.total_runs || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title="Success Runs" value={automationHealth?.summary?.success_runs || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title="Failed Runs" value={automationHealth?.summary?.failed_runs || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title="Failure Rate" value={automationHealth?.summary?.failure_rate || 0} suffix="%" />
              </Col>
            </Row>
            <Table
              dataSource={automationHealth?.runs || []}
              columns={automationRunColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Weekly Pilot Board Reports" loading={loading}>
            <Table
              dataSource={weeklyReports}
              columns={weeklyReportColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="QA Reviews" loading={loading}>
            <Table
              dataSource={qaScores}
              columns={qaColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`QA оценка звонка ${selectedQaCall?.session_id || ''}`}
        open={qaModalVisible}
        forceRender
        onOk={handleSubmitQa}
        onCancel={closeQaModal}
        confirmLoading={qaSubmitting}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form layout="vertical" form={qaForm}>
          <Form.Item
            name="script_adherence_score"
            label="Script Adherence (0-100)"
            rules={[{ required: true, message: 'Укажите оценку скрипта' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="communication_score"
            label="Communication (0-100)"
            rules={[{ required: true, message: 'Укажите оценку коммуникации' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="resolution_quality_score"
            label="Resolution Quality (0-100)"
            rules={[{ required: true, message: 'Укажите оценку результата' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="outcome_tag"
            label="Outcome"
            rules={[{ required: true, message: 'Выберите outcome' }]}
          >
            <Select
              options={Object.entries(outcomeLabelMap).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="strengths" label="Strengths">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="improvements" label="Improvements">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CallsDashboard;
