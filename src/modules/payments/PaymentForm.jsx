import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import EntitySelect from '../../components/EntitySelect';
import ReferenceSelect from '../../components/ReferenceSelect';
import { getDeal, getDeals } from '../../lib/api/client';
import { createPayment, getPayment, updatePayment } from '../../lib/api/payments';
import { canWrite } from '../../lib/rbac';
import { navigate } from '../../router';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';

import { App, Button, Card, DatePicker, Input } from 'antd';
const Label = ({ children, ...props }) => <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }} {...props}>{children}</label>;

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
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || 'Уведомление';
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('crm.change_payment');

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
      notify({ title: 'Ошибка', description: 'Ошибка загрузки платежа', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    if (!canManage) {
      notify({ title: 'Недостаточно прав', description: 'У вас нет прав для изменения платежей', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updatePayment(id, payload);
        notify({ title: 'Платеж обновлен', description: 'Платеж обновлен' });
      } else {
        await createPayment(payload);
        notify({ title: 'Платеж создан', description: 'Платеж создан' });
      }
      navigate('/payments');
    } catch (error) {
      notify({ title: 'Ошибка', description: isEdit ? 'Ошибка обновления платежа' : 'Ошибка создания платежа', variant: 'destructive' });
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
      listPath="/payments"
      listButtonText="К списку платежей"
      description="У вас нет прав для создания или редактирования платежей."
    >
      <div>
        <Button onClick={() => navigate('/payments')}>
          <ArrowLeft />
          Назад
        </Button>

        <h2>
          {isEdit ? 'Редактирование платежа' : 'Новый платеж'}
        </h2>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div>
              <Label htmlFor="amount">Сумма *</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p>{errors.amount.message}</p>}
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

          <div>
            <div>
              <Label htmlFor="status">Статус *</Label>
              <select
                id="status"
               
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
              {errors.status && <p>{errors.status.message}</p>}
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
            {errors.deal && <p>{errors.deal.message}</p>}
          </div>

          <div>
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

            <div>
              {canManage && (
                <Button type="submit" loading={saving}>
                  <Save />
                  {isEdit ? 'Сохранить' : 'Создать'}
                </Button>
              )}
              <Button onClick={() => navigate('/payments')}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </FormPermissionGuard>
  );
}

export default PaymentForm;
