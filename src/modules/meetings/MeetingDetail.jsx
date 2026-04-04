import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Result, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { deleteMeeting, getMeeting } from '../../lib/api/meetings.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Title } = Typography;

const statusMeta = {
  scheduled: { color: 'processing', label: 'Запланирована' },
  completed: { color: 'success', label: 'Завершена' },
  cancelled: { color: 'error', label: 'Отменена' },
};

const formatMeta = {
  offline: 'Оффлайн',
  online: 'Онлайн',
  call: 'Звонок',
};

export default function MeetingDetail({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('tasks.reminders');
  const canManage = canWrite('crm.change_meeting');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadData = async () => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      setData(await getMeeting(id));
    } catch {
      setData(null);
      message.error('Не удалось загрузить встречу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const handleDelete = async () => {
    try {
      await deleteMeeting(id);
      message.success('Встреча удалена');
      navigate('/meetings');
    } catch {
      message.error('Не удалось удалить встречу');
    }
  };

  if (loading) return <Card loading />;

  if (!data) {
    return (
      <Result
        status="404"
        title="Встреча не найдена"
        extra={<Button onClick={() => navigate('/meetings')}>К списку</Button>}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="tasks.reminders"
        description="Для доступа к деталям встречи включите модуль Reminders в лицензии."
      />
    );
  }

  const status = statusMeta[String(data.status || '').toLowerCase()] || { color: 'default', label: data.status || '-' };

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>{data.subject || 'Встреча'}</Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/meetings')}>
              Назад
            </Button>
            {canManage ? (
              <>
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/meetings/${id}/edit`)}>
                  Редактировать
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => setConfirmOpen(true)}>
                  Удалить
                </Button>
              </>
            ) : null}
          </Space>
        </Space>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Начало">{data.start_at ? dayjs(data.start_at).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Окончание">{data.end_at ? dayjs(data.end_at).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={status.color}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Формат">{formatMeta[String(data.format || '').toLowerCase()] || data.format || '-'}</Descriptions.Item>
          <Descriptions.Item label="Компания">{data.company_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Контакт">{data.contact_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Сделка">{data.deal_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Локация / ссылка">{data.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="Описание">{data.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="Участники">{data.attendees || '-'}</Descriptions.Item>
          <Descriptions.Item label="Итоги">{data.outcome || '-'}</Descriptions.Item>
        </Descriptions>
      </Space>

      <Modal
        title="Удалить встречу?"
        open={confirmOpen && canManage}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleDelete}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        Это действие нельзя отменить.
      </Modal>
    </Card>
  );
}
