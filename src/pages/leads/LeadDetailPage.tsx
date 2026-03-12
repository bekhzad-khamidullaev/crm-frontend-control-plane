import { BankOutlined, CheckCircleOutlined, ClockCircleOutlined, EditOutlined, LinkOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, App, Avatar, Button, Card, Descriptions, Empty, Modal, Result, Space, Spin, Tag, Tabs, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDeals } from '@/entities/deal';
// @ts-ignore
import { useLead } from '@/entities/lead/api/queries';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

const { Text, Title } = Typography;

interface LeadDetailPageProps {
  id?: number;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ id }) => {
  const { message } = App.useApp();
  const { data: lead, isLoading } = useLead(id!);
  const { data: leadDealsResponse, isLoading: isLeadDealsLoading } = useDeals({ lead: id, page: 1, ordering: '-creation_date' } as any);
  const [isConverting, setIsConverting] = React.useState(false);
  const canManage = canWrite();

  const isConverted = Boolean(lead?.contact || lead?.company || lead?.was_in_touch);
  const leadDeal = leadDealsResponse?.results?.[0];

  const handleConvertToDeal = () => {
    if (!id || isConverting || isConverted || !canManage) return;

    Modal.confirm({
      title: 'Конвертировать лид в сделку?',
      content: 'Будут созданы/связаны контакт, компания и новая сделка.',
      okText: 'Конвертировать',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          setIsConverting(true);
          const result = await LeadsService.leadsConvertCreate({ id, requestBody: { create_deal: true } as any });
          message.success('Лид успешно конвертирован');
          if ((result as any)?.deal) {
            navigate(`/deals/${(result as any).deal}`);
            return;
          }
          navigate('/deals');
        } catch (error) {
          console.error(error);
          message.error('Не удалось конвертировать лид');
        } finally {
          setIsConverting(false);
        }
      },
    });
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  if (!lead) return <Result status="404" title="Лид не найден" extra={<Button onClick={() => navigate('/leads')}>К лидам</Button>} />;

  const activityEvents = [
    lead.creation_date ? { key: 'created', timestamp: lead.creation_date, color: 'green', icon: <ClockCircleOutlined />, title: 'Лид создан', description: 'Лид добавлен в CRM' } : null,
    lead.was_in_touch ? { key: 'converted', timestamp: lead.was_in_touch, color: 'blue', icon: <CheckCircleOutlined />, title: 'Лид конвертирован', description: leadDeal ? `Создана сделка #${leadDeal.id}` : 'Лид отмечен как конвертированный' } : null,
    leadDeal?.creation_date ? { key: 'deal-created', timestamp: leadDeal.creation_date, color: 'cyan', icon: <LinkOutlined />, title: `Сделка #${leadDeal.id}`, description: leadDeal.name || 'Связанная сделка' } : null,
    lead.disqualified ? { key: 'disqualified', timestamp: lead.update_date || lead.creation_date, color: 'red', icon: <ClockCircleOutlined />, title: 'Лид дисквалифицирован', description: 'Лид переведен в статус "Потерян"' } : null,
    lead.update_date && lead.update_date !== lead.creation_date ? { key: 'updated', timestamp: lead.update_date, color: 'gray', icon: <ClockCircleOutlined />, title: 'Последнее обновление', description: 'Изменены данные лида' } : null,
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf()) as Array<{ key: string; timestamp: string; color: string; icon: React.ReactNode; title: string; description: string }>;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {isConverted ? (
        <Alert
          type="success"
          showIcon
          message={leadDeal ? <Space size={4}>Лид конвертирован. <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>Открыть сделку</Button></Space> : 'Лид конвертирован'}
        />
      ) : null}

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/leads')}>Назад</Button>
          {lead.disqualified ? <Tag color="red">Потерян</Tag> : isConverted ? <Tag color="success">Конвертирован</Tag> : <Tag color="processing">В работе</Tag>}
        </Space>
        <Space wrap>
          {canManage ? <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/leads/${id}/edit`)}>Редактировать</Button> : null}
          {canManage ? <Button onClick={handleConvertToDeal} loading={isConverting} disabled={isConverted}>{isConverted ? 'Уже конвертирован' : 'Конвертировать в сделку'}</Button> : null}
          {leadDeal ? <Button icon={<LinkOutlined />} onClick={() => navigate(`/deals/${leadDeal.id}`)}>Открыть сделку</Button> : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{lead.full_name}</Title>
        <Text type="secondary">{lead.email || lead.phone || lead.title || 'Карточка лида'}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Источник">{String(lead.lead_source || 'Не указан')}</Card>
        <Card size="small" title="Ответственный">{String(lead.owner || 'Не назначен')}</Card>
        <Card size="small" title="Создан">{lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY') : '-'}</Card>
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
                  <Descriptions.Item label="ФИО" span={2}><Space><Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} /><Text strong>{lead.full_name}</Text>{lead.disqualified ? <Tag color="red">Дисквалифицирован</Tag> : null}</Space></Descriptions.Item>
                  <Descriptions.Item label="Должность">{lead.title || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Компания">{lead.company_name ? <Space><BankOutlined /> {lead.company_name}</Space> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{lead.email ? <a href={`mailto:${lead.email}`}><MailOutlined /> {lead.email}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{lead.phone ? <a href={`tel:${lead.phone}`}><PhoneOutlined /> {lead.phone}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Адрес" span={2}>{lead.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Ответственный">{lead.owner || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Источник">{lead.lead_source || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Теги" span={2}>{(lead.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Descriptions.Item>
                  <Descriptions.Item label="Сделка" span={2}>{isConverted ? leadDeal ? <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>{leadDeal.name || `Сделка #${leadDeal.id}`}</Button> : <Text type="secondary">{isLeadDealsLoading ? 'Поиск сделки...' : 'Сделка не найдена'}</Text> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Описание" span={2}>{lead.description || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'activity',
              label: 'История',
              children: activityEvents.length ? (
                <Timeline
                  items={activityEvents.map((event) => ({
                    color: event.color,
                    dot: event.icon,
                    children: <Space direction="vertical" size={2}><Text strong>{event.title}</Text><Text>{event.description}</Text><Text type="secondary">{dayjs(event.timestamp).format('DD.MM.YYYY HH:mm')}</Text></Space>,
                  }))}
                />
              ) : (
                <Empty description="История взаимодействий пока пуста" />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
};

export default LeadDetailPage;
