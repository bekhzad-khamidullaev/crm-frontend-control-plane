import React, { useEffect, useState } from 'react';
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
  DatePicker,
  Row,
  Col,
  Select,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getPayment, createPayment, updatePayment } from '../../lib/api/payments';
import { getDeal } from '../../lib/api/client';
import { getDeals } from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';

const { Title } = Typography;

const statusOptions = [
  { value: 'r', label: 'Получен' },
  { value: 'g', label: 'Гарантирован' },
  { value: 'h', label: 'Высокая вероятность' },
  { value: 'l', label: 'Низкая вероятность' },
];

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
            status: 'r',
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
              <Form.Item label="Валюта" name="currency">
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Статус"
                name="status"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select placeholder="Выберите статус" options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Дата платежа" name="payment_date">
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="Выберите дату" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Сделка"
                name="deal"
                rules={[{ required: true, message: 'Выберите сделку' }]}
              >
                <EntitySelect
                  placeholder="Выберите сделку"
                  fetchOptions={getDeals}
                  fetchById={getDeal}
                  optionLabel={(item) => item?.name || `#${item?.id}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Номер договора" name="contract_number">
                <Input placeholder="Договор №" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Номер счета" name="invoice_number">
                <Input placeholder="Счет №" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Номер заказа" name="order_number">
                <Input placeholder="Заказ №" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
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
