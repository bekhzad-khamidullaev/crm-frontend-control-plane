import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save, FileText } from 'lucide-react';

import { getMemo, createMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';
import EntitySelect from '../../components/EntitySelect.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import { getUsers, getUser, getDeal, getDeals, getProject, getProjects, getTask, getTasks } from '../../lib/api';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import { toast } from '../../components/ui/use-toast.js';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  note: z.string().optional(),
  draft: z.boolean().optional(),
  notified: z.boolean().optional(),
  stage: z.string().optional(),
  review_date: z.any().optional(),
  to: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: 'Выберите получателя' }),
  deal: z.any().optional(),
  project: z.any().optional(),
  task: z.any().optional(),
  resolution: z.any().optional(),
  tags: z.any().optional(),
});

export default function MemoForm({ id }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      note: '',
      draft: false,
      notified: false,
      stage: 'pen',
      review_date: null,
      to: '',
      deal: '',
      project: '',
      task: '',
      resolution: '',
      tags: [],
    },
  });

  const reviewDate = watch('review_date');
  const draftValue = watch('draft');
  const notifiedValue = watch('notified');
  const stageValue = watch('stage');
  const toValue = watch('to');
  const dealValue = watch('deal');
  const projectValue = watch('project');
  const taskValue = watch('task');
  const resolutionValue = watch('resolution');
  const tagsValue = watch('tags');

  useEffect(() => {
    if (isEdit) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemo(id);
      reset({
        ...res,
        review_date: res.review_date ? dayjs(res.review_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить мемо', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        review_date: values.review_date ? values.review_date.format('YYYY-MM-DD') : null,
      };
      if (isEdit) {
        await updateMemo(id, payload);
        toast({ title: 'Мемо обновлено', description: 'Мемо обновлено' });
      } else {
        await createMemo(payload);
        toast({ title: 'Мемо создано', description: 'Мемо создано' });
      }
      navigate('/memos');
    } catch (error) {
      toast({ title: 'Ошибка', description: `Не удалось ${isEdit ? 'обновить' : 'создать'} мемо`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-muted-foreground">Загрузка...</div>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="outline" onClick={() => navigate('/memos')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="mt-4 p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{isEdit ? 'Редактирование мемо' : 'Новое мемо'}</h2>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit(onFinish)}>
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input id="name" placeholder="Например: Итоги встречи" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" rows={3} placeholder="Краткое описание" {...register('description')} />
          </div>

          <div>
            <Label htmlFor="note">Заключение</Label>
            <Textarea id="note" rows={4} placeholder="Ключевые выводы и договоренности" {...register('note')} />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={!!draftValue} onCheckedChange={(val) => setValue('draft', val)} />
              <Label>Черновик</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!notifiedValue} onCheckedChange={(val) => setValue('notified', val)} />
              <Label>Уведомить получателей</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Стадия</Label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={stageValue || ''}
                onChange={(e) => setValue('stage', e.target.value)}
              >
                <option value="">Выберите стадию</option>
                <option value="pen">В ожидании</option>
                <option value="pos">Отложено</option>
                <option value="rev">Рассмотрено</option>
              </select>
            </div>
            <div>
              <Label>Дата обзора</Label>
              <DatePicker value={reviewDate || null} onChange={(val) => setValue('review_date', val)} format="YYYY-MM-DD" />
            </div>
          </div>

          <div>
            <Label>Получатель *</Label>
            <EntitySelect
              placeholder="Выберите пользователя"
              fetchList={getUsers}
              fetchById={getUser}
              allowClear
              value={toValue}
              onChange={(val) => setValue('to', val)}
            />
            {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Сделка</Label>
              <EntitySelect
                placeholder="Выберите сделку"
                fetchList={getDeals}
                fetchById={getDeal}
                allowClear
                value={dealValue}
                onChange={(val) => setValue('deal', val)}
              />
            </div>
            <div>
              <Label>Проект</Label>
              <EntitySelect
                placeholder="Выберите проект"
                fetchList={getProjects}
                fetchById={getProject}
                allowClear
                value={projectValue}
                onChange={(val) => setValue('project', val)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Задача</Label>
              <EntitySelect
                placeholder="Выберите задачу"
                fetchList={getTasks}
                fetchById={getTask}
                allowClear
                value={taskValue}
                onChange={(val) => setValue('task', val)}
              />
            </div>
            <div>
              <Label>Resolution ID</Label>
              <Input type="number" min={1} value={resolutionValue || ''} onChange={(e) => setValue('resolution', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Теги</Label>
            <ReferenceSelect
              type="crm-tags"
              mode="multiple"
              allowClear
              placeholder="Выберите теги"
              value={tagsValue || []}
              onChange={(val) => setValue('tags', val)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/memos')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
