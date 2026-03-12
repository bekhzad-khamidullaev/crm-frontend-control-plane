import React, { useState, useEffect } from 'react';
import { Form, Input, Card, message, DatePicker, Row, Col, Switch, Space, Button, Result, Skeleton, Typography } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getCampaign, createCampaign, updateCampaign, getSegments, getSegment, getTemplates, getTemplate } from '../../lib/api/marketing';
import EntitySelect from '../../components/EntitySelect';

const { Title, Text } = Typography;

function CampaignForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

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

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить кампанию для редактирования"
        subTitle="Попробуйте повторить загрузку"
        extra={<Button onClick={loadCampaign}>Повторить</Button>}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button onClick={() => navigate('/campaigns')}>Назад</Button>
        <Space>
          <Button onClick={() => navigate('/campaigns')}>Отмена</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {isEdit ? 'Сохранить кампанию' : 'Создать кампанию'}
          </Button>
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{isEdit ? 'Редактирование кампании' : 'Новая кампания'}</Title>
        <Text type="secondary">Создание и настройка маркетинговой кампании</Text>
      </Card>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
  );
}

export default CampaignForm;
