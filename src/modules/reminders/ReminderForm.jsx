/**
 * Reminder Form
 * Форма для создания и редактирования напоминаний
 */

import React, { useState, useEffect } from 'react';
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
  Select,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getReminder,
  createReminder,
  updateReminder,
} from '../../lib/api/reminders';
import { getUsers } from '../../lib/api/user';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function ReminderForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    loadUsers();
    if (isEdit) {
      loadReminder();
    }
  }, [id]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.results || data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadReminder = async () => {
    setLoading(true);
    try {
      const data = await getReminder(id);
      form.setFieldsValue({
        ...data,
        remind_at: data.remind_at ? dayjs(data.remind_at) : null,
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
        remind_at: values.remind_at ? values.remind_at.toISOString() : null,
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

  const handleBack = () => {
    navigate('/reminders');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Загрузка данных..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
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
            status: 'pending',
            reminder_type: 'in_app',
          }}
        >
          <Form.Item
            label="Заголовок"
            name="title"
            rules={[{ required: true, message: 'Введите заголовок' }]}
          >
            <Input 
              prefix={<BellOutlined />} 
              placeholder="Например: Позвонить клиенту" 
            />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={4} placeholder="Дополнительная информация" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Дата и время напоминания"
                name="remind_at"
                rules={[{ required: true, message: 'Выберите дату и время' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Выберите дату и время"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Назначить пользователю"
                name="user"
                rules={[{ required: true, message: 'Выберите пользователя' }]}
              >
                <Select placeholder="Выберите пользователя" showSearch>
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Тип напоминания"
                name="reminder_type"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <Select placeholder="Выберите тип">
                  <Option value="email">Email</Option>
                  <Option value="push">Push уведомление</Option>
                  <Option value="in_app">В приложении</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Статус"
                name="status"
              >
                <Select placeholder="Выберите статус">
                  <Option value="pending">Ожидает</Option>
                  <Option value="completed">Завершено</Option>
                  <Option value="cancelled">Отменено</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="ID связанного лида"
            name="related_lead"
          >
            <Input type="number" placeholder="Необязательно" />
          </Form.Item>

          <Form.Item
            label="ID связанного контакта"
            name="related_contact"
          >
            <Input type="number" placeholder="Необязательно" />
          </Form.Item>

          <Form.Item
            label="ID связанной сделки"
            name="related_deal"
          >
            <Input type="number" placeholder="Необязательно" />
          </Form.Item>

          <Form.Item
            label="ID связанной задачи"
            name="related_task"
          >
            <Input type="number" placeholder="Необязательно" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={handleBack}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ReminderForm;
