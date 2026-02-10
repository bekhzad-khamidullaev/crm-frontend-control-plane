import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';

import { navigate } from '../../router';
import {
  getDeal,
  createDeal,
  updateDeal,
  getLead,
  getLeads,
  getContact,
  getContacts,
  getCompany,
  getCompanies,
  getUser,
  getUsers,
} from '../../lib/api/client';
import { getRequest, getRequests } from '../../lib/api/requests';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import { toast } from '../../components/ui/use-toast.js';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  amount: z.any().optional(),
  currency: z.any().optional(),
  stage: z.any().optional(),
  probability: z.any().optional(),
  closing_date: z.any().optional(),
  closing_reason: z.any().optional(),
  next_step: z.string().min(1, 'Введите следующий шаг'),
  next_step_date: z.any().optional(),
  company: z.any().optional(),
  contact: z.any().optional(),
  lead: z.any().optional(),
  request: z.any().optional(),
  partner_contact: z.any().optional(),
  tags: z.any().optional(),
  country: z.any().optional(),
  city: z.any().optional(),
  owner: z.any().optional(),
  co_owner: z.any().optional(),
  department: z.any().optional(),
  active: z.boolean().optional(),
  relevant: z.boolean().optional(),
  important: z.boolean().optional(),
  is_new: z.boolean().optional(),
  remind_me: z.boolean().optional(),
  description: z.string().optional(),
});

