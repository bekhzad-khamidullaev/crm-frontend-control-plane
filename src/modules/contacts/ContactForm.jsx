import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';

import { navigate } from '../../router';
import {
  getContact,
  createContact,
  updateContact,
  getCompanies,
  getCompany,
  getUsers,
  getUser,
} from '../../lib/api/client';
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
  first_name: z.string().min(1, 'Введите имя'),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  title: z.string().optional(),
  sex: z.string().optional(),
  birth_date: z.any().optional(),
  email: z.string().email('Некорректный email').min(1, 'Введите email'),
  secondary_email: z.string().optional(),
  phone: z.string().optional(),
  other_phone: z.string().optional(),
  mobile: z.string().optional(),
  company: z.any().optional(),
  lead_source: z.any().optional(),
  country: z.any().optional(),
  city: z.any().optional(),
  city_name: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  tags: z.any().optional(),
  token: z.string().optional(),
  owner: z.any().optional(),
  department: z.any().optional(),
  massmail: z.boolean().optional(),
  disqualified: z.boolean().optional(),
  was_in_touch: z.any().optional(),
  description: z.string().optional(),
});

function ContactForm({ id }) {
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
      first_name: '',
      middle_name: '',
      last_name: '',
      title: '',
      sex: '',
      birth_date: null,
      email: '',
      secondary_email: '',
      phone: '',
      other_phone: '',
      mobile: '',
      company: '',
      lead_source: '',
      country: '',
      city: '',
      city_name: '',
      region: '',
      district: '',
      address: '',
      tags: [],
      token: '',
      owner: '',
      department: '',
      massmail: false,
      disqualified: false,
      was_in_touch: null,
      description: '',
    },
  });

  const birthDate = watch('birth_date');
  const lastTouch = watch('was_in_touch');
  const massmail = watch('massmail');
  const disqualified = watch('disqualified');
  const companyValue = watch('company');
  const ownerValue = watch('owner');
  const tagsValue = watch('tags');
  const leadSourceValue = watch('lead_source');
  const countryValue = watch('country');
  const cityValue = watch('city');
  const departmentValue = watch('department');

  useEffect(() => {
    if (isEdit) {
      loadContact();
    }
  }, [id]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const contact = await getContact(id);
      reset({
        ...contact,
        birth_date: contact.birth_date ? dayjs(contact.birth_date) : null,
        was_in_touch: contact.was_in_touch ? dayjs(contact.was_in_touch) : null,
      });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных контакта', variant: 'destructive' });
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
          birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
          was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
        },
        { preserveEmptyArrays: ['tags'] }
      );
      if (isEdit) {
        await updateContact(id, payload);
        toast({ title: 'Контакт обновлен', description: 'Контакт обновлен' });
      } else {
        await createContact(payload);
        toast({ title: 'Контакт создан', description: 'Контакт создан' });
      }
      navigate('/contacts');
    } catch (error) {
      const details = error?.details;
      if (details && typeof details === 'object') {
        const message = details?.detail || `Ошибка ${isEdit ? 'обновления' : 'создания'} контакта`;
        toast({ title: 'Ошибка', description: message, variant: 'destructive' });
      } else {
        toast({ title: 'Ошибка', description: `Ошибка ${isEdit ? 'обновления' : 'создания'} контакта`, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate('/contacts')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h2 className="text-2xl font-semibold">
        {isEdit ? 'Редактировать контакт' : 'Создать новый контакт'}
      </h2>

      <Card className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="first_name">Имя *</Label>
                <Input id="first_name" placeholder="Анна" {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="middle_name">Отчество</Label>
                <Input id="middle_name" placeholder="Сергеевна" {...register('middle_name')} />
              </div>
              <div>
                <Label htmlFor="last_name">Фамилия</Label>
                <Input id="last_name" placeholder="Смирнова" {...register('last_name')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Должность</Label>
                <Input id="title" placeholder="Менеджер" {...register('title')} />
              </div>
              <div>
                <Label htmlFor="sex">Пол</Label>
                <select
                  id="sex"
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  {...register('sex')}
                >
                  <option value="">Выберите пол</option>
                  <option value="M">Мужской</option>
                  <option value="F">Женский</option>
                  <option value="O">Другое</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Дата рождения</Label>
                <DatePicker value={birthDate || null} onChange={(val) => setValue('birth_date', val)} format="DD.MM.YYYY" />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Контакты</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" placeholder="anna@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="secondary_email">Доп. Email</Label>
                <Input id="secondary_email" placeholder="anna.secondary@example.com" {...register('secondary_email')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" placeholder="+7 999 111-22-33" {...register('phone')} />
              </div>
              <div>
                <Label htmlFor="other_phone">Доп. телефон</Label>
                <Input id="other_phone" placeholder="+7 999 222-33-44" {...register('other_phone')} />
              </div>
              <div>
                <Label htmlFor="mobile">Мобильный</Label>
                <Input id="mobile" placeholder="+7 999 333-44-55" {...register('mobile')} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Организация</h3>
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
                <Label>Источник</Label>
                <ReferenceSelect
                  type="lead-sources"
                  placeholder="Выберите источник"
                  allowClear
                  value={leadSourceValue || ''}
                  onChange={(val) => setValue('lead_source', val)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Локация</h3>
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
                <Label htmlFor="city_name">Город (строкой)</Label>
                <Input id="city_name" placeholder="Ташкент" {...register('city_name')} />
              </div>
              <div>
                <Label htmlFor="region">Регион/область</Label>
                <Input id="region" placeholder="Ташкентская область" {...register('region')} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="district">Район</Label>
                <Input id="district" placeholder="Юнусабадский район" {...register('district')} />
              </div>
              <div>
                <Label htmlFor="address">Адрес</Label>
                <Input id="address" placeholder="г. Москва, ул. Ленина, д. 1" {...register('address')} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Управление и теги</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div>
                <Label htmlFor="token">Токен</Label>
                <Input id="token" placeholder="Авто" {...register('token')} />
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch checked={!!massmail} onCheckedChange={(val) => setValue('massmail', val)} />
                <Label>Массовая рассылка</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!disqualified} onCheckedChange={(val) => setValue('disqualified', val)} />
                <Label>Дисквалифицирован</Label>
              </div>
              <div>
                <Label>Последний контакт</Label>
                <DatePicker value={lastTouch || null} onChange={(val) => setValue('was_in_touch', val)} format="DD.MM.YYYY" />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Дополнительная информация</h3>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={4} placeholder="Дополнительная информация о контакте" {...register('description')} />
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Обновить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/contacts')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ContactForm;
