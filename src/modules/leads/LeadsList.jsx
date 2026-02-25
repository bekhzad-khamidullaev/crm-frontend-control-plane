import dayjs from 'dayjs';
import {
    Briefcase,
    Download,
    LayoutGrid,
    List as ListIcon,
    MessageSquare,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BulkSMSModal from '../../components/BulkSMSModal';
import CallButton from '../../components/CallButton';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import { deleteLead, getLeads, leadsApi } from '../../lib/api/client';
import { getLeadSources } from '../../lib/api/reference';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';
import { buildLeadPayload, deriveLeadStatus, getLeadSourceLabel } from '../../lib/utils/leads';
import { navigate } from '../../router';
import LeadsKanban from './LeadsKanban.jsx';

// Shadcn UI Components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { useToast } from "../../components/ui/use-toast";

function LeadsList() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [allLeadsCache, setAllLeadsCache] = useState(null);
  const [leadSources, setLeadSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Array of IDs

  // Modals state
  const [bulkSMSModalVisible, setBulkSMSModalVisible] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const leadSourceMap = useMemo(() => {
    return leadSources.reduce((acc, source) => {
      acc[source.id] = source.name;
      return acc;
    }, {});
  }, [leadSources]);

  const MAX_RETRIES = 3;

  const fetchLeads = async (page = 1, search = '', isRetry = false) => {
    if (isRetry && retryCount >= MAX_RETRIES) {
      setError('Не удалось подключиться к серверу.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getLeads({
        page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });

      setRetryCount(0);
      setError(null);

      const results = response.results || [];
      const totalCount = response.count || 0;

      if (results.length > pagination.pageSize && results.length === totalCount) {
        setAllLeadsCache(results);
        // Client-side pagination
        const startIndex = (page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        setLeads(results.slice(startIndex, endIndex));
        setPagination(prev => ({ ...prev, current: page, total: totalCount }));
      } else {
        setAllLeadsCache(null);
        setLeads(results);
        setPagination(prev => ({ ...prev, current: page, total: totalCount }));
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      if (isRetry) setRetryCount(prev => prev + 1);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список лидов",
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1, searchText, false);

    // Load sources
    getLeadSources({ page_size: 200 }).then(res => {
      setLeadSources(res?.results || res || []);
    }).catch(err => console.error(err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
  };

  const executeSearch = () => {
    setRetryCount(0);
    setAllLeadsCache(null);
    fetchLeads(1, searchText, false);
  };

  const handlePageChange = (newPage) => {
    if (allLeadsCache) {
       const startIndex = (newPage - 1) * pagination.pageSize;
       const endIndex = startIndex + pagination.pageSize;
       setLeads(allLeadsCache.slice(startIndex, endIndex));
       setPagination(prev => ({ ...prev, current: newPage }));
    } else {
       fetchLeads(newPage, searchText);
    }
  };

  // --- Actions ---

  const handleDeleteClick = (id) => {
    setLeadToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead(leadToDelete);
      toast({ title: "Удалено", description: "Лид успешно удален" });
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось удалить лид" });
    } finally {
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) return;
    try {
      await Promise.all(selectedRowKeys.map(id => deleteLead(id)));
      toast({ title: "Успешно", description: `Удалено ${selectedRowKeys.length} лидов` });
      setSelectedRowKeys([]);
      fetchLeads(pagination.current, searchText);
    } catch (error) {
       toast({ variant: "destructive", title: "Ошибка", description: "Ошибка массового удаления" });
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus) return;
    try {
       await Promise.all(selectedRowKeys.map(async (id) => {
         const lead = allLeadsCache ? allLeadsCache.find(l => l.id === id) : leads.find(l => l.id === id);
         if (!lead) return;

         if (bulkStatus === 'lost') await leadsApi.disqualify(id, buildLeadPayload(lead));
         else if (bulkStatus === 'converted') await leadsApi.convert(id, buildLeadPayload(lead));
         else if (bulkStatus === 'new') await leadsApi.patch(id, { disqualified: false });
       }));

       toast({ title: "Успешно", description: "Статусы обновлены" });
       setSelectedRowKeys([]);
       setStatusChangeDialogOpen(false);
       fetchLeads(pagination.current, searchText);
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось обновить статусы" });
    }
  };

  const handleBulkTagConfirm = async () => {
    if (!selectedTags.length) return;
    try {
      await leadsApi.bulkTag({ lead_ids: selectedRowKeys, tag_ids: selectedTags });
      toast({ title: "Успешно", description: "Теги добавлены" });
      setSelectedRowKeys([]);
      setBulkTagDialogOpen(false);
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось добавить теги" });
    }
  };

  const handleExport = (format) => {
    const ids = selectedRowKeys;
    const source = ids.length
      ? (allLeadsCache || leads).filter(l => ids.includes(l.id))
      : (allLeadsCache || leads);

    if (!source.length) {
      toast({ title: "Внимание", description: "Нет данных для экспорта" });
      return;
    }

    const columns = [
      { key: 'first_name', label: 'Имя' },
      { key: 'last_name', label: 'Фамилия' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Телефон' },
      { key: 'company_name', label: 'Компания' },
      { key: 'status', label: 'Статус' },
    ];

    const rows = source.map(lead => ({
      ...lead,
      status: deriveLeadStatus(lead),
    }));

    const filename = `leads_${dayjs().format('YYYY-MM-DD')}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    if (format === 'excel') exportToExcel(rows, columns, filename);
    else exportToCSV(rows, columns, filename);

    toast({ title: "Экспорт", description: "Файл сформирован" });
  };

  // Selection
  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowKeys(leads.map(l => l.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRowKeys.includes(id)) {
      setSelectedRowKeys(prev => prev.filter(k => k !== id));
    } else {
      setSelectedRowKeys(prev => [...prev, id]);
    }
  };

  const getInitials = (first, last) => `${first?.[0]||''}${last?.[0]||''}`.toUpperCase();

  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-700 hover:bg-blue-100', text: 'Новый' },
    converted: { color: 'bg-teal-100 text-teal-700 hover:bg-teal-100', text: 'Конвертирован' },
    lost: { color: 'bg-red-100 text-red-700 hover:bg-red-100', text: 'Потерян' },
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.new;
    return <Badge variant="secondary" className={config.color}>{config.text}</Badge>;
  };

  // Render
  return (
    <div className="w-full p-6 space-y-6 bg-background min-h-screen">

      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
           <h1 className="text-2xl font-bold text-foreground">Лиды</h1>
           <p className="text-muted-foreground text-sm">Управление потенциальными клиентами</p>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-lg">
               <Button
                 variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                 size="sm"
                 onClick={() => setViewMode('table')}
                 className="h-8 w-8 p-0"
                 aria-label="Table View"
               >
                 <ListIcon className="h-4 w-4" />
               </Button>
               <Button
                 variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                 size="sm"
                 onClick={() => setViewMode('kanban')}
                 className="h-8 w-8 p-0"
                 aria-label="Kanban View"
               >
                 <LayoutGrid className="h-4 w-4" />
               </Button>
            </div>

            <Button onClick={() => navigate('/leads/new')} className="gap-2">
               <Plus className="h-4 w-4" /> Создать лид
            </Button>
        </div>
      </div>

      <Card>
         <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b">
            {/* Search */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-sm">
               <div className="relative w-full">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                    placeholder="Поиск по имени, email..."
                    className="pl-9"
                    value={searchText}
                    onChange={handleSearch}
                    onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                 />
               </div>
               <Button variant="outline" size="icon" onClick={() => executeSearch()} aria-label="Search">
                  <Search className="h-4 w-4" />
               </Button>
            </div>

            {/* Actions & Export */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
               <Button variant="outline" size="sm" onClick={() => fetchLeads(pagination.current, searchText)} disabled={loading}>
                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>

               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2">
                     <Download className="h-4 w-4" /> Экспорт
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>

         {/* BULK ACTIONS BAR */}
         {selectedRowKeys.length > 0 && (
           <div className="bg-primary/5 p-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 border-b">
              <span className="text-sm font-medium text-primary">
                Выбрано: {selectedRowKeys.length}
              </span>
              <div className="flex items-center gap-2">
                 <Button size="sm" variant="ghost" onClick={() => setStatusChangeDialogOpen(true)}>
                    <RefreshCw className="h-3 w-3 mr-2" /> Изменить статус
                 </Button>
                 <Button size="sm" variant="ghost" onClick={() => setBulkTagDialogOpen(true)}>
                    <LayoutGrid className="h-3 w-3 mr-2" /> Добавить теги
                 </Button>
                 <Button size="sm" variant="ghost" onClick={() => setBulkSMSModalVisible(true)}>
                    <MessageSquare className="h-3 w-3 mr-2" /> SMS
                 </Button>
                 <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-3 w-3 mr-2" /> Удалить
                 </Button>
                 <Button size="sm" variant="link" onClick={() => setSelectedRowKeys([])}>
                    Сбросить
                 </Button>
              </div>
           </div>
         )}

         {/* CONTENT: Table or Kanban */}
         {viewMode === 'table' ? (
           <div className="relative w-full overflow-auto">
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead className="w-[40px]">
                         <input
                           type="checkbox"
                           className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                           checked={leads.length > 0 && selectedRowKeys.length === leads.length}
                           onChange={(e) => toggleSelectAll(e.target.checked)}
                         />
                      </TableHead>
                      <TableHead>Контакт</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {loading ? (
                     <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                           Загрузка...
                        </TableCell>
                     </TableRow>
                   ) : leads.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                           Лиды не найдены
                        </TableCell>
                     </TableRow>
                   ) : (
                     leads.map((lead) => (
                       <TableRow key={lead.id} data-state={selectedRowKeys.includes(lead.id) && "selected"}>
                          <TableCell>
                             <input
                               type="checkbox"
                               className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                               checked={selectedRowKeys.includes(lead.id)}
                               onChange={() => toggleSelectRow(lead.id)}
                             />
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                   <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                     {getInitials(lead.first_name, lead.last_name)}
                                   </AvatarFallback>
                                </Avatar>
                                <div>
                                   <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                                   {lead.company_name && (
                                     <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" /> {lead.company_name}
                                     </div>
                                   )}
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             {lead.email ? (
                               <a href={`mailto:${lead.email}`} className="text-sm hover:underline hover:text-primary flex items-center gap-2">
                                  {lead.email}
                               </a>
                             ) : '-'}
                          </TableCell>
                          <TableCell>
                             {lead.phone ? (
                               <div className="flex items-center gap-2">
                                  <span className="text-sm">{lead.phone}</span>
                               </div>
                             ) : '-'}
                          </TableCell>
                          <TableCell>
                             {getStatusBadge(deriveLeadStatus(lead))}
                             <div className="text-[10px] text-muted-foreground mt-1">
                                {lead.lead_source_label || getLeadSourceLabel(lead, leadSourceMap)}
                             </div>
                          </TableCell>
                          <TableCell>
                             <span className="text-sm text-muted-foreground">
                                {dayjs(lead.created_at).format('DD.MM.YYYY')}
                             </span>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                {lead.phone && (
                                   <CallButton
                                     phone={lead.phone}
                                     name={`${lead.first_name} ${lead.last_name}`}
                                     entityType="lead"
                                     entityId={lead.id}
                                     size="small"
                                     icon={true}
                                   />
                                )}
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                         <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                         Просмотр
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                                         Редактировать
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleDeleteClick(lead.id)} className="text-destructive focus:text-destructive">
                                         Удалить
                                      </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                          </TableCell>
                       </TableRow>
                     ))
                   )}
                </TableBody>
             </Table>
           </div>
         ) : (
            <div className="p-4 bg-muted/20 min-h-[500px]">
               <LeadsKanban />
            </div>
         )}

         {/* PAGINATION */}
         {viewMode === 'table' && pagination.total > 0 && (
           <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                 Показано {Math.min((pagination.current - 1) * pagination.pageSize + 1, pagination.total)} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} из {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handlePageChange(pagination.current - 1)}
                   disabled={pagination.current <= 1}
                   aria-label="Previous Page"
                 >
                   Назад
                 </Button>
                 <div className="text-sm font-medium">
                    Стр. {pagination.current}
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handlePageChange(pagination.current + 1)}
                   disabled={pagination.current * pagination.pageSize >= pagination.total}
                   aria-label="Next Page"
                 >
                   Вперед
                 </Button>
              </div>
           </div>
         )}
      </Card>

      {/* DIALOGS */}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
               <AlertDialogDescription>
                  Это действие нельзя отменить. Лид будет удален навсегда.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>Отмена</AlertDialogCancel>
               <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Удалить
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change */}
      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Изменить статус</DialogTitle>
               <DialogDescription>
                  Выберите новый статус для {selectedRowKeys.length} выбранных лидов.
               </DialogDescription>
            </DialogHeader>
            <div className="py-4">
               <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger>
                     <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="new">Новый</SelectItem>
                     <SelectItem value="converted">Конвертирован</SelectItem>
                     <SelectItem value="lost">Потерян</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setStatusChangeDialogOpen(false)}>Отмена</Button>
               <Button onClick={handleBulkStatusChange}>Применить</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Bulk Tags (Simplified implementation) */}
      <Dialog open={bulkTagDialogOpen} onOpenChange={setBulkTagDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Добавить теги</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Теги</label>
                  <ReferenceSelect
                     type="crm-tags"
                     mode="multiple"
                     placeholder="Выберите теги"
                     value={selectedTags}
                     onChange={setSelectedTags}
                     style={{ width: '100%' }}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setBulkTagDialogOpen(false)}>Отмена</Button>
               <Button onClick={handleBulkTagConfirm}>Добавить</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <BulkSMSModal
         visible={bulkSMSModalVisible}
         onClose={() => setBulkSMSModalVisible(false)}
         recipients={leads.filter(l => selectedRowKeys.includes(l.id)).map(l => ({
            id: l.id,
            name: `${l.first_name} ${l.last_name}`,
            phone: l.phone
         }))}
      />

    </div>
  );
}

export default LeadsList;
