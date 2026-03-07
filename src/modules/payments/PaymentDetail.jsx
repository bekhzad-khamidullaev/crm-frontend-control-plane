import dayjs from 'dayjs';
import { ArrowLeft, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatCurrency } from '../../lib/utils/format';

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { deletePayment, getPayment } from '../../lib/api/payments';
import { navigate } from '../../router';
import { LegacyEmptyState, LegacyLoadingState } from '../../shared/ui';

const statusOptions = {
  r: 'Получен',
  g: 'Гарантирован',
  h: 'Высокая вероятность',
  l: 'Низкая вероятность',
};

const statusColors = {
  r: 'bg-emerald-100 text-emerald-700',
  g: 'bg-sky-100 text-sky-700',
  h: 'bg-amber-100 text-amber-700',
  l: 'bg-muted text-muted-foreground',
};

export default function PaymentDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPayment(id);
      setData(res);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить платеж', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(id);
      toast({ title: 'Платеж удален', description: 'Платеж удален' });
      navigate('/payments');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления платежа', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <LegacyLoadingState
        title="Загрузка платежа"
        description="Получаем сумму, статус и связь со сделкой."
      />
    );
  }

  if (!data) {
    return (
      <LegacyEmptyState
        title="Платеж не найден"
        description="Возможно, запись была удалена или у вас нет к ней доступа."
        actionLabel="Вернуться к платежам"
        onAction={() => navigate('/payments')}
      />
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Платеж</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Button onClick={() => navigate(`/payments/${id}/edit`)}>
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
          <div className="text-xs text-muted-foreground">Сумма</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(data.amount, data.currency_name || 'RUB')}
          </div>
        </div>

        <DetailRow label="Статус">
          <Badge className={statusColors[data.status] || 'bg-muted text-muted-foreground'}>
            {statusOptions[data.status] || data.status || '—'}
          </Badge>
        </DetailRow>

        <DetailRow label="Дата платежа">
          {data.payment_date ? dayjs(data.payment_date).format('DD MMM YYYY') : '-'}
        </DetailRow>

        <DetailRow label="Сделка">
          {data.deal_name || '-'}
        </DetailRow>

        <DetailRow label="Номер договора">{data.contract_number || '-'}</DetailRow>
        <DetailRow label="Номер счета">{data.invoice_number || '-'}</DetailRow>
        <DetailRow label="Номер заказа">{data.order_number || '-'}</DetailRow>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платеж?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Это действие нельзя отменить</p>
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
