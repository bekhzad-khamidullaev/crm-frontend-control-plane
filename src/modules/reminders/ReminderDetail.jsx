import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, BellOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getReminder, deleteReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';
import dayjs from 'dayjs';

export default function ReminderDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getReminder(id);
      setData(res);
    } catch (error) {
      message.error('Failed to fetch reminder details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Reminder',
      content: 'Are you sure you want to delete this reminder?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteReminder(id);
          message.success('Reminder deleted successfully');
          navigate('/reminders');
        } catch (error) {
          message.error('Failed to delete reminder');
        }
      },
    });
  };

  const handleToggleActive = async () => {
    try {
      await updateReminder(id, { active: !data.active });
      message.success(`Reminder ${!data.active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update reminder');
    }
  };

  const getRelatedEntity = () => {
    if (data.lead) return { type: 'Lead', id: data.lead.id, title: data.lead.title };
    if (data.deal) return { type: 'Deal', id: data.deal.id, title: data.deal.title };
    if (data.contact) return { type: 'Contact', id: data.contact.id, title: data.contact.name };
    if (data.task) return { type: 'Task', id: data.task.id, title: data.task.title };
    return null;
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

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Reminder not found
        </div>
      </Card>
    );
  }

  const entity = getRelatedEntity();
  const reminderDate = dayjs(data.remind_at);
  const isPast = reminderDate.isBefore(dayjs());

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>Reminder Details</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/reminders')}
          >
            Back
          </Button>
          <Button
            type={data.active ? 'default' : 'primary'}
            icon={data.active ? <CloseOutlined /> : <CheckOutlined />}
            onClick={handleToggleActive}
          >
            {data.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/reminders/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Title" span={2}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {data.title}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={data.active ? 'green' : 'default'}>
            {data.active ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Remind At">
          <span style={{ color: isPast ? '#ff4d4f' : undefined, fontWeight: 'bold' }}>
            {reminderDate.format('DD MMM YYYY HH:mm')}
            {isPast && ' (Past)'}
          </span>
        </Descriptions.Item>

        {entity && (
          <>
            <Descriptions.Item label="Related Entity Type">
              <Tag color="blue">{entity.type}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Related Entity">
              <Button
                type="link"
                onClick={() => navigate(`/${entity.type.toLowerCase()}s/${entity.id}`)}
                style={{ padding: 0 }}
              >
                {entity.title || `${entity.type} #${entity.id}`}
              </Button>
            </Descriptions.Item>
          </>
        )}

        <Descriptions.Item label="Owner">
          {data.owner?.username || data.owner?.email || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Created By">
          {data.created_by?.username || data.created_by?.email || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Description" span={2}>
          {data.description || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {data.created_at ? dayjs(data.created_at).format('DD MMM YYYY HH:mm') : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {data.updated_at ? dayjs(data.updated_at).format('DD MMM YYYY HH:mm') : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
