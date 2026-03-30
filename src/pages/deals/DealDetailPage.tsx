import { useDeal } from '@/entities/deal/api/queries';
import { navigate } from '@/router.js';
import { BellOutlined, EditOutlined, RobotOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Descriptions, Result, Space, Spin, Tag, Tabs, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { formatCurrencyForRecord } from '@/lib/utils/format.js';
// @ts-ignore
import { canWrite, hasAnyFeature } from '@/lib/rbac.js';
import QuickReminderModal from '@/components/reminders/QuickReminderModal.jsx';

const { Text, Title } = Typography;

interface DealDetailPageProps {
  id?: number | string;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ id }) => {
  const dealId = Number(id);
  const { data: deal, isLoading } = useDeal(dealId);
  const canManage = canWrite();
  const canUseAiAssist = hasAnyFeature('ai.assist');
  const [quickReminderOpen, setQuickReminderOpen] = React.useState(false);
  const openAiChat = () => navigate(`/ai-chat?entity_type=deal&entity_id=${dealId}`);

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!deal) {
    return (
      <Result
        status="404"
        title="Сделка не найдена"
        extra={<Button onClick={() => navigate('/deals')}>К списку сделок</Button>}
      />
    );
  }

  const d = deal as any;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/deals')}>Сделки</Button>
          <Tag color={deal.active ? 'green' : 'red'}>{deal.active ? 'Активна' : 'Неактивна'}</Tag>
        </Space>
        <Space wrap>
          <Button icon={<BellOutlined />} onClick={() => setQuickReminderOpen(true)}>
            Напомнить
          </Button>
          {canUseAiAssist ? (
            <Button icon={<RobotOutlined />} onClick={openAiChat}>
              Спросить AI
            </Button>
          ) : null}
          {canManage ? (
            <Button icon={<EditOutlined />} type="primary" onClick={() => navigate(`/deals/${dealId}/edit`)}>
              Редактировать
            </Button>
          ) : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{deal.name}</Title>
        <Text type="secondary">Создано: {new Date(deal.creation_date).toLocaleDateString('ru-RU')}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Сумма">{formatCurrencyForRecord(d.amount, d)}</Card>
        <Card size="small" title="Вероятность">{`${d.probability || 0}%`}</Card>
        <Card size="small" title="Следующий шаг">
          {deal.next_step_date ? new Date(deal.next_step_date).toLocaleDateString('ru-RU') : 'Не назначен'}
        </Card>
      </Space>

      <Card>
        <Tabs
          defaultActiveKey="details"
          items={[
            {
              key: 'details',
              label: 'Детали',
              children: (
                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                  <Descriptions.Item label="Название">{d.name}</Descriptions.Item>
                  <Descriptions.Item label="Сумма">{formatCurrencyForRecord(d.amount, d)}</Descriptions.Item>
                  <Descriptions.Item label="Стадия"><Badge color="blue" text={d.stage_name} /></Descriptions.Item>
                  <Descriptions.Item label="Вероятность">{d.probability}%</Descriptions.Item>
                  <Descriptions.Item label="Компания">
                    {d.company_name ? <a onClick={() => navigate(`/companies/${d.company}`)}>{d.company_name}</a> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Контакт">
                    {d.contact_name ? <a onClick={() => navigate(`/contacts/${d.contact}`)}>{d.contact_name}</a> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ответственный">{d.owner_name}</Descriptions.Item>
                  <Descriptions.Item label="Отдел">{d.department_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Следующий шаг" span={2}>
                    <Space direction="vertical">
                      <Text strong>{deal.next_step}</Text>
                      <Text type="secondary">Дата: {deal.next_step_date ? new Date(deal.next_step_date).toLocaleDateString('ru-RU') : '-'}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Дата закрытия">
                    {deal.closing_date ? new Date(deal.closing_date).toLocaleDateString('ru-RU') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Причина закрытия">{d.closing_reason_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Теги" span={2}>{(deal.tags || []).map((tag: any) => <Tag key={tag}>{tag}</Tag>)}</Descriptions.Item>
                  <Descriptions.Item label="Описание" span={2}>{deal.description || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            { key: 'activity', label: 'Активность', children: <div>История активности (в разработке)</div> },
            { key: 'calls', label: 'Звонки', children: <div>История звонков (в разработке)</div> },
          ]}
        />
      </Card>

      <QuickReminderModal
        open={quickReminderOpen}
        onClose={() => setQuickReminderOpen(false)}
        entityType="deal"
        entityId={dealId}
        entityLabel={deal.name}
      />
    </Space>
  );
};

export default DealDetailPage;
