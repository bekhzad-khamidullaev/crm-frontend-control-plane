import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { BusinessEntityListShell } from '../../components/business/BusinessEntityListShell';
import { deleteFinancePlan, getFinancePlans } from '../../lib/api/financePlans.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { formatCurrencyForRecord } from '../../lib/utils/format';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Text } = Typography;

const statusMeta = {
  draft: { color: 'default', label: 'Черновик' },
  approved: { color: 'processing', label: 'Согласован' },
  closed: { color: 'success', label: 'Закрыт' },
};

export default function FinancePlansList() {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('billing.invoicing');
  const canManage = canWrite('crm.change_financeplan');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadPlans = async (page = 1, searchValue = search, pageSize = pagination.pageSize) => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      const response = await getFinancePlans({
        page,
        page_size: pageSize,
        search: searchValue || undefined,
        ordering: '-period_month',
      });
      setPlans(response?.results || []);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: response?.count || 0 }));
    } catch {
      message.error('Не удалось загрузить финпланы');
      setPlans([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadPlans(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadFeature]);

  const handleDelete = async (id) => {
    try {
      await deleteFinancePlan(id);
      message.success('Финплан удален');
      loadPlans(pagination.current);
    } catch {
      message.error('Не удалось удалить финплан');
    }
  };

  if (!canReadFeature) {
    return (
      <BusinessEntityListShell title="Финплан" subtitle="Полноценный CRUD по финансовому планированию">
        <BusinessFeatureGateNotice
          featureCode="billing.invoicing"
          description="Для доступа к финансовому планированию включите модуль Invoicing в лицензии."
        />
      </BusinessEntityListShell>
    );
  }

  return (
    <BusinessEntityListShell
        title="Финплан"
        subtitle="Полноценный CRUD по финансовому планированию"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/finance-planning/new')}>
              Создать план
            </Button>
          ) : null
        }
      >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <EntityListToolbar
            searchValue={search}
            searchPlaceholder="Поиск по названию или комментарию"
            onSearchChange={(value) => {
              setSearch(value);
              loadPlans(1, value);
            }}
            onRefresh={() => loadPlans(pagination.current, search)}
            onReset={() => {
              setSearch('');
              loadPlans(1, '');
            }}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={
              search
                ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => { setSearch(''); loadPlans(1, ''); } }]
                : []
            }
          />

          <Table
            rowKey="id"
            loading={loading}
            dataSource={plans}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={(nextPagination) => loadPlans(nextPagination.current, search, nextPagination.pageSize)}
            columns={[
              {
                title: 'План',
                key: 'title',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{record.title || '-'}</Text>
                    <Text type="secondary">{record.period_month ? dayjs(record.period_month).format('MM.YYYY') : '-'}</Text>
                  </Space>
                ),
              },
              {
                title: 'План доход/расход',
                key: 'plan',
                render: (_, record) => `${formatCurrencyForRecord(record.planned_income || 0, record)} / ${formatCurrencyForRecord(record.planned_expense || 0, record)}`,
              },
              {
                title: 'Факт доход/расход',
                key: 'fact',
                render: (_, record) => `${formatCurrencyForRecord(record.actual_income || 0, record)} / ${formatCurrencyForRecord(record.actual_expense || 0, record)}`,
              },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                render: (value) => {
                  const meta = statusMeta[String(value || '').toLowerCase()] || { color: 'default', label: value || '-' };
                  return <Tag color={meta.color}>{meta.label}</Tag>;
                },
              },
              {
                title: 'Действия',
                key: 'actions',
                width: 280,
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/finance-planning/${record.id}`)}>
                      Просмотр
                    </Button>
                    {canManage ? (
                      <>
                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/finance-planning/${record.id}/edit`)}>
                          Редактировать
                        </Button>
                        <Popconfirm
                          title="Удалить финплан?"
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
