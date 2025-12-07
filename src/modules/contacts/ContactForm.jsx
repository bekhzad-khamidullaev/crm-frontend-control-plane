import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getContact, createContact, updateContact } from '../../lib/api/client';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function ContactForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadContact();
    }
  }, [id]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const contact = await getContact(id);
      form.setFieldsValue(contact);
    } catch (error) {
      message.error('Ошибка загрузки данных контакта');
      // Mock data for demo
      form.setFieldsValue({
        first_name: 'Анна',
        last_name: 'Смирнова',
        email: 'anna@example.com',
        phone: '+7 999 111-22-33',
        company: 'ООО "Альфа"',
        position: 'Менеджер',
        type: 'client',
        address: 'г. Москва, ул. Ленина, д. 1',
        website: 'https://example.com',
        notes: 'Постоянный клиент',
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateContact(id, values);
        message.success('Контакт обновлен');
      } else {
        await createContact(values);
        message.success('Контакт создан');
      }
      navigate('/contacts');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} контакта`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать контакт' : 'Создать новый контакт'}
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Имя"
                name="first_name"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Анна" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Фамилия"
                name="last_name"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input placeholder="Смирнова" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Некорректный email' },
                ]}
              >
                <Input placeholder="anna@example.com" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Телефон"
                name="phone"
                rules={[{ required: true, message: 'Введите телефон' }]}
              >
                <Input placeholder="+7 999 111-22-33" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Организация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Компания" name="company">
                <Input placeholder="ООО «Альфа»" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Должность" name="position">
                <Input placeholder="Менеджер" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Тип контакта"
                name="type"
                rules={[{ required: true, message: 'Выберите тип' }]}
                initialValue="client"
              >
                <Select placeholder="Выберите тип">
                  <Option value="client">Клиент</Option>
                  <Option value="partner">Партнер</Option>
                  <Option value="supplier">Поставщик</Option>
                  <Option value="employee">Сотрудник</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Веб-сайт" name="website">
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительная информация
          </Title>

          <Form.Item label="Адрес" name="address">
            <Input placeholder="г. Москва, ул. Ленина, д. 1" />
          </Form.Item>

          <Form.Item label="Заметки" name="notes">
            <TextArea rows={4} placeholder="Дополнительная информация о контакте" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/contacts')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ContactForm;
