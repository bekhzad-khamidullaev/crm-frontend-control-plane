import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
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
  Switch,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import {
  getTask,
  createTask,
  updateTask,
  getProjects,
  getProject,
  getTasks,
  getUsers,
  getUser,
} from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';

const { Title } = Typography;
const { TextArea } = Input;

function TaskForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const task = await getTask(id);
      form.setFieldsValue({
        ...task,
        start_date: task.start_date ? dayjs(task.start_date) : null,
        due_date: task.due_date ? dayjs(task.due_date) : null,
        closing_date: task.closing_date ? dayjs(task.closing_date) : null,
        next_step_date: task.next_step_date ? dayjs(task.next_step_date) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных задачи');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
        next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updateTask(id, payload);
        message.success('Задача обновлена');
      } else {
        await createTask(payload);
        message.success('Задача создана');
      }
      navigate('/tasks');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} задачи`);
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать задачу' : 'Создать новую задачу'}
      </Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Название задачи"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Подготовить коммерческое предложение" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Приоритет" name="priority">
                <InputNumber min={1} max={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Детальное описание задачи" />
          </Form.Item>

          <Form.Item label="Заметка" name="note">
            <TextArea rows={3} placeholder="Внутренние заметки" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Этап"
                name="stage"
                rules={[{ required: true, message: 'Выберите этап' }]}
              >
                <ReferenceSelect type="task-stages" placeholder="Выберите этап" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дата начала" name="start_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Срок выполнения" name="due_date">
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
              <Form.Item label="Lead time" name="lead_time">
                <Input placeholder="DD HH:MM:SS" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Следующий шаг" name="next_step">
                <Input placeholder="Согласовать требования" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Дата следующего шага" name="next_step_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Связанные записи
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Проект" name="project">
                <EntitySelect
                  placeholder="Выберите проект"
                  fetchOptions={getProjects}
                  fetchById={getProject}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Родительская задача" name="task">
                <EntitySelect
                  placeholder="Выберите задачу"
                  fetchOptions={getTasks}
                  fetchById={getTask}
                />
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
                <ReferenceSelect type="task-tags" placeholder="Выберите теги" mode="multiple" allowClear />
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
              <Button onClick={() => navigate('/tasks')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default TaskForm;
