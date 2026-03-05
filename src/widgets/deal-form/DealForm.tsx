import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  App,
  Typography,
  Row,
  Col,
  Switch,
  DatePicker,
  Spin,
  InputNumber,
  Grid,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateDeal, useUpdateDeal } from '@/entities/deal/api/mutations';
import { useDeal as useDealQuery } from '@/entities/deal/api/queries';
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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

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

  const onFinish = async (values: any) => {
    try {
      const payload: any = {
        ...values,
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
      if (error?.body?.details) {
        const fields = Object.entries(error.body.details).map(([name, errors]: [string, any]) => ({
          name,
          errors: Array.isArray(errors) ? errors : [errors],
        }));
        form.setFields(fields);
      }
      message.error(isEdit ? 'Ошибка обновления' : 'Ошибка создания');
    }
  };

  if (isEdit && isLoadingDeal) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')} block={isMobile}>
          Назад
        </Button>
      </Space>

      <Title level={isMobile ? 3 : 2}>{isEdit ? 'Редактировать сделку' : 'Создать новую сделку'}</Title>

      <Card>
        <Form
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
              <Form.Item label="Дата" name="next_step_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
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

          <Form.Item>
            <Space wrap style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending || updateMutation.isPending}
                block={isMobile}
              >
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/deals')} block={isMobile}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
