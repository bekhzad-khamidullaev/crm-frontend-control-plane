# Analytics Refactor: Code Examples

## Side-by-Side Comparison Examples

### Example 1: AnalyticsCard Component

#### Before (Ant Design)
```jsx
import React from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
import PropTypes from 'prop-types';

function AnalyticsCard({ 
  title, 
  loading, 
  error, 
  children, 
  extra,
  bordered = true,
  size = 'default',
}) {
  return (
    <Card
      title={title}
      extra={extra}
      variant={bordered ? 'outlined' : 'borderless'}
      size={size}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large">
            <div style={{ padding: '20px' }}>Загрузка данных...</div>
          </Spin>
        </div>
      ) : error ? (
        <Alert
          message="Ошибка загрузки"
          description={error.message || 'Не удалось загрузить данные'}
          type="error"
          showIcon
        />
      ) : children ? (
        children
      ) : (
        <Empty description="Нет данных" />
      )}
    </Card>
  );
}
```

#### After (shadcn/ui)
```jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import PropTypes from 'prop-types';

function AnalyticsCard({ 
  title, 
  loading, 
  error, 
  children, 
  extra,
  bordered = true,
  size = 'default',
  className,
}) {
  const sizeClasses = {
    default: '',
    small: 'text-sm',
  };

  return (
    <Card className={cn(
      bordered ? '' : 'border-0 shadow-none',
      sizeClasses[size],
      className
    )}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{title}</CardTitle>
          {extra && <div>{extra}</div>}
        </CardHeader>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Загрузка данных...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка загрузки</AlertTitle>
            <AlertDescription>
              {error.message || 'Не удалось загрузить данные'}
            </AlertDescription>
          </Alert>
        ) : children ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">Нет данных</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Example 2: DrillDownModal → DrillDownDialog (TanStack Table)

#### Before (Ant Design Table)
```jsx
import { Modal, Table, Tag } from 'antd';

function DrillDownModal({ visible, onClose, data, columns }) {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  return (
    <Modal
      title="Детальная информация"
      open={visible}
      onCancel={onClose}
      width={900}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        onChange={setPagination}
      />
    </Modal>
  );
}
```

#### After (shadcn Dialog + TanStack Table)
```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function DrillDownDialog({ open, onClose, data, columns }) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: false,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Детальная информация</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className="cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Показано {table.getRowModel().rows.length} из {data.length} записей
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Страница {table.getState().pagination.pageIndex + 1} из{' '}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Example 3: Custom Statistic Component

#### Implementation (shadcn-style)
```jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function Statistic({
  title,
  value,
  prefix,
  suffix,
  precision = 0,
  valueStyle,
  trend,
  trendValue,
  className,
}) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-baseline gap-2">
        {prefix && <span className="text-lg">{prefix}</span>}
        <p className={cn('text-3xl font-bold', valueStyle)}>
          {formatValue(value)}
        </p>
        {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={cn('text-sm font-medium', getTrendColor())}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

// Usage in analytics cards
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Statistic
    title="Всего лидов"
    value={1234}
    trend="up"
    trendValue="+12% за месяц"
  />
  <Statistic
    title="Конверсия"
    value={23.5}
    suffix="%"
    precision={1}
    trend="down"
    trendValue="-2.3%"
  />
</div>
```

---

### Example 4: AnalyticsWrapper Filters

#### Before (Ant Design)
```jsx
<Select
  value={period}
  onChange={handlePeriodChange}
  style={{ width: 180 }}
  options={periodOptions}
  suffixIcon={<FilterOutlined />}
/>

<RangePicker
  value={customRange ? [dayjs(customRange.start), dayjs(customRange.end)] : null}
  onChange={handleCustomRangeChange}
  format="DD.MM.YYYY"
/>
```

#### After (shadcn/ui)
```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter } from 'lucide-react';

// Period selector
<Select value={period} onValueChange={handlePeriodChange}>
  <SelectTrigger className="w-[180px]">
    <Filter className="h-4 w-4 mr-2" />
    <SelectValue placeholder="Выберите период" />
  </SelectTrigger>
  <SelectContent>
    {periodOptions.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Date range picker (custom component using two DatePickers)
<DateRangePicker
  from={customRange?.start}
  to={customRange?.end}
  onSelect={handleCustomRangeChange}
/>
```

---

### Example 5: Layout Migration (Grid System)

#### Before (Ant Design)
```jsx
import { Row, Col, Space } from 'antd';

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>KPI 1</Card>
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>KPI 2</Card>
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>KPI 3</Card>
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>KPI 4</Card>
  </Col>
</Row>

<Space direction="vertical" size="large">
  <Card>Chart 1</Card>
  <Card>Chart 2</Card>
</Space>
```

