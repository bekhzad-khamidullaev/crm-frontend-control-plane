import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { App, Button, Card, Col, Form, Input, InputNumber, Result, Row, Select, Skeleton, Space, Switch, Typography } from 'antd';
import { navigate } from '../../router';
import { getProduct, createProduct, updateProduct, getProductCategories, getProductCategory } from '../../lib/api/products';
import { canWrite } from '../../lib/rbac';
import ReferenceSelect from '../../components/ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import { normalizePayload } from '../../lib/utils/payload';

const { TextArea } = Input;
const { Title, Text } = Typography;

const typeOptions = [
  { value: 'G', label: 'Товар' },
  { value: 'S', label: 'Услуга' },
];

const normalizeTypeValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
};

function ProductForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('crm.change_product');

  useEffect(() => {
    if (isEdit) loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getProduct(id);
      form.setFieldsValue({
        ...data,
        type: normalizeTypeValue(data?.type),
      });
    } catch {
      setLoadError(true);
      message.error('Ошибка загрузки продукта');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (!canManage) {
      message.error('Недостаточно прав для изменения продуктов');
      return;
    }
    setSaving(true);
    try {
      const payload = normalizePayload({
        ...values,
        type: normalizeTypeValue(values?.type),
        price: values.price !== undefined && values.price !== null && values.price !== '' ? String(values.price) : null,
      });

      if (isEdit) {
        await updateProduct(id, payload);
        message.success('Продукт обновлен');
      } else {
        await createProduct(payload);
        message.success('Продукт создан');
      }
      navigate('/products');
    } catch {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} продукта`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить продукт для редактирования"
        subTitle="Попробуйте повторить загрузку или вернитесь к каталогу продуктов"
        extra={<Button onClick={loadProduct}>Повторить</Button>}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/products"
      listButtonText="К каталогу продуктов"
      description="У вас нет прав для создания или редактирования продуктов."
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/products')} icon={<ArrowLeft size={16} />}>Назад</Button>
          <Space>
            <Button onClick={() => navigate('/products')}>Отмена</Button>
            {canManage && (
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                {isEdit ? 'Сохранить продукт' : 'Создать продукт'}
              </Button>
            )}
          </Space>
        </Space>

        <Card>
          <Title level={3} style={{ marginTop: 0 }}>{isEdit ? 'Редактировать продукт' : 'Новый продукт'}</Title>
          <Text type="secondary">Настройка карточки товара или услуги</Text>
        </Card>

        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Title level={5} style={{ marginTop: 0 }}>Основное</Title>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
                  <Input placeholder="Например: Ноутбук ASUS" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Категория" name="product_category">
                  <EntitySelect placeholder="Выберите категорию" fetchOptions={getProductCategories} fetchById={getProductCategory} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Описание" name="description">
              <TextArea rows={4} placeholder="Описание продукта" />
            </Form.Item>

            <Title level={5}>Коммерческие параметры</Title>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="Цена" name="price">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
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
          </Form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}

export default ProductForm;
