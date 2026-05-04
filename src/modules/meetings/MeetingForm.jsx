import { App, Button, Card, DatePicker, Form, Input, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import EntitySelect from '../../components/EntitySelect.jsx';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';
import { BusinessFormHeader } from '../../components/business/BusinessFormHeader';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard.jsx';
import { getCompany, getCompanies, getContact, getContacts, getDeal, getDeals } from '../../lib/api/client.js';
import {
  createMeeting,
  getMeeting,
  updateMeeting,
} from '../../lib/api/meetings.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';

const statusOptions = [
  { value: 'scheduled', label: 'Запланирована' },
  { value: 'completed', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' },
];

const formatOptions = [
  { value: 'offline', label: 'Оффлайн' },
  { value: 'online', label: 'Онлайн' },
  { value: 'call', label: 'Звонок' },
];

export default function MeetingForm({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('tasks.reminders');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isEdit = Boolean(id);
  const canManage = canWrite('crm.change_meeting');

  const loadMeeting = async () => {
    if (!isEdit || !canReadFeature) return;
    setLoading(true);
    setLoadError(false);
    try {
      const payload = await getMeeting(id);
      form.setFieldsValue({
        ...payload,
        start_at: payload?.start_at ? dayjs(payload.start_at) : null,
        end_at: payload?.end_at ? dayjs(payload.end_at) : null,
      });
    } catch {
      setLoadError(true);
      message.error('Не удалось загрузить встречу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const onSubmit = async (values) => {
    if (!canManage) {
      message.error('Недостаточно прав для изменения встреч');
      return;
    }

    const payload = {
      ...values,
      start_at: values.start_at ? values.start_at.toISOString() : null,
      end_at: values.end_at ? values.end_at.toISOString() : null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateMeeting(id, payload);
        message.success('Встреча обновлена');
      } else {
        await createMeeting(payload);
        message.success('Встреча создана');
      }
      navigate('/meetings');
    } catch (error) {
      message.error(error?.message || 'Не удалось сохранить встречу');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка встречи"
        description="Подготавливаем форму встречи для редактирования."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <BusinessScreenState
        variant="error"
        title="Не удалось загрузить встречу"
        description="Повторите загрузку или вернитесь к списку."
        actionLabel="Повторить"
        onAction={loadMeeting}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="tasks.reminders"
        description="Для доступа к форме встречи включите модуль Reminders в лицензии."
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/meetings"
      listButtonText="К списку встреч"
      description="У вас нет прав для создания или редактирования встреч."
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <BusinessFormHeader
          formId="meeting-form"
          title={isEdit ? 'Редактирование встречи' : 'Новая встреча'}
          subtitle="Синхронизируйте время, участников и outcome встречи с CRM."
          submitLabel={isEdit ? 'Сохранить' : 'Создать'}
          isSubmitting={saving}
          onBack={() => navigate('/meetings')}
        />

        <Card>
          <Form
            id="meeting-form"
            form={form}
            layout="vertical"
            initialValues={{
              status: 'scheduled',
              format: 'offline',
            }}
            onFinish={onSubmit}
          >
            <Form.Item name="subject" label="Тема" rules={[{ required: true, message: 'Введите тему встречи' }]}>
              <Input placeholder="Тема встречи" />
            </Form.Item>

            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={3} placeholder="Описание встречи" />
            </Form.Item>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="start_at" label="Начало" rules={[{ required: true, message: 'Укажите время начала' }]}>
                <DatePicker showTime format="DD.MM.YYYY HH:mm" />
              </Form.Item>
              <Form.Item name="end_at" label="Окончание">
                <DatePicker showTime format="DD.MM.YYYY HH:mm" />
              </Form.Item>
              <Form.Item name="format" label="Формат" style={{ minWidth: 180 }}>
                <Select options={formatOptions} />
              </Form.Item>
              <Form.Item name="status" label="Статус" style={{ minWidth: 180 }}>
                <Select options={statusOptions} />
              </Form.Item>
            </Space>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="company" label="Компания" style={{ minWidth: 260 }}>
                <EntitySelect
                  placeholder="Выберите компанию"
                  fetchOptions={getCompanies}
                  fetchById={getCompany}
                  optionLabel={(item) => item?.full_name || '-'}
                />
              </Form.Item>
              <Form.Item name="contact" label="Контакт" style={{ minWidth: 260 }}>
                <EntitySelect
                  placeholder="Выберите контакт"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                  optionLabel={(item) => item?.full_name || '-'}
                />
              </Form.Item>
              <Form.Item name="deal" label="Сделка" style={{ minWidth: 260 }}>
                <EntitySelect
                  placeholder="Выберите сделку"
                  fetchOptions={getDeals}
                  fetchById={getDeal}
                  optionLabel={(item) => item?.name || '-'}
                />
              </Form.Item>
            </Space>

            <Form.Item name="location" label="Локация / ссылка">
              <Input placeholder="Офис, Zoom, Meet..." />
            </Form.Item>

            <Form.Item name="attendees" label="Участники">
              <Input.TextArea rows={2} placeholder="Список участников" />
            </Form.Item>

            <Form.Item name="outcome" label="Итоги">
              <Input.TextArea rows={4} placeholder="Результат встречи и follow-up" />
            </Form.Item>

            <Space>
              <Button onClick={() => navigate('/meetings')}>Отмена</Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}