#### After (Tailwind)
```jsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <Card>KPI 1</Card>
  <Card>KPI 2</Card>
  <Card>KPI 3</Card>
  <Card>KPI 4</Card>
</div>

// Vertical spacing
<div className="flex flex-col gap-6">
  <Card>Chart 1</Card>
  <Card>Chart 2</Card>
</div>

// Complex layout example
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-4">
    <Card>Sidebar</Card>
  </div>
  <div className="col-span-12 md:col-span-8">
    <Card>Main content</Card>
  </div>
</div>
```

---

### Example 6: Export Dropdown Menu

#### Before (Ant Design)
```jsx
import { Dropdown, Button } from 'antd';
import { DownloadOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';

<Dropdown
  menu={{ items: exportMenuItems }}
  placement="bottomRight"
  trigger={['click']}
>
  <Button icon={<DownloadOutlined />}>
    Экспорт
  </Button>
</Dropdown>
```

#### After (shadcn/ui)
```jsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileDown, Image } from 'lucide-react';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Экспорт
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleExportCSV}>
      <FileText className="h-4 w-4 mr-2" />
      Экспорт в CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleExportPDF}>
      <FileDown className="h-4 w-4 mr-2" />
      Экспорт в PDF
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleExportImage}>
      <Image className="h-4 w-4 mr-2" />
      Экспорт как изображение
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Example 7: TanStack Table Column Definitions

```jsx
// columns/analytics-columns.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import dayjs from 'dayjs';

export const leadsAnalyticsColumns = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Название
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue('name')}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status');
      const variants = {
        new: 'default',
        qualified: 'secondary',
        converted: 'success',
        lost: 'destructive',
      };
      return <Badge variant={variants[status]}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'value',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Сумма
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('value'));
      const formatted = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Дата создания',
    cell: ({ row }) => {
      return dayjs(row.getValue('created_at')).format('DD.MM.YYYY HH:mm');
    },
  },
];
```

---

## Helper Components to Create

### 1. Empty State Component
```jsx
// components/common/EmptyState.jsx
import { FileQuestion } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = FileQuestion, 
  title = "Нет данных", 
  description,
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### 2. Loading State Component
```jsx
// components/common/LoadingState.jsx
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = "Загрузка данных..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

### 3. DateRangePicker Component
```jsx
// components/common/DateRangePicker.jsx
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function DateRangePicker({ from, to, onSelect }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {from && to ? (
            <>
              {format(from, 'dd.MM.yyyy', { locale: ru })} -{' '}
              {format(to, 'dd.MM.yyyy', { locale: ru })}
            </>
          ) : (
            <span>Выберите период</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={onSelect}
          numberOfMonths={2}
          locale={ru}
        />
      </PopoverContent>
    </Popover>
  );
}
```

---

## Quick Migration Checklist

### For Each Component:

- [ ] Replace Ant Design imports with shadcn/ui
- [ ] Replace `@ant-design/icons` with `lucide-react`
- [ ] Replace inline styles with Tailwind classes
- [ ] Replace `<Space>` with Tailwind gap utilities
- [ ] Replace `<Row>`/`<Col>` with Tailwind grid/flex
- [ ] Update prop names (e.g., `open` vs `visible`)
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states
- [ ] Test responsive behavior
- [ ] Update unit tests
- [ ] Update documentation

---

## Common Pitfalls to Avoid

1. **Forgetting to update prop names**: Ant Design uses `visible`, shadcn uses `open`
2. **Not handling Tailwind class conflicts**: Use `cn()` utility for conditional classes
3. **Losing focus management**: shadcn Dialog auto-manages focus, but test tab navigation
4. **Date format inconsistencies**: Ant Design uses dayjs, shadcn uses date-fns
5. **Table performance**: TanStack Table needs proper memoization for large datasets
6. **Icon size mismatches**: Lucide icons default to 24px, use `className="h-4 w-4"` for consistency

---

## Performance Optimization Tips

### TanStack Table
```jsx
// Memoize columns
const columns = useMemo(() => [...], []);

// Memoize data
const data = useMemo(() => [...], [rawData]);

// Use virtualization for large datasets
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Chart Components
```jsx
// Keep Chart.js canvas rendering optimized
const chartOptions = useMemo(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // ... other options
}), []);
```

### Conditional Rendering
```jsx
// Use early returns for better performance
if (loading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
if (!data?.length) return <EmptyState />;

return <ActualContent data={data} />;
```
