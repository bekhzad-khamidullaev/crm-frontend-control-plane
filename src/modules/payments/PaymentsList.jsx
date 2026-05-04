import { CreditCardOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Popconfirm, Select, Space, Table, Typography } from 'antd';

import { BusinessEntityListShell } from '../../components/business/BusinessEntityListShell';
import { deletePayment, getPayments } from '../../lib/api/payments';
import { canWrite } from '../../lib/rbac.js';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { formatCurrencyForRecord } from '../../lib/utils/format';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';
import { navigate } from '../../router';

const { Text } = Typography;

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

function PaymentsList() {
  const { message } = App.useApp();
  const canManage = canWrite('crm.change_payment');
  const [payments, setPayments] = useState([]);
  const [allPaymentsCache, setAllPaymentsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    fetchPayments(1, searchText, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPayments = async (page = 1, search = '', status = statusFilter, pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayments({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: status || undefined,
      });
      const results = response.results || [];
      const totalCount = response.count || 0;

      if (results.length > pageSize && results.length === totalCount) {
        setAllPaymentsCache(results);
        const startIndex = (page - 1) * pageSize;
        setPayments(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllPaymentsCache(null);
        setPayments(results);
      }

      setPagination((prev) => ({ ...prev, current: page, pageSize, total: totalCount }));
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить список платежей');
      message.error('Ошибка загрузки платежей');
      setPayments([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchPayments(1, value, statusFilter);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    fetchPayments(1, '', null);
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;

    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllPaymentsCache(null);
      fetchPayments(nextPage, searchText, statusFilter, nextPageSize);
      return;
    }

    if (allPaymentsCache && allPaymentsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setPayments(allPaymentsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchPayments(nextPage, searchText, statusFilter, nextPageSize);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePayment(id);
      message.success('Платеж удален');
      fetchPayments(pagination.current, searchText, statusFilter);
    } catch {
      message.error('Ошибка удаления платежа');
    }
  };

  const handleExport = (format) => {
    const filename = `payments_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    if (format === 'excel') {
      exportToExcel(payments, [], filename);
    } else {
      exportToCSV(payments, [], filename);
    }
    message.success('Платежи экспортированы');
  };

  const columns = [
    {
      title: 'Платеж',
      key: 'payment',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <CreditCardOutlined size={14} /> {formatCurrencyForRecord(record.amount, record, {
              currencyKeys: ['currency_code', 'currency_name', 'deal_currency_code', 'deal_currency_name'],
            })}
          </Text>
          <Text type="secondary">{record.payment_date ? new Date(record.payment_date).toLocaleDateString('ru-RU') : ''}</Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => statusOptions.find((opt) => opt.value === status)?.label || status || '-',
    },
    {
      title: 'Дата платежа',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Сделка',
      dataIndex: 'deal_name',
      key: 'deal_name',
      render: (value) => value || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined size={14} />} onClick={() => navigate(`/payments/${record.id}`)}>
            Просмотр
          </Button>
          {canManage ? (
            <>
              <Button size="small" icon={<EditOutlined size={14} />} onClick={() => navigate(`/payments/${record.id}/edit`)}>
                Редактировать
              </Button>
              <Popconfirm
                title="Удалить платеж?"
                description="Это действие нельзя отменить."
                onConfirm={() => handleDelete(record.id)}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined size={14} />}>
                  Удалить
                </Button>
              </Popconfirm>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <BusinessEntityListShell
      title="Платежи"
      subtitle="Список платежей"
      extra={(
        <Space>
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: 'CSV', onClick: () => handleExport('csv') },
                { key: 'excel', label: 'Excel', onClick: () => handleExport('excel') },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />}>Экспорт</Button>
          </Dropdown>
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/payments/new')}>
              Создать платеж
            </Button>
          ) : null}
        </Space>
      )}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>

          <EntityListToolbar
            searchValue={searchText}
            searchPlaceholder="Поиск по платежам..."
            onSearchChange={handleSearch}
            filters={(
              <Select
                allowClear
                placeholder="Статус"
                style={{ minWidth: 180 }}
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => {
                  setStatusFilter(value || null);
                  fetchPayments(1, searchText, value || null);
                }}
              />
            )}
            onRefresh={() => fetchPayments(pagination.current, searchText, statusFilter)}
            onReset={handleResetFilters}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={[
              ...(searchText ? [{ key: 'search', label: 'Поиск', value: searchText, onClear: () => handleSearch('') }] : []),
              ...(statusFilter
                ? [
                    {
                      key: 'status',
                      label: 'Статус',
                      value: statusOptions.find((opt) => opt.value === statusFilter)?.label || statusFilter,
                      onClear: () => {
                        setStatusFilter(null);
                        fetchPayments(1, searchText, null);
                      },
                    },
                  ]
                : []),
            ]}
          />

          {error ? <Text type="danger">{error}</Text> : null}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={payments}
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={handleTableChange}
            locale={{ emptyText: 'Нет платежей' }}
          />
      </Space>
    </BusinessEntityListShell>
  );
}

export default PaymentsList;
