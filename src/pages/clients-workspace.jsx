import { Alert, App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EditableCell from '@/components/editable-cell';
import { useStages, useUsers } from '../features/reference';
import { deleteCompany, getCompanies, patchCompany } from '../lib/api/companies.js';
import {
  deleteDeal,
  exportContractGenerationJournal,
  generateDealContract,
  getContractGenerationJournal,
  getDealContractContext,
  getDealContractGenerations,
  getDeals,
  patchDeal,
} from '../lib/api/deals.js';
import { deletePayment, getPayments, patchPayment } from '../lib/api/payments.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';
import { containsText, formatDateSafe, fromMoneyMinor, toMoneyMinor, toResults } from './workspace-utils.js';
import { formatCurrency } from '../lib/utils/format.js';
import { getCompanyDisplayName } from '../lib/utils/company-display.js';
import { navigate } from '../router.js';
import { canWrite, hasAnyFeature } from '../lib/rbac.js';
import { BusinessMoneyValue } from '../components/business/BusinessMoneyValue';
import { BusinessFeatureGateNotice } from '../components/business/BusinessFeatureGateNotice';

const getContractLifecycleStatus = (deal) => {
  const closeDateRaw = deal?.closing_date || deal?.win_closing_date;
  const closeDate = closeDateRaw ? new Date(closeDateRaw) : null;
  const now = Date.now();
  const debt = fromMoneyMinor(toMoneyMinor(deal?.debt || 0));

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

const extractContractApiError = (error) => {
  const payload = error?.details || {};
  const code = String(payload?.code || '').trim().toUpperCase();
  const message = payload?.message || payload?.details?.detail || '';
  const missingFields = Array.isArray(payload?.details?.missing_fields) ? payload.details.missing_fields : [];
  return { code, message, missingFields };
};

const paymentStatusTag = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'r') return <Tag color="success">Получен</Tag>;
  if (value === 'g') return <Tag color="processing">Гарантирован</Tag>;
  if (value === 'h') return <Tag color="warning">Высокая вероятность</Tag>;
  if (value === 'l') return <Tag>Низкая вероятность</Tag>;
  return <Tag>{status || '-'}</Tag>;
};

