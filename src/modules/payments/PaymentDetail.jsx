import dayjs from 'dayjs';
import { ArrowLeftOutlined, CreditCardOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

import { App, Button, Card, Descriptions, Modal, Space, Tag, Typography } from 'antd';
import { BusinessScreenState } from '../../components/business/BusinessScreenState';

import { deletePayment, getPayment } from '../../lib/api/payments';
import { canWrite } from '../../lib/rbac.js';
import { formatCurrencyForRecord } from '../../lib/utils/format';
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
  const canManage = canWrite('crm.change_payment');
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
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка платежа"
        description="Собираем карточку платежа и связанные данные."
      />
    );
  }

  if (!data) {
    return (
      <BusinessScreenState
        variant="notFound"
        title="Платеж не найден"
        description="Возможно, запись удалена или у вас нет доступа."
        actionLabel="Вернуться к платежам"
        onAction={() => navigate('/payments')}
      />
    );
  }

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>
            <CreditCardOutlined size={18} /> Платеж
          </Title>
          <Space>
            <Button icon={<ArrowLeftOutlined size={14} />} onClick={() => navigate('/payments')}>
              Назад
            </Button>
            {canManage ? (
              <>
                <Button type="primary" icon={<EditOutlined size={14} />} onClick={() => navigate(`/payments/${id}/edit`)}>
                  Редактировать
                </Button>
                <Button danger icon={<DeleteOutlined size={14} />} onClick={() => setConfirmOpen(true)}>
                  Удалить
                </Button>
              </>
            ) : null}
          </Space>
        </Space>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Сумма">{formatCurrencyForRecord(data.amount, data)}</Descriptions.Item>
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
        open={confirmOpen && canManage}
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
