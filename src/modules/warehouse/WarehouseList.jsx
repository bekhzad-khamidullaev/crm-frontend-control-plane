import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { BusinessEntityListShell } from '../../components/business/BusinessEntityListShell';
import { deleteWarehouseItem, getWarehouseItems } from '../../lib/api/warehouseItems.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Text } = Typography;

const statusMap = {
  active: { color: 'success', label: 'Активный' },
  archived: { color: 'default', label: 'Архив' },
};

export default function WarehouseList() {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('inventory.lite');
  const canManage = canWrite('crm.change_warehouseitem');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadItems = async (page = 1, searchValue = search, pageSize = pagination.pageSize) => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      const response = await getWarehouseItems({
        page,
        page_size: pageSize,
        search: searchValue || undefined,
        ordering: 'name',
      });
      setItems(response?.results || []);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: response?.count || 0 }));
    } catch {
      message.error('Не удалось загрузить складские позиции');
      setItems([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadFeature]);

  const handleDelete = async (id) => {
    try {
      await deleteWarehouseItem(id);
      message.success('Позиция удалена');
      loadItems(pagination.current);
    } catch {
      message.error('Не удалось удалить позицию');
    }
  };

  if (!canReadFeature) {
    return (
      <BusinessEntityListShell title="Склад" subtitle="Полноценный CRUD по складским позициям">
        <BusinessFeatureGateNotice
          featureCode="inventory.lite"
          description="Для доступа к складу включите модуль Inventory Lite в лицензии."
        />
      </BusinessEntityListShell>
    );
  }

  return (
    <BusinessEntityListShell
        title="Склад"
        subtitle="Полноценный CRUD по складским позициям"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/warehouse/new')}>
              Создать позицию
            </Button>
          ) : null
        }
      >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <EntityListToolbar
            searchValue={search}
            searchPlaceholder="Поиск по названию, SKU, категории"
            onSearchChange={(value) => {
              setSearch(value);
              loadItems(1, value);
            }}
            onRefresh={() => loadItems(pagination.current, search)}
            onReset={() => {
              setSearch('');
              loadItems(1, '');
            }}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={
              search
                ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => { setSearch(''); loadItems(1, ''); } }]
                : []
            }
          />

          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={(nextPagination) => loadItems(nextPagination.current, search, nextPagination.pageSize)}
            columns={[
              {
                title: 'Позиция',
                key: 'name',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>
                      <ShopOutlined /> {record.name || '-'}
                    </Text>
                    <Text type="secondary">SKU: {record.sku || '-'}</Text>
                  </Space>
                ),
              },
              { title: 'Категория', dataIndex: 'category', key: 'category', render: (value) => value || '-' },
              { title: 'Локация', dataIndex: 'location', key: 'location', render: (value) => value || '-' },
              {
                title: 'Остаток',
                key: 'qty',
                render: (_, record) => `${record.quantity || 0} ${record.unit || 'pcs'}`,
              },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                render: (value) => {
                  const status = statusMap[String(value || '').toLowerCase()] || { color: 'default', label: value || '-' };
                  return <Tag color={status.color}>{status.label}</Tag>;
                },
              },
              {
                title: 'Действия',
                key: 'actions',
                width: 280,
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/warehouse/${record.id}`)}>
                      Просмотр
                    </Button>
                    {canManage ? (
                      <>
                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/warehouse/${record.id}/edit`)}>
                          Редактировать
                        </Button>
                        <Popconfirm
                          title="Удалить позицию?"
                          description="Действие нельзя отменить"
                          onConfirm={() => handleDelete(record.id)}
                          okText="Удалить"
                          cancelText="Отмена"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Удалить
                          </Button>
                        </Popconfirm>
                      </>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
      </Space>
    </BusinessEntityListShell>
  );
}
