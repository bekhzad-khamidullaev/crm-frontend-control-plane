import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Modal, Result, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { deleteWarehouseItem, getWarehouseItem } from '../../lib/api/warehouseItems.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Title } = Typography;

export default function WarehouseDetail({ id }) {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('inventory.lite');
  const canManage = canWrite('crm.change_warehouseitem');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadItem = async () => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      setItem(await getWarehouseItem(id));
    } catch {
      setItem(null);
      message.error('Не удалось загрузить позицию');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canReadFeature]);

  const handleDelete = async () => {
    try {
      await deleteWarehouseItem(id);
      message.success('Позиция удалена');
      navigate('/warehouse');
    } catch {
      message.error('Не удалось удалить позицию');
    }
  };

  if (loading) return <Card loading />;

  if (!item) {
    return (
      <Result
        status="404"
        title="Позиция не найдена"
        extra={<Button onClick={() => navigate('/warehouse')}>К списку</Button>}
      />
    );
  }

  if (!canReadFeature) {
    return (
      <BusinessFeatureGateNotice
        featureCode="inventory.lite"
        description="Для доступа к деталям складской позиции включите модуль Inventory Lite в лицензии."
      />
    );
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>
            {item.name}
          </Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouse')}>
              Назад
            </Button>
            {canManage ? (
              <>
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/warehouse/${id}/edit`)}>
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
          <Descriptions.Item label="SKU">{item.sku || '-'}</Descriptions.Item>
          <Descriptions.Item label="Категория">{item.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="Локация">{item.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="Остаток">{`${item.quantity || 0} ${item.unit || 'pcs'}`}</Descriptions.Item>
          <Descriptions.Item label="Мин. остаток">{item.min_quantity || 0}</Descriptions.Item>
          <Descriptions.Item label="Себестоимость">{item.unit_cost || 0}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={String(item.status || '').toLowerCase() === 'active' ? 'success' : 'default'}>
              {String(item.status || '').toLowerCase() === 'active' ? 'Активный' : 'Архив'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Комментарий">{item.note || '-'}</Descriptions.Item>
        </Descriptions>
      </Space>

      <Modal
        title="Удалить позицию?"
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
