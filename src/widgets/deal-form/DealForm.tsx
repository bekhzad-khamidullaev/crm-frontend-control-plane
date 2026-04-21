import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  App,
  Modal,
  Typography,
  Row,
  Col,
  Switch,
  DatePicker,
  InputNumber,
} from 'antd';
import { BusinessFormHeader } from '@/components/business/BusinessFormHeader';
import dayjs from 'dayjs';
import { BusinessScreenState } from '@/components/business/BusinessScreenState';
import { useCreateDeal, useUpdateDeal } from '@/entities/deal/api/mutations';
import { useDeal as useDealQuery } from '@/entities/deal/api/queries';
import { getApiErrorPayload } from '@/lib/api/error-utils';
// @ts-ignore
import { navigate } from '@/router.js';

import {
  StageSelect,
  CurrencySelect,
  ClosingReasonSelect,
  CountrySelect,
  CitySelect,
  DepartmentSelect,
  TagSelect,
  UserSelect,
  CompanySelect,
  ContactSelect,
  LeadSelect,
} from '@/features/reference';

const { Title } = Typography;
const { TextArea } = Input;

interface DealFormProps {
  id?: number;
}

export const DealForm: React.FC<DealFormProps> = ({ id }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!id;

  const { data: deal, isLoading: isLoadingDeal } = useDealQuery(id!, !!id);
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();

  useEffect(() => {
    if (deal) {
      form.setFieldsValue({
        ...deal,
        closing_date: deal.closing_date ? dayjs(deal.closing_date) : null,
        next_step_date: deal.next_step_date ? dayjs(deal.next_step_date) : null,
      });
    }
  }, [deal, form]);

  const handleLeave = () => {
    if (!form.isFieldsTouched()) {
      navigate('/deals');
      return;
    }

    Modal.confirm({
      title: 'Есть несохраненные изменения',
      content: 'Выйти без сохранения?',
      okText: 'Выйти',
      cancelText: 'Остаться',
      okButtonProps: { danger: true },
      onOk: () => navigate('/deals'),
    });
  };

  const normalizeErrorMessage = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(' ');
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  const isPastDate = (value: dayjs.Dayjs | null) =>
    Boolean(value && value.isBefore(dayjs().startOf('day'), 'day'));

  const applyServerErrors = (error: any) => {
    const details = getApiErrorPayload(error);
    if (!details || typeof details !== 'object') return false;

    const fields: Array<{ name: string; errors: string[] }> = [];
    let surfacedGlobalError = false;

    Object.entries(details).forEach(([name, value]) => {
      const errorMessage = normalizeErrorMessage(value);
      if (!errorMessage) return;

      if (name === 'detail' || name === 'non_field_errors') {
        surfacedGlobalError = true;
        message.error(errorMessage);
        return;
      }

      fields.push({
        name,
        errors: [errorMessage],
      });
    });

    if (fields.length > 0) {
      form.setFields(fields);
      return true;
    }

    return surfacedGlobalError;
  };

  const onFinish = async (values: any) => {
    try {
      const payload: any = {
        ...values,
        amount:
          values.amount !== undefined && values.amount !== null && values.amount !== ''
            ? String(values.amount)
            : null,
        closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
        next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
        // Enforce null if empty for relations
        company: values.company || null,
        contact: values.contact || null,
        lead: values.lead || null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/deals');
      message.success(isEdit ? 'Сделка обновлена' : 'Сделка создана');
    } catch (error: any) {
      if (!applyServerErrors(error)) {
        message.error(isEdit ? 'Ошибка обновления' : 'Ошибка создания');
      }
    }
  };

  if (isEdit && isLoadingDeal) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка сделки"
        description="Подготавливаем карточку сделки к редактированию."
      />
    );
  }

  if (isEdit && !deal) {
    return (
      <BusinessScreenState
        variant="notFound"
        title="Сделка не найдена"
        actionLabel="К сделкам"
        onAction={() => navigate('/deals')}
      />
    );
  }

  return (
    <div>
      <BusinessFormHeader
        formId="deal-form"
        title={isEdit ? 'Редактировать сделку' : 'Создать новую сделку'}
        subtitle="Держите следующую активность и связи сделки в актуальном состоянии."
        submitLabel={isEdit ? 'Сохранить изменения' : 'Создать сделку'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onBack={handleLeave}
      />

      <Card>
        <Form
          id="deal-form"
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            active: true,
            relevant: true,
            is_new: true,
          }}
        >
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название сделки"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Поставка оборудования..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Сумма" name="amount">
                <InputNumber style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Валюта" name="currency">
                <CurrencySelect />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Стадия" name="stage">
                <StageSelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Вероятность (%)" name="probability">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дата закрытия" name="closing_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Причина закрытия" name="closing_reason">
                <ClosingReasonSelect />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Следующий шаг
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Действие"
                name="next_step"
                rules={[{ required: true, message: 'Укажите следующий шаг' }]}
              >
                <Input placeholder="Позвонить клиенту..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Дата"
                name="next_step_date"
                rules={[
                  { required: true, message: 'Выберите дату следующего шага' },
                  {
                    validator: async (_, value) => {
                      if (value && isPastDate(value)) {
                        throw new Error('Дата следующего шага не может быть в прошлом');
                      }
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  disabledDate={(current) => isPastDate(current)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Связи
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Компания" name="company">
                <CompanySelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Контакт" name="contact">
                <ContactSelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Лид" name="lead">
                <LeadSelect />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <TagSelect mode="multiple" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Ответственные и Локация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Ответственный" name="owner">
                <UserSelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Со-ответственный" name="co_owner">
                <UserSelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Отдел" name="department">
                <DepartmentSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Страна" name="country">
                <CountrySelect />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item noStyle shouldUpdate={(prev, current) => prev.country !== current.country}>
                {({ getFieldValue }) => (
                  <Form.Item label="Город" name="city">
                    <CitySelect
                      countryId={getFieldValue('country')}
                      disabled={!getFieldValue('country')}
                    />
                  </Form.Item>
                )}
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
              <Form.Item label="Новая" name="is_new" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительно
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} />
          </Form.Item>

        </Form>
      </Card>
    </div>
  );
};
