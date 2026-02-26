import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trash2, FileText, Clock, Check } from 'lucide-react';
import dayjs from 'dayjs';

import { getMemo, deleteMemo, markMemoReviewed, markMemoPostponed } from '../../lib/api/memos';
import { navigate } from '../../router';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog.jsx';

const stageLabels = {
  pen: { text: 'В ожидании', className: 'bg-sky-100 text-sky-700' },
  pos: { text: 'Отложено', className: 'bg-amber-100 text-amber-700' },
  rev: { text: 'Рассмотрено', className: 'bg-emerald-100 text-emerald-700' },
};

export default function MemoDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemo(id);
      setData(res);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить мемо', variant: 'destructive' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMemo(id);
      toast({ title: 'Мемо удалено', description: 'Мемо удалено' });
      navigate('/memos');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить мемо', variant: 'destructive' });
    }
  };

  const handleReviewed = async () => {
    try {
      await markMemoReviewed(id);
      toast({ title: 'Мемо рассмотрено', description: 'Мемо отмечено как рассмотренное' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить мемо', variant: 'destructive' });
    }
  };

  const handlePostponed = async () => {
    try {
      await markMemoPostponed(id);
      toast({ title: 'Мемо отложено', description: 'Мемо отложено' });
      fetchData();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить мемо', variant: 'destructive' });
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
        <div className="text-center text-sm text-muted-foreground">Мемо не найдено</div>
      </Card>
    );
  }

  const stage = stageLabels[data.stage] || { text: data.stage || '—', className: 'bg-muted text-muted-foreground' };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Детали мемо</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/memos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <Button variant="outline" onClick={handlePostponed}>
              <Clock className="mr-2 h-4 w-4" />
              Отложить
            </Button>
            <Button onClick={handleReviewed}>
              <Check className="mr-2 h-4 w-4" />
              Рассмотрено
            </Button>
            <Button onClick={() => navigate(`/memos/${id}/edit`)}>
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
          <DetailRow label="Название" span>
            <div className="text-base font-semibold">{data.name}</div>
          </DetailRow>
          <DetailRow label="Стадия">
            <Badge className={stage.className}>{stage.text}</Badge>
          </DetailRow>
          <DetailRow label="Черновик">{data.draft ? 'Да' : 'Нет'}</DetailRow>
          <DetailRow label="Уведомления">{data.notified ? 'Отправлены' : 'Не отправлялись'}</DetailRow>
          <DetailRow label="Дата обзора">{data.review_date ? dayjs(data.review_date).format('DD.MM.YYYY') : '-'}</DetailRow>
          <DetailRow label="Получатель">{data.to_name || '-'}</DetailRow>
          <DetailRow label="Сделка">{data.deal_name || '-'}</DetailRow>
          <DetailRow label="Проект">{data.project_name || '-'}</DetailRow>
          <DetailRow label="Задача">{data.task_name || '-'}</DetailRow>
          <DetailRow label="Resolution">{data.resolution_name || data.resolution || '-'}</DetailRow>
          <DetailRow label="Теги">{data.tag_names || '-'}</DetailRow>
          <DetailRow label="Владелец">{data.owner_name || '-'}</DetailRow>
          <DetailRow label="Создано">{data.creation_date ? dayjs(data.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</DetailRow>
          <DetailRow label="Обновлено">{data.update_date ? dayjs(data.update_date).format('DD.MM.YYYY HH:mm') : '-'}</DetailRow>
          <DetailRow label="Описание" span>{data.description || '-'}</DetailRow>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Заключение</h3>
        <div className="text-sm whitespace-pre-wrap">{data.note || 'Нет заключения'}</div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить мемо?</AlertDialogTitle>
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
    </div>
  );
}

function DetailRow({ label, children, span }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
