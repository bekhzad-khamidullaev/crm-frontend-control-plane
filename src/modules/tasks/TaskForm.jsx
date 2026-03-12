import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import EntitySelect from '../../components/EntitySelect';
import ReferenceSelect from '../../components/ReferenceSelect';
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
import { canWrite } from '../../lib/rbac';
import { navigate } from '../../router';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';

import { App, Button, Card, DatePicker, Input, Switch } from 'antd';
const { TextArea } = Input;
const Label = ({ children, ...props }) => <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }} {...props}>{children}</label>;

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
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || 'Уведомление';
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('tasks.change_task');

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
      notify({ title: 'Ошибка', description: 'Ошибка загрузки данных задачи', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    if (!canManage) {
      notify({ title: 'Недостаточно прав', description: 'У вас нет прав для изменения задач', variant: 'destructive' });
      return;
    }
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
        notify({ title: 'Задача обновлена', description: 'Задача обновлена' });
      } else {
        await createTask(payload);
        notify({ title: 'Задача создана', description: 'Задача создана' });
      }
      navigate('/tasks');
    } catch (error) {
      notify({ title: 'Ошибка', description: `Ошибка ${isEdit ? 'обновления' : 'создания'} задачи`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/tasks"
      listButtonText="К списку задач"
      description="У вас нет прав для создания или редактирования задач."
    >
      <div>
        <Button onClick={() => navigate('/tasks')}>
          <ArrowLeft />
          Назад
        </Button>

        <h2>
          {isEdit ? 'Редактировать задачу' : 'Создать новую задачу'}
        </h2>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
          <section>
            <h3>Основная информация</h3>
            <div>
              <div>
                <Label htmlFor="name">Название задачи *</Label>
                <Input id="name" placeholder="Подготовить коммерческое предложение" {...register('name')} />
                {errors.name && <p>{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Input id="priority" type="number" min={1} max={3} value={priorityValue || ''} onChange={(e) => setValue('priority', e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <TextArea id="description" rows={4} placeholder="Детальное описание задачи" {...register('description')} />
            </div>

            <div>
              <Label htmlFor="note">Заметка</Label>
              <TextArea id="note" rows={3} placeholder="Внутренние заметки" {...register('note')} />
            </div>

            <div>
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
                {errors.stage && <p>{errors.stage.message}</p>}
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

            <div>
              <div>
                <Label htmlFor="closing_date">Дата закрытия</Label>
                <DatePicker id="closing_date" value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label htmlFor="lead_time">Lead time</Label>
                <Input id="lead_time" placeholder="DD HH:MM:SS" {...register('lead_time')} />
              </div>
            </div>

            <div>
              <div>
                <Label htmlFor="next_step">Следующий шаг *</Label>
                <Input id="next_step" placeholder="Согласовать требования" {...register('next_step')} />
                {errors.next_step && <p>{errors.next_step.message}</p>}
              </div>
              <div>
                <Label htmlFor="next_step_date">Дата следующего шага *</Label>
                <DatePicker id="next_step_date" value={nextStepDate || null} onChange={(val) => setValue('next_step_date', val)} format="DD.MM.YYYY" />
                {errors.next_step_date && <p>{errors.next_step_date.message}</p>}
              </div>
            </div>
          </section>

          <section>
            <h3>Связанные записи</h3>
            <div>
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

          <section>
            <h3>Ответственные</h3>
            <div>
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

            <div>
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

            <div>
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

          <section>
            <h3>Статус</h3>
            <div>
              <div>
                <Switch id="active" checked={!!activeValue} onChange={(val) => setValue('active', val)} />
                <Label htmlFor="active">Активна</Label>
              </div>
              <div>
                <Switch id="remind_me" checked={!!remindMeValue} onChange={(val) => setValue('remind_me', val)} />
                <Label htmlFor="remind_me">Напоминать</Label>
              </div>
            </div>
          </section>

            <div>
              {canManage && (
                <Button type="submit" loading={saving}>
                  <Save />
                  {isEdit ? 'Обновить' : 'Создать'}
                </Button>
              )}
              <Button onClick={() => navigate('/tasks')}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </FormPermissionGuard>
  );
}

export default TaskForm;
