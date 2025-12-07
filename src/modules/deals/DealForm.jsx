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
  InputNumber,
  DatePicker,
  Slider,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeal, createDeal, updateDeal } from '../../lib/api/client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function DealForm({ id }) {
  const [form] = Form.useForm();
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
      // Convert date strings to dayjs objects
      if (deal.expected_close_date) {
        deal.expected_close_date = dayjs(deal.expected_close_date);
      }
      form.setFieldsValue(deal);
    } catch (error) {
      message.error('Ошибка загрузки данных сделки');
      // Mock data for demo
      form.setFieldsValue({
        title: 'Поставка оборудования',
        amount: 1500000,
        stage: 'negotiation',
        probability: 70,
        expected_close_date: dayjs('2024-03-15'),
        contact_id: '1',
        company_id: '1',
        description: 'Поставка промышленного оборудования для производственной линии',
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      // Convert dayjs to ISO string
      const payload = {
        ...values,
        expected_close_date: values.expected_close_date
          ? values.expected_close_date.format('YYYY-MM-DD')
          : null,
      };

      if (isEdit) {
        await updateDeal(id, payload);
        message.success('Сделка обновлена');
      } else {
        await createDeal(payload);
        message.success('Сделка создана');
      }
      navigate('/deals');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} сделки`);
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
                label="Название сделки"
                name="title"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Поставка оборудования" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Сумма сделки (₽)"
                name="amount"
                rules={[{ required: true, message: 'Введите сумму' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="1500000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }
                  parser={(value) => value.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Стадия"
                name="stage"
                rules={[{ required: true, message: 'Выберите стадию' }]}
                initialValue="lead"
              >
                <Select placeholder="Выберите стадию">
                  <Option value="lead">Лид</Option>
                  <Option value="qualification">Квалификация</Option>
                  <Option value="meeting">Встреча</Option>
                  <Option value="proposal">Предложение</Option>
                  <Option value="negotiation">Переговоры</Option>
                  <Option value="closed_won">Выиграна</Option>
                  <Option value="closed_lost">Проиграна</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Ожидаемая дата закрытия"
                name="expected_close_date"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Вероятность закрытия (%)"
            name="probability"
            rules={[{ required: true, message: 'Укажите вероятность' }]}
            initialValue={50}
          >
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>
            Связанные записи
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Компания"
                name="company_id"
                rules={[{ required: true, message: 'Выберите компанию' }]}
              >
                <Select placeholder="Выберите компанию" showSearch>
                  <Option value="1">ООО "ТехноПром"</Option>
                  <Option value="2">АО "Инновации"</Option>
                  <Option value="3">ИП Козлов</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Контактное лицо"
                name="contact_id"
                rules={[{ required: true, message: 'Выберите контакт' }]}
              >
                <Select placeholder="Выберите контакт" showSearch>
                  <Option value="1">Иван Петров</Option>
                  <Option value="2">Мария Сидорова</Option>
                  <Option value="3">Дмитрий Козлов</Option>
                </Select>
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
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
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
