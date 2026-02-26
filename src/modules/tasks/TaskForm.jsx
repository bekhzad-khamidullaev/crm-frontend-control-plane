import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import EntitySelect from '../../components/EntitySelect';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { toast } from '../../components/ui/use-toast.js';
import {
    createTask,
    getProject,
    getProjects,
    getTask,
    getTasks,
    getUser,
    getUsers,
    updateTask
} from '../../lib/api';
import { normalizePayload } from '../../lib/utils/payload';
import { navigate } from '../../router';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  note: z.string().optional(),
  stage: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: 'Выберите этап' }),
  start_date: z.any().optional(),
  due_date: z.any().optional(),
  closing_date: z.any().optional(),
  lead_time: z.string().optional(),
  next_step: z.string().min(1, 'Введите следующий шаг'),
  next_step_date: z.any().refine((val) => val, { message: 'Выберите дату следующего шага' }),
  project: z.any().optional(),
  task: z.any().optional(),
  owner: z.any().optional(),
  co_owner: z.any().optional(),
  responsible: z.any().optional(),
  subscribers: z.any().optional(),
  tags: z.any().optional(),
  priority: z.any().optional(),
  active: z.boolean().optional(),
  remind_me: z.boolean().optional(),
});

function TaskForm({ id }) {
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
      lead_time: '',
      next_step: '',
      next_step_date: null,
      project: '',
      task: '',
      owner: '',
      co_owner: '',
      responsible: [],
      subscribers: [],
      tags: [],
      priority: '',
      active: true,
      remind_me: false,
    },
  });

  const startDate = watch('start_date');
  const dueDate = watch('due_date');
  const closingDate = watch('closing_date');
  const nextStepDate = watch('next_step_date');
  const stageValue = watch('stage');
  const projectValue = watch('project');
  const taskValue = watch('task');
  const ownerValue = watch('owner');
  const coOwnerValue = watch('co_owner');
  const responsibleValue = watch('responsible');
  const subscribersValue = watch('subscribers');
  const tagsValue = watch('tags');
  const priorityValue = watch('priority');
  const activeValue = watch('active');
  const remindMeValue = watch('remind_me');

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const task = await getTask(id);
      reset({
        ...task,
        start_date: task.start_date ? dayjs(task.start_date) : null,
        due_date: task.due_date ? dayjs(task.due_date) : null,
        closing_date: task.closing_date ? dayjs(task.closing_date) : null,
        next_step_date: task.next_step_date ? dayjs(task.next_step_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных задачи', variant: 'destructive' });
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
        await updateTask(id, payload);
        toast({ title: 'Задача обновлена', description: 'Задача обновлена' });
      } else {
        await createTask(payload);
        toast({ title: 'Задача создана', description: 'Задача создана' });
      }
      navigate('/tasks');
    } catch (error) {
      toast({ title: 'Ошибка', description: `Ошибка ${isEdit ? 'обновления' : 'создания'} задачи`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/tasks')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold">
        {isEdit ? 'Редактировать задачу' : 'Создать новую задачу'}
      </h2>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Название задачи *</Label>
                <Input id="name" placeholder="Подготовить коммерческое предложение" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Input id="priority" type="number" min={1} max={3} value={priorityValue || ''} onChange={(e) => setValue('priority', e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={4} placeholder="Детальное описание задачи" {...register('description')} />
            </div>

            <div>
              <Label htmlFor="note">Заметка</Label>
              <Textarea id="note" rows={3} placeholder="Внутренние заметки" {...register('note')} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="stage">Этап *</Label>
                <ReferenceSelect
                  id="stage"
                  type="task-stages"
                  placeholder="Выберите этап"
                  allowClear
                  value={stageValue || ''}
                  onChange={(val) => setValue('stage', val)}
                />
                {errors.stage && <p className="text-xs text-destructive">{errors.stage.message}</p>}
              </div>
              <div>
                <Label htmlFor="start_date">Дата начала</Label>
                <DatePicker id="start_date" value={startDate || null} onChange={(val) => setValue('start_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label htmlFor="due_date">Срок выполнения</Label>
                <DatePicker id="due_date" value={dueDate || null} onChange={(val) => setValue('due_date', val)} format="DD.MM.YYYY" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="closing_date">Дата закрытия</Label>
                <DatePicker id="closing_date" value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label htmlFor="lead_time">Lead time</Label>
                <Input id="lead_time" placeholder="DD HH:MM:SS" {...register('lead_time')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="next_step">Следующий шаг *</Label>
                <Input id="next_step" placeholder="Согласовать требования" {...register('next_step')} />
                {errors.next_step && <p className="text-xs text-destructive">{errors.next_step.message}</p>}
              </div>
              <div>
                <Label htmlFor="next_step_date">Дата следующего шага *</Label>
                <DatePicker id="next_step_date" value={nextStepDate || null} onChange={(val) => setValue('next_step_date', val)} format="DD.MM.YYYY" />
                {errors.next_step_date && <p className="text-xs text-destructive">{errors.next_step_date.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Связанные записи</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Проект</Label>
                <EntitySelect
                  value={projectValue || ''}
                  placeholder="Выберите проект"
                  fetchOptions={getProjects}
                  fetchById={getProject}
                  onChange={(val) => setValue('project', val)}
                />
              </div>
              <div>
                <Label>Родительская задача</Label>
                <EntitySelect
                  value={taskValue || ''}
                  placeholder="Выберите задачу"
                  fetchOptions={getTasks}
                  fetchById={getTask}
                  onChange={(val) => setValue('task', val)}
                />
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
                  type="task-tags"
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
                <Switch id="active" checked={!!activeValue} onCheckedChange={(val) => setValue('active', val)} />
                <Label htmlFor="active">Активна</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="remind_me" checked={!!remindMeValue} onCheckedChange={(val) => setValue('remind_me', val)} />
                <Label htmlFor="remind_me">Напоминать</Label>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Обновить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/tasks')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default TaskForm;
