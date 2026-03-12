import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Check, Edit, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tag, Typography } from 'antd';

import { deleteReminder, getReminder, updateReminder } from '../../lib/api/reminders';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { Title, Text } = Typography;

export default function ReminderDetail({ id }) {
  const { message } = App.useApp();
  const canManage = canWrite('common.change_reminder');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getReminder(id);
      setData(res);
    } catch {
      setData(null);
      setLoadError(true);
      message.error('Не удалось загрузить напоминание');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReminder(id);
      message.success('Напоминание удалено');
      navigate('/reminders');
    } catch {
      message.error('Не удалось удалить напоминание');
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateReminder(id, { active: !data.active });
      message.success(!data.active ? 'Напоминание активировано' : 'Напоминание деактивировано');
      fetchData();
    } catch {
      message.error('Не удалось обновить напоминание');
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  if (loadError) {
    return (
      <Result
        status="error"
        title="Не удалось открыть напоминание"
        subTitle="Попробуйте повторить загрузку"
        extra={<Button onClick={fetchData}>Повторить</Button>}
      />
    );
  }

  if (!data) {
    return (
      <Result
        status="404"
        title="Напоминание не найдено"
        subTitle="Запись могла быть удалена или недоступна"
        extra={<Button onClick={() => navigate('/reminders')}>К списку напоминаний</Button>}
      />
    );
  }

  const reminderDate = data.reminder_date ? dayjs(data.reminder_date) : null;
  const isPast = reminderDate ? reminderDate.isBefore(dayjs()) : false;

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>
            <Bell size={18} /> Детали напоминания
          </Title>
          <Space>
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/reminders')}>Назад</Button>
            {canManage ? (
              <>
                <Button icon={data.active ? <X size={14} /> : <Check size={14} />} onClick={handleToggleActive}>
                  {data.active ? 'Отключить' : 'Включить'}
                </Button>
                <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/reminders/${id}/edit`)}>Редактировать</Button>
                <Button danger icon={<Trash2 size={14} />} onClick={() => setConfirmOpen(true)}>Удалить</Button>
              </>
            ) : null}
          </Space>
        </Space>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Тема">{data.subject}</Descriptions.Item>
          <Descriptions.Item label="Статус"><Tag color={data.active ? 'green' : 'default'}>{data.active ? 'Активно' : 'Неактивно'}</Tag></Descriptions.Item>
          <Descriptions.Item label="Дата напоминания">
            {reminderDate ? <Text type={isPast ? 'danger' : undefined}>{reminderDate.format('DD.MM.YYYY HH:mm')}{isPast ? ' (Просрочено)' : ''}</Text> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Тип объекта">{data.content_type ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Связанный объект">{data.object_id ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Владелец">{data.owner_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email уведомление">{data.send_notification_email ? 'Да' : 'Нет'}</Descriptions.Item>
          <Descriptions.Item label="Описание">{data.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="Дата создания">{data.creation_date ? dayjs(data.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
        </Descriptions>
      </Space>

      <Modal
        title="Удалить напоминание?"
        open={confirmOpen && canManage}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleDelete}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        Действие нельзя отменить.
      </Modal>
    </Card>
  );
}
