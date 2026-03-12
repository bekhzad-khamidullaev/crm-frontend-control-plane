import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock, Edit, FileText, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tag, Typography } from 'antd';

import { deleteMemo, getMemo, markMemoPostponed, markMemoReviewed } from '../../lib/api/memos';
import { navigate } from '../../router';

const { Title } = Typography;

const stageLabels = {
  pen: { text: 'В ожидании', color: 'blue' },
  pos: { text: 'Отложено', color: 'gold' },
  rev: { text: 'Рассмотрено', color: 'green' },
};

export default function MemoDetail({ id }) {
  const { message } = App.useApp();
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
      const res = await getMemo(id);
      setData(res);
    } catch {
      setData(null);
      setLoadError(true);
      message.error('Не удалось загрузить мемо');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMemo(id);
      message.success('Мемо удалено');
      navigate('/memos');
    } catch {
      message.error('Не удалось удалить мемо');
    }
  };

  const handleReviewed = async () => {
    try {
      await markMemoReviewed(id);
      message.success('Мемо отмечено как рассмотренное');
      fetchData();
    } catch {
      message.error('Не удалось обновить мемо');
    }
  };

  const handlePostponed = async () => {
    try {
      await markMemoPostponed(id);
      message.success('Мемо отложено');
      fetchData();
    } catch {
      message.error('Не удалось обновить мемо');
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (loadError) {
    return (
      <Result
        status="error"
        title="Не удалось открыть мемо"
        subTitle="Попробуйте повторить загрузку"
        extra={<Button onClick={fetchData}>Повторить</Button>}
      />
    );
  }

  if (!data) {
    return (
      <Result
        status="404"
        title="Мемо не найдено"
        subTitle="Запись могла быть удалена или недоступна"
        extra={<Button onClick={() => navigate('/memos')}>К списку мемо</Button>}
      />
    );
  }

  const stage = stageLabels[data.stage] || { text: '—', color: 'default' };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={3} style={{ margin: 0 }}>
              <FileText size={18} /> Детали мемо
            </Title>
            <Space>
              <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/memos')}>Назад</Button>
              <Button icon={<Clock size={14} />} onClick={handlePostponed}>Отложить</Button>
              <Button icon={<Check size={14} />} onClick={handleReviewed}>Рассмотрено</Button>
              <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/memos/${id}/edit`)}>Редактировать</Button>
              <Button danger icon={<Trash2 size={14} />} onClick={() => setConfirmOpen(true)}>Удалить</Button>
            </Space>
          </Space>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Название">{data.name}</Descriptions.Item>
            <Descriptions.Item label="Стадия"><Tag color={stage.color}>{stage.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="Черновик">{data.draft ? 'Да' : 'Нет'}</Descriptions.Item>
            <Descriptions.Item label="Уведомления">{data.notified ? 'Отправлены' : 'Не отправлялись'}</Descriptions.Item>
            <Descriptions.Item label="Дата обзора">{data.review_date ? dayjs(data.review_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Получатель">{data.to_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Сделка">{data.deal_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Проект">{data.project_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Задача">{data.task_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Resolution">{data.resolution_name || data.resolution || '-'}</Descriptions.Item>
            <Descriptions.Item label="Теги">{data.tag_names || '-'}</Descriptions.Item>
            <Descriptions.Item label="Владелец">{data.owner_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Создано">{data.creation_date ? dayjs(data.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Обновлено">{data.update_date ? dayjs(data.update_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Описание">{data.description || '-'}</Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Card title="Заключение">{data.note || 'Нет заключения'}</Card>

      <Modal
        title="Удалить мемо?"
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleDelete}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        Действие нельзя отменить.
      </Modal>
    </Space>
  );
}
