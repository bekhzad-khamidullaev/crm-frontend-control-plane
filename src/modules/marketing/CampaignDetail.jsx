import { useEffect, useState } from 'react';
import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { getCampaign, deleteCampaign, patchCampaign } from '../../lib/api/marketing';
import { navigate } from '../../router';

const { Title, Text } = Typography;

export default function CampaignDetail({ id }) {
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        } catch {
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
    } catch {
      message.error('Ошибка обновления статуса');
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (loadError) {
    return (
      <Result
        status="error"
        title="Не удалось открыть кампанию"
        subTitle="Попробуйте повторить загрузку"
        extra={<Button onClick={fetchData}>Повторить</Button>}
      />
    );
  }

  if (!data) {
    return (
      <Result
        status="404"
        title="Кампания не найдена"
        extra={<Button onClick={() => navigate('/campaigns')}>К списку кампаний</Button>}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/campaigns')}>Назад</Button>
          <Tag color={data.is_active ? 'green' : 'default'}>{data.is_active ? 'Активна' : 'Неактивна'}</Tag>
        </Space>
        <Space wrap>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/campaigns/${id}/edit`)}>Редактировать</Button>
          <Button onClick={handleToggleActive}>{data.is_active ? 'Отключить' : 'Активировать'}</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Удалить</Button>
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{data.name || 'Кампания'}</Title>
        <Text type="secondary">Карточка маркетинговой кампании</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Сегмент">{data.segment_name || '-'}</Card>
        <Card size="small" title="Шаблон">{data.template_name || '-'}</Card>
        <Card size="small" title="Дата старта">{data.start_at ? new Date(data.start_at).toLocaleString('ru-RU') : '-'}</Card>
      </Space>

      <Card>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
          <Descriptions.Item label="Название" span={2}>{data.name}</Descriptions.Item>
          <Descriptions.Item label="Сегмент">{data.segment_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Шаблон">{data.template_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Дата старта">{data.start_at ? new Date(data.start_at).toLocaleString('ru-RU') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Статус"><Tag color={data.is_active ? 'green' : 'default'}>{data.is_active ? 'Активна' : 'Неактивна'}</Tag></Descriptions.Item>
          <Descriptions.Item label="Дата создания">{data.created_at ? new Date(data.created_at).toLocaleString('ru-RU') : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
