import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import EntitySelect from '../../components/EntitySelect.jsx';
import { getUser, getUsers } from '../../lib/api';
import { createReminder, getReminder, updateReminder } from '../../lib/api/reminders';
import { canWrite } from '../../lib/rbac';
import { navigate } from '../../router';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';

import { App, Button, Card, DatePicker, Input, Result, Skeleton, Switch } from 'antd';
const { TextArea } = Input;
const Label = ({ children, ...props }) => <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }} {...props}>{children}</label>;

const schema = z.object({
  subject: z.string().min(1, 'Введите тему напоминания'),
  description: z.string().optional(),
  reminder_date: z.any().refine((val) => val, { message: 'Выберите дату и время' }),
  active: z.boolean().optional(),
  send_notification_email: z.boolean().optional(),
  owner: z.any().optional(),
  content_type: z.number({ invalid_type_error: 'Укажите content type ID' }).min(1, 'Укажите content type ID'),
  object_id: z.number({ invalid_type_error: 'Укажите object ID' }).min(1, 'Укажите object ID'),
});

function ReminderForm({ id }) {
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
  const canManage = canWrite('common.change_reminder');

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
      subject: '',
      description: '',
      reminder_date: null,
      active: true,
      send_notification_email: false,
      owner: '',
      content_type: 0,
      object_id: 0,
    },
  });

  const reminderDate = watch('reminder_date');
  const activeValue = watch('active');
  const emailValue = watch('send_notification_email');
  const ownerValue = watch('owner');

  useEffect(() => {
    if (isEdit) {
      loadReminder();
    }
  }, [id]);

  const loadReminder = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getReminder(id);
      reset({
        ...data,
        reminder_date: data.reminder_date ? dayjs(data.reminder_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: 'Ошибка', description: 'Ошибка загрузки напоминания', variant: 'destructive' });
      console.error('Error loading reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (values) => {
    if (!canManage) {
      notify({ title: 'Недостаточно прав', description: 'У вас нет прав для изменения напоминаний', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        reminder_date: values.reminder_date ? values.reminder_date.toISOString() : null,
      };

      if (isEdit) {
        await updateReminder(id, payload);
        notify({ title: 'Напоминание обновлено', description: 'Напоминание обновлено' });
      } else {
        await createReminder(payload);
        notify({ title: 'Напоминание создано', description: 'Напоминание создано' });
      }
      navigate('/reminders');
    } catch (error) {
      notify({ title: 'Ошибка', description: isEdit ? 'Ошибка обновления напоминания' : 'Ошибка создания напоминания', variant: 'destructive' });
      console.error('Error saving reminder:', error);
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
        title="Не удалось загрузить напоминание для редактирования"
        subTitle="Попробуйте повторить загрузку или вернитесь к списку напоминаний."
        extra={<Button onClick={loadReminder}>Повторить</Button>}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/reminders"
      listButtonText="К списку напоминаний"
      description="У вас нет прав для создания или редактирования напоминаний."
    >
      <div>
        <Button onClick={() => navigate('/reminders')}>
          <ArrowLeft />
          Назад
        </Button>

        <div>
          <Bell />
          <h2>
            {isEdit ? 'Редактирование напоминания' : 'Новое напоминание'}
          </h2>
        </div>

        <Card>
          <form onSubmit={handleSubmit(handleSubmitForm)}>
          <div>
            <Label htmlFor="subject">Тема *</Label>
            <Input id="subject" placeholder="Например: Связаться с клиентом" {...register('subject')} />
            {errors.subject && <p>{errors.subject.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <TextArea id="description" rows={4} placeholder="Дополнительная информация" {...register('description')} />
          </div>

          <div>
            <Label htmlFor="reminder_date">Дата и время напоминания *</Label>
            <DatePicker id="reminder_date" value={reminderDate || null} onChange={(val) => setValue('reminder_date', val)} format="YYYY-MM-DD" />
            {errors.reminder_date && <p>{errors.reminder_date.message}</p>}
          </div>

          <div>
            <div>
              <Switch id="active" checked={!!activeValue} onChange={(val) => setValue('active', val)} />
              <Label htmlFor="active">Активно</Label>
            </div>
            <div>
              <Switch id="send_notification_email" checked={!!emailValue} onChange={(val) => setValue('send_notification_email', val)} />
              <Label htmlFor="send_notification_email">Email уведомление</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="owner">Владелец</Label>
            <EntitySelect
              id="owner"
              placeholder="Выберите пользователя"
              fetchList={getUsers}
              fetchById={getUser}
              allowClear
              value={ownerValue || ''}
              onChange={(val) => setValue('owner', val)}
            />
          </div>

          <div>
            <div>
              <Label htmlFor="content_type">Тип объекта *</Label>
              <Input
                id="content_type"
                type="number"
                min={1}
                placeholder="Код типа объекта"
                {...register('content_type', { valueAsNumber: true })}
              />
              {errors.content_type && <p>{errors.content_type.message}</p>}
            </div>
            <div>
              <Label htmlFor="object_id">Связанный объект *</Label>
              <Input
                id="object_id"
                type="number"
                min={1}
                placeholder="Код связанного объекта"
                {...register('object_id', { valueAsNumber: true })}
              />
              {errors.object_id && <p>{errors.object_id.message}</p>}
            </div>
          </div>

            <div>
              {canManage && (
                <Button type="submit" loading={saving}>
                  <Save />
                  {isEdit ? 'Сохранить' : 'Создать'}
                </Button>
              )}
              <Button onClick={() => navigate('/reminders')}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </FormPermissionGuard>
  );
}

export default ReminderForm;
