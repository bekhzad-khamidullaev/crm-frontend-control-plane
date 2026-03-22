import React, { useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Grid, Modal, Table, Tabs, Tag, Spin } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { t } from '../lib/i18n/index.js';
import {
  getCountries,
  getCountry,
  getCities,
  getCity,
  getIndustries,
  getIndustry,
  getLeadSources,
  getLeadSource,
  getClientTypes,
  getClientType,
  getClosingReasons,
  getClosingReason,
  getStages,
  getStage,
  getTaskStages,
  getTaskStage,
  getProjectStages,
  getProjectStage,
  getCrmTags,
  getCrmTag,
  getTaskTags,
  getTaskTag,
  getDepartments,
  getDepartment,
  getDepartmentMembers,
  getCurrencies,
  getCurrency,
  getCurrencyRates,
} from '../lib/api/reference.js';
import { getProductCategories, getProductCategory } from '../lib/api/products.js';
import { useTheme } from '../lib/hooks/useTheme.js';

const REFERENCE_PAGE_SIZE = 1000;

async function fetchAllReferencePages(listFn, params = {}) {
  const firstPage = await listFn({ ...params, page: 1, page_size: REFERENCE_PAGE_SIZE });
  if (Array.isArray(firstPage)) return firstPage;
  if (!firstPage || !Array.isArray(firstPage.results)) return [];

  const allResults = [...firstPage.results];
  let next = firstPage.next;
  let page = 2;

  while (next) {
    const currentPage = await listFn({ ...params, page, page_size: REFERENCE_PAGE_SIZE });
    allResults.push(...(Array.isArray(currentPage?.results) ? currentPage.results : []));
    next = currentPage?.next;
    page += 1;
    if (page > 200) break;
  }

  return allResults;
}

