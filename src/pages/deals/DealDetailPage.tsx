import { useDeal } from '@/entities/deal/api/queries';
import { EntityDetailShell } from '@/shared/ui';
import { EditOutlined } from '@ant-design/icons';
import { Badge, Button, Descriptions, Spin, Space, Tag, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

const { Text } = Typography;

interface DealDetailPageProps {
  id?: number | string;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ id }) => {
  const dealId = Number(id);
  const { data: deal, isLoading } = useDeal(dealId);
  const canManage = canWrite();

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!deal) {
    return <div>Сделка не найдена</div>;
  }

  // Cast to any to access fields that might be missing in strict type but present in API
  const d = deal as any;

  const items = [
    {
      key: '1',
      label: 'Детали',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
          <Descriptions.Item label="Название">{d.name}</Descriptions.Item>
          <Descriptions.Item label="Сумма">
            {formatCurrency(d.amount, d.currency_name || 'RUB')}
          </Descriptions.Item>
          <Descriptions.Item label="Стадия">
            <Badge color="blue" text={d.stage_name} />
          </Descriptions.Item>
          <Descriptions.Item label="Вероятность">{d.probability}%</Descriptions.Item>

          <Descriptions.Item label="Компания">
            {d.company_name ? (
              <a onClick={() => navigate(`/companies/${d.company}`)}>{d.company_name}</a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Контакт">
            {d.contact_name ? (
              <a onClick={() => navigate(`/contacts/${d.contact}`)}>{d.contact_name}</a>
            ) : (
              '-'
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Ответственный">{d.owner_name}</Descriptions.Item>
          <Descriptions.Item label="Отдел">
            {d.department_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Следующий шаг" span={2}>
            <Space direction="vertical">
              <Text strong>{deal.next_step}</Text>
              <Text type="secondary">
                Дата:{' '}
                {deal.next_step_date
                  ? new Date(deal.next_step_date).toLocaleDateString('ru-RU')
                  : '-'}
              </Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Дата закрытия">
            {deal.closing_date ? new Date(deal.closing_date).toLocaleDateString('ru-RU') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Причина закрытия">
            {d.closing_reason_name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Теги" span={2}>
            {(deal.tags || []).map((tag: any) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Descriptions.Item>

          <Descriptions.Item label="Описание" span={2}>
            {deal.description}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '2',
      label: 'Активность',
      children: <div>История активности (в разработке)</div>,
    },
    {
      key: '3',
      label: 'Звонки',
      children: <div>История звонков (в разработке)</div>,
    },
  ];

  return (
    <EntityDetailShell
      backLabel="Сделки"
      onBack={() => navigate('/deals')}
      title={deal.name}
      subtitle={`Создано: ${new Date(deal.creation_date).toLocaleDateString('ru-RU')}`}
      statusTag={<Tag color={deal.active ? 'green' : 'red'}>{deal.active ? 'Активна' : 'Неактивна'}</Tag>}
      primaryActions={
        canManage ? (
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={() => navigate(`/deals/${dealId}/edit`)}
          >
            Редактировать
          </Button>
        ) : null
      }
      stats={[
        { key: 'amount', label: 'Сумма', value: formatCurrency(d.amount, d.currency_name || 'RUB') },
        { key: 'probability', label: 'Вероятность', value: `${d.probability || 0}%` },
        {
          key: 'nextStepDate',
          label: 'Следующий шаг',
          value: deal.next_step_date
            ? new Date(deal.next_step_date).toLocaleDateString('ru-RU')
            : 'Не назначен',
        },
      ]}
      tabs={items}
      defaultTabKey="1"
    />
  );
};

export default DealDetailPage;
