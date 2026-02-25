import { useDeal } from '@/entities/deal/api/queries';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Descriptions, Space, Spin, Tabs, Tag, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';

const { Title, Text } = Typography;

interface DealDetailPageProps {
  id?: number | string;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ id }) => {
  const dealId = Number(id);
  const { data: deal, isLoading } = useDeal(dealId);

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
        <Descriptions bordered column={2}>
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
            {d.department ? `#${d.department}` : '-'}
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
            {deal.closing_reason ? `#${deal.closing_reason}` : '-'}
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
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
          Список
        </Button>
        <Button
          icon={<EditOutlined />}
          type="primary"
          onClick={() => navigate(`/deals/${dealId}/edit`)}
        >
          Редактировать
        </Button>
      </Space>

      <Card>
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space direction="vertical">
            <Title level={3} style={{ margin: 0 }}>
              {deal.name}
            </Title>
            <Text type="secondary">
              Создано: {new Date(deal.creation_date).toLocaleDateString('ru-RU')}
            </Text>
          </Space>
          <Space>
            <Tag color={deal.active ? 'green' : 'red'}>{deal.active ? 'Активна' : 'Неактивна'}</Tag>
          </Space>
        </div>

        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
};

export default DealDetailPage;
