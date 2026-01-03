import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  DatePicker,
  Row,
  Col,
  Switch,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getCampaign, createCampaign, updateCampaign, getSegments, getSegment, getTemplates, getTemplate } from '../../lib/api/marketing';
import EntitySelect from '../../components/EntitySelect';

const { Title } = Typography;

function CampaignForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const data = await getCampaign(id);
      form.setFieldsValue({
        ...data,
        start_at: data.start_at ? dayjs(data.start_at) : null,
      });
    } catch (error) {
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
            {isEdit ? 'Редактирование кампании' : 'Новая кампания'}
          </Title>
        </Space>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Название кампании"
            name="name"
            rules={[{ required: true, message: 'Введите название кампании' }]}
          >
            <Input prefix={<RocketOutlined />} placeholder="Например: Летняя акция 2024" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Сегмент" name="segment">
                <EntitySelect
                  placeholder="Выберите сегмент"
                  fetchOptions={getSegments}
                  fetchById={getSegment}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Шаблон" name="template">
                <EntitySelect
                  placeholder="Выберите шаблон"
                  fetchOptions={getTemplates}
                  fetchById={getTemplate}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Дата старта" name="start_at">
                <DatePicker
                  format="DD.MM.YYYY HH:mm"
                  showTime
                  style={{ width: '100%' }}
                  placeholder="Выберите дату и время"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Активна" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
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

export default CampaignForm;
