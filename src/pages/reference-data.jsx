import React, { useState } from 'react';
import { Button, Grid, Modal, Table, Tabs, Tag, Spin } from 'antd';
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
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
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
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {ratesModal.data ? JSON.stringify(ratesModal.data, null, 2) : ''}
        </pre>
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
          api={{ list: getCountries, retrieve: getCountry }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'cities',
      label: 'Города',
      children: (
        <CrudPage
          title="Города"
          api={{ list: getCities, retrieve: getCity }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Страна', dataIndex: 'country_name', key: 'country_name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'industries',
      label: 'Отрасли',
      children: (
        <CrudPage
          title="Отрасли"
          api={{ list: getIndustries, retrieve: getIndustry }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'lead-sources',
      label: 'Источники лидов',
      children: (
        <CrudPage
          title="Источники лидов"
          api={{ list: getLeadSources, retrieve: getLeadSource }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'client-types',
      label: 'Типы клиентов',
      children: (
        <CrudPage
          title="Типы клиентов"
          api={{ list: getClientTypes, retrieve: getClientType }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'closing-reasons',
      label: 'Причины закрытия',
      children: (
        <CrudPage
          title="Причины закрытия"
          api={{ list: getClosingReasons, retrieve: getClosingReason }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'stages',
      label: 'Стадии сделок',
      children: (
        <CrudPage
          title="Стадии сделок"
          api={{ list: getStages, retrieve: getStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Успешная', dataIndex: 'success_stage', key: 'success_stage', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Отдел', dataIndex: 'department', key: 'department', width: 90 },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'task-stages',
      label: 'Стадии задач',
      children: (
        <CrudPage
          title="Стадии задач"
          api={{ list: getTaskStages, retrieve: getTaskStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'В работе', dataIndex: 'in_progress', key: 'in_progress', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Завершено', dataIndex: 'done', key: 'done', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'project-stages',
      label: 'Стадии проектов',
      children: (
        <CrudPage
          title="Стадии проектов"
          api={{ list: getProjectStages, retrieve: getProjectStage }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 90 },
            { title: 'По умолчанию', dataIndex: 'default', key: 'default', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'В работе', dataIndex: 'in_progress', key: 'in_progress', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Завершено', dataIndex: 'done', key: 'done', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'crm-tags',
      label: 'CRM теги',
      children: (
        <CrudPage
          title="CRM теги"
          api={{ list: getCrmTags, retrieve: getCrmTag }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Отдел', dataIndex: 'department', key: 'department', width: 100 },
            { title: 'Владелец', dataIndex: 'owner', key: 'owner', width: 100 },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'task-tags',
      label: 'Теги задач',
      children: (
        <CrudPage
          title="Теги задач"
          api={{ list: getTaskTags, retrieve: getTaskTag }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Для контента', dataIndex: 'for_content', key: 'for_content' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
    {
      key: 'departments',
      label: 'Отделы',
      children: (
        <CrudPage
          title="Отделы"
          api={{ list: getDepartments, retrieve: getDepartment }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
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
        />
      ),
    },
    {
      key: 'currencies',
      label: 'Валюты',
      children: (
        <CrudPage
          title="Валюты"
          api={{ list: getCurrencies, retrieve: getCurrency }}
          columns={[
            { title: 'Код', dataIndex: 'name', key: 'name', width: 120 },
            { title: 'Курс', dataIndex: 'rate_to_state_currency', key: 'rate_to_state_currency' },
            { title: 'Автообновление', dataIndex: 'auto_update', key: 'auto_update', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
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
          api={{ list: getProductCategories, retrieve: getProductCategory }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Название', dataIndex: 'name', key: 'name' },
          ]}
          fields={emptyFields}
          readOnly={readOnly}
        />
      ),
    },
  ];

  return (
    <>
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
      >
        {membersModal.loading ? (
          <Spin />
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {membersModal.data.length ? JSON.stringify(membersModal.data, null, 2) : 'Нет данных'}
          </pre>
        )}
      </Modal>
    </>
  );
}
