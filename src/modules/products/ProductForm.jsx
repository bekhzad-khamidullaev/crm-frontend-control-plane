import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Card,
  App,
  Row,
  Col,
  InputNumber,
  Switch,
  Select,
} from 'antd';
import { navigate } from '../../router';
import { getProduct, createProduct, updateProduct, getProductCategories, getProductCategory } from '../../lib/api/products';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';
import { EntityFormSection, EntityFormShell, LegacyErrorState, LegacyLoadingState } from '../../shared/ui';
const { TextArea } = Input;

const typeOptions = [
  { value: 'G', label: 'Товар' },
  { value: 'S', label: 'Услуга' },
];

function ProductForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const formId = 'product-form';

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getProduct(id);
      form.setFieldsValue(data);
    } catch (error) {
      setLoadError(true);
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
      <LegacyLoadingState
        title="Загрузка продукта"
        description="Подготавливаем форму редактирования продукта."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <LegacyErrorState
        title="Не удалось загрузить продукт для редактирования"
        description="Попробуйте повторить загрузку или вернитесь к каталогу продуктов."
        onAction={loadProduct}
      />
    );
  }

  return (
    <EntityFormShell
      title={isEdit ? 'Редактировать продукт' : 'Новый продукт'}
      subtitle="Настройка карточки товара или услуги в едином CRM-паттерне."
      hint="Сначала заполните коммерчески важные поля: название, цену, категорию и тип продукта."
      formId={formId}
      submitText={isEdit ? 'Сохранить продукт' : 'Создать продукт'}
      isSubmitting={saving}
      onBack={() => navigate('/products')}
      onCancel={() => navigate('/products')}
    >
      <Card>
        <Form id={formId} form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <EntityFormSection
            title="Основное"
            description="Базовые данные, по которым продукт будет найден и использован в сделках."
          />
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

          <EntityFormSection
            title="Коммерческие параметры"
            description="Цена, валюта и тип определяют, как продукт выглядит в каталоге и расчётах."
          />
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

        </Form>
      </Card>
    </EntityFormShell>
  );
}

export default ProductForm;
