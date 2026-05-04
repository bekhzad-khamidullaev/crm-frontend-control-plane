// Proof of Concept: DrillDownDialog with TanStack Table
// This is a complete working example showing the migration from Ant Design Table to TanStack Table

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Filter,
  Search,
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import dayjs from 'dayjs';

/**
 * DrillDownDialog - Modal window for detailed data view with TanStack Table
 * 
 * @param {boolean} open - Show dialog
 * @param {Function} onClose - Close callback
 * @param {string} title - Dialog title
 * @param {Array} data - Data to display
 * @param {Array} columns - Column definitions (TanStack Table format)
 * @param {string} segmentLabel - Selected segment name
 * @param {Object} filters - Applied filters
 * @param {Function} onItemClick - Click callback
 * @param {boolean} loading - Loading state
 */
function DrillDownDialog({
  open,
  onClose,
  title = 'Детальная информация',
  data = [],
  columns = [],
  segmentLabel,
  filters = {},
  onItemClick,
  loading = false,
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Memoize data and columns for performance
  const memoizedData = useMemo(() => data, [data]);
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (row) => {
    if (onItemClick) {
      onItemClick(row.original);
    }
  };

  const getFilterTags = () => {
    return Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => (
        <Badge key={key} variant="secondary">
          {key}: {value}
        </Badge>
      ));
  };

  // Render sort icon
  const renderSortIcon = (column) => {
    if (!column.getCanSort()) return null;
    
    const sorted = column.getIsSorted();
    if (sorted === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    if (sorted === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />;
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {segmentLabel && (
              <Badge variant="outline">{segmentLabel}</Badge>
            )}
          </DialogTitle>
          {Object.keys(filters).length > 0 && (
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Активные фильтры:</span>
                {getFilterTags()}
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Search and Stats */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong>Всего:</strong> {data.length}
            </span>
            <span>
              <strong>Найдено:</strong> {table.getFilteredRowModel().rows.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <LoadingState />
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState 
              title={globalFilter ? "Ничего не найдено" : "Нет данных"}
              description={globalFilter ? "Попробуйте изменить поисковый запрос" : null}
            />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {renderSortIcon(header.column)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={onItemClick ? 'cursor-pointer' : ''}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Строк на странице:
            </span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Страница {table.getState().pagination.pageIndex + 1} из{' '}
              {table.getPageCount()}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DrillDownDialog;

// =============================================================================
// USAGE EXAMPLE: Column Definitions for Leads Analytics
// =============================================================================

export const leadsAnalyticsColumns = [
  {
    accessorKey: 'name',
    header: 'Название',
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue('name')}</span>
          {row.original.company && (
            <span className="text-xs text-muted-foreground">
              {row.original.company}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status');
      const statusConfig = {
        new: { label: 'Новый', variant: 'default' },
        qualified: { label: 'Квалифицирован', variant: 'secondary' },
        converted: { label: 'Конвертирован', variant: 'success' },
        lost: { label: 'Проигран', variant: 'destructive' },
      };
      const config = statusConfig[status] || statusConfig.new;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'value',
    header: 'Сумма',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('value'));
      if (isNaN(amount)) return '—';
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(amount);
    },
    // Enable sorting for this column
    sortingFn: 'basic',
  },
  {
    accessorKey: 'source',
    header: 'Источник',
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {row.getValue('source') || '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Дата создания',
    cell: ({ row }) => {
      const date = row.getValue('created_at');
      return dayjs(date).format('DD.MM.YYYY HH:mm');
    },
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'owner',
    header: 'Ответственный',
    cell: ({ row }) => {
      const owner = row.original.owner;
      if (!owner) return '—';
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {owner.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm">{owner.name}</span>
        </div>
      );
    },
  },
];

// =============================================================================
// USAGE EXAMPLE: Using DrillDownDialog in an Analytics Component
// =============================================================================

export function ExampleUsage() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Simulated data
  const mockLeadsData = [
    {
      id: 1,
      name: 'ООО "Рога и Копыта"',
      company: 'РиК Холдинг',
      status: 'qualified',
      value: 150000,
      source: 'Сайт',
      created_at: '2024-01-15T10:30:00',
      owner: { name: 'Иванов И.И.' },
    },
    {
      id: 2,
      name: 'ИП Петров',
      company: null,
      status: 'new',
      value: 75000,
      source: 'Холодный звонок',
      created_at: '2024-01-16T14:20:00',
      owner: { name: 'Петрова М.А.' },
    },
    // ... more data
  ];

  const handleChartClick = (segment) => {
    // Fetch or filter data based on segment
    setSelectedSegment(segment);
    setDrillDownData(mockLeadsData.filter(lead => lead.status === segment));
    setDrillDownOpen(true);
  };

  const handleLeadClick = (lead) => {
    console.log('Lead clicked:', lead);
    // Navigate to lead detail or show modal
  };

  return (
    <div>
      {/* Your chart component with click handler */}
      <button onClick={() => handleChartClick('qualified')}>
        Click to see qualified leads
      </button>

      {/* Drill-down dialog */}
      <DrillDownDialog
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title="Детальная информация по лидам"
        data={drillDownData}
        columns={leadsAnalyticsColumns}
        segmentLabel={selectedSegment}
        filters={{ status: selectedSegment }}
        onItemClick={handleLeadClick}
      />
    </div>
  );
}

// =============================================================================
// ADVANCED: Reusable TanStack Table Hook
// =============================================================================

export function useAnalyticsTable({
  data,
  columns,
  initialPageSize = 10,
  initialSorting = [],
  enableGlobalFilter = true,
}) {
  const [sorting, setSorting] = useState(initialSorting);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: enableGlobalFilter ? getFilteredRowModel() : undefined,
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    table,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    pagination,
    setPagination,
  };
}

// Usage with custom hook:
/*
function MyAnalyticsComponent() {
  const { table, globalFilter, setGlobalFilter } = useAnalyticsTable({
    data: myData,
    columns: myColumns,
    initialPageSize: 20,
  });

  return (
    <div>
      <Input 
        value={globalFilter} 
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search..."
      />
      <Table>
        // ... render table using table object
      </Table>
    </div>
  );
}
*/
