import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  App,
  Typography,
  Spin,
  Row,
  Col,
  Select,
  Switch,
  DatePicker,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getLead,
  createLead,
  updateLead,
  getCompanies,
  getCompany,
  getContacts,
  getContact,
  getUsers,
  getUser,
} from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { buildLeadPayload } from '../../lib/utils/leads';

const { Title } = Typography;
const { TextArea } = Input;

function LeadForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadLead();
    }
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const lead = await getLead(id);
      form.setFieldsValue({
        ...lead,
        birth_date: lead.birth_date ? dayjs(lead.birth_date) : null,
        was_in_touch: lead.was_in_touch ? dayjs(lead.was_in_touch) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных лида');
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = buildLeadPayload({
        ...values,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
      });

      if (isEdit) {
        await updateLead(id, payload);
        message.success('Лид обновлен');
      } else {
        await createLead(payload);
        message.success('Лид создан');
      }
      navigate('/leads');
    } catch (error) {
      const details = error?.details;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .filter(([, value]) => Array.isArray(value))
          .map(([name, errors]) => ({ name, errors: errors.map(String) }));
        if (fieldErrors.length) {
          form.setFields(fieldErrors);
          setSaving(false);
          return;
        }
      }
      message.error(details?.detail || `Ошибка ${isEdit ? 'обновления' : 'создания'} лида`);
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>{isEdit ? 'Редактировать лид' : 'Создать новый лид'}</Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Имя" name="first_name" rules={[{ required: true, message: 'Введите имя' }]}>
                <Input placeholder="Иван" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Отчество" name="middle_name">
                <Input placeholder="Иванович" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Фамилия" name="last_name">
                <Input placeholder="Иванов" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Должность" name="title">
                <Input placeholder="Директор" />
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
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Доп. Email" name="secondary_email">
                <Input placeholder="ivan.secondary@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Телефон" name="phone">
                <Input placeholder="+7 999 123-45-67" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Доп. телефон" name="other_phone">
                <Input placeholder="+7 999 111-22-33" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Мобильный" name="mobile">
                <Input placeholder="+7 999 333-44-55" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Компания
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Компания (из базы)" name="company">
                <EntitySelect
                  placeholder="Выберите компанию"
                  fetchOptions={getCompanies}
                  fetchById={getCompany}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Название компании" name="company_name">
                <Input placeholder="ООО «Технологии»" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Телефон компании" name="company_phone">
                <Input placeholder="+7 495 123-45-67" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Email компании" name="company_email">
                <Input placeholder="info@company.ru" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Сайт" name="website">
                <Input placeholder="https://company.ru" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Адрес компании" name="company_address">
            <Input placeholder="г. Москва, ул. Ленина, д. 1" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Тип компании" name="type">
                <ReferenceSelect type="client-types" placeholder="Выберите тип" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Отрасль" name="industry">
                <ReferenceSelect
                  type="industries"
                  placeholder="Выберите отрасли"
                  mode="multiple"
                  allowClear
                />
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
            Управление
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Источник" name="lead_source">
                <ReferenceSelect type="lead-sources" placeholder="Выберите источник" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <ReferenceSelect type="crm-tags" placeholder="Выберите теги" mode="multiple" allowClear />
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
            <Col xs={24} md={12}>
              <Form.Item label="Контакт" name="contact">
                <EntitySelect
                  placeholder="Выберите контакт"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Токен" name="token">
                <Input placeholder="Авто" />
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
            Дополнительно
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Дополнительная информация о лиде" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/leads')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LeadForm;
