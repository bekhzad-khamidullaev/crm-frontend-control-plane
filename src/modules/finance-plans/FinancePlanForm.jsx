import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Form, Input, InputNumber, Result, Select, Skeleton, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';
import ReferenceSelect from '../../components/ReferenceSelect.jsx';
import {
  createFinancePlan,
  getFinancePlan,
  updateFinancePlan,
} from '../../lib/api/financePlans.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';

const statusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'approved', label: 'Согласован' },
  { value: 'closed', label: 'Закрыт' },
];

export default function FinancePlanForm({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('billing.invoicing');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isEdit = Boolean(id);
  const canManage = canWrite('crm.change_financeplan');

  const loadPlan = async () => {
    if (!isEdit || !canReadFeature) return;
    setLoading(true);
    setLoadError(false);
    try {
      const payload = await getFinancePlan(id);
      form.setFieldsValue({
        ...payload,
        period_month: payload?.period_month ? dayjs(payload.period_month) : null,
      });
    } catch {
      setLoadError(true);
      message.error('Не удалось загрузить финплан');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const onSubmit = async (values) => {
    if (!canManage) {
      message.error('Недостаточно прав для изменения финплана');
      return;
    }

    const payload = {
      ...values,
      period_month: values.period_month ? values.period_month.format('YYYY-MM-DD') : null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateFinancePlan(id, payload);
        message.success('Финплан обновлен');
      } else {
        await createFinancePlan(payload);
        message.success('Финплан создан');
      }
      navigate('/finance-planning');
    } catch (error) {
      message.error(error?.message || 'Не удалось сохранить финплан');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить финплан"
        extra={[
          <Button key="retry" onClick={loadPlan}>Повторить</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/finance-planning')}>К списку</Button>,
        ]}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="billing.invoicing"
        description="Для доступа к форме финплана включите модуль Invoicing в лицензии."
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/finance-planning"
      listButtonText="К списку финпланов"
      description="У вас нет прав для создания или редактирования финплана."
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/finance-planning')}>
          Назад
        </Button>

        <Card title={isEdit ? 'Редактирование финплана' : 'Новый финплан'}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: 'draft',
              planned_income: 0,
              planned_expense: 0,
              actual_income: 0,
              actual_expense: 0,
            }}
            onFinish={onSubmit}
          >
            <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
              <Input placeholder="Финансовый план Q2 2026" />
            </Form.Item>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="period_month" label="Период (месяц)" rules={[{ required: true, message: 'Выберите период' }]}>
                <DatePicker picker="month" format="MM.YYYY" />
              </Form.Item>
              <Form.Item name="status" label="Статус" style={{ minWidth: 180 }}>
                <Select options={statusOptions} />
              </Form.Item>
              <Form.Item name="currency" label="Валюта" style={{ minWidth: 220 }}>
                <ReferenceSelect type="currencies" placeholder="Выберите валюту" />
              </Form.Item>
            </Space>

            <Space style={{ width: '100%' }} align="start" wrap>
              <Form.Item name="planned_income" label="План дохода" style={{ minWidth: 220 }}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="planned_expense" label="План расхода" style={{ minWidth: 220 }}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="actual_income" label="Факт дохода" style={{ minWidth: 220 }}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="actual_expense" label="Факт расхода" style={{ minWidth: 220 }}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Space>

            <Form.Item name="comment" label="Комментарий">
              <Input.TextArea rows={4} placeholder="Комментарий по плану" />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/finance-planning')}>Отмена</Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}
