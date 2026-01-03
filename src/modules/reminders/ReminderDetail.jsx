import { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
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
      message.error('Не удалось загрузить напоминание');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить напоминание?',
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteReminder(id);
          message.success('Напоминание удалено');
          navigate('/reminders');
        } catch (error) {
          message.error('Не удалось удалить напоминание');
        }
      },
    });
  };

  const handleToggleActive = async () => {
    try {
      await updateReminder(id, { active: !data.active });
      message.success(!data.active ? 'Напоминание активировано' : 'Напоминание деактивировано');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить напоминание');
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

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Напоминание не найдено
        </div>
      </Card>
    );
  }

  const reminderDate = data.reminder_date ? dayjs(data.reminder_date) : null;
  const isPast = reminderDate ? reminderDate.isBefore(dayjs()) : false;

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>Детали напоминания</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reminders')}>
            Назад
          </Button>
          <Button
            type={data.active ? 'default' : 'primary'}
            icon={data.active ? <CloseOutlined /> : <CheckOutlined />}
            onClick={handleToggleActive}
          >
            {data.active ? 'Отключить' : 'Включить'}
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/reminders/${id}/edit`)}>
            Редактировать
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Удалить
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Тема" span={2}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{data.subject}</span>
        </Descriptions.Item>

        <Descriptions.Item label="Статус">
          <Tag color={data.active ? 'green' : 'default'}>
            {data.active ? 'Активно' : 'Неактивно'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Дата напоминания">
          {reminderDate ? (
            <span style={{ color: isPast ? '#ff4d4f' : undefined, fontWeight: 600 }}>
              {reminderDate.format('DD MMM YYYY HH:mm')}
              {isPast && ' (Просрочено)'}
            </span>
          ) : (
            '-'
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Content type ID">
          {data.content_type ?? '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Object ID">
          {data.object_id ?? '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Владелец">
          {data.owner_name || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Email уведомление">
          {data.send_notification_email ? 'Да' : 'Нет'}
        </Descriptions.Item>

        <Descriptions.Item label="Описание" span={2}>
          {data.description || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Дата создания">
          {data.creation_date ? dayjs(data.creation_date).format('DD MMM YYYY HH:mm') : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
