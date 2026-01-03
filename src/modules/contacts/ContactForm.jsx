import React, { useEffect, useState } from 'react';
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
  Switch,
  DatePicker,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getContact, createContact, updateContact, getCompanies, getCompany, getUsers, getUser } from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';

const { Title } = Typography;
const { TextArea } = Input;

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
      form.setFieldsValue({
        ...contact,
        birth_date: contact.birth_date ? dayjs(contact.birth_date) : null,
        was_in_touch: contact.was_in_touch ? dayjs(contact.was_in_touch) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных контакта');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
      };
      if (isEdit) {
        await updateContact(id, payload);
        message.success('Контакт обновлен');
      } else {
        await createContact(payload);
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
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Имя"
                name="first_name"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Анна" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Отчество" name="middle_name">
                <Input placeholder="Сергеевна" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
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
              <Form.Item label="Должность" name="title">
                <Input placeholder="Менеджер" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Пол" name="sex">
                <Select placeholder="Выберите пол" allowClear>
                  <Select.Option value="M">Мужской</Select.Option>
                  <Select.Option value="F">Женский</Select.Option>
                  <Select.Option value="O">Другое</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата рождения" name="birth_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Контакты
          </Title>
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
              <Form.Item label="Доп. Email" name="secondary_email">
                <Input placeholder="anna.secondary@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Телефон"
                name="phone"
                rules={[{ required: true, message: 'Введите телефон' }]}
              >
                <Input placeholder="+7 999 111-22-33" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Доп. телефон" name="other_phone">
                <Input placeholder="+7 999 222-33-44" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Мобильный" name="mobile">
                <Input placeholder="+7 999 333-44-55" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Организация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Компания" name="company">
                <EntitySelect
                  placeholder="Выберите компанию"
                  fetchOptions={getCompanies}
                  fetchById={getCompany}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Источник" name="lead_source">
                <ReferenceSelect type="lead-sources" placeholder="Выберите источник" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Локация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Страна" name="country">
                <ReferenceSelect type="countries" placeholder="Выберите страну" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Город" name="city">
                <ReferenceSelect type="cities" placeholder="Выберите город" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Город (строкой)" name="city_name">
                <Input placeholder="Ташкент" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Регион/область" name="region">
                <Input placeholder="Ташкентская область" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Район" name="district">
                <Input placeholder="Юнусабадский район" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Адрес" name="address">
                <Input placeholder="г. Москва, ул. Ленина, д. 1" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Управление и теги
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <ReferenceSelect type="crm-tags" placeholder="Выберите теги" mode="multiple" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Токен" name="token">
                <Input placeholder="Авто" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Ответственный" name="owner">
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Отдел" name="department">
                <ReferenceSelect type="departments" placeholder="Выберите отдел" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Массовая рассылка" name="massmail" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дисквалифицирован" name="disqualified" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Последний контакт" name="was_in_touch">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительная информация
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Дополнительная информация о контакте" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
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
