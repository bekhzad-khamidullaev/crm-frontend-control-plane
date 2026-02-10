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

const message = {
  info: (msg) => toast({ title: 'Info', description: msg }),
  success: (msg) => toast({ title: 'Success', description: msg }),
  warning: (msg) => toast({ title: 'Warning', description: msg }),
  error: (msg) => toast({ title: 'Error', description: msg, variant: 'destructive' }),
  loading: (msg) => toast({ title: 'Loading', description: msg }),
};

const notification = message;

const App = {
  useApp: () => ({ message, notification }),
};

function Space({ children, size = 8, direction = 'horizontal', align = 'center', className = '', style = {} }) {
  const gapStyle = {
    gap: typeof size === 'number' ? `${size}px` : size,
    ...(direction === 'vertical' ? { flexDirection: 'column', alignItems: align } : { alignItems: align }),
    ...style,
  };
  return (
    <div className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'} ${className}`} style={gapStyle}>
      {children}
    </div>
  );
}

function Row({ children, gutter = 16, className = '', style = {} }) {
  return (
    <div className={`flex flex-wrap -m-2 ${className}`} style={style}>
      {React.Children.map(children, (child) => (
        <div className="p-2" style={{ width: '100%' }}>
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

function Button({ children, type, ...props }) {
  const variant = type === 'primary' ? 'default' : type === 'link' ? 'link' : 'secondary';
  return (
    <ShadButton variant={variant} {...props}>
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

function Tabs({ items = [], defaultActiveKey, activeKey, onChange }) {
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

function Select({ options = [], value, onChange, placeholder, ...props }) {
  return (
    <ShadSelect value={value} onValueChange={onChange} {...props}>
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

function Alert({ message: msg, description, type = 'default' }) {
  const variant = type === 'error' ? 'destructive' : 'default';
  return (
    <ShadAlert variant={variant}>
      {msg && <AlertTitle>{msg}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
    </ShadAlert>
  );
}

function Tag({ children, color }) {
  return <Badge className={color ? `bg-${color}-500` : ''}>{children}</Badge>;
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

function Table({ columns = [], dataSource = [], rowKey = 'id' }) {
  return (
    <ShadTable>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key || col.dataIndex}>{col.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataSource.map((row, index) => (
          <TableRow key={row[rowKey] ?? index}>
            {columns.map((col) => (
              <TableCell key={col.key || col.dataIndex}>
                {col.render ? col.render(row[col.dataIndex], row, index) : row[col.dataIndex]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </ShadTable>
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

const Popconfirm = ({ title, onConfirm, onCancel, okText = 'OK', cancelText = 'Cancel', children }) => {
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
  <FileUpload variant="dropzone" onUpload={(file) => beforeUpload?.(file) && onChange?.({ file, fileList: [file] })}>
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

function Dropdown({ overlay, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>{overlay}</DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    },
  ];
};

const DatePicker = ShadInput;

export {
  App,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popover,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Layout,
  Divider,
  Timeline,
  Steps,
  Slider,
  Popconfirm,
  Upload,
  ScrollArea,
  Skeleton,
  message,
  notification,
};

export default {
  App,
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popover,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Layout,
  Divider,
  Timeline,
  Steps,
  Slider,
  Popconfirm,
  Upload,
  ScrollArea,
  Skeleton,
  message,
  notification,
};
