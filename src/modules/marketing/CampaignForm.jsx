/**
 * Campaign Form
 * Форма для создания и редактирования маркетинговых кампаний
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  getSegments,
} from '../../lib/api/marketing';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function CampaignForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    loadSegments();
    if (isEdit) {
      loadCampaign();
    }
  }, [id]);

  const loadSegments = async () => {
    try {
      const data = await getSegments();
      setSegments(data.results || data || []);
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  };

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const data = await getCampaign(id);
      form.setFieldsValue({
        ...data,
        dates: data.start_date && data.end_date 
          ? [dayjs(data.start_date), dayjs(data.end_date)]
          : null,
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
        start_date: values.dates ? values.dates[0].format('YYYY-MM-DD') : null,
        end_date: values.dates ? values.dates[1].format('YYYY-MM-DD') : null,
      };
      delete payload.dates;

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
        <Spin size="large" tip="Загрузка данных...">
          <div style={{ padding: '20px' }}></div>
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            type: 'email',
          }}
        >
          <Form.Item
            label="Название кампании"
            name="name"
            rules={[{ required: true, message: 'Введите название кампании' }]}
          >
            <Input 
              prefix={<RocketOutlined />}
              placeholder="Например: Летняя акция 2024" 
            />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={4} placeholder="Опишите цели и детали кампании" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Тип кампании"
                name="type"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <Select placeholder="Выберите тип">
                  <Option value="email">Email рассылка</Option>
                  <Option value="sms">SMS рассылка</Option>
                  <Option value="social">Социальные сети</Option>
                  <Option value="advertisement">Реклама</Option>
                  <Option value="event">Мероприятие</Option>
                  <Option value="other">Другое</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Статус"
                name="status"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select placeholder="Выберите статус">
                  <Option value="draft">Черновик</Option>
                  <Option value="active">Активна</Option>
                  <Option value="paused">Приостановлена</Option>
                  <Option value="completed">Завершена</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Период проведения"
            name="dates"
          >
            <RangePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              placeholder={['Дата начала', 'Дата окончания']}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Бюджет"
                name="budget"
              >
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="0.00"
                  />
                  <Input
                    style={{ width: '50px' }}
                    disabled
                    value="₽"
                  />
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Целевой сегмент"
                name="segment"
              >
                <Select 
                  placeholder="Выберите сегмент аудитории"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {segments.map((segment) => (
                    <Option key={segment.id} value={segment.id}>
                      {segment.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
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
