import dayjs from 'dayjs';
import { ArrowLeft, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { App, Button, Card, Descriptions, Modal, Result, Skeleton, Space, Tag, Typography } from 'antd';

import { deletePayment, getPayment } from '../../lib/api/payments';
import { formatCurrency } from '../../lib/utils/format';
import { navigate } from '../../router';

const { Title } = Typography;

const statusOptions = {
  r: 'Получен',
  g: 'Гарантирован',
  h: 'Высокая вероятность',
  l: 'Низкая вероятность',
};

export default function PaymentDetail({ id }) {
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPayment(id);
      setData(res);
    } catch {
      message.error('Не удалось загрузить платеж');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(id);
      message.success('Платеж удален');
      navigate('/payments');
    } catch {
      message.error('Ошибка удаления платежа');
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (!data) {
    return (
      <Result
        status="404"
        title="Платеж не найден"
        subTitle="Возможно, запись удалена или у вас нет доступа"
        extra={<Button onClick={() => navigate('/payments')}>Вернуться к платежам</Button>}
      />
    );
  }

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>
            <DollarSign size={18} /> Платеж
          </Title>
          <Space>
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/payments')}>
              Назад
            </Button>
            <Button type="primary" icon={<Edit size={14} />} onClick={() => navigate(`/payments/${id}/edit`)}>
              Редактировать
            </Button>
            <Button danger icon={<Trash2 size={14} />} onClick={() => setConfirmOpen(true)}>
              Удалить
            </Button>
          </Space>
        </Space>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Сумма">{formatCurrency(data.amount, data.currency_name || 'RUB')}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag>{statusOptions[data.status] || data.status || '—'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Дата платежа">{data.payment_date ? dayjs(data.payment_date).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Сделка">{data.deal_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Номер договора">{data.contract_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="Номер счета">{data.invoice_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="Номер заказа">{data.order_number || '-'}</Descriptions.Item>
        </Descriptions>
      </Space>

      <Modal
        title="Удалить платеж?"
        open={confirmOpen}
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
