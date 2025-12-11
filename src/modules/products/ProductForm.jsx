/**
 * Product Form
 * Форма для создания и редактирования продуктов
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
  Switch,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import {
  getProduct,
  createProduct,
  updateProduct,
  getProductCategories,
} from '../../lib/api/products';
import { getCurrencies } from '../../lib/api/reference';
import ReferenceSelect from '../../components/ui-ReferenceSelect';

const { Title } = Typography;
const { TextArea } = Input;

function ProductForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data.results || data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await getProduct(id);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('Ошибка загрузки продукта');
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(id, values);
        message.success('Продукт обновлен');
      } else {
        await createProduct(values);
        message.success('Продукт создан');
      }
      navigate('/products');
    } catch (error) {
      message.error(isEdit ? 'Ошибка обновления продукта' : 'Ошибка создания продукта');
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/products');
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
            {isEdit ? 'Редактирование продукта' : 'Новый продукт'}
          </Title>
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            stock_quantity: 0,
            currency: 'RUB',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Название"
                name="name"
                rules={[{ required: true, message: 'Введите название продукта' }]}
              >
                <Input placeholder="Например: Ноутбук ASUS" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="SKU (артикул)"
                name="sku"
                rules={[{ required: true, message: 'Введите SKU' }]}
              >
                <Input placeholder="Например: ASUS-X550-001" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={4} placeholder="Описание продукта" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Цена"
                name="price"
                rules={[{ required: true, message: 'Введите цену' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Валюта"
                name="currency"
                rules={[{ required: true, message: 'Выберите валюту' }]}
              >
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Остаток на складе"
                name="stock_quantity"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Категория"
                name="category"
              >
                <ReferenceSelect 
                  type="product-categories" 
                  placeholder="Выберите категорию"
                  data={categories}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Единица измерения"
                name="unit"
              >
                <Input placeholder="шт, кг, л и т.д." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Активен"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
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

export default ProductForm;
