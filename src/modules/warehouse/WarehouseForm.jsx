import { App, Button, Card, Form, Input, InputNumber, Select, Space } from 'antd';
import { useEffect, useState } from 'react';

import { BusinessFormHeader } from '../../components/business/BusinessFormHeader';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';
import {
  createWarehouseItem,
  getWarehouseItem,
  updateWarehouseItem,
} from '../../lib/api/warehouseItems.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';

const statusOptions = [
  { value: 'active', label: 'Активный' },
  { value: 'archived', label: 'Архив' },
];

export default function WarehouseForm({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('inventory.lite');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isEdit = Boolean(id);
  const canManage = canWrite('crm.change_warehouseitem');

  const loadItem = async () => {
    if (!isEdit || !canReadFeature) return;
    setLoading(true);
    setLoadError(false);
    try {
      const payload = await getWarehouseItem(id);
      form.setFieldsValue(payload);
    } catch {
      setLoadError(true);
      message.error('Не удалось загрузить позицию');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const onSubmit = async (values) => {
    if (!canManage) {
      message.error('Недостаточно прав для изменения склада');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateWarehouseItem(id, values);
        message.success('Позиция обновлена');
      } else {
        await createWarehouseItem(values);
        message.success('Позиция создана');
      }
      navigate('/warehouse');
    } catch (error) {
      message.error(error?.message || 'Не удалось сохранить позицию');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка позиции"
        description="Подготавливаем форму складской позиции для редактирования."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <BusinessScreenState
        variant="error"
        title="Не удалось загрузить позицию"
        description="Повторите загрузку или вернитесь к списку."
        actionLabel="Повторить"
        onAction={loadItem}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="inventory.lite"
        description="Для доступа к карточке складской позиции включите модуль Inventory Lite в лицензии."
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/warehouse"
      listButtonText="К списку склада"
      description="У вас нет прав для создания или редактирования складских позиций."
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <BusinessFormHeader
          formId="warehouse-form"
          title={isEdit ? 'Редактирование складской позиции' : 'Новая складская позиция'}
          subtitle="Ведите остатки и статусы позиций в едином каталоге склада."
          submitLabel={isEdit ? 'Сохранить' : 'Создать'}
          isSubmitting={saving}
          onBack={() => navigate('/warehouse')}
        />

        <Card>
          <Form
            id="warehouse-form"
            form={form}
            layout="vertical"
            initialValues={{
              status: 'active',
              quantity: 0,
              min_quantity: 0,
              unit_cost: 0,
              unit: 'pcs',
            }}
            onFinish={onSubmit}
          >
            <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
              <Input placeholder="Название позиции" />
            </Form.Item>

            <Form.Item name="sku" label="SKU">
              <Input placeholder="Артикул" />
            </Form.Item>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="category" label="Категория" style={{ minWidth: 220 }}>
                <Input placeholder="Категория" />
              </Form.Item>
              <Form.Item name="location" label="Локация" style={{ minWidth: 220 }}>
                <Input placeholder="Склад / ячейка" />
              </Form.Item>
              <Form.Item name="unit" label="Ед. изм." style={{ minWidth: 140 }}>
                <Input placeholder="pcs" />
              </Form.Item>
            </Space>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="quantity" label="Количество" style={{ minWidth: 200 }}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="min_quantity" label="Мин. остаток" style={{ minWidth: 200 }}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="unit_cost" label="Себестоимость" style={{ minWidth: 220 }}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="status" label="Статус" style={{ minWidth: 180 }}>
                <Select options={statusOptions} />
              </Form.Item>
            </Space>

            <Form.Item name="note" label="Комментарий">
              <Input.TextArea rows={4} placeholder="Комментарий по позиции" />
            </Form.Item>

            <Space>
              <Button onClick={() => navigate('/warehouse')}>Отмена</Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}
