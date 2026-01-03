import { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin, Typography } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { getMemo, deleteMemo, markMemoReviewed, markMemoPostponed } from '../../lib/api/memos';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

const stageLabels = {
  pen: { text: 'В ожидании', color: 'blue' },
  pos: { text: 'Отложено', color: 'orange' },
  rev: { text: 'Рассмотрено', color: 'green' },
};

export default function MemoDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemo(id);
      setData(res);
    } catch (error) {
      message.error('Не удалось загрузить мемо');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить мемо?',
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteMemo(id);
          message.success('Мемо удалено');
          navigate('/memos');
        } catch (error) {
          message.error('Не удалось удалить мемо');
        }
      },
    });
  };

  const handleReviewed = async () => {
    try {
      await markMemoReviewed(id);
      message.success('Мемо отмечено как рассмотренное');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить мемо');
    }
  };

  const handlePostponed = async () => {
    try {
      await markMemoPostponed(id);
      message.success('Мемо отложено');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить мемо');
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
          Мемо не найдено
        </div>
      </Card>
    );
  }

  const stage = stageLabels[data.stage] || { text: data.stage || '—', color: 'default' };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Детали мемо</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/memos')}>
              Назад
            </Button>
            <Button icon={<ClockCircleOutlined />} onClick={handlePostponed}>
              Отложить
            </Button>
            <Button type="primary" icon={<CheckOutlined />} onClick={handleReviewed}>
              Рассмотрено
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/memos/${id}/edit`)}>
              Редактировать
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Удалить
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Название" span={2}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{data.name}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Стадия">
            <Tag color={stage.color}>{stage.text}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Черновик">
            {data.draft ? 'Да' : 'Нет'}
          </Descriptions.Item>

          <Descriptions.Item label="Уведомления">
            {data.notified ? 'Отправлены' : 'Не отправлялись'}
          </Descriptions.Item>

          <Descriptions.Item label="Дата обзора">
            {data.review_date ? dayjs(data.review_date).format('DD.MM.YYYY') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Получатель">
            {data.to_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Сделка">
            {data.deal_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Проект">
            {data.project_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Задача">
            {data.task_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Resolution">
            {data.resolution_name || data.resolution || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Теги" span={2}>
            {data.tag_names || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Владелец">
            {data.owner_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Создано">
            {data.creation_date ? dayjs(data.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Обновлено">
            {data.update_date ? dayjs(data.update_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Описание" span={2}>
            {data.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Заключение">
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {data.note || 'Нет заключения'}
        </Paragraph>
      </Card>
    </Space>
  );
}
