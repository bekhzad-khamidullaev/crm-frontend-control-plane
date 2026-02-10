import { useEffect, useState } from 'react';
import { DollarSign, Eye, Edit, Trash2 } from 'lucide-react';

import { navigate } from '../../router';
import {
  getPayments,
  deletePayment,
} from '../../lib/api/payments';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { Button } from '../../components/ui/button.jsx';

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

const statusColors = {
  r: 'bg-emerald-100 text-emerald-700',
  g: 'bg-sky-100 text-sky-700',
  h: 'bg-amber-100 text-amber-700',
  l: 'bg-muted text-muted-foreground',
};

function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [allPaymentsCache, setAllPaymentsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    fetchPayments(1, searchText, statusFilter);
  }, []);

  const fetchPayments = async (page = 1, search = '', status = statusFilter, pageSize = pagination.pageSize) => {
    setLoading(true);
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
        console.warn('⚠️ PaymentsList: Caching all data');
        setAllPaymentsCache(results);
        const startIndex = (page - 1) * pageSize;
        setPayments(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllPaymentsCache(null);
        setPayments(results);
      }
      
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalCount,
      }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки платежей', variant: 'destructive' });
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
      toast({ title: 'Платеж удален', description: 'Платеж удален' });
      fetchPayments(pagination.current, searchText, statusFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления платежа', variant: 'destructive' });
    }
  };

  const handleExport = (format) => {
    const filename = `payments_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    if (format === 'excel') {
      exportToExcel(payments, [], filename);
    } else {
      exportToCSV(payments, [], filename);
    }
    toast({ title: 'Экспорт', description: 'Платежи экспортированы' });
  };

  const columns = [
    {
      title: 'Платеж',
      key: 'payment',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">
              {Number(record.amount || 0).toLocaleString('ru-RU')} {record.currency_name || '₽'}
            </div>
            <div className="text-xs text-muted-foreground">#{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
          {statusOptions.find((opt) => opt.value === status)?.label || status || '-'}
        </span>
      ),
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
      render: (value, record) => value || (record.deal ? `#${record.deal}` : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/payments/${record.id}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Просмотр
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/payments/${record.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(record.id)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <TableToolbar
        title="Платежи"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по платежам..."
        onSearch={handleSearch}
        onCreate={() => navigate('/payments/new')}
        onExport={handleExport}
        onRefresh={() => fetchPayments(pagination.current, searchText, statusFilter)}
        filters={[
          {
            key: 'status',
            placeholder: 'Статус',
            options: statusOptions,
            width: 150,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value || null);
            fetchPayments(1, searchText, value || null);
          }
        }}
        createButtonText="Создать платеж"
        showViewModeSwitch={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={payments}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет платежей"
        emptyDescription="Создайте первый платеж"
      />
    </div>
  );
}

export default PaymentsList;
