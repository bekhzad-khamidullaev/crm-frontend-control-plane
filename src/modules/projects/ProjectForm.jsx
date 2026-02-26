import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';

import { navigate } from '../../router';
import { getProject, createProject, updateProject, getUsers, getUser, getProjectStages } from '../../lib/api';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';
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
  stage: z.any().optional(),
  start_date: z.any().optional(),
  due_date: z.any().optional(),
  closing_date: z.any().optional(),
  next_step: z.string().min(1, 'Введите следующий шаг'),
  next_step_date: z.any().refine((val) => val, { message: 'Выберите дату следующего шага' }),
  priority: z.any().optional(),
  owner: z.any().optional(),
  co_owner: z.any().optional(),
  responsible: z.any().optional(),
  subscribers: z.any().optional(),
  tags: z.any().optional(),
  active: z.boolean().optional(),
  remind_me: z.boolean().optional(),
});

function ProjectForm({ id }) {
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
      stage: '',
      start_date: null,
      due_date: null,
      closing_date: null,
      next_step: '',
      next_step_date: null,
      priority: '',
      owner: '',
      co_owner: '',
      responsible: [],
      subscribers: [],
      tags: [],
      active: true,
      remind_me: false,
    },
  });

  const stageValue = watch('stage');
  const startDate = watch('start_date');
  const dueDate = watch('due_date');
  const closingDate = watch('closing_date');
  const nextStepDate = watch('next_step_date');
  const priorityValue = watch('priority');
  const ownerValue = watch('owner');
  const coOwnerValue = watch('co_owner');
  const responsibleValue = watch('responsible');
  const subscribersValue = watch('subscribers');
  const tagsValue = watch('tags');
  const activeValue = watch('active');
  const remindMeValue = watch('remind_me');

  useEffect(() => {
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const project = await getProject(id);
      reset({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        due_date: project.due_date ? dayjs(project.due_date) : null,
        closing_date: project.closing_date ? dayjs(project.closing_date) : null,
        next_step_date: project.next_step_date ? dayjs(project.next_step_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных проекта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = normalizePayload(
        {
          ...values,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
          closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
          next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
        },
        { preserveEmptyArrays: ['responsible', 'subscribers', 'tags'] }
      );

      if (isEdit) {
        await updateProject(id, payload);
        toast({ title: 'Проект обновлен', description: 'Проект обновлен' });
      } else {
        await createProject(payload);
        toast({ title: 'Проект создан', description: 'Проект создан' });
      }
      navigate('/projects');
    } catch (error) {
      toast({ title: 'Ошибка', description: `Ошибка ${isEdit ? 'обновления' : 'создания'} проекта`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold">
        {isEdit ? 'Редактировать проект' : 'Создать новый проект'}
      </h2>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Название проекта *</Label>
                <Input id="name" placeholder="Внедрение CRM системы" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Input id="priority" type="number" min={1} max={3} value={priorityValue || ''} onChange={(e) => setValue('priority', e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={4} placeholder="Детальное описание проекта" {...register('description')} />
            </div>

            <div>
              <Label htmlFor="note">Заметка</Label>
              <Textarea id="note" rows={3} placeholder="Внутренние заметки" {...register('note')} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label>Этап</Label>
                <ReferenceSelect
                  type="project-stages"
                  placeholder="Выберите этап"
                  allowClear
                  value={stageValue || ''}
                  onChange={(val) => setValue('stage', val)}
                />
              </div>
              <div>
                <Label>Дата начала</Label>
                <DatePicker value={startDate || null} onChange={(val) => setValue('start_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label>Срок завершения</Label>
                <DatePicker value={dueDate || null} onChange={(val) => setValue('due_date', val)} format="DD.MM.YYYY" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Дата закрытия</Label>
                <DatePicker value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label htmlFor="next_step">Следующий шаг *</Label>
                <Input id="next_step" placeholder="Определить цели" {...register('next_step')} />
                {errors.next_step && <p className="text-xs text-destructive">{errors.next_step.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Дата следующего шага *</Label>
                <DatePicker value={nextStepDate || null} onChange={(val) => setValue('next_step_date', val)} format="DD.MM.YYYY" />
                {errors.next_step_date && <p className="text-xs text-destructive">{errors.next_step_date.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Ответственные</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Владелец</Label>
                <EntitySelect
                  value={ownerValue || ''}
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('owner', val)}
                />
              </div>
              <div>
                <Label>Со-владелец</Label>
                <EntitySelect
                  value={coOwnerValue || ''}
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('co_owner', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Ответственные</Label>
                <EntitySelect
                  mode="multiple"
                  value={responsibleValue || []}
                  placeholder="Выберите пользователей"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('responsible', val)}
                />
              </div>
              <div>
                <Label>Подписчики</Label>
                <EntitySelect
                  mode="multiple"
                  value={subscribersValue || []}
                  placeholder="Выберите пользователей"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('subscribers', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Теги</Label>
                <ReferenceSelect
                  type="crm-tags"
                  placeholder="Выберите теги"
                  mode="multiple"
                  allowClear
                  value={tagsValue || []}
                  onChange={(val) => setValue('tags', val)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Статус</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Switch checked={!!activeValue} onCheckedChange={(val) => setValue('active', val)} />
                <Label>Активен</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!remindMeValue} onCheckedChange={(val) => setValue('remind_me', val)} />
                <Label>Напоминать</Label>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Обновить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ProjectForm;
