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
import { toast } from '../../components/ui/use-toast.js';
import { getDeal, getDeals } from '../../lib/api/client';
import { createPayment, getPayment, updatePayment } from '../../lib/api/payments';
import { navigate } from '../../router';

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

const schema = z.object({
  amount: z.number({ invalid_type_error: 'Введите сумму' }).min(0, 'Сумма должна быть больше 0'),
  currency: z.any().optional(),
  status: z.string().min(1, 'Выберите статус'),
  payment_date: z.any().optional(),
  deal: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: 'Выберите сделку' }),
  contract_number: z.string().optional(),
  invoice_number: z.string().optional(),
  order_number: z.string().optional(),
});

function PaymentForm({ id }) {
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
      amount: 0,
      currency: '',
      status: 'r',
      payment_date: dayjs(),
      deal: '',
      contract_number: '',
      invoice_number: '',
      order_number: '',
    },
  });

  const paymentDate = watch('payment_date');
  const statusValue = watch('status');
  const currencyValue = watch('currency');
  const dealValue = watch('deal');

  useEffect(() => {
    if (isEdit) {
      loadPayment();
    }
  }, [id]);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const data = await getPayment(id);
      reset({
        ...data,
        payment_date: data.payment_date ? dayjs(data.payment_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки платежа', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updatePayment(id, payload);
        toast({ title: 'Платеж обновлен', description: 'Платеж обновлен' });
      } else {
        await createPayment(payload);
        toast({ title: 'Платеж создан', description: 'Платеж создан' });
      }
      navigate('/payments');
    } catch (error) {
      toast({ title: 'Ошибка', description: isEdit ? 'Ошибка обновления платежа' : 'Ошибка создания платежа', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/payments')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold">
        {isEdit ? 'Редактирование платежа' : 'Новый платеж'}
      </h2>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amount">Сумма *</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="currency">Валюта</Label>
              <ReferenceSelect
                id="currency"
                data-testid="currency-select"
                type="currencies"
                placeholder="Выберите валюту"
                value={currencyValue || ''}
                onChange={(val) => setValue('currency', val)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Статус *</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={statusValue || ''}
                onChange={(e) => setValue('status', e.target.value)}
              >
                <option value="">Выберите статус</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
            <div>
              <Label htmlFor="payment_date">Дата платежа</Label>
              <DatePicker id="payment_date" value={paymentDate || null} onChange={(val) => setValue('payment_date', val)} format="YYYY-MM-DD" />
            </div>
          </div>

          <div>
            <Label htmlFor="deal">Сделка *</Label>
            <EntitySelect
              id="deal"
              data-testid="deal-select"
              placeholder="Выберите сделку"
              value={dealValue || ''}
              fetchOptions={getDeals}
              fetchById={getDeal}
              optionLabel={(item) => item?.name || '-'}
              onChange={(val) => setValue('deal', val)}
            />
            {errors.deal && <p className="text-xs text-destructive">{errors.deal.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="contract_number">Номер договора</Label>
              <Input id="contract_number" placeholder="Договор №" {...register('contract_number')} />
            </div>
            <div>
              <Label htmlFor="invoice_number">Номер счета</Label>
              <Input id="invoice_number" placeholder="Счет №" {...register('invoice_number')} />
            </div>
            <div>
              <Label htmlFor="order_number">Номер заказа</Label>
              <Input id="order_number" placeholder="Заказ №" {...register('order_number')} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/payments')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default PaymentForm;
