import React, { useState, useEffect } from 'react';
import { Form, Input, Card, message, DatePicker, Row, Col, Switch, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { BusinessFormHeader } from '../../components/business/BusinessFormHeader';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';
import { getCampaign, createCampaign, updateCampaign, getSegments, getSegment, getTemplates, getTemplate } from '../../lib/api/marketing';
import { canWrite } from '../../lib/rbac';
import EntitySelect from '../../components/EntitySelect';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';

function CampaignForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('marketing.change_campaign');

  useEffect(() => {
    if (isEdit) loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCampaign = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getCampaign(id);
      form.setFieldsValue({ ...data, start_at: data.start_at ? dayjs(data.start_at) : null });
    } catch (error) {
      setLoadError(true);
      message.error('Ошибка загрузки кампании');
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!canManage) {
      message.error('Недостаточно прав для изменения кампаний');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...values, start_at: values.start_at ? values.start_at.toISOString() : null };
      if (isEdit) {
        await updateCampaign(id, payload);
        message.success('Кампания обновлена');
      } else {
        await createCampaign(payload);
        message.success('Кампания создана');
      }
      navigate('/campaigns');
    } catch (error) {
      message.error(isEdit ? 'Ошибка обновления кампании' : 'Ошибка создания кампании');
      console.error('Error saving campaign:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка кампании"
        description="Подготавливаем форму кампании для редактирования."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <BusinessScreenState
        variant="error"
        title="Не удалось загрузить кампанию"
        description="Попробуйте повторить загрузку."
        actionLabel="Повторить"
        onAction={loadCampaign}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/campaigns"
      listButtonText="К списку кампаний"
      description="У вас нет прав для создания или редактирования кампаний."
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <BusinessFormHeader
          formId="campaign-form"
          title={isEdit ? 'Редактирование кампании' : 'Новая кампания'}
          subtitle="Создание и настройка маркетинговой кампании"
          submitLabel={isEdit ? 'Сохранить кампанию' : 'Создать кампанию'}
          isSubmitting={saving}
          onBack={() => navigate('/campaigns')}
        />

        <Card>
          <Form id="campaign-form" form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Название кампании" name="name" rules={[{ required: true, message: 'Введите название кампании' }]}>
              <Input prefix={<RocketOutlined />} placeholder="Например: Летняя акция 2026" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Сегмент" name="segment">
                  <EntitySelect placeholder="Выберите сегмент" fetchOptions={getSegments} fetchById={getSegment} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Шаблон" name="template">
                  <EntitySelect placeholder="Выберите шаблон" fetchOptions={getTemplates} fetchById={getTemplate} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Дата старта" name="start_at">
                  <DatePicker format="DD.MM.YYYY HH:mm" showTime style={{ width: '100%' }} placeholder="Выберите дату и время" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Активна" name="is_active" valuePropName="checked">
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

export default CampaignForm;
