import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Result, Row, Select, Skeleton, Space, Switch, Typography } from 'antd';
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
  subject: z.string().min(1, 'Введите тему напоминания'),
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
          label: item.label || item.model || `Type ${item.id}`,
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
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить напоминание для редактирования"
        subTitle="Попробуйте повторить загрузку или вернитесь к списку напоминаний."
        extra={[
          <Button key="retry" onClick={loadReminder}>Повторить</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/reminders')}>К списку напоминаний</Button>,
        ]}
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
        <Button onClick={() => navigate('/reminders')} icon={<ArrowLeft size={16} />}>
          Назад
        </Button>

        <Card
          title={(
            <Space>
              <Bell size={18} />
              <Title level={4} style={{ margin: 0 }}>
                {isEdit ? 'Редактирование напоминания' : 'Новое напоминание'}
              </Title>
            </Space>
          )}
        >
          <form onSubmit={handleSubmit(handleSubmitForm)}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <FieldLabel htmlFor="subject">Тема *</FieldLabel>
                <Input id="subject" placeholder="Например: Связаться с клиентом" {...register('subject')} />
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
                {canManage && (
                  <Button type="primary" htmlType="submit" loading={saving} icon={<Save size={16} />}>
                    {isEdit ? 'Сохранить' : 'Создать'}
                  </Button>
                )}
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
