import { useEffect, useState } from 'react';
import { Button, Space, Tag, Select, message, Modal } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { getPayments, deletePayment, updatePayment } from '../../lib/api/payments';
import { navigate } from '../../router';
import dayjs from 'dayjs';
import BulkActions from '../../components/ui-BulkActions.jsx';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

const statusColors = {
  r: 'green',
  g: 'blue',
  h: 'orange',
  l: 'default',
};

export default function PaymentsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        status: statusFilter || undefined,
      };
      const res = await getPayments(params);
      const results = res.results || [];
      setData(results);
      setPagination((prev) => ({ ...prev, total: res.count || results.length }));
    } catch (error) {
      message.error('Не удалось загрузить платежи');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Удалить платеж',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deletePayment(id);
          message.success('Платеж удален');
          fetchData();
        } catch (error) {
          message.error('Ошибка удаления платежа');
        }
      },
    });
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((paymentId) => deletePayment(paymentId)));
      message.success(`Удалено ${ids.length} платежей`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('Ошибка массового удаления');
      throw error;
    }
  };

  const handleBulkStatusChange = (ids) => {
    let newStatus = statusOptions[0]?.value;
    Modal.confirm({
      title: 'Изменить статус',
      content: (
        <Select
          id="bulk-status-select"
          style={{ width: '100%', marginTop: 16 }}
          placeholder="Выберите статус"
          defaultValue={newStatus}
          options={statusOptions}
          onChange={(value) => {
            newStatus = value;
          }}
        />
      ),
      onOk: async () => {
        if (!newStatus) {
          message.warning('Выберите статус');
          return;
        }
        try {
          await Promise.all(ids.map((paymentId) => updatePayment(paymentId, { status: newStatus })));
          message.success(`Обновлено ${ids.length} платежей`);
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error('Ошибка обновления платежей');
        }
      },
    });
  };

  const exportColumns = [
    { key: 'amount', label: 'Сумма' },
    { key: 'currency_name', label: 'Валюта' },
    { key: 'status', label: 'Статус' },
    { key: 'deal_name', label: 'Сделка' },
    { key: 'payment_date', label: 'Дата платежа' },
    { key: 'transaction_id', label: 'Транзакция' },
  ];

  const buildExportRows = (ids = []) => {
    const source = ids.length ? data.filter((payment) => ids.includes(payment.id)) : data;
    return source;
  };

  const performExport = (format, ids = []) => {
    const rows = buildExportRows(ids);
    if (!rows.length) {
      message.warning('Нет данных для экспорта');
      return;
    }
    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const filename = `payments_${new Date().toISOString().split('T')[0]}.${ext}`;
    if (format === 'excel') {
      exportToExcel(rows, exportColumns, filename);
    } else {
      exportToCSV(rows, exportColumns, filename);
    }
    message.success('Данные экспортированы');
  };

  const handleBulkExport = (ids) => {
    performExport('csv', ids);
  };

  const columns = [
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ fontWeight: 'bold' }}>
          <DollarOutlined style={{ marginRight: 6 }} />
          {Number(amount || 0).toLocaleString('ru-RU')} {record.currency_name || '₽'}
        </span>
      ),
      sorter: true,
    },
    {
      title: 'Сделка',
      dataIndex: 'deal_name',
      key: 'deal_name',
      render: (dealName, record) => dealName || (record.deal ? `#${record.deal}` : '-'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusOptions.find((opt) => opt.value === status)?.label || status || '—'}
        </Tag>
      ),
    },
    {
      title: 'Дата платежа',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => (date ? dayjs(date).format('DD MMM YYYY') : '-'),
      sorter: true,
    },
    {
      title: 'Номер договора',
      dataIndex: 'contract_number',
      key: 'contract_number',
      render: (value) => value || '-',
    },
    {
      title: 'Номер счета',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (value) => value || '-',
    },
    {
      title: 'Номер заказа',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (value) => value || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <QuickActions
            record={record}
            onView={(r) => navigate(`/payments/${r.id}`)}
            onEdit={(r) => navigate(`/payments/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <TableToolbar
        title="Платежи"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по сделке, номеру счета..."
        onSearch={(value) => setSearchText(value)}
        onCreate={() => navigate('/payments/new')}
        onRefresh={fetchData}
        createButtonText="Создать платеж"
        showViewModeSwitch={false}
        filters={[
          {
            key: 'status',
            placeholder: 'Статус',
            options: statusOptions,
            width: 180,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value || null);
          }
        }}
      />

      <EnhancedTable
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 1400 }}
        showTotal={true}
        showSizeChanger={true}
        showQuickJumper={true}
        emptyText="Нет платежей"
        emptyDescription="Создайте первый платеж"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onExport={handleBulkExport}
        entityName="платежей"
      />
    </div>
  );
}
