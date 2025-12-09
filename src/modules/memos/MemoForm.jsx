import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Spin, Select, Switch } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getMemo, createMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';

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
      form.setFieldsValue(res);
    } catch (error) {
      message.error('Failed to fetch memo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateMemo(id, values);
        message.success('Memo updated successfully');
      } else {
        await createMemo(values);
        message.success('Memo created successfully');
      }
      navigate('/memos');
    } catch (error) {
      message.error(`Failed to ${isEdit ? 'update' : 'create'} memo`);
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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/memos')}
        >
          Back
        </Button>
      </Space>

      <Card title={isEdit ? 'Edit Memo' : 'Create New Memo'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            draft: true,
            archived: false,
          }}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter memo title" />
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <TextArea
              rows={10}
              placeholder="Enter memo content"
            />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
          >
            <Input placeholder="Category (optional)" />
          </Form.Item>

          <Form.Item
            label="Related Entity"
            name="content_type"
          >
            <Select placeholder="Select related entity type" allowClear>
              <Select.Option value="deal">Deal</Select.Option>
              <Select.Option value="project">Project</Select.Option>
              <Select.Option value="contact">Contact</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Related Entity ID"
            name="object_id"
            dependencies={['content_type']}
          >
            <Input placeholder="Enter entity ID" />
          </Form.Item>

          <Form.Item
            label="Draft"
            name="draft"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Archived"
            name="archived"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/memos')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
