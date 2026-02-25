import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import EntitySelect from '../../components/EntitySelect.jsx';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { getUser, getUsers } from '../../lib/api';
import { createReminder, getReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';

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
    try {
      const data = await getReminder(id);
      reset({
        ...data,
        reminder_date: data.reminder_date ? dayjs(data.reminder_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки напоминания', variant: 'destructive' });
      console.error('Error loading reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        reminder_date: values.reminder_date ? values.reminder_date.toISOString() : null,
      };

      if (isEdit) {
        await updateReminder(id, payload);
        toast({ title: 'Напоминание обновлено', description: 'Напоминание обновлено' });
      } else {
        await createReminder(payload);
        toast({ title: 'Напоминание создано', description: 'Напоминание создано' });
      }
      navigate('/reminders');
    } catch (error) {
      toast({ title: 'Ошибка', description: isEdit ? 'Ошибка обновления напоминания' : 'Ошибка создания напоминания', variant: 'destructive' });
      console.error('Error saving reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/reminders')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">
          {isEdit ? 'Редактирование напоминания' : 'Новое напоминание'}
        </h2>
      </div>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(handleSubmitForm)}>
          <div>
            <Label htmlFor="subject">Тема *</Label>
            <Input id="subject" placeholder="Например: Связаться с клиентом" {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" rows={4} placeholder="Дополнительная информация" {...register('description')} />
          </div>

          <div>
            <Label htmlFor="reminder_date">Дата и время напоминания *</Label>
            <DatePicker id="reminder_date" value={reminderDate || null} onChange={(val) => setValue('reminder_date', val)} format="YYYY-MM-DD" />
            {errors.reminder_date && <p className="text-xs text-destructive">{errors.reminder_date.message}</p>}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="active" checked={!!activeValue} onCheckedChange={(val) => setValue('active', val)} />
              <Label htmlFor="active">Активно</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="send_notification_email" checked={!!emailValue} onCheckedChange={(val) => setValue('send_notification_email', val)} />
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="content_type">Content type ID *</Label>
              <Input
                id="content_type"
                type="number"
                min={1}
                placeholder="Например: 12"
                {...register('content_type', { valueAsNumber: true })}
              />
              {errors.content_type && <p className="text-xs text-destructive">{errors.content_type.message}</p>}
            </div>
            <div>
              <Label htmlFor="object_id">Object ID *</Label>
              <Input
                id="object_id"
                type="number"
                min={1}
                placeholder="ID связанного объекта"
                {...register('object_id', { valueAsNumber: true })}
              />
              {errors.object_id && <p className="text-xs text-destructive">{errors.object_id.message}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/reminders')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ReminderForm;