function DealForm({ id }) {
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
      name: '',
      amount: '',
      currency: '',
      stage: '',
      probability: '',
      closing_date: null,
      closing_reason: '',
      next_step: '',
      next_step_date: null,
      company: '',
      contact: '',
      lead: '',
      request: '',
      partner_contact: '',
      tags: [],
      country: '',
      city: '',
      owner: '',
      co_owner: '',
      department: '',
      active: true,
      relevant: true,
      important: false,
      is_new: true,
      remind_me: false,
      description: '',
    },
  });

  const closingDate = watch('closing_date');
  const nextStepDate = watch('next_step_date');
  const currencyValue = watch('currency');
  const stageValue = watch('stage');
  const closingReasonValue = watch('closing_reason');
  const companyValue = watch('company');
  const contactValue = watch('contact');
  const leadValue = watch('lead');
  const requestValue = watch('request');
  const partnerContactValue = watch('partner_contact');
  const tagsValue = watch('tags');
  const countryValue = watch('country');
  const cityValue = watch('city');
  const ownerValue = watch('owner');
  const coOwnerValue = watch('co_owner');
  const departmentValue = watch('department');
  const activeValue = watch('active');
  const relevantValue = watch('relevant');
  const importantValue = watch('important');
  const isNewValue = watch('is_new');
  const remindMeValue = watch('remind_me');

  useEffect(() => {
    if (isEdit) {
      loadDeal();
    }
  }, [id]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const deal = await getDeal(id);
      reset({
        ...deal,
        amount: deal.amount ?? '',
        closing_date: deal.closing_date ? dayjs(deal.closing_date) : null,
        next_step_date: deal.next_step_date ? dayjs(deal.next_step_date) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных сделки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = normalizePayload(
        {
          ...values,
          amount:
            values.amount !== undefined && values.amount !== null && values.amount !== ''
              ? String(values.amount)
              : null,
          closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
          next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
        },
        { preserveEmptyArrays: ['tags'] }
      );

      if (isEdit) {
        await updateDeal(id, payload);
        toast({ title: 'Сделка обновлена', description: 'Сделка обновлена' });
      } else {
        await createDeal(payload);
        toast({ title: 'Сделка создана', description: 'Сделка создана' });
      }
      navigate('/deals');
    } catch (error) {
      const details = error?.details;
      toast({
        title: 'Ошибка',
        description: details?.detail || `Ошибка ${isEdit ? 'обновления' : 'создания'} сделки`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/deals')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold">
        {isEdit ? 'Редактировать сделку' : 'Создать новую сделку'}
      </h2>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Название сделки *</Label>
                <Input id="name" placeholder="Поставка оборудования" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="amount">Сумма сделки</Label>
                <Input id="amount" type="number" placeholder="1500000" {...register('amount')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label>Валюта</Label>
                <ReferenceSelect
                  type="currencies"
                  placeholder="Выберите валюту"
                  allowClear
                  value={currencyValue || ''}
                  onChange={(val) => setValue('currency', val)}
                />
              </div>
              <div>
                <Label>Стадия</Label>
                <ReferenceSelect
                  type="stages"
                  placeholder="Выберите стадию"
                  allowClear
                  value={stageValue || ''}
                  onChange={(val) => setValue('stage', val)}
                />
              </div>
              <div>
                <Label htmlFor="probability">Вероятность (%)</Label>
                <Input id="probability" type="number" min={0} max={100} {...register('probability')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Дата закрытия</Label>
                <DatePicker id="closing_date" value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" />
              </div>
              <div>
                <Label>Причина закрытия</Label>
                <ReferenceSelect
                  type="closing-reasons"
                  placeholder="Выберите причину"
                  allowClear
                  value={closingReasonValue || ''}
                  onChange={(val) => setValue('closing_reason', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="next_step">Следующий шаг *</Label>
                <Input id="next_step" placeholder="Согласовать КП" {...register('next_step')} />
                {errors.next_step && <p className="text-xs text-destructive">{errors.next_step.message}</p>}
              </div>
              <div>
                <Label>Дата следующего шага *</Label>
                <DatePicker id="next_step_date" value={nextStepDate || null} onChange={(val) => setValue('next_step_date', val)} format="DD.MM.YYYY" />
                {errors.next_step_date && <p className="text-xs text-destructive">{errors.next_step_date.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Связанные записи</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Компания</Label>
                <EntitySelect
                  value={companyValue || ''}
                  placeholder="Выберите компанию"
                  fetchOptions={getCompanies}
                  fetchById={getCompany}
                  onChange={(val) => setValue('company', val)}
                />
              </div>
              <div>
                <Label>Контакт</Label>
                <EntitySelect
                  value={contactValue || ''}
                  placeholder="Выберите контакт"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                  onChange={(val) => setValue('contact', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Лид</Label>
                <EntitySelect
                  value={leadValue || ''}
                  placeholder="Выберите лид"
                  fetchOptions={getLeads}
                  fetchById={getLead}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                  onChange={(val) => setValue('lead', val)}
                />
              </div>
              <div>
                <Label>Запрос</Label>
                <EntitySelect
                  value={requestValue || ''}
                  placeholder="Выберите запрос"
                  fetchOptions={getRequests}
                  fetchById={getRequest}
                  optionLabel={(item) => item?.ticket || item?.description || `#${item?.id}`}
                  onChange={(val) => setValue('request', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Контакт партнера</Label>
                <EntitySelect
                  value={partnerContactValue || ''}
                  placeholder="Выберите контакт партнера"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                  onChange={(val) => setValue('partner_contact', val)}
                />
              </div>
              <div>
                <Label>Теги</Label>
                <ReferenceSelect
                  type="crm-tags"
                  placeholder="Выберите теги"
                  mode="multiple"
                  allowClear
                  value={tagsValue || []}
                  onChange={(val) => setValue('tags', val)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">География и ответственные</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Страна</Label>
                <ReferenceSelect
                  type="countries"
                  placeholder="Выберите страну"
                  allowClear
                  value={countryValue || ''}
                  onChange={(val) => setValue('country', val)}
                />
              </div>
              <div>
                <Label>Город</Label>
                <ReferenceSelect
                  type="cities"
                  placeholder="Выберите город"
                  allowClear
                  value={cityValue || ''}
                  onChange={(val) => setValue('city', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Ответственный</Label>
                <EntitySelect
                  value={ownerValue || ''}
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('owner', val)}
                />
              </div>
              <div>
                <Label>Со-ответственный</Label>
                <EntitySelect
                  value={coOwnerValue || ''}
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                  onChange={(val) => setValue('co_owner', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Отдел</Label>
                <ReferenceSelect
                  type="departments"
                  placeholder="Выберите отдел"
                  allowClear
                  value={departmentValue || ''}
                  onChange={(val) => setValue('department', val)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Статус</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch checked={!!activeValue} onCheckedChange={(val) => setValue('active', val)} />
                <Label>Активна</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!relevantValue} onCheckedChange={(val) => setValue('relevant', val)} />
                <Label>Актуальна</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!importantValue} onCheckedChange={(val) => setValue('important', val)} />
                <Label>Важная</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Switch checked={!!isNewValue} onCheckedChange={(val) => setValue('is_new', val)} />
                <Label>Новая</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!remindMeValue} onCheckedChange={(val) => setValue('remind_me', val)} />
                <Label>Напоминать</Label>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Дополнительная информация</h3>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={4} placeholder="Детальное описание сделки" {...register('description')} />
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Обновить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/deals')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default DealForm;
