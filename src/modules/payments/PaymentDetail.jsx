import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import { getPayment, deletePayment } from '../../lib/api/payments';
import { navigate } from '../../router';
import dayjs from 'dayjs';

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
      message.error('Failed to fetch payment details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Payment',
      content: 'Are you sure you want to delete this payment?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deletePayment(id);
          message.success('Payment deleted successfully');
          navigate('/payments');
        } catch (error) {
          message.error('Failed to delete payment');
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      failed: 'red',
      cancelled: 'default',
    };
    return colors[status] || 'default';
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
          Payment not found
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Payment Details</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/payments')}
          >
            Back
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/payments/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Amount" span={2}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {data.currency || '$'} {parseFloat(data.amount).toFixed(2)}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(data.status)}>
            {data.status ? data.status.toUpperCase() : 'UNKNOWN'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Payment Date">
          {data.payment_date ? dayjs(data.payment_date).format('DD MMM YYYY') : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Method">
          {data.method || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Currency">
          {data.currency || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Deal">
          {data.deal ? (
            <Button
              type="link"
              onClick={() => navigate(`/deals/${data.deal.id}`)}
              style={{ padding: 0 }}
            >
              {data.deal.title || `Deal #${data.deal.id}`}
            </Button>
          ) : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Invoice">
          {data.invoice ? `Invoice #${data.invoice.number || data.invoice.id}` : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Transaction ID">
          {data.transaction_id || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Payment Gateway">
          {data.gateway || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Notes" span={2}>
          {data.notes || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {data.created_at ? dayjs(data.created_at).format('DD MMM YYYY HH:mm') : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {data.updated_at ? dayjs(data.updated_at).format('DD MMM YYYY HH:mm') : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
