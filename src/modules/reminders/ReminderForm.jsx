import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Row, Select, Space, Switch, Typography } from 'antd';
import { BusinessFormHeader } from '../../components/business/BusinessFormHeader';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';
import EntitySelect from '../../components/EntitySelect.jsx';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import { getUser, getUsers } from '../../lib/api';
import {
  createReminder,
  getReminder,
  getReminderContentTypes,
  getReminderObject,
  getReminderObjects,
  updateReminder,
} from '../../lib/api/reminders';
import { canWrite } from '../../lib/rbac';
import { navigate } from '../../router';

const { TextArea } = Input;
const { Text, Title } = Typography;

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

const schema = z.object({
  subject: z.string().trim().min(1, 'Введите тему напоминания'),
  description: z.string().optional(),
  reminder_date: z.any().refine((val) => val, { message: 'Выберите дату и время' }),
  active: z.boolean().optional(),
  send_notification_email: z.boolean().optional(),
  owner: z.any().optional(),
  content_type: z.number({ invalid_type_error: 'Выберите тип объекта' }).min(1, 'Выберите тип объекта'),
  object_id: z.number({ invalid_type_error: 'Выберите связанный объект' }).min(1, 'Выберите связанный объект'),
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
  const [contentTypeOptions, setContentTypeOptions] = useState([]);
  const isEdit = !!id;
  const canManage = canWrite('common.change_reminder');

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      subject: '',
      description: '',
      reminder_date: null,
      active: true,
      send_notification_email: false,
      owner: '',
      content_type: undefined,
      object_id: undefined,
    },
  });

  const reminderDate = watch('reminder_date');
  const activeValue = watch('active');
  const emailValue = watch('send_notification_email');
  const ownerValue = watch('owner');
  const contentTypeValue = watch('content_type');
  const objectValue = watch('object_id');

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadReminder();
    }
  }, [id]);

  const loadContentTypes = async () => {
    try {
      const response = await getReminderContentTypes();
      const results = Array.isArray(response?.results) ? response.results : [];
      setContentTypeOptions(
        results.map((item) => ({
          value: item.id,
          label: item.label || item.model || 'Type',
        })),
      );
    } catch (error) {
      setContentTypeOptions([]);
      console.error('Error loading reminder content types:', error);
    }
  };

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
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка напоминания"
        description="Подготавливаем форму напоминания для редактирования."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <BusinessScreenState
        variant="error"
        title="Не удалось загрузить напоминание для редактирования"
        description="Попробуйте повторить загрузку или вернитесь к списку напоминаний."
        actionLabel="Повторить"
        onAction={loadReminder}
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
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <BusinessFormHeader
          formId="reminder-form"
          title={isEdit ? 'Редактирование напоминания' : 'Новое напоминание'}
          subtitle="Контролируйте сроки и уведомления по задачам и связанным объектам."
          submitLabel={isEdit ? 'Сохранить' : 'Создать'}
          isSubmitting={saving}
          onBack={() => navigate('/reminders')}
        />

        <Card>
          <form id="reminder-form" onSubmit={handleSubmit(handleSubmitForm)}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <FieldLabel htmlFor="subject">Тема *</FieldLabel>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="subject"
                      placeholder="Например: Связаться с клиентом"
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <FieldError message={errors.subject?.message} />
              </div>

              <div>
                <FieldLabel htmlFor="description">Описание</FieldLabel>
                <TextArea id="description" rows={4} placeholder="Дополнительная информация" {...register('description')} />
              </div>

              <div>
                <FieldLabel htmlFor="reminder_date">Дата и время напоминания *</FieldLabel>
                <DatePicker
                  id="reminder_date"
                  value={reminderDate || null}
                  onChange={(val) => setValue('reminder_date', val)}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                />
                <FieldError message={errors.reminder_date?.message} />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space align="center">
                    <Switch id="active" checked={!!activeValue} onChange={(val) => setValue('active', val)} />
                    <Text>Активно</Text>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space align="center">
                    <Switch id="send_notification_email" checked={!!emailValue} onChange={(val) => setValue('send_notification_email', val)} />
                    <Text>Email уведомление</Text>
                  </Space>
                </Col>
              </Row>

              <div>
                <FieldLabel htmlFor="owner">Владелец</FieldLabel>
                <EntitySelect
                  id="owner"
                  placeholder="Выберите пользователя"
                  fetchList={getUsers}
                  fetchById={getUser}
                  allowClear
                  style={{ width: '100%' }}
                  value={ownerValue || ''}
                  onChange={(val) => setValue('owner', val)}
                />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="content_type">Тип объекта *</FieldLabel>
                  <Select
                    id="content_type"
                    placeholder="Выберите тип объекта"
                    options={contentTypeOptions}
                    value={contentTypeValue}
                    onChange={(val) => {
                      setValue('content_type', val ?? undefined);
                      setValue('object_id', undefined);
                    }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                  <FieldError message={errors.content_type?.message} />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel htmlFor="object_id">Связанный объект *</FieldLabel>
                  <EntitySelect
                    id="object_id"
                    placeholder={contentTypeValue ? 'Выберите объект' : 'Сначала выберите тип объекта'}
                    disabled={!contentTypeValue}
                    fetchList={contentTypeValue ? (params) => getReminderObjects(contentTypeValue, params) : undefined}
                    fetchById={contentTypeValue ? (objectId) => getReminderObject(contentTypeValue, objectId) : undefined}
                    value={objectValue}
                    onChange={(val) => setValue('object_id', val ?? undefined)}
                    allowClear
                  />
                  <FieldError message={errors.object_id?.message} />
                </Col>
              </Row>

              <Space size={12}>
                <Button htmlType="button" onClick={() => navigate('/reminders')}>
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

export default ReminderForm;
