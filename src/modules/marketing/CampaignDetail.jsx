import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { getCampaign, deleteCampaign, patchCampaign } from '../../lib/api/marketing';
import { navigate } from '../../router';

export default function CampaignDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCampaign(id);
      setData(res);
    } catch (error) {
      message.error('Не удалось загрузить кампанию');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить кампанию',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCampaign(id);
          message.success('Кампания удалена');
          navigate('/campaigns');
        } catch (error) {
          message.error('Ошибка удаления кампании');
        }
      },
    });
  };

  const handleToggleActive = async () => {
    try {
      await patchCampaign(id, { is_active: !data.is_active });
      message.success('Статус обновлен');
      fetchData();
    } catch (error) {
      message.error('Ошибка обновления статуса');
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
          Кампания не найдена
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <RocketOutlined />
          <span>Кампания</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/campaigns')}>
            Назад
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/campaigns/${id}/edit`)}>
            Редактировать
          </Button>
          <Button onClick={handleToggleActive}>
            {data.is_active ? 'Отключить' : 'Активировать'}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Удалить
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Название" span={2}>
          {data.name}
        </Descriptions.Item>
        <Descriptions.Item label="Сегмент">
          {data.segment_name || (data.segment ? `#${data.segment}` : '-')}
        </Descriptions.Item>
        <Descriptions.Item label="Шаблон">
          {data.template_name || (data.template ? `#${data.template}` : '-')}
        </Descriptions.Item>
        <Descriptions.Item label="Дата старта">
          {data.start_at ? new Date(data.start_at).toLocaleString('ru-RU') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Статус">
          <Tag color={data.is_active ? 'green' : 'default'}>
            {data.is_active ? 'Активна' : 'Неактивна'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Дата создания">
          {data.created_at ? new Date(data.created_at).toLocaleString('ru-RU') : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
