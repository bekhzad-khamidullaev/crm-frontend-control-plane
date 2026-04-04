import React, { useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Empty,
  Grid,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import CrudPage from '../components/CrudPage.jsx';
import { t } from '../lib/i18n/index.js';
import { exportReferenceDataExcel, importReferenceDataExcel } from '../lib/api/crmData.js';
import {
  cityCrud,
  clientTypeCrud,
  closingReasonCrud,
  countryCrud,
  crmTagCrud,
  currencyCrud,
  departmentCrud,
  getCities,
  getCity,
  getClientType,
  getClientTypes,
  getClosingReason,
  getClosingReasons,
  getCountries,
  getCountry,
  getCrmTag,
  getCrmTags,
  getCurrencies,
  getCurrency,
  getCurrencyRates,
  getDepartment,
  getDepartmentMembers,
  getDepartments,
  getIndustries,
  getIndustry,
  getLeadSource,
  getLeadSources,
  getProjectStage,
  getProjectStages,
  getStage,
  getStages,
  getTaskStage,
  getTaskStages,
  getTaskTag,
  getTaskTags,
  industryCrud,
  leadSourceCrud,
  projectStageCrud,
  stageCrud,
  taskStageCrud,
} from '../lib/api/reference.js';
import { getProductCategories, getProductCategory } from '../lib/api/products.js';
import { canWrite, hasAnyFeature } from '../lib/rbac.js';
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
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
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

function buildCrudApi(list, retrieve, crud) {
  return {
    list,
    retrieve,
    create: crud?.create,
    update: crud?.update,
    delete: crud?.remove,
  };
}

function pickPayload(row, fields) {
  const payload = {};
  for (const field of fields || []) {
    if (!field?.name) continue;
    if (row[field.name] !== undefined) {
      payload[field.name] = row[field.name];
    }
  }
  return payload;
}

function downloadJson(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

async function upsertRecords(editor, rows) {
  const result = { created: 0, updated: 0, errors: 0, total: rows.length };
  const { api, fields } = editor;
  const canWriteDataset = Boolean(api?.create && api?.update);
  if (!canWriteDataset) {
    result.errors = rows.length;
    return result;
  }

  for (const row of rows) {
    try {
      const payload = pickPayload(row, fields);
      if (row?.id) {
        try {
          await api.update(row.id, payload);
          result.updated += 1;
          continue;
        } catch {
          await api.create(payload);
          result.created += 1;
          continue;
        }
      }
      await api.create(payload);
      result.created += 1;
    } catch {
      result.errors += 1;
    }
  }

  return result;
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
        title: `${t('referenceDataPage.currencyRates.rates')}: ${currency.name}`,
      });
    } catch {
      setRatesModal({ open: true, data: { error: t('referenceDataPage.currencyRates.loadError') }, title: t('referenceDataPage.currencyRates.rates') });
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
      render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? t('referenceDataPage.common.yes') : t('referenceDataPage.common.no')}</Tag>,
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
          <Empty description={t('referenceDataPage.currencyRates.empty')} />
        )}
      </Modal>
    </>
  );
}

