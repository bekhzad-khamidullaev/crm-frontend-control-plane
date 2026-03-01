import { Building2, DollarSign, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CallButton from '../../components/CallButton';
import QuickActions from '../../components/QuickActions';
import BulkActions from '../../components/ui-BulkActions';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { dealsApi, deleteDeal, getDeals } from '../../lib/api/client';
import { getStages } from '../../lib/api/reference';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';
import { formatCurrency } from '../../lib/utils/format';
import { navigate } from '../../router';

function DealsList() {
  const [deals, setDeals] = useState([]);
  const [allDealsCache, setAllDealsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [stageChangeModalVisible, setStageChangeModalVisible] = useState(false);
  const [bulkStage, setBulkStage] = useState('');
  const [stages, setStages] = useState([]);
  const [stageFilter, setStageFilter] = useState(null);
  const [quickStageModal, setQuickStageModal] = useState({ open: false, record: null, stage: '' });

  const fetchDeals = async (page = 1, search = '', stage = stageFilter, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const response = await getDeals({
        page,
        page_size: pageSize,
        search,
        stage: stage || undefined,
      });
      const results = response.results || [];
      const totalCount = response.count || 0;
      
      // Check if backend pagination is working
      if (results.length > pageSize && results.length === totalCount) {
        console.warn('⚠️ DealsList: Caching all data and using client-side pagination');
        setAllDealsCache(results);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setDeals(results.slice(startIndex, endIndex));
      } else {
        setAllDealsCache(null);
        setDeals(results);
      }
      
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalCount,
      }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки сделок', variant: 'destructive' });
      setDeals([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(1, searchText, stageFilter);
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const response = await getStages({ page_size: 200 });
      setStages(response.results || response || []);
    } catch (error) {
      console.error('Error loading deal stages:', error);
      setStages([]);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchDeals(1, value, stageFilter);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      toast({ title: 'Сделка удалена', description: 'Сделка удалена' });
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления сделки', variant: 'destructive' });
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;
    
    // If pageSize changed, clear cache
    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllDealsCache(null);
      fetchDeals(nextPage, searchText, stageFilter, nextPageSize);
      return;
    }
    
    // If we have cached data, use it
    if (allDealsCache && allDealsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      const endIndex = startIndex + nextPageSize;
      setDeals(allDealsCache.slice(startIndex, endIndex));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchDeals(nextPage, searchText, stageFilter, nextPageSize);
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => deleteDeal(id)));
      toast({ title: 'Удалено', description: `Удалено ${ids.length} сделок` });
      setSelectedRowKeys([]);
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка массового удаления', variant: 'destructive' });
    }
  };

  const handleBulkStageChange = () => {
    setStageChangeModalVisible(true);
  };

  const handleStageChangeConfirm = async () => {
    if (!bulkStage) {
      toast({ title: 'Ошибка', description: 'Выберите стадию', variant: 'destructive' });
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map((id) => dealsApi.patch(id, { stage: Number(bulkStage) }))
      );
      toast({ title: 'Стадия изменена', description: `Стадия изменена для ${selectedRowKeys.length} сделок` });
      setSelectedRowKeys([]);
      setStageChangeModalVisible(false);
      setBulkStage('');
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка изменения стадии', variant: 'destructive' });
    }
  };

  const exportColumns = [
    { key: 'name', label: 'Название' },
    { key: 'amount', label: 'Сумма' },
    { key: 'currency_name', label: 'Валюта' },
    { key: 'stage_name', label: 'Стадия' },
    { key: 'company_name', label: 'Компания' },
    { key: 'contact_name', label: 'Контакт' },
    { key: 'owner_name', label: 'Ответственный' },
  ];

  const buildExportRows = (ids = []) => {
    const source = ids.length ? deals.filter((deal) => ids.includes(deal.id)) : deals;
    return source;
  };

  const performExport = (format, ids = []) => {
    const rows = buildExportRows(ids);
    if (!rows.length) {
      toast({ title: 'Нет данных', description: 'Нет данных для экспорта', variant: 'destructive' });
      return;
    }
    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const filename = `deals_${new Date().toISOString().split('T')[0]}.${ext}`;
    if (format === 'excel') {
      exportToExcel(rows, exportColumns, filename);
    } else {
      exportToCSV(rows, exportColumns, filename);
    }
    toast({ title: 'Экспорт', description: 'Данные экспортированы' });
  };

  const handleBulkExport = (ids) => {
    performExport('csv', ids);
  };

  const handleDuplicate = async (record) => {
    try {
      const {
        id,
        creation_date,
        update_date,
        workflow,
        ticket,
        stage_name,
        stages_dates,
        ...payload
      } = record;
      const baseName = record.name || record.title || 'Сделка';
      const newDeal = {
        ...payload,
        name: `${baseName} (копия)`,
      };
      await dealsApi.create(newDeal);
      toast({ title: 'Сделка дублирована', description: 'Сделка дублирована' });
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка дублирования сделки', variant: 'destructive' });
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {});
  }, [stages]);

  const stageOptions = stages.map((stage) => ({
    label: stage.name,
    value: stage.id,
  }));

  const handleChangeStage = async (record, newStage) => {
    try {
      await dealsApi.patch(record.id, { stage: Number(newStage) });
      toast({ title: 'Стадия сделки изменена', description: 'Стадия сделки изменена' });
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка изменения стадии', variant: 'destructive' });
    }
  };

  const handleArchive = async (record) => {
    try {
      await dealsApi.patch(record.id, { active: false });
      toast({ title: 'Сделка архивирована', description: 'Сделка архивирована' });
      fetchDeals(pagination.current, searchText, stageFilter);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка архивирования', variant: 'destructive' });
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          {record.company_name && (
            <div className="text-xs text-muted-foreground">
              <Building2 className="mr-1 inline h-3 w-3" /> {record.company_name || '-'}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount, record) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            {formatCurrency(amount, record.currency_name || 'RUB')}
          </span>
        </div>
      ),
      sorter: (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
    },
    {
      title: 'Стадия',
      dataIndex: 'stage',
      key: 'stage',
      width: 140,
      render: (stage, record) => {
        const label = record.stage_name || stageMap[stage];
        const display = label || '-';
        return stage ? (
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
            {display}
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      key: 'probability',
      width: 120,
      render: (probability) => {
        const value = Number(probability || 0);
        return (
          <div className="w-full">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${
                  value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-sky-500' : 'bg-rose-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{value}%</div>
          </div>
        );
      },
      sorter: (a, b) => Number(a.probability || 0) - Number(b.probability || 0),
    },
    {
      title: 'Контакт',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User className="h-3 w-3" />
          </div>
          <div>
            <div className="text-sm">
              {record.contact_name || record.contact_full_name || '-'}
            </div>
            {record.contact_phone && (
              <div className="text-xs text-muted-foreground">{record.contact_phone}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
      render: (_owner, record) => record.owner_name || '-',
      sorter: (a, b) =>
        (a.owner_name || '')
          .toString()
          .localeCompare((b.owner_name || '').toString()),
    },
    {
      title: 'Закрытие',
      dataIndex: 'closing_date',
      key: 'closing_date',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const closeDate = new Date(date);
        const today = new Date();
        const daysLeft = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));

        return (
          <div>
            <div className="text-sm">{closeDate.toLocaleDateString('ru-RU')}</div>
            {daysLeft > 0 && daysLeft <= 7 && (
              <div className="text-xs text-amber-600">через {daysLeft} дн.</div>
            )}
            {daysLeft < 0 && (
              <div className="text-xs text-rose-600">просрочено</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.closing_date) - new Date(b.closing_date),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.contact_phone && (
            <CallButton
              phone={record.contact_phone}
              name={record.contact_name || record.contact_full_name || record.name}
              entityType="deal"
              entityId={record.id}
              size="small"
            />
          )}
          <QuickActions
            record={record}
            onView={(r) => navigate(`/deals/${r.id}`)}
            onEdit={(r) => navigate(`/deals/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
            onDuplicate={handleDuplicate}
            onCall={record.contact_phone ? (r) => window.open(`tel:${r.contact_phone}`) : null}
            onChangeStatus={(r) => setQuickStageModal({ open: true, record: r, stage: '' })}
            onArchive={handleArchive}
          />
        </div>
      ),
    },
  ];

  const handleExport = (format) => {
    performExport(format, selectedRowKeys);
  };

  const stageFilters = stageOptions;

  return (
    <div className="space-y-4">
      <TableToolbar
        title="Сделки"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, компании, контакту..."
        onSearch={handleSearch}
        onCreate={() => navigate('/deals/new')}
        onExport={handleExport}
        onRefresh={() => fetchDeals(pagination.current, searchText, stageFilter)}
        filters={[
          {
            key: 'stage',
            placeholder: 'Стадия',
            options: stageFilters,
            width: 150,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'stage') {
            setStageFilter(value || null);
            fetchDeals(1, searchText, value || null);
          }
        }}
        createButtonText="Создать сделку"
        showViewModeSwitch={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={deals}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        showTotal
        showSizeChanger
        showQuickJumper
        emptyText="Нет сделок"
        emptyDescription="Создайте первую сделку или измените параметры поиска"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStageChange}
        onExport={handleBulkExport}
        entityName="сделок"
      />

      <Dialog open={stageChangeModalVisible} onOpenChange={setStageChangeModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить стадию сделок</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Изменить стадию для {selectedRowKeys.length} выбранных сделок
          </p>
          <div className="mt-3">
            <Select value={bulkStage} onValueChange={setBulkStage}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите стадию" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStageChangeModalVisible(false)}>Отмена</Button>
            <Button onClick={handleStageChangeConfirm}>Применить</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickStageModal.open} onOpenChange={(open) => setQuickStageModal((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить стадию</DialogTitle>
          </DialogHeader>
          <div className="mt-3">
            <Select
              value={quickStageModal.stage}
              onValueChange={(val) => setQuickStageModal((prev) => ({ ...prev, stage: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите стадию" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuickStageModal({ open: false, record: null, stage: '' })}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (!quickStageModal.stage || !quickStageModal.record) return;
                handleChangeStage(quickStageModal.record, quickStageModal.stage);
                setQuickStageModal({ open: false, record: null, stage: '' });
              }}
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DealsList;
