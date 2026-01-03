import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import { getPayment, deletePayment } from '../../lib/api/payments';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const statusOptions = {
  r: 'Получен',
  g: 'Гарантирован',
  h: 'Высокая вероятность',
  l: 'Низкая вероятность',
};

const statusColors = {
  r: 'green',
  g: 'blue',
  h: 'orange',
  l: 'default',
};

export default function PaymentDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPayment(id);
      setData(res);
    } catch (error) {
      message.error('Не удалось загрузить платеж');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить платеж',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deletePayment(id);
          message.success('Платеж удален');
          navigate('/payments');
        } catch (error) {
          message.error('Ошибка удаления платежа');
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
          Платеж не найден
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Платеж</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payments')}>
            Назад
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/payments/${id}/edit`)}>
            Редактировать
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Удалить
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Сумма" span={2}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {Number(data.amount || 0).toLocaleString('ru-RU')} {data.currency_name || '₽'}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Статус">
          <Tag color={statusColors[data.status] || 'default'}>
            {statusOptions[data.status] || data.status || '—'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Дата платежа">
          {data.payment_date ? dayjs(data.payment_date).format('DD MMM YYYY') : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Сделка">
          {data.deal_name || (data.deal ? `#${data.deal}` : '-')}
        </Descriptions.Item>

        <Descriptions.Item label="Номер договора">
          {data.contract_number || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Номер счета">
          {data.invoice_number || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Номер заказа">
          {data.order_number || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
