import { DollarSign, Edit, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Dropdown, Input, Select, Space, Table, Typography } from 'antd';

import { deletePayment, getPayments } from '../../lib/api/payments';
import { formatCurrency } from '../../lib/utils/format';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';
import { navigate } from '../../router';

const { Search } = Input;
const { Text, Title } = Typography;

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

function PaymentsList() {
  const { message } = App.useApp();
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
            <DollarSign size={14} /> {formatCurrency(record.amount, record.currency_name || 'RUB')}
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
          <Button size="small" icon={<Eye size={14} />} onClick={() => navigate(`/payments/${record.id}`)}>
            Просмотр
          </Button>
          <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/payments/${record.id}/edit`)}>
            Редактировать
          </Button>
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Платежи
            </Title>
            <Text type="secondary">Список платежей</Text>
          </div>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/payments/new')}>
              Создать платеж
            </Button>
          </Space>
        </Space>

        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="Поиск по платежам..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ maxWidth: 360 }}
          />
          <Space>
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
            <Button onClick={() => fetchPayments(pagination.current, searchText, statusFilter)} loading={loading}>
              Обновить
            </Button>
          </Space>
        </Space>

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
    </Card>
  );
}

export default PaymentsList;
