import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Switch } from './ui/switch.jsx';
import { Textarea } from './ui/textarea.jsx';
import EnhancedTable from './ui-EnhancedTable.jsx';
import Select from './ui-Select.jsx';
import EntitySelect from './EntitySelect.jsx';
import { DatePicker } from './ui-DatePicker.jsx';
import { toast } from './ui/use-toast.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx';

// CrudPage migrated to shadcn/ui + React Hook Form + zod
export default function CrudPage({
  title = 'CRUD',
  api,
  columns = [],
  fields = [],
  readOnly = false,
  initialValues = {},
  pageSize = 20,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const schema = useMemo(() => buildZodSchema(fields), [fields]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValuesFrom(fields, initialValues),
  });

  const fetchList = async () => {
    if (!api?.list) return;
    setLoading(true);
    try {
      const res = await api.list({ page: pagination.current, page_size: pagination.pageSize });
      const results = Array.isArray(res) ? res : res?.results || [];
      const total = res?.count ?? results.length;
      setData(results);
      setPagination((p) => ({ ...p, total }));
    } catch (e) {
      console.error('List load error', e);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const openCreate = () => {
    setEditing(false);
    setCurrentId(null);
    form.reset(initialValuesFrom(fields, initialValues));
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditing(true);
    setCurrentId(record?.id);
    try {
      if (api?.retrieve && record?.id) {
        const full = await api.retrieve(record.id);
        form.reset(valuesFromRecord(fields, full));
      } else {
        form.reset(valuesFromRecord(fields, record));
      }
      setModalOpen(true);
    } catch (e) {
      console.error('Retrieve error', e);
      toast({ title: 'Ошибка', description: 'Не удалось открыть запись', variant: 'destructive' });
    }
  };

  const handleSave = form.handleSubmit(async (values) => {
    try {
      const payload = toApiPayload(fields, values);
      if (editing && api?.update && currentId) {
        await api.update(currentId, payload);
        toast({ title: 'Сохранено', description: 'Запись обновлена' });
      } else if (api?.create) {
        await api.create(payload);
        toast({ title: 'Создано', description: 'Новая запись добавлена' });
      }
      setModalOpen(false);
      setCurrentId(null);
      await fetchList();
    } catch (e) {
      console.error('Save error', e);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить запись', variant: 'destructive' });
    }
  });

  const handleDelete = async (record) => {
    if (!api?.remove) return;
    if (!window.confirm('Удалить запись?')) return;
    try {
      await api.remove(record.id);
      toast({ title: 'Удалено', description: 'Запись удалена' });
      await fetchList();
    } catch (e) {
      console.error('Delete error', e);
      toast({ title: 'Ошибка', description: 'Не удалось удалить запись', variant: 'destructive' });
    }
  };

  const onTableChange = (next) => {
    setPagination((p) => ({ ...p, current: next.current ?? p.current, pageSize: next.pageSize ?? p.pageSize }));
  };

  const actionColumn = useMemo(() => {
    if (readOnly) return null;
    return {
      title: 'Действия',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewRecord(record)}>Просмотр</Button>
          <Button size="sm" onClick={() => openEdit(record)}>Изменить</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>Удалить</Button>
        </div>
      ),
    };
  }, [readOnly]);

  const tableColumns = useMemo(() => {
    const cols = [...columns];
    if (actionColumn) cols.push(actionColumn);
    return cols;
  }, [columns, actionColumn]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {!readOnly && (
          <Button onClick={openCreate}>Создать</Button>
        )}
      </div>

      <EnhancedTable
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактирование' : 'Создание'}</DialogTitle>
          </DialogHeader>
          <form className="mt-2 space-y-3" onSubmit={handleSave}>
            {fields.map((field) => (
              <FieldRenderer key={field.name} field={field} form={form} />
            ))}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Детали</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(viewRecord).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border p-2">
                  <div className="text-xs uppercase text-muted-foreground">{key}</div>
                  <div className="text-sm">{renderValue(value)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="text-right">
            <Button variant="outline" onClick={() => setViewRecord(null)}>Закрыть</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FieldRenderer({ field, form }) {
  const { register, setValue, watch, formState: { errors } } = form;
  const value = watch(field.name);
  const error = errors?.[field.name]?.message;

  const commonProps = {
    id: field.name,
    required: field.required,
    placeholder: field.placeholder,
  };

  const label = (
    <Label htmlFor={field.name}>
      {field.label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  );

  switch (field.type) {
    case 'text':
      return (
        <div>
          {label}
          <Input {...register(field.name)} {...commonProps} />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'textarea':
      return (
        <div>
          {label}
          <Textarea rows={field.rows || 3} {...register(field.name)} {...commonProps} />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'number':
      return (
        <div>
          {label}
          <Input type="number" {...register(field.name, { valueAsNumber: true })} {...commonProps} />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'switch':
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={field.name}
            checked={!!value}
            onCheckedChange={(val) => setValue(field.name, val)}
          />
          {label}
        </div>
      );
    case 'select':
      return (
        <div>
          {label}
          <Select
            value={value ?? ''}
            onChange={(val) => setValue(field.name, val || undefined)}
            options={(field.options || []).map((o) => ({ value: o.value, label: o.label }))}
            placeholder={field.placeholder}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'entity':
      return (
        <div>
          {label}
          <EntitySelect
            value={value ?? ''}
            onChange={(val) => setValue(field.name, val || undefined)}
            fetchList={field.fetchList}
            fetchById={field.fetchById}
            placeholder={field.placeholder}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'date':
      return (
        <div>
          {label}
          <DatePicker
            value={value || null}
            onChange={(val) => setValue(field.name, val)}
            format={field.format || 'YYYY-MM-DD'}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    case 'datetime':
      return (
        <div>
          {label}
          <DatePicker
            value={value || null}
            onChange={(val) => setValue(field.name, val)}
            format={field.format || 'YYYY-MM-DD HH:mm'}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
    default:
      return (
        <div>
          {label}
          <Input {...register(field.name)} {...commonProps} />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      );
  }
}

function buildZodSchema(fields) {
  const shape = {};
  fields.forEach((f) => {
    let s = z.any();
    if (f.type === 'text' || f.type === 'textarea') s = z.string().optional();
    if (f.type === 'number') s = z.number().optional();
    if (f.type === 'select' || f.type === 'entity') s = z.any().optional();
    if (f.type === 'date' || f.type === 'datetime') s = z.any().optional();
    if (f.type === 'switch') s = z.boolean().optional();
    if (f.required) s = s.refine((v) => (v !== undefined && v !== null && v !== ''), { message: 'Обязательное поле' });
    shape[f.name] = s;
  });
  return z.object(shape);
}

function initialValuesFrom(fields, initialValues) {
  const values = { ...initialValues };
  fields.forEach((f) => {
    if (values[f.name] === undefined) {
      if (f.type === 'switch') values[f.name] = false;
      else values[f.name] = '';
    }
  });
  return values;
}

function valuesFromRecord(fields, record) {
  const values = {};
  fields.forEach((f) => {
    values[f.name] = record?.[f.name] ?? '';
  });
  return values;
}

function toApiPayload(fields, values) {
  const payload = {};
  fields.forEach((f) => {
    payload[f.name] = values[f.name];
  });
  return payload;
}

function renderValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
