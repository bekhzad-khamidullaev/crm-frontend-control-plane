import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Result, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { deleteFinancePlan, getFinancePlan } from '../../lib/api/financePlans.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { formatCurrencyForRecord } from '../../lib/utils/format';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Title } = Typography;

const statusLabel = {
  draft: { color: 'default', label: 'Черновик' },
  approved: { color: 'processing', label: 'Согласован' },
  closed: { color: 'success', label: 'Закрыт' },
};

export default function FinancePlanDetail({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('billing.invoicing');
  const canManage = canWrite('crm.change_financeplan');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadData = async () => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      setData(await getFinancePlan(id));
    } catch {
      setData(null);
      message.error('Не удалось загрузить финплан');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const handleDelete = async () => {
    try {
      await deleteFinancePlan(id);
      message.success('Финплан удален');
      navigate('/finance-planning');
    } catch {
      message.error('Не удалось удалить финплан');
    }
  };

  if (loading) return <Card loading />;

  if (!data) {
    return (
      <Result
        status="404"
        title="Финплан не найден"
        extra={<Button onClick={() => navigate('/finance-planning')}>К списку</Button>}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="billing.invoicing"
        description="Для доступа к деталям финплана включите модуль Invoicing в лицензии."
      />
    );
  }

  const status = statusLabel[String(data.status || '').toLowerCase()] || { color: 'default', label: data.status || '-' };

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>{data.title || 'Финплан'}</Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/finance-planning')}>
              Назад
            </Button>
            {canManage ? (
              <>
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/finance-planning/${id}/edit`)}>
                  Редактировать
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => setConfirmOpen(true)}>
                  Удалить
                </Button>
              </>
            ) : null}
          </Space>
        </Space>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Период">{data.period_month ? dayjs(data.period_month).format('MM.YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={status.color}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="План дохода">{formatCurrencyForRecord(data.planned_income || 0, data)}</Descriptions.Item>
          <Descriptions.Item label="План расхода">{formatCurrencyForRecord(data.planned_expense || 0, data)}</Descriptions.Item>
          <Descriptions.Item label="Факт дохода">{formatCurrencyForRecord(data.actual_income || 0, data)}</Descriptions.Item>
          <Descriptions.Item label="Факт расхода">{formatCurrencyForRecord(data.actual_expense || 0, data)}</Descriptions.Item>
          <Descriptions.Item label="Комментарий">{data.comment || '-'}</Descriptions.Item>
        </Descriptions>
      </Space>

      <Modal
        title="Удалить финплан?"
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
