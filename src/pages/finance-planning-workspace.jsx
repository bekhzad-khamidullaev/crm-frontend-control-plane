import { FundProjectionScreenOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Statistic, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getDeals } from '../lib/api/deals.js';
import { getOutputs } from '../lib/api/outputs.js';
import { getPayments } from '../lib/api/payments.js';
import { getRequests } from '../lib/api/requests.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toNumberSafe, toResults } from './workspace-utils.js';
import { formatCurrency } from '../lib/utils/format.js';

const toMonth = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const paymentStatusTag = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'r') return <Tag color="success">Получен</Tag>;
  if (value === 'g') return <Tag color="processing">Гарантирован</Tag>;
  if (value === 'h') return <Tag color="warning">Высокая вероятность</Tag>;
  if (value === 'l') return <Tag>Низкая вероятность</Tag>;
  return <Tag>{status || '-'}</Tag>;
};

export default function FinancePlanningWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deals, setDeals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [requests, setRequests] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [dealsRes, paymentsRes, outputsRes, requestsRes] = await Promise.allSettled([
      getDeals({ page_size: 300, ordering: '-closing_date' }),
      getPayments({ page_size: 300, ordering: '-payment_date' }),
      getOutputs({ page_size: 300, ordering: '-date' }),
      getRequests({ page_size: 300, ordering: '-update_date' }),
    ]);

    setDeals(dealsRes.status === 'fulfilled' ? toResults(dealsRes.value) : []);
    setPayments(paymentsRes.status === 'fulfilled' ? toResults(paymentsRes.value) : []);
    setOutputs(outputsRes.status === 'fulfilled' ? toResults(outputsRes.value) : []);
    setRequests(requestsRes.status === 'fulfilled' ? toResults(requestsRes.value) : []);

    const hasFailure = [dealsRes, paymentsRes, outputsRes, requestsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть данных финансового контура недоступна. Показаны доступные значения.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPayments = useMemo(
    () => payments.filter((item) => containsText(item.deal_name, search) || containsText(item.status, search)),
    [payments, search],
  );

  const filteredRequests = useMemo(
    () => requests.filter((item) => containsText(item.title || item.description, search) || containsText(item.status, search)),
    [requests, search],
  );

  const filteredDeals = useMemo(
    () => deals.filter((item) => containsText(item.name, search) || containsText(item.company_name, search)),
    [deals, search],
  );

  const pipelineAmount = useMemo(
    () => filteredDeals.reduce((sum, deal) => sum + (deal.active !== false ? toNumberSafe(deal.amount) : 0), 0),
    [filteredDeals],
  );

  const receivedAmount = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + (String(payment.status || '').toLowerCase() === 'r' ? toNumberSafe(payment.amount) : 0), 0),
    [filteredPayments],
  );

  const expectedAmount = useMemo(
    () => filteredPayments.reduce((sum, payment) => {
      const status = String(payment.status || '').toLowerCase();
      if (['g', 'h', 'l'].includes(status)) return sum + toNumberSafe(payment.amount);
      return sum;
    }, 0),
    [filteredPayments],
  );

  const expenseAmount = useMemo(
    () => outputs.reduce((sum, output) => sum + toNumberSafe(output.amount), 0),
    [outputs],
  );

  const openRequests = useMemo(
    () => filteredRequests.filter((request) => !['completed', 'cancelled', 'rejected'].includes(String(request.status || '').toLowerCase())),
    [filteredRequests],
  );

  const planFactRows = useMemo(() => {
    const planByMonth = new Map();
    const factByMonth = new Map();
    const expenseByMonth = new Map();

    filteredDeals.forEach((deal) => {
      const month = toMonth(deal.closing_date || deal.win_closing_date || deal.update_date);
      if (!month) return;
      planByMonth.set(month, (planByMonth.get(month) || 0) + toNumberSafe(deal.amount));
    });

    filteredPayments.forEach((payment) => {
      const month = toMonth(payment.payment_date || payment.update_date);
      if (!month) return;
      if (String(payment.status || '').toLowerCase() !== 'r') return;
      factByMonth.set(month, (factByMonth.get(month) || 0) + toNumberSafe(payment.amount));
    });

    outputs.forEach((output) => {
      const month = toMonth(output.date || output.update_date);
      if (!month) return;
      expenseByMonth.set(month, (expenseByMonth.get(month) || 0) + toNumberSafe(output.amount));
    });

    const keys = Array.from(new Set([...planByMonth.keys(), ...factByMonth.keys(), ...expenseByMonth.keys()])).sort();

    return keys.map((month) => {
      const plan = planByMonth.get(month) || 0;
      const fact = factByMonth.get(month) || 0;
      const expenses = expenseByMonth.get(month) || 0;
      return {
        key: month,
        month,
        plan,
        fact,
        expenses,
        delta: fact - plan,
        net: fact - expenses,
      };
    });
  }, [filteredDeals, filteredPayments, outputs]);

  const cashCalendar14d = useMemo(() => {
    const rows = [];
    const now = new Date();
    const map = new Map();

    for (let i = 0; i < 14; i += 1) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        key,
        date: key,
        inflow: 0,
        outflow: 0,
      });
    }

    filteredPayments.forEach((payment) => {
      const dateRaw = payment.payment_date || payment.update_date;
      const key = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : null;
      if (!key || !map.has(key)) return;
      map.get(key).inflow += toNumberSafe(payment.amount);
    });

    outputs.forEach((output) => {
      const dateRaw = output.date || output.update_date;
      const key = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : null;
      if (!key || !map.has(key)) return;
      map.get(key).outflow += toNumberSafe(output.amount);
    });

    let running = 0;
    Array.from(map.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .forEach((item) => {
        running += item.inflow - item.outflow;
        rows.push({
          ...item,
          net: item.inflow - item.outflow,
          running,
        });
      });

    return rows;
  }, [filteredPayments, outputs]);

  const cashGapRiskDays = useMemo(
    () => cashCalendar14d.filter((day) => day.running < 0).length,
    [cashCalendar14d],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Финансовое планирование"
        subtitle="План/факт по доходам, расходам и заявкам на согласование."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по платежам, заявкам и сделкам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Сделки: ${filteredDeals.length} | Платежи: ${filteredPayments.length} | Заявки: ${filteredRequests.length}`}
      />

      <Space size={16} wrap>
        <Card size="small">
          <Statistic title="Pipeline" value={pipelineAmount} precision={2} prefix={<FundProjectionScreenOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="Получено" value={receivedAmount} precision={2} />
        </Card>
        <Card size="small">
          <Statistic title="Ожидается" value={expectedAmount} precision={2} />
        </Card>
        <Card size="small">
          <Statistic title="Открытые заявки" value={openRequests.length} />
        </Card>
        <Card size="small">
          <Statistic title="Расходы" value={expenseAmount} precision={2} />
        </Card>
        <Card size="small">
          <Statistic title="Риск кассового разрыва (14д)" value={cashGapRiskDays} />
        </Card>
      </Space>

      {error ? <Alert type="warning" showIcon message={error} /> : null}
      {cashGapRiskDays > 0 ? (
        <Alert
          type="error"
          showIcon
          message="Есть риск кассового разрыва на горизонте 14 дней"
          description={`Дней с отрицательным кумулятивным балансом: ${cashGapRiskDays}`}
        />
      ) : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'plan-fact',
              label: 'План / факт',
              children: (
                <Table
                  rowKey="key"
                  loading={loading}
                  dataSource={planFactRows}
                  pagination={{ pageSize: 12, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Месяц', dataIndex: 'month', key: 'month' },
                    { title: 'План', dataIndex: 'plan', key: 'plan', render: (value) => value.toFixed(2) },
                    { title: 'Факт', dataIndex: 'fact', key: 'fact', render: (value) => value.toFixed(2) },
                    { title: 'Отклонение', dataIndex: 'delta', key: 'delta', render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{value.toFixed(2)}</Tag> },
                    { title: 'Расходы', dataIndex: 'expenses', key: 'expenses', render: (value) => value.toFixed(2) },
                    { title: 'Net', dataIndex: 'net', key: 'net', render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{value.toFixed(2)}</Tag> },
                  ]}
                />
              ),
            },
            {
              key: 'payments',
              label: 'Платежи',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredPayments}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Дата', dataIndex: 'payment_date', key: 'payment_date', render: (value) => formatDateSafe(value) },
                    { title: 'Сделка', dataIndex: 'deal_name', key: 'deal_name', render: (value) => value || '-' },
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : '-';
                      },
                    },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => paymentStatusTag(value) },
                  ]}
                />
              ),
            },
            {
              key: 'cash-calendar',
              label: 'Календарь платежей (14 дней)',
              children: (
                <Table
                  rowKey="key"
                  loading={loading}
                  dataSource={cashCalendar14d}
                  pagination={false}
                  columns={[
                    { title: 'Дата', dataIndex: 'date', key: 'date', render: (value) => formatDateSafe(value) },
                    { title: 'Приток', dataIndex: 'inflow', key: 'inflow', render: (value) => value.toFixed(2) },
                    { title: 'Отток', dataIndex: 'outflow', key: 'outflow', render: (value) => value.toFixed(2) },
                    {
                      title: 'Net дня',
                      dataIndex: 'net',
                      key: 'net',
                      render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{value.toFixed(2)}</Tag>,
                    },
                    {
                      title: 'Кумулятив',
                      dataIndex: 'running',
                      key: 'running',
                      render: (value) => <Tag color={value >= 0 ? 'processing' : 'error'}>{value.toFixed(2)}</Tag>,
                    },
                  ]}
                />
              ),
            },
            {
              key: 'requests',
              label: 'Заявки',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredRequests}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Заявка', dataIndex: 'title', key: 'title', render: (value, record) => value || record.description || `#${record.id}` },
                    { title: 'Тип', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (value) => {
                        const normalized = String(value || '').toLowerCase();
                        if (normalized === 'completed') return <Tag color="success">Завершено</Tag>;
                        if (normalized === 'cancelled' || normalized === 'rejected') return <Tag color="error">Отклонено</Tag>;
                        if (normalized === 'in_progress') return <Tag color="processing">В работе</Tag>;
                        return <Tag>{value || '-'}</Tag>;
                      },
                    },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
