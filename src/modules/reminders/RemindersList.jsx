import { useEffect, useMemo, useState } from 'react';
import { Bell, Eye, Edit, Trash2, Check, X } from 'lucide-react';
import dayjs from 'dayjs';

import { getReminders, deleteReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getUsers, getUser } from '../../lib/api';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog.jsx';

export default function RemindersList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, activeFilter, ownerFilter, contentTypeFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        active: typeof activeFilter === 'boolean' ? activeFilter : undefined,
        owner: ownerFilter || undefined,
        content_type: contentTypeFilter || undefined,
        ordering: '-reminder_date',
      };
      const res = await getReminders(params);
      const results = res.results || [];

      const filteredByDate = dateRange && dateRange.length === 2
        ? results.filter((item) => {
            if (!item.reminder_date) return false;
            const date = dayjs(item.reminder_date);
            return date.isAfter(dayjs(dateRange[0]).startOf('day')) && date.isBefore(dayjs(dateRange[1]).endOf('day'));
          })
        : results;

      setData(filteredByDate);
      setPagination((prev) => ({ ...prev, total: res.count || filteredByDate.length }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить напоминания', variant: 'destructive' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminder(id);
      toast({ title: 'Напоминание удалено', description: 'Напоминание удалено' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить напоминание', variant: 'destructive' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateReminder(id, { active: !currentActive });
      toast({
        title: !currentActive ? 'Напоминание активировано' : 'Напоминание деактивировано',
        description: !currentActive ? 'Напоминание активировано' : 'Напоминание деактивировано',
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить напоминание', variant: 'destructive' });
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const columns = useMemo(() => ([
    {
      title: 'Тема',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <strong>{subject}</strong>,
    },
    {
      title: 'Дата напоминания',
      dataIndex: 'reminder_date',
      key: 'reminder_date',
      render: (date) => {
        if (!date) return '-';
        const reminderDate = dayjs(date);
        const isPast = reminderDate.isBefore(dayjs());
        return (
          <span className={isPast ? 'text-destructive' : undefined}>
            {reminderDate.format('DD MMM YYYY HH:mm')}
            {isPast && ' (Просрочено)'}
          </span>
        );
      },
      sorter: true,
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Badge variant={active ? 'default' : 'secondary'}>
          {active ? 'Активно' : 'Неактивно'}
        </Badge>
      ),
    },
    {
      title: 'Content Type',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 120,
      render: (value) => value ?? '-',
    },
    {
      title: 'Object ID',
      dataIndex: 'object_id',
      key: 'object_id',
      width: 120,
      render: (value) => value ?? '-',
    },
    {
      title: 'Владелец',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (ownerName) => ownerName || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/reminders/${record.id}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Открыть
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/reminders/${record.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Ред.
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(record.id, record.active)}
          >
            {record.active ? <X className="mr-1 h-4 w-4" /> : <Check className="mr-1 h-4 w-4" />}
            {record.active ? 'Откл.' : 'Вкл.'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setConfirmDelete(record)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </Button>
        </div>
      ),
    },
  ]), [activeFilter]);

  return (
    <div>
      <TableToolbar
        title="Напоминания"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по теме или описанию"
        onSearch={setSearchText}
        onCreate={() => navigate('/reminders/new')}
        createButtonText="Новое напоминание"
        showViewModeSwitch={false}
        showExportButton={false}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className="h-9 w-[160px] rounded-md border border-border bg-background px-2 text-sm"
          value={activeFilter ?? ''}
          onChange={(e) => setActiveFilter(e.target.value === '' ? null : e.target.value === 'true')}
        >
          <option value="">Активность</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </select>
        <EntitySelect
          placeholder="Владелец"
          value={ownerFilter}
          onChange={setOwnerFilter}
          fetchList={getUsers}
          fetchById={getUser}
          allowClear
        />
        <input
          type="number"
          min={1}
          className="h-9 w-[160px] rounded-md border border-border bg-background px-2 text-sm"
          placeholder="Content type ID"
          value={contentTypeFilter || ''}
          onChange={(e) => setContentTypeFilter(e.target.value ? Number(e.target.value) : null)}
        />
        <div className="flex items-center gap-2">
          <DatePicker
            value={dateRange?.[0] || null}
            onChange={(val) => setDateRange((prev) => [val, prev?.[1] || null])}
            format="DD.MM.YYYY"
          />
          <span className="text-sm text-muted-foreground">—</span>
          <DatePicker
            value={dateRange?.[1] || null}
            onChange={(val) => setDateRange((prev) => [prev?.[0] || null, val])}
            format="DD.MM.YYYY"
          />
        </div>
      </div>

      <EnhancedTable
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        emptyText="Нет напоминаний"
        emptyDescription="Создайте новое напоминание"
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить напоминание?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Действие нельзя отменить.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(confirmDelete.id)}>
              Удалить
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
