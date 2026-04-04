import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { deleteProduct, getProduct } from '../../lib/api/products';
import { canWrite } from '../../lib/rbac.js';
import { formatCurrencyForRecord, resolveCurrencyCode } from '../../lib/utils/format';
import { navigate } from '../../router';

const { Title, Text } = Typography;

export default function ProductDetail({ id }) {
  const { message } = App.useApp();
  const canManage = canWrite('crm.change_product');
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

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (loadError) {
    return <Result status="error" title="Не удалось открыть продукт" subTitle="Попробуйте повторить загрузку" extra={<Button onClick={fetchData}>Повторить</Button>} />;
  }

  if (!data) {
    return <Result status="404" title="Продукт не найден" extra={<Button onClick={() => navigate('/products')}>К каталогу продуктов</Button>} />;
  }
  const currencyCode = resolveCurrencyCode(data, { fallback: null });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/products')}>Назад</Button>
          <Tag color={data.on_sale ? 'green' : 'default'}>{data.on_sale ? 'В продаже' : 'Скрыт'}</Tag>
        </Space>
        <Space>
          {canManage ? (
            <>
              <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/products/${id}/edit`)}>Редактировать</Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Удалить</Button>
            </>
          ) : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{data.name || 'Продукт'}</Title>
        <Text type="secondary">Карточка продукта с коммерческими параметрами</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Цена">{formatCurrencyForRecord(data.price, data)}</Card>
        <Card size="small" title="Категория">{data.category_name || '-'}</Card>
        <Card size="small" title="Тип">{data.type === 'S' ? 'Услуга' : data.type === 'G' ? 'Товар' : '-'}</Card>
      </Space>

      <Card>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
          <Descriptions.Item label="Название" span={2}>{data.name}</Descriptions.Item>
          <Descriptions.Item label="Категория">{data.category_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Цена">{formatCurrencyForRecord(data.price, data)}</Descriptions.Item>
          <Descriptions.Item label="Тип"><Tag color={data.type === 'S' ? 'blue' : 'green'}>{data.type === 'S' ? 'Услуга' : data.type === 'G' ? 'Товар' : '-'}</Tag></Descriptions.Item>
          <Descriptions.Item label="В продаже"><Tag color={data.on_sale ? 'green' : 'default'}>{data.on_sale ? 'Да' : 'Нет'}</Tag></Descriptions.Item>
          <Descriptions.Item label="Валюта">{currencyCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="Описание" span={2}>{data.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
