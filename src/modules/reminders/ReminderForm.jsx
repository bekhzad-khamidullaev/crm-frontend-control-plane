/**
 * Reminder Form
 * Создание и редактирование напоминаний (API schema-aligned)
 */

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  DatePicker,
  Switch,
  InputNumber,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getReminder,
  createReminder,
  updateReminder,
} from '../../lib/api/reminders';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getUsers, getUser } from '../../lib/api';

const { Title } = Typography;
const { TextArea } = Input;

function ReminderForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadReminder();
    }
  }, [id]);

  const loadReminder = async () => {
    setLoading(true);
    try {
      const data = await getReminder(id);
      form.setFieldsValue({
        ...data,
        reminder_date: data.reminder_date ? dayjs(data.reminder_date) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки напоминания');
      console.error('Error loading reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        reminder_date: values.reminder_date ? values.reminder_date.toISOString() : null,
      };

      if (isEdit) {
        await updateReminder(id, payload);
        message.success('Напоминание обновлено');
      } else {
        await createReminder(payload);
        message.success('Напоминание создано');
      }
      navigate('/reminders');
    } catch (error) {
      message.error(isEdit ? 'Ошибка обновления напоминания' : 'Ошибка создания напоминания');
      console.error('Error saving reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Загрузка данных..." spinning={true}>
          <div style={{ minHeight: '200px' }}></div>
        </Spin>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reminders')}>
            Назад
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {isEdit ? 'Редактирование напоминания' : 'Новое напоминание'}
          </Title>
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            active: true,
            send_notification_email: false,
          }}
        >
          <Form.Item
            label="Тема"
            name="subject"
            rules={[{ required: true, message: 'Введите тему напоминания' }]}
          >
            <Input prefix={<BellOutlined />} placeholder="Например: Связаться с клиентом" />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={4} placeholder="Дополнительная информация" />
          </Form.Item>

          <Form.Item
            label="Дата и время напоминания"
            name="reminder_date"
            rules={[{ required: true, message: 'Выберите дату и время' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Выберите дату и время"
            />
          </Form.Item>

          <Space size="large" style={{ marginBottom: 16 }}>
            <Form.Item
              label="Активно"
              name="active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Email уведомление"
              name="send_notification_email"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item
            label="Владелец"
            name="owner"
          >
            <EntitySelect
              placeholder="Выберите пользователя"
              fetchList={getUsers}
              fetchById={getUser}
              allowClear
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item
              label="Content type ID"
              name="content_type"
              rules={[{ required: true, message: 'Укажите content type ID' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Например: 12" />
            </Form.Item>
            <Form.Item
              label="Object ID"
              name="object_id"
              rules={[{ required: true, message: 'Укажите object ID' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="ID связанного объекта" />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/reminders')}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ReminderForm;