function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function dedupeRows(rows, keySelector) {
  const seen = new Set();
  const unique = [];
  for (const row of rows || []) {
    const rawKey = keySelector(row);
    const key = Array.isArray(rawKey)
      ? rawKey.map((part) => normalizeValue(part)).join('::')
      : normalizeValue(rawKey);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function withAllPagesDeduped(listFn, keySelector, baseParams = {}) {
  return async (params = {}) => {
    const rows = await fetchAllReferencePages(listFn, { ...params, ...baseParams });
    return dedupeRows(rows, keySelector);
  };
}

function localizedNameColumns() {
  return [
    {
      title: t('referenceDataPage.common.ru'),
      dataIndex: 'name_ru',
      key: 'name_ru',
      render: (value, record) => value || record?.name || '-',
    },
    {
      title: t('referenceDataPage.common.en'),
      dataIndex: 'name_en',
      key: 'name_en',
      render: (value, record) => value || record?.name || '-',
    },
    {
      title: t('referenceDataPage.common.uz'),
      dataIndex: 'name_uz',
      key: 'name_uz',
      render: (value, record) => value || record?.name || '-',
    },
  ];
}

function CurrencyRatesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [ratesModal, setRatesModal] = useState({
    open: false,
    data: null,
    title: '',
    error: '',
    loading: false,
  });

  const fetchCurrencies = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await withAllPagesDeduped(getCurrencies, (row) => row?.name)();
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      setData([]);
      setLoadError(t('referenceDataPage.currencyRates.loadError', 'Не удалось загрузить валюты'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCurrencies();
  }, []);

  const openRates = async (currency) => {
    setRatesModal({
      open: true,
      data: null,
      title: `${t('referenceDataPage.currencyRates.rates')}: ${currency.name}`,
      error: '',
      loading: true,
    });
    try {
      const rates = await getCurrencyRates(currency.id);
      setRatesModal({
        open: true,
        data: rates,
        title: `${t('referenceDataPage.currencyRates.rates')}: ${currency.name}`,
        error: '',
        loading: false,
      });
    } catch {
      setRatesModal({
        open: true,
        data: null,
        title: `${t('referenceDataPage.currencyRates.rates')}: ${currency.name}`,
        error: t('referenceDataPage.currencyRates.loadError', 'Не удалось загрузить курсы валют'),
        loading: false,
      });
    }
  };

  const columns = [
    { title: t('referenceDataPage.common.code'), dataIndex: 'name', key: 'name', width: 120 },
    {
      title: t('referenceDataPage.common.rate'),
      dataIndex: 'rate_to_state_currency',
      key: 'rate_to_state_currency',
      width: 140,
    },
    {
      title: t('referenceDataPage.common.autoUpdate'),
      dataIndex: 'auto_update',
      key: 'auto_update',
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>
          {value ? t('referenceDataPage.common.yes') : t('referenceDataPage.common.no')}
        </Tag>
      ),
    },
    {
      title: t('referenceDataPage.common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => openRates(record)}>
          {t('referenceDataPage.currencyRates.rates')}
        </Button>
      ),
    },
  ];

  const rateRows = useMemo(() => {
    const payload = ratesModal.data;
    if (!payload || typeof payload !== 'object') return [];
    return Object.entries(payload)
      .filter(([key, value]) => !Array.isArray(value) && typeof value !== 'object')
      .map(([key, value]) => ({
        key,
        label: key.replace(/_/g, ' '),
        value: value ?? '-',
      }));
  }, [ratesModal.data]);

  return (
    <>
      {loadError ? (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message={loadError}
          action={
            <Button size="small" onClick={fetchCurrencies}>
              {t('common.retry', 'Повторить')}
            </Button>
          }
        />
      ) : null}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: (
            <Empty description={t('referenceDataPage.currencyRates.empty', 'Нет валют для отображения')} />
          ),
        }}
      />
      <Modal
        title={ratesModal.title}
        open={ratesModal.open}
        onCancel={() =>
          setRatesModal({ open: false, data: null, title: '', error: '', loading: false })
        }
        footer={null}
      >
        {ratesModal.loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin />
          </div>
        ) : ratesModal.error ? (
          <Alert showIcon type="error" message={ratesModal.error} />
        ) : rateRows.length ? (
          <Descriptions column={1} bordered size="small">
            {rateRows.map((row) => (
              <Descriptions.Item key={row.key} label={row.label}>
                {String(row.value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Empty description={t('referenceDataPage.currencyRates.empty', 'Нет курсов для отображения')} />
        )}
      </Modal>
    </>
  );
}

export default function ReferenceDataPage() {
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const readOnly = true;
  const emptyFields = [];
  const [membersModal, setMembersModal] = useState({
    open: false,
    loading: false,
    data: [],
    title: '',
  });
  const allPagesApi = useMemo(
    () => ({
      countries: withAllPagesDeduped(getCountries, (row) => row?.name),
      cities: withAllPagesDeduped(getCities, (row) => [row?.country, row?.name]),
      industries: withAllPagesDeduped(getIndustries, (row) => row?.name),
      leadSources: withAllPagesDeduped(getLeadSources, (row) => row?.name),
      clientTypes: withAllPagesDeduped(getClientTypes, (row) => row?.name),
      closingReasons: withAllPagesDeduped(getClosingReasons, (row) => row?.name),
      stages: withAllPagesDeduped(getStages, (row) => row?.name),
      taskStages: withAllPagesDeduped(getTaskStages, (row) => row?.name),
      projectStages: withAllPagesDeduped(getProjectStages, (row) => row?.name),
      crmTags: withAllPagesDeduped(getCrmTags, (row) => row?.name),
      taskTags: withAllPagesDeduped(getTaskTags, (row) => [row?.for_content, row?.name]),
      departments: withAllPagesDeduped(getDepartments, (row) => row?.name),
      currencies: withAllPagesDeduped(getCurrencies, (row) => row?.name),
      productCategories: withAllPagesDeduped(getProductCategories, (row) => row?.name),
    }),
    []
  );

  const departmentMemberColumns = [
    {
      title: t('referenceDataPage.members.user'),
      key: 'name',
      render: (_, record) => record.full_name || record.username || record.email || `#${record.id}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-',
    },
    {
      title: t('referenceDataPage.members.role'),
      key: 'role',
      render: (_, record) => record.role_name || record.role || '-',
    },
  ];

  const openDepartmentMembers = async (department) => {
    setMembersModal({
      open: true,
      loading: true,
      data: [],
      title: `${t('referenceDataPage.members.title')}: ${department.name}`,
    });
    try {
      const response = await getDepartmentMembers(department.id);
      const list = response?.results || response || [];
      setMembersModal({
        open: true,
        loading: false,
        data: Array.isArray(list) ? list : [],
        title: `${t('referenceDataPage.members.title')}: ${department.name}`,
      });
    } catch (error) {
      setMembersModal({
        open: true,
        loading: false,
        data: [],
        title: `${t('referenceDataPage.members.title')}: ${department.name}`,
      });
    }
  };

  const nameColumn = { title: t('referenceDataPage.common.name'), dataIndex: 'name', key: 'name' };
  const yesNo = (value) =>
    value ? t('referenceDataPage.common.yes') : t('referenceDataPage.common.no');

  const tabs = [
    {
      key: 'countries',
      label: t('referenceDataPage.tabs.countries'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.countries')}
          api={{ list: allPagesApi.countries, retrieve: getCountry }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'cities',
      label: t('referenceDataPage.tabs.cities'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.cities')}
          api={{ list: allPagesApi.cities, retrieve: getCity }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.country'),
              dataIndex: 'country_name',
              key: 'country_name',
            },
            {
              title: t('referenceDataPage.common.countryRu'),
              dataIndex: 'country_name_ru',
              key: 'country_name_ru',
            },
            {
              title: t('referenceDataPage.common.countryEn'),
              dataIndex: 'country_name_en',
              key: 'country_name_en',
            },
            {
              title: t('referenceDataPage.common.countryUz'),
              dataIndex: 'country_name_uz',
              key: 'country_name_uz',
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'industries',
      label: t('referenceDataPage.tabs.industries'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.industries')}
          api={{ list: allPagesApi.industries, retrieve: getIndustry }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'lead-sources',
      label: t('referenceDataPage.tabs.leadSources'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.leadSources')}
          api={{ list: allPagesApi.leadSources, retrieve: getLeadSource }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'client-types',
      label: t('referenceDataPage.tabs.clientTypes'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.clientTypes')}
          api={{ list: allPagesApi.clientTypes, retrieve: getClientType }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'closing-reasons',
      label: t('referenceDataPage.tabs.closingReasons'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.closingReasons')}
          api={{ list: allPagesApi.closingReasons, retrieve: getClosingReason }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'stages',
      label: t('referenceDataPage.tabs.dealStages'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.dealStages')}
          api={{ list: allPagesApi.stages, retrieve: getStage }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.index'),
              dataIndex: 'index_number',
              key: 'index_number',
              width: 90,
            },
            {
              title: t('referenceDataPage.common.default'),
              dataIndex: 'default',
              key: 'default',
              render: yesNo,
            },
            {
              title: t('referenceDataPage.common.successful'),
              dataIndex: 'success_stage',
              key: 'success_stage',
              render: yesNo,
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'task-stages',
      label: t('referenceDataPage.tabs.taskStages'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.taskStages')}
          api={{ list: allPagesApi.taskStages, retrieve: getTaskStage }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.index'),
              dataIndex: 'index_number',
              key: 'index_number',
              width: 90,
            },
            {
              title: t('referenceDataPage.common.default'),
              dataIndex: 'default',
              key: 'default',
              render: yesNo,
            },
            {
              title: t('referenceDataPage.common.inProgress'),
              dataIndex: 'in_progress',
              key: 'in_progress',
              render: yesNo,
            },
            {
              title: t('referenceDataPage.common.done'),
              dataIndex: 'done',
              key: 'done',
              render: yesNo,
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'project-stages',
      label: t('referenceDataPage.tabs.projectStages'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.projectStages')}
          api={{ list: allPagesApi.projectStages, retrieve: getProjectStage }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.index'),
              dataIndex: 'index_number',
              key: 'index_number',
              width: 90,
            },
            {
              title: t('referenceDataPage.common.default'),
              dataIndex: 'default',
              key: 'default',
              render: yesNo,
            },
            {
              title: t('referenceDataPage.common.inProgress'),
              dataIndex: 'in_progress',
              key: 'in_progress',
              render: yesNo,
            },
            {
              title: t('referenceDataPage.common.done'),
              dataIndex: 'done',
              key: 'done',
              render: yesNo,
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'crm-tags',
      label: t('referenceDataPage.tabs.crmTags'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.crmTags')}
          api={{ list: allPagesApi.crmTags, retrieve: getCrmTag }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'task-tags',
      label: t('referenceDataPage.tabs.taskTags'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.taskTags')}
          api={{ list: allPagesApi.taskTags, retrieve: getTaskTag }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.forContent'),
              dataIndex: 'for_content',
              key: 'for_content',
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'departments',
      label: t('referenceDataPage.tabs.departments'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.departments')}
          api={{ list: allPagesApi.departments, retrieve: getDepartment }}
          columns={[
            nameColumn,
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.members.count'),
              dataIndex: 'member_count',
              key: 'member_count',
              width: 120,
            },
            {
              title: t('referenceDataPage.members.composition'),
              key: 'members',
              width: 120,
              render: (_, record) => (
                <Button type="link" onClick={() => openDepartmentMembers(record)}>
                  {t('referenceDataPage.members.composition')}
                </Button>
              ),
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'currencies',
      label: t('referenceDataPage.tabs.currencies'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.currencies')}
          api={{ list: allPagesApi.currencies, retrieve: getCurrency }}
          columns={[
            {
              title: t('referenceDataPage.common.code'),
              dataIndex: 'name',
              key: 'name',
              width: 120,
            },
            ...localizedNameColumns(),
            {
              title: t('referenceDataPage.common.rate'),
              dataIndex: 'rate_to_state_currency',
              key: 'rate_to_state_currency',
            },
            {
              title: t('referenceDataPage.common.autoUpdate'),
              dataIndex: 'auto_update',
              key: 'auto_update',
              render: yesNo,
            },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'currency-rates',
      label: t('referenceDataPage.tabs.currencyRates'),
      children: <CurrencyRatesTab />,
    },
    {
      key: 'product-categories',
      label: t('referenceDataPage.tabs.productCategories'),
      children: (
        <CrudPage
          title={t('referenceDataPage.tabs.productCategories')}
          api={{ list: allPagesApi.productCategories, retrieve: getProductCategory }}
          columns={[nameColumn, ...localizedNameColumns()]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
  ];

  return (
    <>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message={t('referenceDataPage.alert.title')}
        description={t('referenceDataPage.alert.description')}
      />
      <Tabs
        items={tabs}
        tabPosition={isMobile ? 'top' : 'left'}
        style={{
          background: theme === 'dark' ? '#161b22' : '#fff',
          padding: isMobile ? 12 : 16,
          borderRadius: 8,
        }}
      />
      <Modal
        title={membersModal.title}
        open={membersModal.open}
        onCancel={() => setMembersModal({ open: false, loading: false, data: [], title: '' })}
        footer={null}
        width={720}
      >
        {membersModal.loading ? (
          <Spin />
        ) : membersModal.data.length ? (
          <Table
            dataSource={membersModal.data}
            columns={departmentMemberColumns}
            rowKey={(record) => record.id || record.email || record.username}
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description={t('referenceDataPage.members.empty')} />
        )}
      </Modal>
    </>
  );
}
