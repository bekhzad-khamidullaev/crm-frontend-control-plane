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
  Switch,
  Select,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getProduct, createProduct, updateProduct, getProductCategories, getProductCategory } from '../../lib/api/products';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';

const { Title } = Typography;
const { TextArea } = Input;

const typeOptions = [
  { value: 'G', label: 'Товар' },
  { value: 'S', label: 'Услуга' },
];

function ProductForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await getProduct(id);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('Ошибка загрузки продукта');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = normalizePayload({
        ...values,
        price:
          values.price !== undefined && values.price !== null && values.price !== ''
            ? String(values.price)
            : null,
      });
      if (isEdit) {
        await updateProduct(id, payload);
        message.success('Продукт обновлен');
      } else {
        await createProduct(payload);
        message.success('Продукт создан');
      }
      navigate('/products');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} продукта`);
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать продукт' : 'Создать новый продукт'}
      </Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Например: Ноутбук ASUS" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Категория" name="product_category">
                <EntitySelect
                  placeholder="Выберите категорию"
                  fetchOptions={getProductCategories}
                  fetchById={getProductCategory}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Описание продукта" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Цена" name="price">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Валюта" name="currency">
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Тип" name="type">
                <Select placeholder="Выберите тип" options={typeOptions} allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="В продаже" name="on_sale" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/products')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ProductForm;
