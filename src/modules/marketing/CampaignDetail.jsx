import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCampaign, deleteCampaign, patchCampaign } from '../../lib/api/marketing';
import { navigate } from '../../router';
import { EntityDetailShell, LegacyEmptyState, LegacyErrorState, LegacyLoadingState } from '../../shared/ui';

export default function CampaignDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getCampaign(id);
      setData(res);
    } catch (error) {
      setData(null);
      setLoadError(true);
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
      <LegacyLoadingState
        title="Загрузка кампании"
        description="Подгружаем карточку маркетинговой кампании."
      />
    );
  }

  if (loadError) {
    return (
      <LegacyErrorState
        title="Не удалось открыть кампанию"
        description="Попробуйте повторить загрузку или вернитесь к списку кампаний."
        onAction={fetchData}
      />
    );
  }

  if (!data) {
    return (
      <LegacyEmptyState
        title="Кампания не найдена"
        description="Возможно, запись была удалена или больше недоступна."
        actionLabel="К списку кампаний"
        onAction={() => navigate('/campaigns')}
      />
    );
  }

  return (
    <EntityDetailShell
      onBack={() => navigate('/campaigns')}
      title={data.name || 'Кампания'}
      subtitle="Карточка маркетинговой кампании с основными параметрами и быстрыми действиями."
      statusTag={
        <Tag color={data.is_active ? 'green' : 'default'}>
          {data.is_active ? 'Активна' : 'Неактивна'}
        </Tag>
      }
      primaryActions={
        <Space wrap>
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
      stats={[
        {
          key: 'segment',
          label: 'Сегмент',
          value: data.segment_name || '-',
        },
        {
          key: 'template',
          label: 'Шаблон',
          value: data.template_name || '-',
        },
        {
          key: 'start',
          label: 'Дата старта',
          value: data.start_at ? new Date(data.start_at).toLocaleString('ru-RU') : '-',
        },
      ]}
      tabs={[
        {
          key: 'details',
          label: 'Детали',
          children: (
            <Card variant="borderless" styles={{ body: { padding: 0 } }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Название" span={2}>
                  {data.name}
                </Descriptions.Item>
                <Descriptions.Item label="Сегмент">
                  {data.segment_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Шаблон">
                  {data.template_name || '-'}
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
          ),
        },
      ]}
    />
  );
}
