import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, ShopOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Space, Spin, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { deleteProduct, getProduct } from '../../lib/api/products';
import { formatCurrency } from '../../lib/utils/format';
import { navigate } from '../../router';

export default function ProductDetail({ id }) {
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProduct(id);
      setData(res);
    } catch (error) {
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
          Продукт не найден
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <ShopOutlined />
          <span>Продукт</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
            Назад
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/products/${id}/edit`)}>
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
          {data.name}
        </Descriptions.Item>
        <Descriptions.Item label="Категория">
          {data.category_name || (data.product_category ? `#${data.product_category}` : '-')}
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
        {data.description && (
          <Descriptions.Item label="Описание" span={2}>
            {data.description}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
