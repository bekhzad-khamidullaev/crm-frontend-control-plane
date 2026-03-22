import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Result, Row, Select, Skeleton, Space, Typography } from 'antd';
import EntitySelect from '../../components/EntitySelect';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import ReferenceSelect from '../../components/ReferenceSelect';
import { getDeal, getDeals } from '../../lib/api/client';
import { createPayment, getPayment, updatePayment } from '../../lib/api/payments';
import { canWrite } from '../../lib/rbac';
import { navigate } from '../../router';

const { Text } = Typography;

const FieldLabel = ({ children, ...props }) => (
  <Text strong style={{ display: 'block', marginBottom: 6 }} {...props}>
    {children}
  </Text>
);

const FieldError = ({ message }) => (
  message ? (
    <Text type="danger" style={{ display: 'block', marginTop: 6 }}>
      {message}
    </Text>
  ) : null
);

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

const schema = z.object({
  amount: z.number({ invalid_type_error: 'Введите сумму' }).min(0, 'Сумма не может быть отрицательной'),
  currency: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: 'Выберите валюту' }),
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
  const normalizeErrorMessage = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(' ');
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('crm.change_payment');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    setError,
    clearErrors,
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
    setLoadError(false);
    try {
      const data = await getPayment(id);
      reset({
        ...data,
        payment_date: data.payment_date ? dayjs(data.payment_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: 'Ошибка', description: 'Ошибка загрузки платежа', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyServerErrors = (error) => {
    const details = error?.details || error?.body?.details || error?.response?.data;
    if (!details || typeof details !== 'object') return false;

    let hasFieldErrors = false;

    Object.entries(details).forEach(([field, value]) => {
      const messageText = normalizeErrorMessage(value);
      if (!messageText) return;

      if (field === 'detail' || field === 'non_field_errors') {
        notify({ title: 'Ошибка', description: messageText, variant: 'destructive' });
        return;
      }

      setError(field, { type: 'server', message: messageText });
      hasFieldErrors = true;
    });

    return hasFieldErrors;
  };

  const onSubmit = async (values) => {
    if (!canManage) {
      notify({ title: 'Недостаточно прав', description: 'У вас нет прав для изменения платежей', variant: 'destructive' });
      return;
    }

    setSaving(true);
    clearErrors();
    try {
      const payload = {
        ...values,
        amount:
          values.amount !== undefined && values.amount !== null && values.amount !== ''
            ? String(values.amount)
            : null,
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
      const hasFieldErrors = applyServerErrors(error);
      if (!hasFieldErrors) {
        notify({ title: 'Ошибка', description: isEdit ? 'Ошибка обновления платежа' : 'Ошибка создания платежа', variant: 'destructive' });
      }
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
        title="Не удалось загрузить платеж"
        subTitle="Попробуйте обновить данные или вернитесь к списку платежей."
        extra={[
          <Button key="retry" onClick={loadPayment}>Повторить</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/payments')}>К списку платежей</Button>,
        ]}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/payments"
      listButtonText="К списку платежей"
      description="У вас нет прав для создания или редактирования платежей."
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button onClick={() => navigate('/payments')} icon={<ArrowLeft size={16} />}>
          Назад
        </Button>

        <Card title={isEdit ? 'Редактирование платежа' : 'Новый платеж'}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="amount">Сумма *</FieldLabel>
                  <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
                  <FieldError message={errors.amount?.message} />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="currency">Валюта</FieldLabel>
                  <ReferenceSelect
                    id="currency"
                    data-testid="currency-select"
                    type="currencies"
                    placeholder="Выберите валюту"
                    value={currencyValue || ''}
                    onChange={(val) => setValue('currency', val ?? '', { shouldDirty: true, shouldValidate: true })}
                  />
                  <FieldError message={errors.currency?.message} />
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="status">Статус *</FieldLabel>
                  <Select
                    id="status"
                    value={statusValue || undefined}
                    onChange={(value) => setValue('status', value ?? '', { shouldDirty: true, shouldValidate: true })}
                    placeholder="Выберите статус"
                    allowClear
                    options={statusOptions}
                  />
                  <FieldError message={errors.status?.message} />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="payment_date">Дата платежа</FieldLabel>
                  <DatePicker
                    id="payment_date"
                    value={paymentDate || null}
                    onChange={(val) => setValue('payment_date', val, { shouldDirty: true, shouldValidate: true })}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <div>
                <FieldLabel htmlFor="deal">Сделка *</FieldLabel>
                <EntitySelect
                  id="deal"
                  data-testid="deal-select"
                  placeholder="Выберите сделку"
                  value={dealValue || ''}
                  fetchOptions={getDeals}
                  fetchById={getDeal}
                  optionLabel={(item) => item?.name || '-'}
                  onChange={(val) => setValue('deal', val ?? '', { shouldDirty: true, shouldValidate: true })}
                />
                <FieldError message={errors.deal?.message} />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <FieldLabel htmlFor="contract_number">Номер договора</FieldLabel>
                  <Input id="contract_number" placeholder="Договор №" {...register('contract_number')} />
                </Col>
                <Col xs={24} md={8}>
                  <FieldLabel htmlFor="invoice_number">Номер счета</FieldLabel>
                  <Input id="invoice_number" placeholder="Счет №" {...register('invoice_number')} />
                </Col>
                <Col xs={24} md={8}>
                  <FieldLabel htmlFor="order_number">Номер заказа</FieldLabel>
                  <Input id="order_number" placeholder="Заказ №" {...register('order_number')} />
                </Col>
              </Row>

              <Space size={12}>
                {canManage && (
                  <Button type="primary" htmlType="submit" loading={saving} icon={<Save size={16} />}>
                    {isEdit ? 'Сохранить' : 'Создать'}
                  </Button>
                )}
                <Button htmlType="button" onClick={() => navigate('/payments')}>
                  Отмена
                </Button>
              </Space>
            </Space>
          </form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}

export default PaymentForm;
