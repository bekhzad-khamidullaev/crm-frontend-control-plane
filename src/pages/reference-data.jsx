import React, { useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Grid, Modal, Table, Tabs, Tag, Spin } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
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

function withAllPages(listFn, baseParams = {}) {
  return async (params = {}) => fetchAllReferencePages(listFn, { ...params, ...baseParams });
}

function localizedNameColumns() {
  return [
    { title: 'RU', dataIndex: 'name_ru', key: 'name_ru', render: (value, record) => value || record?.name || '-' },
    { title: 'EN', dataIndex: 'name_en', key: 'name_en', render: (value, record) => value || record?.name || '-' },
    { title: 'UZ', dataIndex: 'name_uz', key: 'name_uz', render: (value, record) => value || record?.name || '-' },
  ];
}

function CurrencyRatesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ratesModal, setRatesModal] = useState({ open: false, data: null, title: '' });

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await getCurrencies({ page_size: 200 });
      setData(res.results || res || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCurrencies();
  }, []);

  const openRates = async (currency) => {
    try {
      const rates = await getCurrencyRates(currency.id);
      setRatesModal({
        open: true,
        data: rates,
        title: `Курсы: ${currency.name}`,
      });
    } catch (error) {
      setRatesModal({ open: true, data: { error: 'Не удалось загрузить курсы' }, title: 'Курсы' });
    }
  };

  const columns = [
    { title: 'Код', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: 'Курс',
      dataIndex: 'rate_to_state_currency',
      key: 'rate_to_state_currency',
      width: 140,
    },
    {
      title: 'Автообновление',
      dataIndex: 'auto_update',
      key: 'auto_update',
      render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Да' : 'Нет'}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => openRates(record)}>
          Курсы
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
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={ratesModal.title}
        open={ratesModal.open}
        onCancel={() => setRatesModal({ open: false, data: null, title: '' })}
        footer={null}
      >
        {rateRows.length ? (
          <Descriptions column={1} bordered size="small">
            {rateRows.map((row) => (
              <Descriptions.Item key={row.key} label={row.label}>
                {String(row.value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Empty description="Нет доступных данных по курсам" />
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
      countries: withAllPages(getCountries),
      cities: withAllPages(getCities),
      industries: withAllPages(getIndustries),
      leadSources: withAllPages(getLeadSources),
      clientTypes: withAllPages(getClientTypes),
      closingReasons: withAllPages(getClosingReasons),
      stages: withAllPages(getStages),
      taskStages: withAllPages(getTaskStages),
      projectStages: withAllPages(getProjectStages),
      crmTags: withAllPages(getCrmTags),
      taskTags: withAllPages(getTaskTags),
      departments: withAllPages(getDepartments),
      currencies: withAllPages(getCurrencies),
      productCategories: withAllPages(getProductCategories),
    }),
    []
  );

  const departmentMemberColumns = [
    {
      title: 'Пользователь',
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
      title: 'Роль',
      key: 'role',
      render: (_, record) => record.role_name || record.role || '-',
    },
  ];

  const openDepartmentMembers = async (department) => {
    setMembersModal({
      open: true,
      loading: true,
      data: [],
      title: `Сотрудники: ${department.name}`,
    });
    try {
      const response = await getDepartmentMembers(department.id);
      const list = response?.results || response || [];
      setMembersModal({
        open: true,
        loading: false,
        data: Array.isArray(list) ? list : [],
        title: `Сотрудники: ${department.name}`,
      });
    } catch (error) {
      setMembersModal({
        open: true,
        loading: false,
        data: [],
        title: `Сотрудники: ${department.name}`,
      });
    }
  };

  const tabs = [
    {
      key: 'countries',
      label: 'Страны',
      children: (
        <CrudPage
          title="Страны"
          api={{ list: allPagesApi.countries, retrieve: getCountry }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'cities',
      label: 'Города',
      children: (
        <CrudPage
          title="Города"
          api={{ list: allPagesApi.cities, retrieve: getCity }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Страна', dataIndex: 'country_name', key: 'country_name' },
            { title: 'Страна RU', dataIndex: 'country_name_ru', key: 'country_name_ru' },
            { title: 'Страна EN', dataIndex: 'country_name_en', key: 'country_name_en' },
            { title: 'Страна UZ', dataIndex: 'country_name_uz', key: 'country_name_uz' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'industries',
      label: 'Отрасли',
      children: (
        <CrudPage
          title="Отрасли"
          api={{ list: allPagesApi.industries, retrieve: getIndustry }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'lead-sources',
      label: 'Источники лидов',
      children: (
        <CrudPage
          title="Источники лидов"
          api={{ list: allPagesApi.leadSources, retrieve: getLeadSource }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'client-types',
      label: 'Типы клиентов',
      children: (
        <CrudPage
          title="Типы клиентов"
          api={{ list: allPagesApi.clientTypes, retrieve: getClientType }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'closing-reasons',
      label: 'Причины закрытия',
      children: (
        <CrudPage
          title="Причины закрытия"
          api={{ list: allPagesApi.closingReasons, retrieve: getClosingReason }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'stages',
      label: 'Стадии сделок',
      children: (
        <CrudPage
          title="Стадии сделок"
          api={{ list: allPagesApi.stages, retrieve: getStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Успешная', dataIndex: 'success_stage', key: 'success_stage', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'task-stages',
      label: 'Стадии задач',
      children: (
        <CrudPage
          title="Стадии задач"
          api={{ list: allPagesApi.taskStages, retrieve: getTaskStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'В работе', dataIndex: 'in_progress', key: 'in_progress', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Завершено', dataIndex: 'done', key: 'done', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'project-stages',
      label: 'Стадии проектов',
      children: (
        <CrudPage
          title="Стадии проектов"
          api={{ list: allPagesApi.projectStages, retrieve: getProjectStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'В работе', dataIndex: 'in_progress', key: 'in_progress', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Завершено', dataIndex: 'done', key: 'done', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'crm-tags',
      label: 'CRM теги',
      children: (
        <CrudPage
          title="CRM теги"
          api={{ list: allPagesApi.crmTags, retrieve: getCrmTag }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'task-tags',
      label: 'Теги задач',
      children: (
        <CrudPage
          title="Теги задач"
          api={{ list: allPagesApi.taskTags, retrieve: getTaskTag }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Для контента', dataIndex: 'for_content', key: 'for_content' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'departments',
      label: 'Отделы',
      children: (
        <CrudPage
          title="Отделы"
          api={{ list: allPagesApi.departments, retrieve: getDepartment }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
            { title: 'Сотрудников', dataIndex: 'member_count', key: 'member_count', width: 120 },
            {
              title: 'Состав',
              key: 'members',
              width: 120,
              render: (_, record) => (
                <Button type="link" onClick={() => openDepartmentMembers(record)}>
                  Состав
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
      label: 'Валюты',
      children: (
        <CrudPage
          title="Валюты"
          api={{ list: allPagesApi.currencies, retrieve: getCurrency }}
          columns={[
            { title: 'Код', dataIndex: 'name', key: 'name', width: 120 },
            ...localizedNameColumns(),
            { title: 'Курс', dataIndex: 'rate_to_state_currency', key: 'rate_to_state_currency' },
            { title: 'Автообновление', dataIndex: 'auto_update', key: 'auto_update', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
          pageSize={100}
        />
      ),
    },
    {
      key: 'currency-rates',
      label: 'Курсы валют',
      children: <CurrencyRatesTab />,
    },
    {
      key: 'product-categories',
      label: 'Категории продуктов',
      children: (
        <CrudPage
          title="Категории продуктов"
          api={{ list: allPagesApi.productCategories, retrieve: getProductCategory }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            ...localizedNameColumns(),
          ]}
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
        message="Справочники"
        description="Раздел с системными справочными списками (статусы, типы, страны, теги и т.д.), которые используются в карточках и бизнес-процессах CRM."
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
          <Empty description="Нет сотрудников в этом отделе" />
        )}
      </Modal>
    </>
  );
}
