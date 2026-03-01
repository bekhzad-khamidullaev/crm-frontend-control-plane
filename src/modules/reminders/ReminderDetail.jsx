import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trash2, Bell, Check, X } from 'lucide-react';
import dayjs from 'dayjs';

import { getReminder, deleteReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog.jsx';

export default function ReminderDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getReminder(id);
      setData(res);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить напоминание', variant: 'destructive' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReminder(id);
      toast({ title: 'Напоминание удалено', description: 'Напоминание удалено' });
      navigate('/reminders');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить напоминание', variant: 'destructive' });
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateReminder(id, { active: !data.active });
      toast({
        title: !data.active ? 'Напоминание активировано' : 'Напоминание деактивировано',
        description: !data.active ? 'Напоминание активировано' : 'Напоминание деактивировано',
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить напоминание', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-muted-foreground">Загрузка...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-muted-foreground">Напоминание не найдено</div>
      </Card>
    );
  }

  const reminderDate = data.reminder_date ? dayjs(data.reminder_date) : null;
  const isPast = reminderDate ? reminderDate.isBefore(dayjs()) : false;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Детали напоминания</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/reminders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Button
            variant={data.active ? 'outline' : 'default'}
            onClick={handleToggleActive}
          >
            {data.active ? <X className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
            {data.active ? 'Отключить' : 'Включить'}
          </Button>
          <Button onClick={() => navigate(`/reminders/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-md border border-border p-4">
          <div className="text-xs text-muted-foreground">Тема</div>
          <div className="text-lg font-semibold">{data.subject}</div>
        </div>

        <DetailRow label="Статус">
          <Badge variant={data.active ? 'default' : 'secondary'}>
            {data.active ? 'Активно' : 'Неактивно'}
          </Badge>
        </DetailRow>

        <DetailRow label="Дата напоминания">
          {reminderDate ? (
            <span className={isPast ? 'text-destructive font-semibold' : 'font-semibold'}>
              {reminderDate.format('DD MMM YYYY HH:mm')}
              {isPast && ' (Просрочено)'}
            </span>
          ) : (
            '-'
          )}
        </DetailRow>

        <DetailRow label="Тип объекта">{data.content_type ?? '-'}</DetailRow>
        <DetailRow label="Связанный объект">{data.object_id ?? '-'}</DetailRow>
        <DetailRow label="Владелец">{data.owner_name || '-'}</DetailRow>
        <DetailRow label="Email уведомление">{data.send_notification_email ? 'Да' : 'Нет'}</DetailRow>
        <DetailRow label="Описание">{data.description || '-'} </DetailRow>
        <DetailRow label="Дата создания">{data.creation_date ? dayjs(data.creation_date).format('DD MMM YYYY HH:mm') : '-'}</DetailRow>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить напоминание?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Действие нельзя отменить.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
