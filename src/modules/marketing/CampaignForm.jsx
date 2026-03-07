import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  message,
  DatePicker,
  Row,
  Col,
  Switch,
} from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getCampaign, createCampaign, updateCampaign, getSegments, getSegment, getTemplates, getTemplate } from '../../lib/api/marketing';
import EntitySelect from '../../components/EntitySelect';
import { EntityFormSection, EntityFormShell, LegacyErrorState, LegacyLoadingState } from '../../shared/ui';

function CampaignForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const formId = 'campaign-form';

  useEffect(() => {
    if (isEdit) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getCampaign(id);
      form.setFieldsValue({
        ...data,
        start_at: data.start_at ? dayjs(data.start_at) : null,
      });
    } catch (error) {
      setLoadError(true);
      message.error('Ошибка загрузки кампании');
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        start_at: values.start_at ? values.start_at.toISOString() : null,
      };

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

  const handleBack = () => {
    navigate('/campaigns');
  };

  if (loading) {
    return (
      <LegacyLoadingState
        title="Загрузка кампании"
        description="Подготавливаем форму маркетинговой кампании."
      />
    );
  }

  if (isEdit && loadError) {
    return (
      <LegacyErrorState
        title="Не удалось загрузить кампанию для редактирования"
        description="Попробуйте повторить загрузку или вернитесь к списку кампаний."
        onAction={loadCampaign}
      />
    );
  }

  return (
    <EntityFormShell
      title={isEdit ? 'Редактирование кампании' : 'Новая кампания'}
      subtitle="Создание и настройка маркетинговой кампании в едином CRM-паттерне."
      hint="Сначала заполните название и целевой сегмент, затем настройте шаблон и дату запуска."
      formId={formId}
      submitText={isEdit ? 'Сохранить кампанию' : 'Создать кампанию'}
      isSubmitting={saving}
      onBack={handleBack}
      onCancel={handleBack}
    >
      <Card>
        <Form id={formId} form={form} layout="vertical" onFinish={handleSubmit}>
          <EntityFormSection
            title="Основное"
            description="Ключевые параметры кампании, которые определяют её назначение и момент запуска."
          />
          <Form.Item
            label="Название кампании"
            name="name"
            rules={[{ required: true, message: 'Введите название кампании' }]}
          >
            <Input prefix={<RocketOutlined />} placeholder="Например: Летняя акция 2026" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Сегмент" name="segment">
                <EntitySelect
                  placeholder="Выберите сегмент"
                  fetchOptions={getSegments}
                  fetchById={getSegment}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Шаблон" name="template">
                <EntitySelect
                  placeholder="Выберите шаблон"
                  fetchOptions={getTemplates}
                  fetchById={getTemplate}
                />
              </Form.Item>
            </Col>
          </Row>

          <EntityFormSection
            title="Запуск и статус"
            description="Определите время старта и текущую активность кампании."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата старта" name="start_at">
                <DatePicker
                  format="DD.MM.YYYY HH:mm"
                  showTime
                  style={{ width: '100%' }}
                  placeholder="Выберите дату и время"
                />
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
    </EntityFormShell>
  );
}

export default CampaignForm;
