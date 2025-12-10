/**
 * Payment Form
 * Форма для создания и редактирования платежей
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getPayment,
  createPayment,
  updatePayment,
} from '../../lib/api/payments';
import ReferenceSelect from '../../components/ui-ReferenceSelect';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function PaymentForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadPayment();
    }
  }, [id]);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const data = await getPayment(id);
      form.setFieldsValue({
        ...data,
        payment_date: data.payment_date ? dayjs(data.payment_date) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки платежа');
      console.error('Error loading payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updatePayment(id, payload);
        message.success('Платеж обновлен');
      } else {
        await createPayment(payload);
        message.success('Платеж создан');
      }
      navigate('/payments');
    } catch (error) {
      message.error(isEdit ? 'Ошибка обновления платежа' : 'Ошибка создания платежа');
      console.error('Error saving payment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/payments');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Загрузка данных...">
          <div style={{ padding: '20px' }}></div>
        </Spin>
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
            {isEdit ? 'Редактирование платежа' : 'Новый платеж'}
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
            payment_method: 'bank_transfer',
            currency: 'RUB',
            payment_date: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Сумма"
                name="amount"
                rules={[{ required: true, message: 'Введите сумму' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix={<DollarOutlined />}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Валюта"
                name="currency"
                rules={[{ required: true, message: 'Выберите валюту' }]}
              >
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Способ оплаты"
                name="payment_method"
                rules={[{ required: true, message: 'Выберите способ оплаты' }]}
              >
                <Select placeholder="Выберите способ">
                  <Option value="cash">Наличные</Option>
                  <Option value="bank_transfer">Банковский перевод</Option>
                  <Option value="card">Банковская карта</Option>
                  <Option value="online">Онлайн-платеж</Option>
                  <Option value="check">Чек</Option>
                  <Option value="other">Другое</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Статус"
                name="status"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select placeholder="Выберите статус">
                  <Option value="pending">Ожидает</Option>
                  <Option value="completed">Завершен</Option>
                  <Option value="failed">Неудачный</Option>
                  <Option value="refunded">Возвращен</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Дата платежа"
            name="payment_date"
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              placeholder="Выберите дату"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ID сделки"
                name="deal"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Необязательно"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ID контакта"
                name="contact"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Необязательно"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={3} placeholder="Дополнительная информация о платеже" />
          </Form.Item>

          <Form.Item
            label="ID транзакции"
            name="transaction_id"
          >
            <Input placeholder="Внешний ID транзакции (необязательно)" />
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

export default PaymentForm;