export default function ReferenceDataPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const canManageReference = hasAnyFeature('reference.core') && canWrite();

  const [membersModal, setMembersModal] = useState({
    open: false,
    loading: false,
    data: [],
    title: '',
  });
  const [importFile, setImportFile] = useState(null);
  const [importExcelFile, setImportExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importExcelLoading, setImportExcelLoading] = useState(false);
  const [exportExcelLoading, setExportExcelLoading] = useState(false);
  const [importSummary, setImportSummary] = useState([]);

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
      render: (_, record) => record.full_name || record.username || record.email || 'Пользователь',
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
    } catch {
      setMembersModal({
        open: true,
        loading: false,
        data: [],
        title: `${t('referenceDataPage.members.title')}: ${department.name}`,
      });
    }
  };

  const nameColumn = { title: t('referenceDataPage.common.name'), dataIndex: 'name', key: 'name' };
  const yesNo = (value) => (value ? t('referenceDataPage.common.yes') : t('referenceDataPage.common.no'));

  const editors = useMemo(
    () => [
      {
        key: 'countries',
        label: t('referenceDataPage.tabs.countries'),
        title: t('referenceDataPage.tabs.countries'),
        api: buildCrudApi(allPagesApi.countries, getCountry, countryCrud),
        columns: [nameColumn, ...localizedNameColumns(), { title: 'URL Name', dataIndex: 'url_name', key: 'url_name' }],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'url_name', label: 'URL Name', type: 'text' },
          { name: 'alternative_names', label: 'Alternative names', type: 'textarea' },
        ],
      },
      {
        key: 'cities',
        label: t('referenceDataPage.tabs.cities'),
        title: t('referenceDataPage.tabs.cities'),
        api: buildCrudApi(allPagesApi.cities, getCity, cityCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.country'), dataIndex: 'country_name', key: 'country_name' },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'country', label: t('referenceDataPage.common.country'), type: 'entity', fetchList: getCountries, labelKey: 'name', valueKey: 'id', required: true },
          { name: 'alternative_names', label: 'Alternative names', type: 'textarea' },
        ],
      },
      {
        key: 'industries',
        label: t('referenceDataPage.tabs.industries'),
        title: t('referenceDataPage.tabs.industries'),
        api: buildCrudApi(allPagesApi.industries, getIndustry, industryCrud),
        columns: [nameColumn, ...localizedNameColumns()],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
        ],
      },
      {
        key: 'lead-sources',
        label: t('referenceDataPage.tabs.leadSources'),
        title: t('referenceDataPage.tabs.leadSources'),
        api: buildCrudApi(allPagesApi.leadSources, getLeadSource, leadSourceCrud),
        columns: [nameColumn, ...localizedNameColumns(), { title: 'SLA (h)', dataIndex: 'sla_hours', key: 'sla_hours', width: 100 }],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'sla_hours', label: 'SLA (hours)', type: 'number' },
        ],
      },
      {
        key: 'client-types',
        label: t('referenceDataPage.tabs.clientTypes'),
        title: t('referenceDataPage.tabs.clientTypes'),
        api: buildCrudApi(allPagesApi.clientTypes, getClientType, clientTypeCrud),
        columns: [nameColumn, ...localizedNameColumns()],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
        ],
      },
      {
        key: 'closing-reasons',
        label: t('referenceDataPage.tabs.closingReasons'),
        title: t('referenceDataPage.tabs.closingReasons'),
        api: buildCrudApi(allPagesApi.closingReasons, getClosingReason, closingReasonCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.index'), dataIndex: 'index_number', key: 'index_number', width: 90 },
          { title: t('referenceDataPage.common.successful'), dataIndex: 'success_reason', key: 'success_reason', render: yesNo },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'index_number', label: t('referenceDataPage.common.index'), type: 'number', required: true },
          { name: 'success_reason', label: t('referenceDataPage.common.successful'), type: 'boolean' },
        ],
      },
      {
        key: 'stages',
        label: t('referenceDataPage.tabs.dealStages'),
        title: t('referenceDataPage.tabs.dealStages'),
        api: buildCrudApi(allPagesApi.stages, getStage, stageCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.index'), dataIndex: 'index_number', key: 'index_number', width: 90 },
          { title: t('referenceDataPage.common.default'), dataIndex: 'default', key: 'default', render: yesNo },
          { title: t('referenceDataPage.common.successful'), dataIndex: 'success_stage', key: 'success_stage', render: yesNo },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'index_number', label: t('referenceDataPage.common.index'), type: 'number', required: true },
          { name: 'default', label: t('referenceDataPage.common.default'), type: 'boolean' },
          { name: 'second_default', label: 'Second default', type: 'boolean' },
          { name: 'success_stage', label: t('referenceDataPage.common.successful'), type: 'boolean' },
          { name: 'conditional_success_stage', label: 'Conditional success', type: 'boolean' },
          { name: 'goods_shipped', label: 'Goods shipped', type: 'boolean' },
          { name: 'department', label: t('referenceDataPage.tabs.departments'), type: 'entity', fetchList: getDepartments, labelKey: 'name', valueKey: 'id', required: true },
        ],
      },
      {
        key: 'task-stages',
        label: t('referenceDataPage.tabs.taskStages'),
        title: t('referenceDataPage.tabs.taskStages'),
        api: buildCrudApi(allPagesApi.taskStages, getTaskStage, taskStageCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.index'), dataIndex: 'index_number', key: 'index_number', width: 90 },
          { title: t('referenceDataPage.common.default'), dataIndex: 'default', key: 'default', render: yesNo },
          { title: t('referenceDataPage.common.inProgress'), dataIndex: 'in_progress', key: 'in_progress', render: yesNo },
          { title: t('referenceDataPage.common.done'), dataIndex: 'done', key: 'done', render: yesNo },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'index_number', label: t('referenceDataPage.common.index'), type: 'number', required: true },
          { name: 'default', label: t('referenceDataPage.common.default'), type: 'boolean' },
          { name: 'in_progress', label: t('referenceDataPage.common.inProgress'), type: 'boolean' },
          { name: 'done', label: t('referenceDataPage.common.done'), type: 'boolean' },
          { name: 'active', label: 'Active', type: 'boolean' },
        ],
      },
      {
        key: 'project-stages',
        label: t('referenceDataPage.tabs.projectStages'),
        title: t('referenceDataPage.tabs.projectStages'),
        api: buildCrudApi(allPagesApi.projectStages, getProjectStage, projectStageCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.index'), dataIndex: 'index_number', key: 'index_number', width: 90 },
          { title: t('referenceDataPage.common.default'), dataIndex: 'default', key: 'default', render: yesNo },
          { title: t('referenceDataPage.common.inProgress'), dataIndex: 'in_progress', key: 'in_progress', render: yesNo },
          { title: t('referenceDataPage.common.done'), dataIndex: 'done', key: 'done', render: yesNo },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'index_number', label: t('referenceDataPage.common.index'), type: 'number', required: true },
          { name: 'default', label: t('referenceDataPage.common.default'), type: 'boolean' },
          { name: 'in_progress', label: t('referenceDataPage.common.inProgress'), type: 'boolean' },
          { name: 'done', label: t('referenceDataPage.common.done'), type: 'boolean' },
          { name: 'active', label: 'Active', type: 'boolean' },
        ],
      },
      {
        key: 'crm-tags',
        label: t('referenceDataPage.tabs.crmTags'),
        title: t('referenceDataPage.tabs.crmTags'),
        api: buildCrudApi(allPagesApi.crmTags, getCrmTag, crmTagCrud),
        columns: [nameColumn, ...localizedNameColumns()],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'department', label: t('referenceDataPage.tabs.departments'), type: 'entity', fetchList: getDepartments, labelKey: 'name', valueKey: 'id' },
        ],
      },
      {
        key: 'task-tags',
        label: t('referenceDataPage.tabs.taskTags'),
        title: t('referenceDataPage.tabs.taskTags'),
        api: buildCrudApi(allPagesApi.taskTags, getTaskTag, null),
        columns: [nameColumn, ...localizedNameColumns(), { title: t('referenceDataPage.common.forContent'), dataIndex: 'for_content', key: 'for_content' }],
        fields: [{ name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true }],
        forceReadOnly: true,
      },
      {
        key: 'departments',
        label: t('referenceDataPage.tabs.departments'),
        title: t('referenceDataPage.tabs.departments'),
        api: buildCrudApi(allPagesApi.departments, getDepartment, departmentCrud),
        columns: [
          nameColumn,
          ...localizedNameColumns(),
          { title: t('referenceDataPage.members.count'), dataIndex: 'member_count', key: 'member_count', width: 120 },
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
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
        ],
      },
      {
        key: 'currencies',
        label: t('referenceDataPage.tabs.currencies'),
        title: t('referenceDataPage.tabs.currencies'),
        api: buildCrudApi(allPagesApi.currencies, getCurrency, currencyCrud),
        columns: [
          { title: t('referenceDataPage.common.code'), dataIndex: 'name', key: 'name', width: 120 },
          ...localizedNameColumns(),
          { title: t('referenceDataPage.common.rate'), dataIndex: 'rate_to_state_currency', key: 'rate_to_state_currency' },
          { title: t('referenceDataPage.common.autoUpdate'), dataIndex: 'auto_update', key: 'auto_update', render: yesNo },
        ],
        fields: [
          { name: 'name', label: t('referenceDataPage.common.code'), type: 'text', required: true },
          { name: 'name_ru', label: t('referenceDataPage.common.ru'), type: 'text' },
          { name: 'name_en', label: t('referenceDataPage.common.en'), type: 'text' },
          { name: 'name_uz', label: t('referenceDataPage.common.uz'), type: 'text' },
          { name: 'rate_to_state_currency', label: 'Rate to state', type: 'number' },
          { name: 'rate_to_marketing_currency', label: 'Rate to marketing', type: 'number' },
          { name: 'auto_update', label: t('referenceDataPage.common.autoUpdate'), type: 'boolean' },
        ],
      },
      {
        key: 'product-categories',
        label: t('referenceDataPage.tabs.productCategories'),
        title: t('referenceDataPage.tabs.productCategories'),
        api: buildCrudApi(allPagesApi.productCategories, getProductCategory, null),
        columns: [nameColumn, ...localizedNameColumns()],
        fields: [{ name: 'name', label: t('referenceDataPage.common.name'), type: 'text', required: true }],
        forceReadOnly: true,
      },
    ],
    [allPagesApi]
  );

  const editorMap = useMemo(() => {
    const entries = {};
    for (const editor of editors) {
      entries[editor.key] = editor;
    }
    return entries;
  }, [editors]);

  const handleExportAll = async () => {
    try {
      const data = {};
      for (const editor of editors) {
        if (!editor.api?.list) continue;
        data[editor.key] = await fetchAllReferencePages(editor.api.list);
      }
      downloadJson(`reference_data_export_${new Date().toISOString().slice(0, 10)}.json`, {
        version: 1,
        exported_at: new Date().toISOString(),
        data,
      });
      message.success('Экспорт справочников завершён');
    } catch (error) {
      console.error('Reference export error:', error);
      message.error('Не удалось экспортировать справочники');
    }
  };

  const handleImportAll = async () => {
    if (!importFile) {
      message.warning('Выберите JSON файл для импорта');
      return;
    }

    try {
      setImportLoading(true);
      const parsed = await readJsonFile(importFile);
      const payload = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      const summaryRows = [];

      for (const [datasetKey, rows] of Object.entries(payload || {})) {
        if (!Array.isArray(rows)) continue;
        const editor = editorMap[datasetKey];
        if (!editor) continue;
        const summary = await upsertRecords(editor, rows);
        summaryRows.push({ key: datasetKey, dataset: datasetKey, ...summary });
      }

      setImportSummary(summaryRows);
      const totalErrors = summaryRows.reduce((acc, row) => acc + (row.errors || 0), 0);
      if (totalErrors > 0) {
        message.warning(`Импорт завершён с ошибками: ${totalErrors}`);
      } else {
        message.success('Импорт справочников завершён');
      }
    } catch (error) {
      console.error('Reference import error:', error);
      message.error('Ошибка импорта справочников');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const flattenImportReport = (report) => {
    const sheets = report?.sheets && typeof report.sheets === 'object' ? report.sheets : {};
    return Object.entries(sheets).map(([key, stats]) => ({
      key,
      dataset: key,
      total: (stats?.created || 0) + (stats?.updated || 0) + (stats?.skipped || 0),
      created: stats?.created || 0,
      updated: stats?.updated || 0,
      errors: Array.isArray(stats?.errors) ? stats.errors.length : 0,
    }));
  };

  const handleExportExcel = async () => {
    try {
      setExportExcelLoading(true);
      const blob = await exportReferenceDataExcel();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadBlob(blob, `reference_data_export_${stamp}.xlsx`);
      message.success('Экспорт справочников в XLSX завершён');
    } catch (error) {
      console.error('Reference XLSX export error:', error);
      message.error('Не удалось экспортировать справочники в XLSX');
    } finally {
      setExportExcelLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importExcelFile) {
      message.warning('Выберите XLSX файл для импорта');
      return;
    }
    try {
      setImportExcelLoading(true);
      const report = await importReferenceDataExcel(importExcelFile);
      const summaryRows = flattenImportReport(report);
      setImportSummary(summaryRows);
      const totalErrors = summaryRows.reduce((acc, row) => acc + (row.errors || 0), 0);
      if (totalErrors > 0) {
        message.warning(`XLSX импорт завершён с ошибками: ${totalErrors}`);
      } else {
        message.success('XLSX импорт справочников завершён');
      }
    } catch (error) {
      console.error('Reference XLSX import error:', error);
      const details = error?.details || {};
      const validationErrors = Array.isArray(details?.errors) ? details.errors : [];
      if (validationErrors.length) {
        message.error(`Ошибка шаблона XLSX: ${validationErrors[0]}`);
      } else if (typeof details?.detail === 'string' && details.detail) {
        message.error(`Ошибка XLSX импорта: ${details.detail}`);
      } else {
        message.error('Ошибка XLSX импорта справочников');
      }
    } finally {
      setImportExcelLoading(false);
    }
  };

  const tabs = [
    ...editors.map((editor) => {
      const isReadOnly = !canManageReference || Boolean(editor.forceReadOnly);
      return {
        key: editor.key,
        label: editor.label,
        children: (
          <CrudPage
            title={editor.title}
            api={editor.api}
            columns={editor.columns}
            fields={editor.fields}
            readOnly={isReadOnly}
            pageSize={100}
          />
        ),
      };
    }),
    {
      key: 'currency-rates',
      label: t('referenceDataPage.tabs.currencyRates'),
      children: <CurrencyRatesTab />,
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

      {!canManageReference ? (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message="Редактирование справочников недоступно"
          description="Для CRUD и импорта требуется право записи и feature reference.core."
        />
      ) : null}

      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<DownloadOutlined />} onClick={handleExportAll}>
          Экспорт справочников (JSON)
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExportExcel} loading={exportExcelLoading}>
          Экспорт справочников (XLSX)
        </Button>

        <Upload
          maxCount={1}
          accept=".json"
          beforeUpload={(file) => {
            setImportFile(file);
            return false;
          }}
          onRemove={() => setImportFile(null)}
        >
          <Button icon={<UploadOutlined />} disabled={!canManageReference}>
            Выбрать файл импорта
          </Button>
        </Upload>

        <Button type="primary" disabled={!canManageReference || !importFile} loading={importLoading} onClick={handleImportAll}>
          Импорт справочников (JSON)
        </Button>

        <Upload
          maxCount={1}
          accept=".xlsx,.xlsm,.xltx,.xltm"
          beforeUpload={(file) => {
            setImportExcelFile(file);
            return false;
          }}
          onRemove={() => setImportExcelFile(null)}
        >
          <Button icon={<UploadOutlined />} disabled={!canManageReference}>
            Выбрать XLSX файл
          </Button>
        </Upload>

        <Button type="primary" disabled={!canManageReference || !importExcelFile} loading={importExcelLoading} onClick={handleImportExcel}>
          Импорт справочников (XLSX)
        </Button>
      </Space>

      {importSummary.length ? (
        <Table
          size="small"
          style={{ marginBottom: 16 }}
          pagination={false}
          rowKey="key"
          dataSource={importSummary}
          columns={[
            { title: 'Справочник', dataIndex: 'dataset', key: 'dataset' },
            { title: 'Всего', dataIndex: 'total', key: 'total', width: 90 },
            { title: 'Создано', dataIndex: 'created', key: 'created', width: 90 },
            { title: 'Обновлено', dataIndex: 'updated', key: 'updated', width: 90 },
            {
              title: 'Ошибки',
              dataIndex: 'errors',
              key: 'errors',
              width: 90,
              render: (value) => <Tag color={value ? 'red' : 'green'}>{value || 0}</Tag>,
            },
          ]}
        />
      ) : null}

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
