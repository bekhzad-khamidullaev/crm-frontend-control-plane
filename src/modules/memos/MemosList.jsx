import { useEffect, useMemo, useState } from 'react';
import { FileText, Eye, Edit, Trash2, Clock, Check } from 'lucide-react';
import dayjs from 'dayjs';

import { getMemos, deleteMemo, markMemoReviewed, markMemoPostponed } from '../../lib/api/memos';
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

const stageLabels = {
  pen: { text: 'В ожидании', className: 'bg-sky-100 text-sky-700' },
  pos: { text: 'Отложено', className: 'bg-amber-100 text-amber-700' },
  rev: { text: 'Рассмотрено', className: 'bg-emerald-100 text-emerald-700' },
};

export default function MemosList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [draftFilter, setDraftFilter] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);
  const [recipientFilter, setRecipientFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, draftFilter, stageFilter, recipientFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        draft: typeof draftFilter === 'boolean' ? draftFilter : undefined,
        stage: stageFilter || undefined,
        to: recipientFilter || undefined,
        ordering: '-update_date',
      };
      const res = await getMemos(params);
      const results = res.results || [];
      const filtered = dateRange && dateRange.length === 2
        ? results.filter((item) => {
            const date = item.update_date || item.creation_date;
            if (!date) return false;
            const parsed = dayjs(date);
            return parsed.isAfter(dayjs(dateRange[0]).startOf('day')) && parsed.isBefore(dayjs(dateRange[1]).endOf('day'));
          })
        : results;

      setData(filtered);
      setPagination((prev) => ({ ...prev, total: res.count || filtered.length }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить мемо', variant: 'destructive' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMemo(id);
      toast({ title: 'Мемо удалено', description: 'Мемо удалено' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить мемо', variant: 'destructive' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await markMemoReviewed(id);
      toast({ title: 'Мемо рассмотрено', description: 'Мемо отмечено как рассмотренное' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить мемо', variant: 'destructive' });
    }
  };

  const handleMarkPostponed = async (id) => {
    try {
      await markMemoPostponed(id);
      toast({ title: 'Мемо отложено', description: 'Мемо отложено' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить мемо', variant: 'destructive' });
    }
  };

  const columns = useMemo(() => ([
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        const stage = stageLabels[record.stage] || { text: '—', className: 'bg-muted text-muted-foreground' };
        return (
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${stage.className}`}>
              {stage.text}
            </span>
            {record.draft && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Черновик
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Получатель',
      dataIndex: 'to_name',
      key: 'to_name',
      render: (toName) => toName || '-',
    },
    {
      title: 'Связь',
      key: 'related',
      render: (_, record) => {
        const items = [
          record.deal_name && { label: 'Сделка', value: record.deal_name },
          record.project_name && { label: 'Проект', value: record.project_name },
          record.task_name && { label: 'Задача', value: record.task_name },
        ].filter(Boolean);
        if (items.length === 0) return '-';
        return (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {items.map((item) => (
              <span key={item.label}>{item.label}: {item.value}</span>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Дата обзора',
      dataIndex: 'review_date',
      key: 'review_date',
      render: (value) => value ? dayjs(value).format('DD.MM.YYYY') : '-',
    },
    {
      title: 'Обновлено',
      dataIndex: 'update_date',
      key: 'update_date',
      render: (date, record) => {
        const value = date || record.creation_date;
        return value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-';
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/memos/${record.id}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Открыть
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/memos/${record.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Ред.
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleMarkPostponed(record.id)}>
            <Clock className="mr-1 h-4 w-4" />
            Отложить
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleMarkReviewed(record.id)}>
            <Check className="mr-1 h-4 w-4" />
            Рассмотрено
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(record)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </Button>
        </div>
      ),
    },
  ]), []);

  return (
    <div>
      <TableToolbar
        title="Мемо"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию или тексту"
        onSearch={setSearchText}
        onCreate={() => navigate('/memos/new')}
        createButtonText="Новое мемо"
        showViewModeSwitch={false}
        showExportButton={false}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Поиск по названию или тексту"
          className="h-9 w-[260px] rounded-md border border-border bg-background px-2 text-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="h-9 w-[160px] rounded-md border border-border bg-background px-2 text-sm"
          value={draftFilter ?? ''}
          onChange={(e) => setDraftFilter(e.target.value === '' ? null : e.target.value === 'true')}
        >
          <option value="">Черновики</option>
          <option value="true">Черновик</option>
          <option value="false">Опубликованные</option>
        </select>
        <select
          className="h-9 w-[180px] rounded-md border border-border bg-background px-2 text-sm"
          value={stageFilter ?? ''}
          onChange={(e) => setStageFilter(e.target.value || null)}
        >
          <option value="">Стадия</option>
          <option value="pen">В ожидании</option>
          <option value="pos">Отложено</option>
          <option value="rev">Рассмотрено</option>
        </select>
        <EntitySelect
          placeholder="Получатель"
          value={recipientFilter}
          onChange={setRecipientFilter}
          fetchList={getUsers}
          fetchById={getUser}
          allowClear
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
        onChange={(newPagination) => setPagination((prev) => ({
          ...prev,
          current: newPagination.current,
          pageSize: newPagination.pageSize,
        }))}
        scroll={{ x: 1200 }}
        emptyText="Нет мемо"
        emptyDescription="Создайте новое мемо"
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить мемо?</AlertDialogTitle>
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
