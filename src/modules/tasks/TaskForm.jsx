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
  Slider,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getTask, createTask, updateTask } from '../../lib/api/client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
      if (task.due_date) {
        task.due_date = dayjs(task.due_date);
      }
      form.setFieldsValue(task);
    } catch (error) {
      message.error('Ошибка загрузки данных задачи');
      // Mock data for demo
      form.setFieldsValue({
        title: 'Подготовить коммерческое предложение',
        description: 'Создать детальное КП для компании ООО "ТехноПром"',
        status: 'in_progress',
        priority: 'high',
        due_date: dayjs('2024-02-15'),
        assignee_id: '1',
        related_type: 'deal',
        related_id: '1',
        progress: 60,
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
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
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
                label="Название задачи"
                name="title"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Подготовить коммерческое предложение" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Приоритет"
                name="priority"
                rules={[{ required: true, message: 'Выберите приоритет' }]}
                initialValue="medium"
              >
                <Select placeholder="Выберите приоритет">
                  <Option value="low">Низкий</Option>
                  <Option value="medium">Средний</Option>
                  <Option value="high">Высокий</Option>
                  <Option value="urgent">Срочно</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Детальное описание задачи" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Статус"
                name="status"
                rules={[{ required: true, message: 'Выберите статус' }]}
                initialValue="todo"
              >
                <Select placeholder="Выберите статус">
                  <Option value="todo">К выполнению</Option>
                  <Option value="in_progress">В работе</Option>
                  <Option value="completed">Выполнено</Option>
                  <Option value="cancelled">Отменено</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Срок выполнения"
                name="due_date"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Ответственный"
                name="assignee_id"
                rules={[{ required: true, message: 'Выберите ответственного' }]}
              >
                <Select placeholder="Выберите сотрудника" showSearch>
                  <Option value="1">Алексей Иванов</Option>
                  <Option value="2">Елена Смирнова</Option>
                  <Option value="3">Дмитрий Козлов</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Прогресс выполнения (%)"
            name="progress"
            initialValue={0}
          >
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>
            Связанные записи
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Тип связи" name="related_type">
                <Select placeholder="Выберите тип" allowClear>
                  <Option value="lead">Лид</Option>
                  <Option value="contact">Контакт</Option>
                  <Option value="company">Компания</Option>
                  <Option value="deal">Сделка</Option>
                  <Option value="project">Проект</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="ID связанной записи"
                name="related_id"
                dependencies={['related_type']}
              >
                <Input placeholder="Введите ID" />
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
              <Button onClick={() => navigate('/tasks')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default TaskForm;
