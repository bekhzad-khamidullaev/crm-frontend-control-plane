import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Row,
  Col,
  DatePicker,
  InputNumber,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getProject, createProject, updateProject } from '../../lib/api/client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function ProjectForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const project = await getProject(id);
      if (project.start_date && project.end_date) {
        project.dateRange = [dayjs(project.start_date), dayjs(project.end_date)];
      }
      form.setFieldsValue(project);
    } catch (error) {
      message.error('Ошибка загрузки данных проекта');
      // Mock data for demo
      form.setFieldsValue({
        name: 'Внедрение CRM системы',
        description: 'Полное внедрение CRM системы для автоматизации бизнес-процессов компании',
        status: 'in_progress',
        dateRange: [dayjs('2024-01-15'), dayjs('2024-04-30')],
        budget: 2500000,
        client_id: '1',
        manager_id: '1',
        team_size: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : null,
        end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : null,
      };
      delete payload.dateRange;

      if (isEdit) {
        await updateProject(id, payload);
        message.success('Проект обновлен');
      } else {
        await createProject(payload);
        message.success('Проект создан');
      }
      navigate('/projects');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} проекта`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать проект' : 'Создать новый проект'}
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Название проекта"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Внедрение CRM системы" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Статус"
                name="status"
                rules={[{ required: true, message: 'Выберите статус' }]}
                initialValue="planning"
              >
                <Select placeholder="Выберите статус">
                  <Option value="planning">Планирование</Option>
                  <Option value="in_progress">В работе</Option>
                  <Option value="on_hold">Приостановлен</Option>
                  <Option value="completed">Завершен</Option>
                  <Option value="cancelled">Отменен</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Детальное описание проекта" />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>
            Сроки и бюджет
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Период выполнения"
                name="dateRange"
                rules={[{ required: true, message: 'Выберите даты' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder={['Дата начала', 'Дата окончания']}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Бюджет (₽)"
                name="budget"
                rules={[{ required: true, message: 'Введите бюджет' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="2500000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }
                  parser={(value) => value.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Команда и клиент
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Клиент"
                name="client_id"
                rules={[{ required: true, message: 'Выберите клиента' }]}
              >
                <Select placeholder="Выберите компанию" showSearch>
                  <Option value="1">ООО "ТехноПром"</Option>
                  <Option value="2">АО "Инновации"</Option>
                  <Option value="3">ИП Козлов</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Менеджер проекта"
                name="manager_id"
                rules={[{ required: true, message: 'Выберите менеджера' }]}
              >
                <Select placeholder="Выберите сотрудника" showSearch>
                  <Option value="1">Алексей Иванов</Option>
                  <Option value="2">Елена Смирнова</Option>
                  <Option value="3">Дмитрий Козлов</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Размер команды"
                name="team_size"
                rules={[{ required: true, message: 'Укажите размер команды' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="5"
                />
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
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/projects')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ProjectForm;
