import { BankOutlined, DollarOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Statistic, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCompanies } from '../lib/api/companies.js';
import { getDeals } from '../lib/api/deals.js';
import { getPayments } from '../lib/api/payments.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toNumberSafe, toResults } from './workspace-utils.js';
import { formatCurrency } from '../lib/utils/format.js';
import { navigate } from '../router.js';

const getContractLifecycleStatus = (deal) => {
  const closeDateRaw = deal?.closing_date || deal?.win_closing_date;
  const closeDate = closeDateRaw ? new Date(closeDateRaw) : null;
  const now = Date.now();
  const debt = Number(deal?.debt || 0);

  if (!closeDate || Number.isNaN(closeDate.getTime())) {
    return { label: 'Без срока', color: 'default', renewInDays: null };
  }

  const msDiff = closeDate.getTime() - now;
  const daysToRenew = Math.ceil(msDiff / (24 * 60 * 60 * 1000));

  if (daysToRenew < 0) {
    return { label: debt > 0 ? 'Просрочен с долгом' : 'Просрочен', color: 'error', renewInDays: daysToRenew };
  }
  if (daysToRenew <= 30) {
    return { label: 'Нужно продление', color: 'warning', renewInDays: daysToRenew };
  }
  return { label: 'Активен', color: 'success', renewInDays: daysToRenew };
};

