import dayjs from 'dayjs';
import { App, Button, DatePicker, Form, Input, Modal, Select, Space, Switch, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createReminder, getReminderContentTypes } from '../../lib/api/reminders.js';

const { Text } = Typography;

const ENTITY_ALIASES = {
  lead: ['lead', 'leads', 'crm.lead'],
  contact: ['contact', 'contacts', 'crm.contact'],
  deal: ['deal', 'deals', 'crm.deal'],
  company: ['company', 'companies', 'crm.company'],
};

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveContentTypeId(entityType, contentTypes = []) {
  const aliases = ENTITY_ALIASES[entityType] || [entityType];
  const normalizedAliases = aliases.map(normalizeToken);
  const found = contentTypes.find((item) => {
    const haystack = [item?.key, item?.model, item?.label]
      .map(normalizeToken)
      .join(' ');
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });
  return found?.id || null;
}

export default function QuickReminderModal({
  open,
  onClose,
  onCreated,
  entityType,
  entityId,
  entityLabel,
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [contentTypes, setContentTypes] = useState([]);

  const resolvedContentTypeId = useMemo(
    () => resolveContentTypeId(entityType, contentTypes),
    [contentTypes, entityType],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTypes(true);
    getReminderContentTypes()
      .then((response) => {
        if (cancelled) return;
        const results = Array.isArray(response?.results) ? response.results : [];
        setContentTypes(results);
      })
      .catch(() => {
        if (cancelled) return;
        setContentTypes([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const title = entityLabel ? `Напоминание: ${entityLabel}` : 'Быстрое напоминание';
    form.setFieldsValue({
      subject: title,
      description: '',
      reminder_date: dayjs().add(1, 'hour'),
      send_notification_email: false,
      active: true,
    });
  }, [entityLabel, form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!resolvedContentTypeId || !entityId) {
        message.error('Не удалось определить тип объекта для напоминания');
        return;
      }
      setSubmitting(true);
      await createReminder({
        subject: values.subject,
        description: values.description || '',
        reminder_date: values.reminder_date.toISOString(),
        send_notification_email: Boolean(values.send_notification_email),
        active: Boolean(values.active),
        content_type: resolvedContentTypeId,
        object_id: Number(entityId),
      });
      message.success('Напоминание создано');
      onCreated?.();
      onClose?.();
    } catch (error) {
      if (!error?.errorFields) {
        message.error('Не удалось создать напоминание');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Быстрое создание напоминания"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Создать"
      cancelText="Отмена"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary">
          Объект: {entityType} #{entityId}
        </Text>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Тема"
            name="subject"
            rules={[{ required: true, message: 'Введите тему напоминания' }]}
          >
            <Input placeholder="Например: Перезвонить клиенту" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} placeholder="Коротко, что нужно сделать" />
          </Form.Item>
          <Form.Item
            label="Дата и время"
            name="reminder_date"
            rules={[{ required: true, message: 'Выберите дату и время' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>
          <Form.Item label="Параметры" style={{ marginBottom: 0 }}>
            <Space wrap>
              <Form.Item name="send_notification_email" valuePropName="checked" noStyle>
                <Switch checkedChildren="Email вкл" unCheckedChildren="Email выкл" />
              </Form.Item>
              <Form.Item name="active" valuePropName="checked" noStyle>
                <Switch checkedChildren="Активно" unCheckedChildren="Пауза" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="Тип объекта">
            <Select
              value={resolvedContentTypeId}
              disabled
              loading={loadingTypes}
              options={contentTypes.map((item) => ({ value: item.id, label: item.label || item.model || item.key }))}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}
