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
  InputNumber,
  DatePicker,
  Switch,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getDeal, createDeal, updateDeal, getLead, getLeads, getContact, getContacts, getCompany, getCompanies, getUser, getUsers } from '../../lib/api/client';
import { getRequest } from '../../lib/api/requests';
import { getRequests } from '../../lib/api/requests';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';

const { Title } = Typography;
const { TextArea } = Input;

function DealForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadDeal();
    }
  }, [id]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const deal = await getDeal(id);
      form.setFieldsValue({
        ...deal,
        closing_date: deal.closing_date ? dayjs(deal.closing_date) : null,
        next_step_date: deal.next_step_date ? dayjs(deal.next_step_date) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных сделки');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = normalizePayload({
        ...values,
        amount: values.amount !== undefined && values.amount !== null && values.amount !== ''
          ? String(values.amount)
          : null,
        closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
        next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
      }, { preserveEmptyArrays: ['tags'] });

      if (isEdit) {
        await updateDeal(id, payload);
        message.success('Сделка обновлена');
      } else {
        await createDeal(payload);
        message.success('Сделка создана');
      }
      navigate('/deals');
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
      message.error(details?.detail || `Ошибка ${isEdit ? 'обновления' : 'создания'} сделки`);
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать сделку' : 'Создать новую сделку'}
      </Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название сделки"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Поставка оборудования" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Сумма сделки" name="amount">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="1500000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={(value) => value.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Валюта" name="currency">
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Стадия" name="stage">
                <ReferenceSelect type="stages" placeholder="Выберите стадию" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Вероятность (%)" name="probability">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата закрытия" name="closing_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Причина закрытия" name="closing_reason">
                <ReferenceSelect type="closing-reasons" placeholder="Выберите причину" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Следующий шаг"
                name="next_step"
                rules={[{ required: true, message: 'Введите следующий шаг' }]}
              >
                <Input placeholder="Согласовать коммерческое предложение" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Дата следующего шага"
                name="next_step_date"
                rules={[{ required: true, message: 'Выберите дату следующего шага' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Связанные записи
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
              <Form.Item label="Контакт" name="contact">
                <EntitySelect
                  placeholder="Выберите контакт"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Лид" name="lead">
                <EntitySelect
                  placeholder="Выберите лид"
                  fetchOptions={getLeads}
                  fetchById={getLead}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Запрос" name="request">
                <EntitySelect
                  placeholder="Выберите запрос"
                  fetchOptions={getRequests}
                  fetchById={getRequest}
                  optionLabel={(item) => item?.ticket || item?.description || `#${item?.id}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Контакт партнера" name="partner_contact">
                <EntitySelect
                  placeholder="Выберите контакт партнера"
                  fetchOptions={getContacts}
                  fetchById={getContact}
                  optionLabel={(item) => item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim()}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <ReferenceSelect type="crm-tags" placeholder="Выберите теги" mode="multiple" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            География и ответственные
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
              <Form.Item label="Ответственный" name="owner">
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Со-ответственный" name="co_owner">
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Отдел" name="department">
                <ReferenceSelect type="departments" placeholder="Выберите отдел" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Статус
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Активна" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Актуальна" name="relevant" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Важная" name="important" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Новая" name="is_new" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Напоминать" name="remind_me" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительная информация
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Детальное описание сделки" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/deals')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default DealForm;
