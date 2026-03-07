import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { deleteProduct, getProduct } from '../../lib/api/products';
import { formatCurrency } from '../../lib/utils/format';
import { navigate } from '../../router';
import { EntityDetailShell, LegacyEmptyState, LegacyErrorState, LegacyLoadingState } from '../../shared/ui';

export default function ProductDetail({ id }) {
  const { message } = App.useApp();
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
      const res = await getProduct(id);
      setData(res);
    } catch (error) {
      setData(null);
      setLoadError(true);
      message.error('Не удалось загрузить продукт');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить продукт',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProduct(id);
          message.success('Продукт удален');
          navigate('/products');
        } catch (error) {
          message.error('Ошибка удаления продукта');
        }
      },
    });
  };

  if (loading) {
    return (
      <LegacyLoadingState
        title="Загрузка продукта"
        description="Подгружаем карточку продукта и его параметры."
      />
    );
  }

  if (loadError) {
    return (
      <LegacyErrorState
        title="Не удалось открыть продукт"
        description="Попробуйте повторить загрузку или вернитесь к каталогу продуктов."
        onAction={fetchData}
      />
    );
  }

  if (!data) {
    return (
      <LegacyEmptyState
        title="Продукт не найден"
        description="Возможно, запись была удалена или у вас нет к ней доступа."
        actionLabel="К каталогу продуктов"
        onAction={() => navigate('/products')}
      />
    );
  }

  return (
    <EntityDetailShell
      onBack={() => navigate('/products')}
      title={data.name || 'Продукт'}
      subtitle="Карточка продукта с основными коммерческими параметрами и быстрыми действиями."
      statusTag={
        <Tag color={data.on_sale ? 'green' : 'default'}>
          {data.on_sale ? 'В продаже' : 'Скрыт'}
        </Tag>
      }
      primaryActions={
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/products/${id}/edit`)}>
            Редактировать
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Удалить
          </Button>
        </Space>
      }
      stats={[
        {
          key: 'price',
          label: 'Цена',
          value: formatCurrency(data.price, data.currency_name || 'RUB'),
        },
        {
          key: 'category',
          label: 'Категория',
          value: data.category_name || '-',
        },
        {
          key: 'type',
          label: 'Тип',
          value: data.type === 'S' ? 'Услуга' : data.type === 'G' ? 'Товар' : '-',
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
                <Descriptions.Item label="Категория">
                  {data.category_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Цена">
                  {formatCurrency(data.price, data.currency_name || 'RUB')}
                </Descriptions.Item>
                <Descriptions.Item label="Тип">
                  <Tag color={data.type === 'S' ? 'blue' : 'green'}>
                    {data.type === 'S' ? 'Услуга' : data.type === 'G' ? 'Товар' : '-'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="В продаже">
                  <Tag color={data.on_sale ? 'green' : 'default'}>{data.on_sale ? 'Да' : 'Нет'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Валюта">
                  {data.currency_name || 'RUB'}
                </Descriptions.Item>
                <Descriptions.Item label="Описание" span={2}>
                  {data.description || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ),
        },
      ]}
    />
  );
}
