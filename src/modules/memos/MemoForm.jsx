import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save, FileText } from 'lucide-react';

import { getMemo, createMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';

import { App, Button, Card, DatePicker, Input, Result, Skeleton, Switch } from 'antd';
import EntitySelect from '../../components/EntitySelect.jsx';
import ReferenceSelect from '../../components/ReferenceSelect';
import { getUsers, getUser, getDeal, getDeals, getProject, getProjects, getTask, getTasks } from '../../lib/api';
const { TextArea } = Input;
const Label = ({ children, ...props }) => <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }} {...props}>{children}</label>;

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
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || 'Уведомление';
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
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
    setLoadError(false);
    try {
      const res = await getMemo(id);
      reset({
        ...res,
        review_date: res.review_date ? dayjs(res.review_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: 'Ошибка', description: 'Не удалось загрузить мемо', variant: 'destructive' });
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
        notify({ title: 'Мемо обновлено', description: 'Мемо обновлено' });
      } else {
        await createMemo(payload);
        notify({ title: 'Мемо создано', description: 'Мемо создано' });
      }
      navigate('/memos');
    } catch (error) {
      notify({ title: 'Ошибка', description: `Не удалось ${isEdit ? 'обновить' : 'создать'} мемо`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить мемо для редактирования"
        subTitle="Попробуйте повторить загрузку или вернитесь к списку мемо."
        extra={<Button onClick={fetchData}>Повторить</Button>}
      />
    );
  }

  return (
    <div>
      <Button onClick={() => navigate('/memos')}>
        <ArrowLeft />
        Назад
      </Button>

      <Card>
        <div>
          <FileText />
          <h2>{isEdit ? 'Редактирование мемо' : 'Новое мемо'}</h2>
        </div>

        <form onSubmit={handleSubmit(onFinish)}>
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input id="name" placeholder="Например: Итоги встречи" {...register('name')} />
            {errors.name && <p>{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <TextArea id="description" rows={3} placeholder="Краткое описание" {...register('description')} />
          </div>

          <div>
            <Label htmlFor="note">Заключение</Label>
            <TextArea id="note" rows={4} placeholder="Ключевые выводы и договоренности" {...register('note')} />
          </div>

          <div>
            <div>
              <Switch checked={!!draftValue} onChange={(val) => setValue('draft', val)} />
              <Label>Черновик</Label>
            </div>
            <div>
              <Switch checked={!!notifiedValue} onChange={(val) => setValue('notified', val)} />
              <Label>Уведомить получателей</Label>
            </div>
          </div>

          <div>
            <div>
              <Label>Стадия</Label>
              <select
               
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
            {errors.to && <p>{errors.to.message}</p>}
          </div>

          <div>
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

          <div>
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

          <div>
            <Button type="submit" loading={saving}>
              <Save />
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button onClick={() => navigate('/memos')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
