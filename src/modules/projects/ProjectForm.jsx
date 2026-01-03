import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  App,
  Typography,
  Spin,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Switch,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getProject,
  createProject,
  updateProject,
  getUsers,
  getProjectStages,
} from '../../lib/api';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { normalizePayload } from '../../lib/utils/payload';

const { Title } = Typography;
const { TextArea } = Input;

function ProjectForm({ id }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
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
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        due_date: project.due_date ? dayjs(project.due_date) : null,
        closing_date: project.closing_date ? dayjs(project.closing_date) : null,
        next_step_date: project.next_step_date ? dayjs(project.next_step_date) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных проекта');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = normalizePayload({
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
        next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
      }, { preserveEmptyArrays: ['responsible', 'subscribers', 'tags'] });

      if (isEdit) {
        await updateProject(id, payload);
        message.success('Проект обновлен');
      } else {
        await createProject(payload);
        message.success('Проект создан');
      }
      navigate('/projects');
    } catch (error) {
      const details = error?.details;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .filter(([, value]) => Array.isArray(value))
          .map(([name, errors]) => ({ name, errors: errors.map(String) }));
        if (fieldErrors.length) {
          form.setFields(fieldErrors);
          setSaving(false);
          return;
        }
      }
      message.error(details?.detail || `Ошибка ${isEdit ? 'обновления' : 'создания'} проекта`);
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
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
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
              <Form.Item label="Приоритет" name="priority">
                <InputNumber min={1} max={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Детальное описание проекта" />
          </Form.Item>

          <Form.Item label="Заметка" name="note">
            <TextArea rows={3} placeholder="Внутренние заметки" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Этап" name="stage">
                <ReferenceSelect type="project-stages" placeholder="Выберите этап" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дата начала" name="start_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Срок завершения" name="due_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата закрытия" name="closing_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Следующий шаг"
                name="next_step"
                rules={[{ required: true, message: 'Введите следующий шаг' }]}
              >
                <Input placeholder="Определить цели" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Дата следующего шага"
                name="next_step_date"
                rules={[{ required: true, message: 'Выберите дату следующего шага' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Ответственные
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Владелец" name="owner">
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Со-владелец" name="co_owner">
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Ответственные" name="responsible">
                <EntitySelect
                  mode="multiple"
                  placeholder="Выберите пользователей"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Подписчики" name="subscribers">
                <EntitySelect
                  mode="multiple"
                  placeholder="Выберите пользователей"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <ReferenceSelect type="crm-tags" placeholder="Выберите теги" mode="multiple" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Статус
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Активен" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Напоминать" name="remind_me" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
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