export default function ClientsWorkspacePage() {
  const { message } = App.useApp();
  const canReadCompaniesFeature = hasAnyFeature(['crm.companies']);
  const canReadDealsFeature = hasAnyFeature(['crm.deals']);
  const canReadPaymentsFeature = hasAnyFeature(['crm.payments']);
  const canReadDebtsFeature = canReadDealsFeature && canReadPaymentsFeature;
  const canManageCompanies = canWrite('crm.change_company');
  const canManageDeals = canWrite('crm.change_deal');
  const canManagePayments = canWrite('crm.change_payment');
  const [contractForm] = Form.useForm();
  const watchedLineItems = Form.useWatch('line_items', contractForm) || [];
  const [loading, setLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractGenerating, setContractGenerating] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedDealForContract, setSelectedDealForContract] = useState(null);
  const [contractLanguage, setContractLanguage] = useState('uz');
  const [contractHistory, setContractHistory] = useState([]);
  const [contractHistoryLoading, setContractHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('clients');
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalRows, setJournalRows] = useState([]);
  const [journalTotal, setJournalTotal] = useState(0);
  const [journalFilters, setJournalFilters] = useState({
    status: '',
    language: '',
    q: '',
    deal_id: '',
    created_from: '',
    created_to: '',
  });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [payments, setPayments] = useState([]);
  const { data: usersData } = useUsers();
  const { data: stagesData } = useStages();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [companiesRes, dealsRes, paymentsRes] = await Promise.allSettled([
      canReadCompaniesFeature
        ? getCompanies({ page_size: 200, ordering: '-update_date' })
        : Promise.resolve({ results: [] }),
      canReadDealsFeature
        ? getDeals({ page_size: 200, ordering: '-update_date' })
        : Promise.resolve({ results: [] }),
      canReadPaymentsFeature
        ? getPayments({ page_size: 200, ordering: '-payment_date' })
        : Promise.resolve({ results: [] }),
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

    const hasFailure = [
      canReadCompaniesFeature ? companiesRes : null,
      canReadDealsFeature ? dealsRes : null,
      canReadPaymentsFeature ? paymentsRes : null,
    ].some((result) => result && result.status === 'rejected');
    if (hasFailure) {
      setError('Часть данных не загрузилась. Отображается доступная информация.');
    }
    setLoading(false);
  }, [canReadCompaniesFeature, canReadDealsFeature, canReadPaymentsFeature]);

  const loadContractJournal = useCallback(async () => {
    setJournalLoading(true);
    try {
      const payload = await getContractGenerationJournal({
        ...journalFilters,
        limit: 200,
      });
      setJournalRows(Array.isArray(payload?.results) ? payload.results : []);
      setJournalTotal(Number(payload?.count || 0));
    } catch {
      setJournalRows([]);
      setJournalTotal(0);
    } finally {
      setJournalLoading(false);
    }
  }, [journalFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'contracts_audit') {
      loadContractJournal();
    }
  }, [activeTab, loadContractJournal]);

  const filteredCompanies = useMemo(
    () =>
      companies.filter(
        (item) =>
          containsText(getCompanyDisplayName(item), search) ||
          containsText(item.email, search) ||
          containsText(item.phone, search),
      ),
    [companies, search],
  );

  const filteredDeals = useMemo(
    () =>
      deals.filter(
        (item) =>
          containsText(item.name, search) ||
          containsText(getCompanyDisplayName(item), search) ||
          containsText(item.owner_name, search),
      ),
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
      map.set(payment.deal, (map.get(payment.deal) || 0) + toMoneyMinor(payment.amount));
    });
    return map;
  }, [filteredPayments]);

  const debtRows = useMemo(() => {
    return filteredDeals
      .map((deal) => {
        const totalMinor = toMoneyMinor(deal.amount);
        const paidMinor = paymentReceivedMap.get(deal.id) || 0;
        const debtMinor = Math.max(0, totalMinor - paidMinor);
        const closeDate = deal.closing_date || deal.win_closing_date;
        const closeAt = closeDate ? new Date(closeDate) : null;
        const overdueDays = closeAt && Number.isFinite(closeAt.getTime())
          ? Math.max(0, Math.floor((Date.now() - closeAt.getTime()) / (24 * 60 * 60 * 1000)))
          : 0;
        return {
          ...deal,
          debt: fromMoneyMinor(debtMinor),
          paid: fromMoneyMinor(paidMinor),
          debt_minor: debtMinor,
          overdueDays,
          closeDate,
        };
      })
      .filter((deal) => deal.debt_minor > 0)
      .sort((a, b) => b.debt_minor - a.debt_minor);
  }, [filteredDeals, paymentReceivedMap]);

  const lifecycleSummary = useMemo(() => {
    const withLifecycle = debtRows.map((row) => ({
      ...row,
      lifecycle: getContractLifecycleStatus(row),
    }));
    const renewalsSoon = withLifecycle.filter((row) => row.lifecycle.label === 'Нужно продление').length;
    const expired = withLifecycle.filter((row) => row.lifecycle.label.includes('Просрочен')).length;
    return { withLifecycle, renewalsSoon, expired };
  }, [debtRows]);

  const userOptions = useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'Пользователь',
      })),
    [usersData],
  );

  const stageOptions = useMemo(
    () =>
      (stagesData?.results || []).map((stage) => ({
        value: stage.id,
        label: stage.name_ru || stage.name || 'Стадия',
      })),
    [stagesData],
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: 'r', label: 'Получен' },
      { value: 'g', label: 'Гарантирован' },
      { value: 'h', label: 'Высокая вероятность' },
      { value: 'l', label: 'Низкая вероятность' },
    ],
    [],
  );

  const normalizeForeignKeyValue = (raw) => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleInlineSave = async (entity, record, dataIndex, value) => {
    const prevCompanies = companies;
    const prevDeals = deals;
    const prevPayments = payments;

    let normalizedValue = value;
    if (dataIndex === 'owner' || dataIndex === 'stage') {
      normalizedValue = normalizeForeignKeyValue(value);
    }
    if (dataIndex === 'closing_date' && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }
    if (dataIndex === 'payment_date' && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }

    const patch = { [dataIndex]: normalizedValue };
    if (entity === 'company') {
      setCompanies((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }
    if (entity === 'deal') {
      setDeals((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }
    if (entity === 'payment') {
      setPayments((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }

    try {
      if (entity === 'company') await patchCompany(record.id, patch);
      if (entity === 'deal') await patchDeal(record.id, patch);
      if (entity === 'payment') await patchPayment(record.id, patch);
      message.success('Изменения сохранены');
    } catch (saveError) {
      setCompanies(prevCompanies);
      setDeals(prevDeals);
      setPayments(prevPayments);
      message.error('Не удалось сохранить изменения');
      throw saveError;
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((item) => item.id !== id));
      message.success('Клиент удален');
    } catch {
      message.error('Не удалось удалить клиента');
    }
  };

  const handleDeleteDeal = async (id) => {
    try {
      await deleteDeal(id);
      setDeals((prev) => prev.filter((item) => item.id !== id));
      message.success('Сделка удалена');
    } catch {
      message.error('Не удалось удалить сделку');
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((item) => item.id !== id));
      message.success('Оплата удалена');
    } catch {
      message.error('Не удалось удалить оплату');
    }
  };

  const openContractModal = async (deal) => {
    setSelectedDealForContract(deal);
    setContractModalOpen(true);
    setContractLoading(true);
    setContractHistoryLoading(true);
    try {
      const [context, history] = await Promise.all([
        getDealContractContext(deal.id, { language: contractLanguage }),
        getDealContractGenerations(deal.id),
      ]);
      contractForm.setFieldsValue({
        ...context,
      });
      setContractLanguage(context.language || contractLanguage);
      setContractHistory(Array.isArray(history) ? history : []);
    } catch (loadError) {
      const parsed = extractContractApiError(loadError);
      message.error(parsed.message || 'Не удалось загрузить данные договора');
    } finally {
      setContractLoading(false);
      setContractHistoryLoading(false);
    }
  };

  const reloadContractContext = async (languageCode) => {
    if (!selectedDealForContract) return;
    setContractLoading(true);
    try {
      const context = await getDealContractContext(selectedDealForContract.id, { language: languageCode });
      contractForm.setFieldsValue({
        ...context,
        language: languageCode,
      });
    } catch (loadError) {
      const parsed = extractContractApiError(loadError);
      message.error(parsed.message || 'Не удалось загрузить данные договора');
    } finally {
      setContractLoading(false);
    }
  };

  const closeContractModal = () => {
    setContractModalOpen(false);
    setSelectedDealForContract(null);
    setContractLanguage('uz');
    setContractHistory([]);
    setContractHistoryLoading(false);
    contractForm.resetFields();
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJournal = async () => {
    try {
      const blob = await exportContractGenerationJournal({
        ...journalFilters,
        limit: 500,
      });
      downloadBlob(blob, `contract_generation_journal_${new Date().toISOString().slice(0, 10)}.csv`);
      message.success('Журнал экспортирован');
    } catch {
      message.error('Не удалось экспортировать журнал');
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedDealForContract) return;
    try {
      const values = await contractForm.validateFields();
      setContractGenerating(true);
      const fileBlob = await generateDealContract(selectedDealForContract.id, values);
      const contractNumber = String(values.contract_number || selectedDealForContract.ticket || selectedDealForContract.id);
      const safeContractNumber = contractNumber.replace(/[^a-zA-Z0-9_-]/g, '');
      downloadBlob(fileBlob, `contract_${safeContractNumber || selectedDealForContract.id}.docx`);
      message.success('Договор сформирован');
      closeContractModal();
    } catch (submitError) {
      if (submitError?.errorFields) return;
      const parsed = extractContractApiError(submitError);
      if (parsed.code === 'CONTRACT_REQUIRED_FIELDS_MISSING' && parsed.missingFields.length) {
        const fieldErrors = parsed.missingFields
          .filter((item) => item?.field && item.field !== 'line_items')
          .map((item) => ({
            name: item.field,
            errors: [`Поле обязательно: ${item.label || item.field}`],
          }));
        if (fieldErrors.length) {
          contractForm.setFields(fieldErrors);
        }
        const labels = parsed.missingFields.map((item) => item?.label || item?.field).filter(Boolean);
        message.error(`Не заполнены обязательные поля: ${labels.join(', ')}`);
        return;
      }
      message.error(parsed.message || 'Не удалось сформировать договор');
    } finally {
      setContractGenerating(false);
    }
  };

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];
  const summaryItems = useMemo(
    () => [
      { key: 'clients', label: 'Клиентская база', value: filteredCompanies.length },
      { key: 'deals', label: 'Сделки', value: filteredDeals.length },
      { key: 'renewals', label: 'Продление <= 30 дн.', value: lifecycleSummary.renewalsSoon },
      { key: 'overdue', label: 'Просрочено', value: lifecycleSummary.expired },
    ],
    [filteredCompanies.length, filteredDeals.length, lifecycleSummary.renewalsSoon, lifecycleSummary.expired],
  );

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
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
      {error ? <Alert type="warning" showIcon message={error} /> : null}
      <WorkspaceSummaryStrip items={summaryItems} />

      <WorkspaceTabsShell>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'clients',
              label: 'База клиентов',
              children: (
                canReadCompaniesFeature ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {canManageCompanies ? (
                    <Button type="primary" onClick={() => navigate('/companies/new')}>
                      Создать клиента
                    </Button>
                  ) : null}
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
                        render: (_, record) => (
                          <a onClick={() => navigate(`/companies/${record.id}`)}>
                            {getCompanyDisplayName(record) || 'Без названия'}
                          </a>
                        ),
                      },
                      { title: 'Телефон', dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
                      {
                        title: 'Email',
                        dataIndex: 'email',
                        key: 'email',
                        render: (value, record) => (
                          <EditableCell
                            value={value}
                            record={record}
                            dataIndex="email"
                            onSave={(r, key, nextValue) => handleInlineSave('company', r, key, nextValue)}
                            placeholder="email@example.com"
                          />
                        ),
                      },
                      {
                        title: 'Ответственный',
                        dataIndex: 'owner',
                        key: 'owner',
                        render: (ownerId, record) => (
                          <EditableCell
                            value={ownerId}
                            record={record}
                            dataIndex="owner"
                            type="select"
                            options={userOptions}
                            saveOnBlur={false}
                            onSave={(r, key, nextValue) => handleInlineSave('company', r, key, nextValue)}
                            renderView={(val) => {
                              const option = userOptions.find((item) => String(item.value) === String(val));
                              return option?.label || record.owner_name || '-';
                            }}
                            style={{ paddingInline: 0 }}
                          />
                        ),
                      },
                      { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                      {
                        title: 'Действия',
                        key: 'actions',
                        width: 260,
                        render: (_, record) => (
                          <Space>
                            <Button size="small" onClick={() => navigate(`/companies/${record.id}`)}>
                              Просмотр
                            </Button>
                            {canManageCompanies ? (
                              <>
                                <Button size="small" onClick={() => navigate(`/companies/${record.id}/edit`)}>
                                  Редактировать
                                </Button>
                                <Popconfirm
                                  title="Удалить клиента?"
                                  description="Действие нельзя отменить"
                                  okText="Удалить"
                                  cancelText="Отмена"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleDeleteCompany(record.id)}
                                >
                                  <Button size="small" danger>
                                    Удалить
                                  </Button>
                                </Popconfirm>
                              </>
                            ) : null}
                          </Space>
                        ),
                      },
                    ]}
                  />
                  </Space>
                ) : (
                  <BusinessFeatureGateNotice
                    featureCode="crm.companies"
                    description="Для доступа к базе клиентов включите модуль компаний в лицензии."
                  />
                )
              ),
            },
            {
              key: 'deals',
              label: 'Реестр договоров и продаж',
              children: (
                canReadDealsFeature ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {canManageDeals ? (
                    <Button type="primary" onClick={() => navigate('/deals/new')}>
                      Создать сделку
                    </Button>
                  ) : null}
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
                      render: (name, record) => <a onClick={() => navigate(`/deals/${record.id}`)}>{name || 'Без названия'}</a>,
                    },
                    {
                      title: 'Компания',
                      dataIndex: 'company_name',
                      key: 'company_name',
                      render: (_value, record) => getCompanyDisplayName(record) || '-',
                    },
                    {
                      title: 'Стадия',
                      dataIndex: 'stage',
                      key: 'stage',
                      render: (stageId, record) => (
                        <EditableCell
                          value={stageId}
                          record={record}
                          dataIndex="stage"
                          type="select"
                          options={stageOptions}
                          saveOnBlur={false}
                          onSave={(r, key, nextValue) => handleInlineSave('deal', r, key, nextValue)}
                          renderView={(val) => {
                            const option = stageOptions.find((item) => String(item.value) === String(val));
                            return option?.label || record.stage_name || '-';
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
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
                    {
                      title: 'Дата закрытия',
                      dataIndex: 'closing_date',
                      key: 'closing_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="closing_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('deal', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                      {
                        title: 'Договор',
                        key: 'contract_generate',
                        width: 180,
                        render: (_, record) => (
                          <Button size="small" onClick={() => openContractModal(record)}>
                            Сформировать
                          </Button>
                        ),
                      },
                      {
                        title: 'Действия',
                        key: 'actions',
                        width: 280,
                        render: (_, record) => (
                          <Space>
                            <Button size="small" onClick={() => navigate(`/deals/${record.id}`)}>
                              Просмотр
                            </Button>
                            {canManageDeals ? (
                              <>
                                <Button size="small" onClick={() => navigate(`/deals/${record.id}/edit`)}>
                                  Редактировать
                                </Button>
                                <Popconfirm
                                  title="Удалить сделку?"
                                  description="Действие нельзя отменить"
                                  okText="Удалить"
                                  cancelText="Отмена"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleDeleteDeal(record.id)}
                                >
                                  <Button size="small" danger>
                                    Удалить
                                  </Button>
                                </Popconfirm>
                              </>
                            ) : null}
                          </Space>
                        ),
                      },
                    ]}
                  />
                  </Space>
                ) : (
                  <BusinessFeatureGateNotice
                    featureCode="crm.deals"
                    description="Для доступа к реестру договоров включите модуль сделок в лицензии."
                  />
                )
              ),
            },
            {
              key: 'payments',
              label: 'Финансы / оплаты',
              children: (
                canReadPaymentsFeature ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {canManagePayments ? (
                    <Button type="primary" onClick={() => navigate('/payments/new')}>
                      Создать оплату
                    </Button>
                  ) : null}
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredPayments}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    columns={[
                    {
                      title: 'Дата',
                      dataIndex: 'payment_date',
                      key: 'payment_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="payment_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('payment', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
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
                        render: (status, record) => (
                          <EditableCell
                            value={status}
                            record={record}
                            dataIndex="status"
                            type="select"
                            options={paymentStatusOptions}
                            saveOnBlur={false}
                            onSave={(r, key, nextValue) => handleInlineSave('payment', r, key, nextValue)}
                            renderView={(val) => paymentStatusTag(val)}
                            style={{ paddingInline: 0 }}
                          />
                        ),
                      },
                      {
                        title: 'Действия',
                        key: 'actions',
                        width: 280,
                        render: (_, record) => (
                          <Space>
                            <Button size="small" onClick={() => navigate(`/payments/${record.id}`)}>
                              Просмотр
                            </Button>
                            {canManagePayments ? (
                              <>
                                <Button size="small" onClick={() => navigate(`/payments/${record.id}/edit`)}>
                                  Редактировать
                                </Button>
                                <Popconfirm
                                  title="Удалить оплату?"
                                  description="Действие нельзя отменить"
                                  okText="Удалить"
                                  cancelText="Отмена"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleDeletePayment(record.id)}
                                >
                                  <Button size="small" danger>
                                    Удалить
                                  </Button>
                                </Popconfirm>
                              </>
                            ) : null}
                          </Space>
                        ),
                      },
                    ]}
                  />
                  </Space>
                ) : (
                  <BusinessFeatureGateNotice
                    featureCode="crm.payments"
                    description="Для доступа к оплатам включите финансовый модуль в лицензии."
                  />
                )
              ),
            },
            {
              key: 'debts',
              label: 'Задолженности',
              children: (
                canReadDebtsFeature ? (
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
                      render: (name, record) => <a onClick={() => navigate(`/deals/${record.id}`)}>{name || 'Без названия'}</a>,
                    },
                    {
                      title: 'Компания',
                      dataIndex: 'company_name',
                      key: 'company_name',
                      render: (_value, record) => getCompanyDisplayName(record) || '-',
                    },
                    {
                      title: 'Оплачено',
                      dataIndex: 'paid',
                      key: 'paid',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode
                          ? formatCurrency(value, currencyCode)
                          : <BusinessMoneyValue value={value} />;
                      },
                    },
                    {
                      title: 'Долг',
                      dataIndex: 'debt',
                      key: 'debt',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode
                          ? formatCurrency(value, currencyCode)
                          : <BusinessMoneyValue value={value} />;
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
                ) : (
                  <BusinessFeatureGateNotice
                    featureCode="crm.deals + crm.payments"
                    description="Для расчета задолженностей необходим доступ к сделкам и оплатам по лицензии."
                  />
                )
              ),
            },
            {
              key: 'contracts_audit',
              label: 'Журнал договоров',
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space wrap>
                    <Select
                      allowClear
                      placeholder="Статус"
                      style={{ width: 160 }}
                      value={journalFilters.status || undefined}
                      options={[
                        { value: 'success', label: 'Успешно' },
                        { value: 'failed', label: 'Ошибка' },
                      ]}
                      onChange={(value) => setJournalFilters((prev) => ({ ...prev, status: value || '' }))}
                    />
                    <Select
                      allowClear
                      placeholder="Язык"
                      style={{ width: 140 }}
                      value={journalFilters.language || undefined}
                      options={[
                        { value: 'uz', label: 'UZ' },
                        { value: 'ru', label: 'RU' },
                        { value: 'en', label: 'EN' },
                      ]}
                      onChange={(value) => setJournalFilters((prev) => ({ ...prev, language: value || '' }))}
                    />
                    <Input
                      placeholder="ID сделки"
                      style={{ width: 130 }}
                      value={journalFilters.deal_id}
                      onChange={(e) => setJournalFilters((prev) => ({ ...prev, deal_id: e.target.value }))}
                    />
                    <Input
                      placeholder="Поиск (№/ошибка/сделка)"
                      style={{ width: 260 }}
                      value={journalFilters.q}
                      onChange={(e) => setJournalFilters((prev) => ({ ...prev, q: e.target.value }))}
                    />
                    <Input
                      placeholder="c даты YYYY-MM-DD"
                      style={{ width: 170 }}
                      value={journalFilters.created_from}
                      onChange={(e) => setJournalFilters((prev) => ({ ...prev, created_from: e.target.value }))}
                    />
                    <Input
                      placeholder="по дату YYYY-MM-DD"
                      style={{ width: 170 }}
                      value={journalFilters.created_to}
                      onChange={(e) => setJournalFilters((prev) => ({ ...prev, created_to: e.target.value }))}
                    />
                    <Button onClick={loadContractJournal} loading={journalLoading}>Обновить</Button>
                    <Button onClick={handleExportJournal}>Экспорт CSV</Button>
                  </Space>
                  <Table
                    rowKey="id"
                    loading={journalLoading}
                    dataSource={journalRows}
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    title={() => `Всего записей: ${journalTotal}`}
                    columns={[
                      { title: 'Дата', dataIndex: 'created_at', key: 'created_at', render: (value) => formatDateSafe(value) },
                      {
                        title: 'Статус',
                        dataIndex: 'status',
                        key: 'status',
                        render: (value) => {
                          if (value === 'success') return <Tag color="success">Успешно</Tag>;
                          if (value === 'failed') return <Tag color="error">Ошибка</Tag>;
                          return <Tag>{value || '-'}</Tag>;
                        },
                      },
                      { title: 'Язык', dataIndex: 'language', key: 'language', render: (value) => String(value || '').toUpperCase() || '-' },
                      { title: 'Сделка', dataIndex: 'deal_name', key: 'deal_name', render: (value) => value || '-' },
                      { title: '№ договора', dataIndex: 'contract_number', key: 'contract_number', render: (value) => value || '-' },
                      { title: 'Пользователь', dataIndex: 'generated_by_name', key: 'generated_by_name', render: (value) => value || '-' },
                      { title: 'Код ошибки', dataIndex: 'error_code', key: 'error_code', render: (value) => value || '-' },
                    ]}
                  />
                </Space>
              ),
            },
          ]}
        />
      </WorkspaceTabsShell>

      <Modal
        title={selectedDealForContract ? `Договор по сделке: ${selectedDealForContract.name || selectedDealForContract.id}` : 'Договор'}
        open={contractModalOpen}
        onCancel={closeContractModal}
        onOk={handleGenerateContract}
        width={920}
        okText="Скачать .docx"
        cancelText="Отмена"
        confirmLoading={contractGenerating}
        destroyOnClose
      >
        <Form form={contractForm} layout="vertical" disabled={contractLoading || contractGenerating}>
          <Form.Item name="language" label="Язык договора" initialValue="uz">
            <Select
              options={[
                { value: 'uz', label: 'Oʻzbekcha' },
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' },
              ]}
              onChange={(value) => {
                setContractLanguage(value);
                reloadContractContext(value);
              }}
            />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="contract_number"
              label="Номер договора"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите номер договора' }]}
            >
              <Input placeholder="Например: 15/2026" />
            </Form.Item>
            <Form.Item
              name="contract_date"
              label="Дата договора"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите дату договора' }]}
            >
              <Input placeholder="ДД.ММ.ГГГГ" />
            </Form.Item>
            <Form.Item
              name="contract_city"
              label="Город"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите город договора' }]}
            >
              <Input placeholder="Ташкент" />
            </Form.Item>
          </Space>

          <Form.Item
            name="executor_company_name"
            label="Исполнитель (наименование)"
            rules={[{ required: true, message: 'Укажите наименование исполнителя' }]}
          >
            <Input />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="executor_signer_position"
              label="Должность подписанта исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите должность подписанта исполнителя' }]}
            >
              <Input placeholder="Директор / Руководитель" />
            </Form.Item>
            <Form.Item
              name="executor_director_name"
              label="ФИО подписанта исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите ФИО подписанта исполнителя' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Form.Item
            name="executor_authority_doc"
            label="Основание подписания (исполнитель)"
            rules={[{ required: true, message: 'Укажите основание подписания исполнителя' }]}
          >
            <Input placeholder="Например: Устав / Доверенность №..." />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item name="executor_phone" label="Телефон исполнителя" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item
              name="executor_address"
              label="Юридический адрес исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите юридический адрес исполнителя' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="executor_stir"
              label="СТИР/ИНН исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите СТИР/ИНН исполнителя' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="executor_mfo"
              label="МФО исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите МФО исполнителя' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="executor_account"
              label="Р/с исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите расчетный счет исполнителя' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="executor_bank"
              label="Банк исполнителя"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите банк исполнителя' }]}
            >
              <Input />
            </Form.Item>
          </Space>

          <Form.Item
            name="customer_company_name"
            label="Заказчик (наименование)"
            rules={[{ required: true, message: 'Укажите наименование заказчика' }]}
          >
            <Input />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="customer_representative_position"
              label="Должность подписанта заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите должность подписанта заказчика' }]}
            >
              <Input placeholder="Директор / Руководитель" />
            </Form.Item>
            <Form.Item
              name="customer_representative_name"
              label="ФИО подписанта заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите ФИО подписанта заказчика' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Form.Item
            name="customer_authority_doc"
            label="Основание подписания (заказчик)"
            rules={[{ required: true, message: 'Укажите основание подписания заказчика' }]}
          >
            <Input placeholder="Например: Устав / Доверенность №..." />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="customer_address"
              label="Адрес заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите адрес заказчика' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="customer_phone"
              label="Телефон заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите телефон заказчика' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="customer_email"
              label="Email заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите email заказчика' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="customer_registration_number"
              label="Рег. номер заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите рег. номер заказчика' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="customer_stir"
              label="СТИР/ИНН заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите СТИР/ИНН заказчика' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="customer_mfo"
              label="МФО заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите МФО заказчика' }]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              name="customer_account"
              label="Р/с заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите расчетный счет заказчика' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="customer_bank"
              label="Банк заказчика"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Укажите банк заказчика' }]}
            >
              <Input />
            </Form.Item>
          </Space>

          <Form.Item
            name="contract_scope_text"
            label="Предмет договора (редактируемый текст)"
            rules={[{ required: true, message: 'Укажите предмет договора' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="custom_terms_text" label="Дополнительные условия (редактируемый текст)">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Позиции из CRM (автозаполнение)" tooltip="Список формируется автоматически из вкладки Output/Shipments по этой сделке">
            <Input.TextArea
              rows={6}
              readOnly
              value={watchedLineItems
                .map((row, idx) => `${idx + 1}. ${row.name} | qty: ${row.quantity} | amount: ${row.amount} ${row.currency || ''}`)
                .join('\n')}
            />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }}>
            <Form.Item name="total_amount" label="Итого сумма (из CRM)" style={{ flex: 1 }}>
              <Input readOnly />
            </Form.Item>
            <Form.Item name="total_currency" label="Валюта" style={{ flex: 1 }}>
              <Input readOnly />
            </Form.Item>
          </Space>
          <Form.Item label="История генерации по этой сделке">
            <Table
              rowKey="id"
              size="small"
              loading={contractHistoryLoading}
              dataSource={contractHistory}
              pagination={{ pageSize: 5, hideOnSinglePage: true }}
              columns={[
                { title: 'Дата', dataIndex: 'created_at', key: 'created_at', render: (value) => formatDateSafe(value) },
                {
                  title: 'Статус',
                  dataIndex: 'status',
                  key: 'status',
                  render: (value) => {
                    if (value === 'success') return <Tag color="success">Успешно</Tag>;
                    if (value === 'failed') return <Tag color="error">Ошибка</Tag>;
                    return <Tag>{value || '-'}</Tag>;
                  },
                },
                { title: 'Язык', dataIndex: 'language', key: 'language', render: (value) => String(value || '').toUpperCase() || '-' },
                { title: '№ договора', dataIndex: 'contract_number', key: 'contract_number', render: (value) => value || '-' },
                { title: 'Код ошибки', dataIndex: 'error_code', key: 'error_code', render: (value) => value || '-' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
