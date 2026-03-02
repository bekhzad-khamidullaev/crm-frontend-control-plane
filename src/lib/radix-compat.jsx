import React from 'react';
import { toast } from '../components/ui/use-toast.js';
import { Button as ShadButton } from '../components/ui/button.jsx';
import { Card as ShadCard, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Tabs as ShadTabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import { Alert as ShadAlert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx';
import { Input as ShadInput } from '../components/ui/input.jsx';
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Switch as ShadSwitch } from '../components/ui/switch.jsx';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Table as ShadTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import { Popover as ShadPopover, PopoverContent, PopoverTrigger } from '../components/ui/popover.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu.jsx';
import { ScrollArea } from '../components/ui/scroll-area.jsx';
import { FileUpload } from '../components/ui-FileUpload.jsx';

const showToast = (type, msg) => {
  const titleMap = {
    info: 'Info',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    loading: 'Loading',
  };

  try {
    toast({
      title: titleMap[type] || 'Info',
      description: msg,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  } catch (_error) {
    console.log(`[${titleMap[type] || 'Info'}]`, msg);
  }
};

const message = {
  info: (msg) => showToast('info', msg),
  success: (msg) => showToast('success', msg),
  warning: (msg) => showToast('warning', msg),
  error: (msg) => showToast('error', msg),
  loading: (msg) => showToast('loading', msg),
};

const notification = message;

const modal = {
  confirm: ({ title, content, onOk, onCancel }) => {
    const text = [title, content].filter(Boolean).join('\n\n');
    const confirmed = window.confirm(text || 'Are you sure?');
    if (confirmed) {
      return onOk?.();
    }
    return onCancel?.();
  },
};

const App = {
  useApp: () => ({ message, notification, modal }),
};

const ConfigProvider = ({ children }) => <>{children}</>;

const theme = {
  defaultAlgorithm: 'default',
  darkAlgorithm: 'dark',
  useToken: () => ({
    token: {
      colorBgContainer: 'var(--card, #ffffff)',
      colorBorder: 'var(--border, #e4e4e7)',
      colorText: 'var(--foreground, #09090b)',
      colorTextSecondary: 'var(--muted-foreground, #71717a)',
      colorPrimary: 'var(--primary, #18181b)',
      borderRadius: 8,
      boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
    },
  }),
};

const Grid = {
  useBreakpoint: () => {
    if (typeof window === 'undefined') {
      return { xs: false, sm: true, md: true, lg: true, xl: true, xxl: true };
    }
    const width = window.innerWidth;
    return {
      xs: width >= 480,
      sm: width >= 576,
      md: width >= 768,
      lg: width >= 992,
      xl: width >= 1200,
      xxl: width >= 1600,
    };
  },
};

function Flex({ children, justify = 'flex-start', align = 'stretch', gap = 0, wrap = false, vertical = false, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        justifyContent: justify,
        alignItems: align,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Space({ children, size = 8, direction = 'horizontal', align = 'center', className = '', style = {}, wrap = false }) {
  const gapStyle = {
    gap: typeof size === 'number' ? `${size}px` : size,
    ...(direction === 'vertical' ? { flexDirection: 'column', alignItems: align } : { alignItems: align }),
    flexWrap: wrap ? 'wrap' : 'nowrap',
    ...style,
  };
  return (
    <div className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'} ${className}`} style={gapStyle}>
      {children}
    </div>
  );
}

function Row({ children, gutter = 16, className = '', style = {} }) {
  const horizontal = Array.isArray(gutter) ? gutter[0] : gutter;
  const vertical = Array.isArray(gutter) ? gutter[1] : gutter;
  return (
    <div className={`flex flex-wrap ${className}`} style={{ marginLeft: -(horizontal / 2), marginRight: -(horizontal / 2), ...style }}>
      {React.Children.map(children, (child) => (
        <div style={{ paddingLeft: horizontal / 2, paddingRight: horizontal / 2, paddingTop: vertical / 2, paddingBottom: vertical / 2, width: '100%' }}>
          {child}
        </div>
      ))}
    </div>
  );
}

function Col({ children, span = 24, className = '', style = {} }) {
  const width = `${(span / 24) * 100}%`;
  return (
    <div className={className} style={{ width, ...style }}>
      {children}
    </div>
  );
}

function Button({ children, type, icon, ...props }) {
  const variant = type === 'primary' ? 'default' : type === 'link' ? 'link' : 'secondary';
  return (
    <ShadButton variant={variant} {...props}>
      {icon}
      {children}
    </ShadButton>
  );
}

function Card({ title, extra, children, className = '' }) {
  return (
    <ShadCard className={className}>
      {(title || extra) && (
        <CardHeader className="flex flex-row items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          {extra}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </ShadCard>
  );
}

function Tabs({ items = [], defaultActiveKey, activeKey, onChange, children }) {
  if (items.length > 0) {
    const initial = activeKey || defaultActiveKey || items[0]?.key;
    return (
      <ShadTabs defaultValue={initial} value={activeKey} onValueChange={onChange}>
        <TabsList>
          {items.map((item) => (
            <TabsTrigger key={item.key} value={item.key}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item) => (
          <TabsContent key={item.key} value={item.key}>
            {item.children}
          </TabsContent>
        ))}
      </ShadTabs>
    );
  }

  return <div>{children}</div>;
}

Tabs.TabPane = ({ children }) => <>{children}</>;

const Input = Object.assign(
  function Input({ ...props }) {
    return <ShadInput {...props} />;
  },
  {
    TextArea: (props) => <textarea className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" {...props} />,
    Password: (props) => <ShadInput type="password" {...props} />,
  },
);

function InputNumber({ ...props }) {
  return <ShadInput type="number" {...props} />;
}

function Select({ options = [], value, onChange, placeholder, children, ...props }) {
  if (children) {
    return (
      <ShadSelect value={value !== undefined ? String(value) : value} onValueChange={onChange} {...props}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </ShadSelect>
    );
  }

  return (
    <ShadSelect value={value !== undefined ? String(value) : value} onValueChange={onChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value ?? opt} value={String(opt.value ?? opt)}>
            {opt.label ?? opt}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadSelect>
  );
}

Select.Option = ({ value, children }) => <SelectItem value={String(value)}>{children}</SelectItem>;

function Switch({ checked, onChange, ...props }) {
  return <ShadSwitch checked={checked} onCheckedChange={onChange} {...props} />;
}

function Modal({ open, visible, onCancel, title, children, footer, width }) {
  const isOpen = open ?? visible;
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onCancel?.()}>
      <DialogContent style={{ maxWidth: width }}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

function Drawer({ open, onClose, title, children, width = 420 }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close drawer" />
      <aside className="relative ml-auto h-full bg-background border-l border-border p-4" style={{ width }}>
        {title && <div className="mb-4 text-lg font-semibold">{title}</div>}
        {children}
      </aside>
    </div>
  );
}

function Alert({ message: msg, description, type = 'default' }) {
  const variant = type === 'error' ? 'destructive' : 'default';
  return (
    <ShadAlert variant={variant}>
      {msg && <AlertTitle>{msg}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
    </ShadAlert>
  );
}

function Tag({ children, color, className = '', style = {} }) {
  return (
    <Badge className={className} style={style}>
      {children}
    </Badge>
  );
}

const Typography = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

Typography.Text = ({ children, strong, type, className = '', ...props }) => (
  <span
    className={`${strong ? 'font-semibold' : ''} ${type === 'secondary' ? 'text-muted-foreground' : ''} ${
      type === 'warning' ? 'text-yellow-600' : ''
    } ${className}`.trim()}
    {...props}
  >
    {children}
  </span>
);

Typography.Title = ({ children, level = 2, className = '', ...props }) => {
  const TagName = `h${Math.min(Math.max(level, 1), 5)}`;
  return (
    <TagName className={`font-semibold ${className}`.trim()} {...props}>
      {children}
    </TagName>
  );
};

Typography.Paragraph = ({ children, className = '', ...props }) => (
  <p className={className} {...props}>
    {children}
  </p>
);

Typography.Link = ({ children, className = '', ...props }) => (
  <a className={`text-primary underline ${className}`.trim()} {...props}>
    {children}
  </a>
);

function Tooltip({ title, children }) {
  return (
    <TooltipProvider>
      <ShadTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
  );
}

function Table({ columns = [], dataSource = [], rowKey = 'id', rowSelection, pagination, footer }) {
  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row);
    return row?.[rowKey] ?? index;
  };

  return (
    <div className="space-y-3">
      <ShadTable>
        <TableHeader>
          <TableRow>
            {rowSelection ? <TableHead style={{ width: 44 }} /> : null}
            {columns.map((col) => (
              <TableHead key={col.key || col.dataIndex}>{col.title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSource.map((row, index) => (
            <TableRow key={getRowKey(row, index)}>
              {rowSelection ? (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={rowSelection?.selectedRowKeys?.includes(getRowKey(row, index))}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      const key = getRowKey(row, index);
                      const next = checked
                        ? [...(rowSelection?.selectedRowKeys || []), key]
                        : (rowSelection?.selectedRowKeys || []).filter((item) => item !== key);
                      rowSelection?.onChange?.(next);
                    }}
                  />
                </TableCell>
              ) : null}
              {columns.map((col) => (
                <TableCell key={col.key || col.dataIndex}>
                  {col.render ? col.render(row[col.dataIndex], row, index) : row[col.dataIndex]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadTable>
      {pagination ? (
        <div className="text-xs text-muted-foreground">
          {pagination.showTotal?.(pagination.total || 0, [1, (dataSource || []).length])}
        </div>
      ) : null}
      {footer ? <div>{footer(dataSource)}</div> : null}
    </div>
  );
}

function Empty({ description = 'No data' }) {
  return <div className="text-center text-sm text-muted-foreground py-6">{description}</div>;
}

function Spin({ spinning, children }) {
  if (spinning) {
    return <Skeleton className="h-24 w-full" />;
  }
  return <>{children}</>;
}

function Statistic({ title, value }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Descriptions({ items = [] }) {
  return (
    <dl className="grid gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex justify-between">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-medium">{item.children}</dd>
        </div>
      ))}
    </dl>
  );
}

const Avatar = ({ children }) => <div className="rounded-full bg-muted p-2">{children}</div>;

function Progress({ percent }) {
  return <progress className="w-full" value={percent} max="100" />;
}

function List({ dataSource = [], renderItem }) {
  return <ul className="space-y-2">{dataSource.map((item, idx) => <li key={idx}>{renderItem(item)}</li>)}</ul>;
}

const Layout = ({ children, className = '', style = {} }) => (
  <div className={className} style={style}>
    {children}
  </div>
);

Layout.Sider = ({ children, className = '', style = {} }) => (
  <aside className={className} style={style}>
    {children}
  </aside>
);

Layout.Content = ({ children, className = '', style = {} }) => (
  <main className={className} style={style}>
    {children}
  </main>
);

Layout.Header = ({ children, className = '', style = {} }) => (
  <header className={className} style={style}>
    {children}
  </header>
);

Layout.Footer = ({ children, className = '', style = {} }) => (
  <footer className={className} style={style}>
    {children}
  </footer>
);

const Divider = ({ children, orientation = 'center', className = '' }) => {
  const align = orientation === 'left' ? 'text-left' : orientation === 'right' ? 'text-right' : 'text-center';
  return (
    <div className={`border-b border-border my-4 ${className}`}>
      {children && <span className={`relative -top-3 bg-background px-2 text-sm ${align}`}>{children}</span>}
    </div>
  );
};

const Timeline = ({ items = [], children }) => {
  if (items.length) {
    return (
      <ol className="relative border-s border-border pl-4 space-y-3">
        {items.map((item, idx) => (
          <li key={item.key || idx} className="relative">
            <span className="absolute -start-2 top-1 h-3 w-3 rounded-full bg-primary" />
            <div className="text-sm font-medium">{item.label || item.children}</div>
          </li>
        ))}
      </ol>
    );
  }
  return <ol className="relative border-s border-border pl-4 space-y-3">{children}</ol>;
};

Timeline.Item = ({ children }) => <li className="relative pl-2 text-sm">{children}</li>;

const Steps = ({ current = 0, children, style = {} }) => (
  <div className="flex flex-wrap gap-4" style={style}>
    {React.Children.map(children, (child, idx) =>
      React.cloneElement(child, { isActive: idx === current, index: idx + 1 }),
    )}
  </div>
);

Steps.Step = ({ title, description, icon, isActive, index }) => (
  <div className={`flex items-center gap-2 ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border">{icon || index}</div>
    <div>
      <div>{title}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
  </div>
);

const Slider = ({ value, onChange, min = 0, max = 100, step = 1, className = '' }) => (
  <input
    type="range"
    className={`w-full ${className}`}
    value={value ?? 0}
    min={min}
    max={max}
    step={step}
    onChange={(event) => onChange?.(Number(event.target.value))}
  />
);

const Popconfirm = ({ title, onConfirm, onCancel, children }) => {
  const handleClick = (event) => {
    event.preventDefault();
    const confirmed = window.confirm(typeof title === 'string' ? title : 'Are you sure?');
    if (confirmed) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
  };
  return React.cloneElement(children, { onClick: handleClick });
};

const Upload = ({ children, beforeUpload, onChange, showUploadList = true }) => {
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allow = (await beforeUpload?.(file)) !== false;
    if (!allow) return;
    onChange?.({ file, fileList: [file] });
  };

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="file" className="hidden" onChange={handleUpload} />
      {children}
      {showUploadList && <span className="text-xs text-muted-foreground">Upload</span>}
    </label>
  );
};

Upload.Dragger = ({ children, beforeUpload, onChange }) => (
  <FileUpload variant="dropzone" onUpload={(file) => beforeUpload?.(file) !== false && onChange?.({ file, fileList: [file] })}>
    {children}
  </FileUpload>
);

function Popover({ content, children }) {
  return (
    <ShadPopover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>{content}</PopoverContent>
    </ShadPopover>
  );
}

function Dropdown({ overlay, menu, children }) {
  const items = menu?.items || [];
  const body = overlay || (
    <div className="min-w-[180px]">
      {items.map((item) => (
        <DropdownMenuItem key={item.key} onClick={() => item.onClick?.()} disabled={item.disabled}>
          {item.label}
        </DropdownMenuItem>
      ))}
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>{body}</DropdownMenuContent>
    </DropdownMenu>
  );
}

const Menu = ({ items = [], selectedKeys = [], onClick, className = '' }) => {
  const renderItems = (menuItems, level = 0) => (
    <ul className={`space-y-1 ${level ? 'ml-4' : ''}`}>
      {menuItems.map((item) => {
        if (item.type === 'divider') {
          return <li key={item.key || `divider-${level}`} className="my-2 border-t border-border" />;
        }

        const selected = selectedKeys.includes(item.key);

        return (
          <li key={item.key}>
            <button
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${selected ? 'bg-muted font-semibold' : 'hover:bg-muted/70'}`}
              onClick={() => onClick?.({ key: item.key })}
            >
              <span className="inline-flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </button>
            {item.children ? renderItems(item.children, level + 1) : null}
          </li>
        );
      })}
    </ul>
  );

  return <nav className={className}>{renderItems(items)}</nav>;
};

const Breadcrumb = ({ children, style }) => (
  <nav style={style} className="text-sm text-muted-foreground">
    <ol className="flex items-center gap-2">{children}</ol>
  </nav>
);

Breadcrumb.Item = ({ href, children }) => (
  <li className="inline-flex items-center gap-2">
    {href ? <a href={href}>{children}</a> : <span>{children}</span>}
    <span>/</span>
  </li>
);

const Segmented = ({ options = [], value, onChange, block }) => {
  return (
    <div className={`inline-flex rounded-md border border-border p-1 ${block ? 'w-full' : ''}`}>
      {options.map((option) => {
        const opt = typeof option === 'object' ? option : { label: option, value: option };
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            className={`rounded px-3 py-1 text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

const FloatButton = ({ icon, onClick, description, style = {} }) => (
  <button
    className="fixed z-50 right-6 bottom-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg"
    onClick={onClick}
    style={style}
  >
    {icon}
    {description}
  </button>
);

const FormContext = React.createContext({});

function Form({ form, onFinish, children, ...props }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onFinish?.(form?.getFieldsValue?.() || {});
  };
  return (
    <FormContext.Provider value={form || {}}>
      <form onSubmit={handleSubmit} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

Form.Item = function FormItem({ label, children }) {
  return (
    <label className="grid gap-2 text-sm">
      {label && <span className="text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
};

Form.useForm = () => {
  const store = { values: {} };
  return [
    {
      setFieldsValue: (values) => {
        store.values = { ...store.values, ...values };
      },
      getFieldValue: (key) => store.values[key],
      getFieldsValue: () => store.values,
      resetFields: () => {
        store.values = {};
      },
      validateFields: async () => store.values,
      submit: () => store.values,
    },
  ];
};

Form.useWatch = (name, form) => {
  if (!form?.getFieldValue) return undefined;
  return form.getFieldValue(name);
};

const DatePicker = Object.assign(
  function CompatDatePicker({ value, onChange, ...props }) {
    return (
      <ShadInput
        type="date"
        value={value}
        onChange={(event) => onChange?.(event.target.value, event.target.value)}
        {...props}
      />
    );
  },
  {
    RangePicker: ({ value = [], onChange, ...props }) => (
      <div className="flex items-center gap-2">
        <ShadInput
          type="date"
          value={value?.[0] || ''}
          onChange={(event) => onChange?.([event.target.value, value?.[1] || ''], [event.target.value, value?.[1] || ''])}
          {...props}
        />
        <span>-</span>
        <ShadInput
          type="date"
          value={value?.[1] || ''}
          onChange={(event) => onChange?.([value?.[0] || '', event.target.value], [value?.[0] || '', event.target.value])}
          {...props}
        />
      </div>
    ),
  },
);

export {
  App,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  FloatButton,
  Form,
  Grid,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Modal,
  Popconfirm,
  Popover,
  Progress,
  Row,
  Segmented,
  Select,
  Skeleton,
  Slider,
  Space,
  Spin,
  Statistic,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Upload,
  ScrollArea,
  message,
  notification,
  theme,
};
