import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Space, message, Spin, Select, Switch, DatePicker, InputNumber } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { getMemo, createMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';
import dayjs from 'dayjs';
import EntitySelect from '../../components/EntitySelect.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import { getUsers, getUser, getDeal, getDeals, getProject, getProjects, getTask, getTasks } from '../../lib/api/client.js';

const { TextArea } = Input;

export default function MemoForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemo(id);
      form.setFieldsValue({
        ...res,
        review_date: res.review_date ? dayjs(res.review_date) : null,
      });
    } catch (error) {
      message.error('Не удалось загрузить мемо');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        review_date: values.review_date ? values.review_date.format('YYYY-MM-DD') : null,
      };
      if (isEdit) {
        await updateMemo(id, payload);
        message.success('Мемо обновлено');
      } else {
        await createMemo(payload);
        message.success('Мемо создано');
      }
      navigate('/memos');
    } catch (error) {
      message.error(`Не удалось ${isEdit ? 'обновить' : 'создать'} мемо`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/memos')}>
          Назад
        </Button>
      </Space>

      <Card title={isEdit ? 'Редактирование мемо' : 'Новое мемо'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            draft: false,
            notified: false,
            stage: 'pen',
          }}
        >
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input prefix={<FileTextOutlined />} placeholder="Например: Итоги встречи" />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <TextArea rows={3} placeholder="Краткое описание" />
          </Form.Item>

          <Form.Item label="Заключение" name="note">
            <TextArea rows={4} placeholder="Ключевые выводы и договоренности" />
          </Form.Item>

          <Space size="large" style={{ marginBottom: 16 }}>
            <Form.Item label="Черновик" name="draft" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Уведомить получателей" name="notified" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item label="Стадия" name="stage" style={{ flex: 1 }}>
              <Select allowClear placeholder="Выберите стадию">
                <Select.Option value="pen">В ожидании</Select.Option>
                <Select.Option value="pos">Отложено</Select.Option>
                <Select.Option value="rev">Рассмотрено</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Дата обзора" name="review_date" style={{ flex: 1 }}>
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            label="Получатель"
            name="to"
            rules={[{ required: true, message: 'Выберите получателя' }]}
          >
            <EntitySelect
              placeholder="Выберите пользователя"
              fetchList={getUsers}
              fetchById={getUser}
              allowClear
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item label="Сделка" name="deal" style={{ flex: 1 }}>
              <EntitySelect
                placeholder="Выберите сделку"
                fetchList={getDeals}
                fetchById={getDeal}
                allowClear
              />
            </Form.Item>
            <Form.Item label="Проект" name="project" style={{ flex: 1 }}>
              <EntitySelect
                placeholder="Выберите проект"
                fetchList={getProjects}
                fetchById={getProject}
                allowClear
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item label="Задача" name="task" style={{ flex: 1 }}>
              <EntitySelect
                placeholder="Выберите задачу"
                fetchList={getTasks}
                fetchById={getTask}
                allowClear
              />
            </Form.Item>
            <Form.Item label="Resolution ID" name="resolution" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="ID связанного объекта" />
            </Form.Item>
          </Space>

          <Form.Item label="Теги" name="tags">
            <ReferenceSelect type="crm-tags" mode="multiple" allowClear placeholder="Выберите теги" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/memos')}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