export default function ClientsWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [companiesRes, dealsRes, paymentsRes] = await Promise.allSettled([
      getCompanies({ page_size: 200, ordering: '-update_date' }),
      getDeals({ page_size: 200, ordering: '-update_date' }),
      getPayments({ page_size: 200, ordering: '-payment_date' }),
    ]);

    if (companiesRes.status === 'fulfilled') {
      setCompanies(toResults(companiesRes.value));
    } else {
      setCompanies([]);
    }

    if (dealsRes.status === 'fulfilled') {
      setDeals(toResults(dealsRes.value));
    } else {
      setDeals([]);
    }

    if (paymentsRes.status === 'fulfilled') {
      setPayments(toResults(paymentsRes.value));
    } else {
      setPayments([]);
    }

    const hasFailure = [companiesRes, dealsRes, paymentsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть данных не загрузилась. Отображается доступная информация.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCompanies = useMemo(
    () => companies.filter((item) => containsText(item.name, search) || containsText(item.email, search) || containsText(item.phone, search)),
    [companies, search],
  );

  const filteredDeals = useMemo(
    () => deals.filter((item) => containsText(item.name, search) || containsText(item.company_name, search) || containsText(item.owner_name, search)),
    [deals, search],
  );

  const filteredPayments = useMemo(
    () => payments.filter((item) => containsText(item.deal_name, search) || containsText(item.status, search)),
    [payments, search],
  );

  const paymentReceivedMap = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((payment) => {
      if (!payment?.deal) return;
      if (String(payment.status || '').toLowerCase() !== 'r') return;
      map.set(payment.deal, (map.get(payment.deal) || 0) + toNumberSafe(payment.amount));
    });
    return map;
  }, [filteredPayments]);

  const debtRows = useMemo(() => {
    return filteredDeals
      .map((deal) => {
        const total = toNumberSafe(deal.amount);
        const paid = paymentReceivedMap.get(deal.id) || 0;
        const debt = Math.max(0, total - paid);
        const closeDate = deal.closing_date || deal.win_closing_date;
        const closeAt = closeDate ? new Date(closeDate) : null;
        const overdueDays = closeAt && Number.isFinite(closeAt.getTime())
          ? Math.max(0, Math.floor((Date.now() - closeAt.getTime()) / (24 * 60 * 60 * 1000)))
          : 0;
        return {
          ...deal,
          debt,
          paid,
          overdueDays,
          closeDate,
        };
      })
      .filter((deal) => deal.debt > 0)
      .sort((a, b) => b.debt - a.debt);
  }, [filteredDeals, paymentReceivedMap]);

  const receivedTotal = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + (String(payment.status || '').toLowerCase() === 'r' ? toNumberSafe(payment.amount) : 0), 0),
    [filteredPayments],
  );

  const lifecycleSummary = useMemo(() => {
    const withLifecycle = debtRows.map((row) => ({
      ...row,
      lifecycle: getContractLifecycleStatus(row),
    }));
    const renewalsSoon = withLifecycle.filter((row) => row.lifecycle.label === 'Нужно продление').length;
    const expired = withLifecycle.filter((row) => row.lifecycle.label.includes('Просрочен')).length;
    return { withLifecycle, renewalsSoon, expired };
  }, [debtRows]);

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Клиенты и договоры"
        subtitle="Единый реестр клиентов, продаж, оплат и задолженностей."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по клиентам, сделкам и оплатам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Клиенты: ${filteredCompanies.length} | Сделки: ${filteredDeals.length} | Оплаты: ${filteredPayments.length}`}
      />

      <Space size={16} wrap>
        <Card size="small">
          <Statistic title="Клиенты" value={filteredCompanies.length} prefix={<BankOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="Договоры/сделки" value={filteredDeals.length} prefix={<FileDoneOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="Оплаты (получено)" value={receivedTotal} precision={2} prefix={<DollarOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="Задолженности" value={debtRows.length} />
        </Card>
        <Card size="small">
          <Statistic title="Продление ≤ 30 дней" value={lifecycleSummary.renewalsSoon} />
        </Card>
        <Card size="small">
          <Statistic title="Просроченные договоры" value={lifecycleSummary.expired} />
        </Card>
      </Space>

      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'clients',
              label: 'База клиентов',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredCompanies}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Компания',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => <a onClick={() => navigate(`/companies/${record.id}`)}>{name || `#${record.id}`}</a>,
                    },
                    { title: 'Телефон', dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
                    { title: 'Email', dataIndex: 'email', key: 'email', render: (value) => value || '-' },
                    { title: 'Ответственный', dataIndex: 'owner_name', key: 'owner_name', render: (value) => value || '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'deals',
              label: 'Реестр договоров и продаж',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredDeals}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Сделка',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => <a onClick={() => navigate(`/deals/${record.id}`)}>{name || `#${record.id}`}</a>,
                    },
                    { title: 'Компания', dataIndex: 'company_name', key: 'company_name', render: (value) => value || '-' },
                    { title: 'Стадия', dataIndex: 'stage_name', key: 'stage_name', render: (value) => value || '-' },
                    {
                      title: 'Жизненный цикл',
                      key: 'contract_lifecycle',
                      render: (_, record) => {
                        const lifecycle = getContractLifecycleStatus(record);
                        return <Tag color={lifecycle.color}>{lifecycle.label}</Tag>;
                      },
                    },
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : '-';
                      },
                    },
                    { title: 'Дата закрытия', dataIndex: 'closing_date', key: 'closing_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'payments',
              label: 'Финансы / оплаты',
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
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => {
                        const value = String(status || '').toLowerCase();
                        if (value === 'r') return <Tag color="success">Получен</Tag>;
                        if (value === 'g') return <Tag color="processing">Гарантирован</Tag>;
                        if (value === 'h') return <Tag color="warning">Высокая вероятность</Tag>;
                        if (value === 'l') return <Tag>Низкая вероятность</Tag>;
                        return <Tag>{status || '-'}</Tag>;
                      },
                    },
                  ]}
                />
              ),
            },
            {
              key: 'debts',
              label: 'Задолженности',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={lifecycleSummary.withLifecycle}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Сделка',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => <a onClick={() => navigate(`/deals/${record.id}`)}>{name || `#${record.id}`}</a>,
                    },
                    { title: 'Компания', dataIndex: 'company_name', key: 'company_name', render: (value) => value || '-' },
                    {
                      title: 'Оплачено',
                      dataIndex: 'paid',
                      key: 'paid',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : value.toFixed(2);
                      },
                    },
                    {
                      title: 'Долг',
                      dataIndex: 'debt',
                      key: 'debt',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : value.toFixed(2);
                      },
                    },
                    {
                      title: 'Просрочка, дн.',
                      dataIndex: 'overdueDays',
                      key: 'overdueDays',
                      render: (value) => (value > 0 ? <Tag color="error">{value}</Tag> : '-'),
                    },
                    {
                      title: 'Продление',
                      key: 'renewal_status',
                      render: (_, record) => {
                        const lifecycle = getContractLifecycleStatus(record);
                        if (lifecycle.renewInDays === null) return <Tag>Н/Д</Tag>;
                        if (lifecycle.renewInDays < 0) return <Tag color="error">{Math.abs(lifecycle.renewInDays)} дн. назад</Tag>;
                        return <Tag color={lifecycle.renewInDays <= 30 ? 'warning' : 'success'}>{lifecycle.renewInDays} дн.</Tag>;
                      },
                    },
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
