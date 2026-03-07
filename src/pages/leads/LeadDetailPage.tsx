import {
    BankOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    LinkOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Alert,
    App,
    Avatar,
    Button,
    Card,
    Descriptions,
    Empty,
    Modal,
    Space,
    Spin,
    Tag,
    Timeline,
    theme as antdTheme,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDeals } from '@/entities/deal';
// @ts-ignore
import { useLead } from '@/entities/lead/api/queries';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { EntityDetailShell } from '@/shared/ui';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

const { Text } = Typography;

interface LeadDetailPageProps {
  id?: number;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ id }) => {
  const { token } = antdTheme.useToken();
  const { message } = App.useApp();
  const { data: lead, isLoading } = useLead(id!);
  const { data: leadDealsResponse, isLoading: isLeadDealsLoading } = useDeals({
    lead: id,
    page: 1,
    ordering: '-creation_date',
  } as any);
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
          const result = await LeadsService.leadsConvertCreate({
            id,
            requestBody: { create_deal: true } as any,
          });
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

  // Explicitly check for loading status
  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  // If loading is finished but no lead
  if (!lead) {
    return <div>Лид не найден</div>;
  }

  const activityEvents = [
    lead.creation_date
      ? {
          key: 'created',
          timestamp: lead.creation_date,
          color: 'green',
          icon: <ClockCircleOutlined />,
          title: 'Лид создан',
          description: 'Лид добавлен в CRM',
        }
      : null,
    lead.was_in_touch
      ? {
          key: 'converted',
          timestamp: lead.was_in_touch,
          color: 'blue',
          icon: <CheckCircleOutlined />,
          title: 'Лид конвертирован',
          description: leadDeal ? `Создана сделка #${leadDeal.id}` : 'Лид отмечен как конвертированный',
        }
      : null,
    leadDeal?.creation_date
      ? {
          key: 'deal-created',
          timestamp: leadDeal.creation_date,
          color: 'cyan',
          icon: <LinkOutlined />,
          title: `Сделка #${leadDeal.id}`,
          description: leadDeal.name || 'Связанная сделка',
        }
      : null,
    lead.disqualified
      ? {
          key: 'disqualified',
          timestamp: lead.update_date || lead.creation_date,
          color: 'red',
          icon: <ClockCircleOutlined />,
          title: 'Лид дисквалифицирован',
          description: 'Лид переведен в статус "Потерян"',
        }
      : null,
    lead.update_date && lead.update_date !== lead.creation_date
      ? {
          key: 'updated',
          timestamp: lead.update_date,
          color: 'gray',
          icon: <ClockCircleOutlined />,
          title: 'Последнее обновление',
          description: 'Изменены данные лида',
        }
      : null,
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf()) as Array<{
    key: string;
    timestamp: string;
    color: string;
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2 }}
          contentStyle={{ background: token.colorBgContainer }}
          labelStyle={{ background: token.colorFillAlter }}
        >
          <Descriptions.Item label="ФИО" span={2}>
            <Space>
               <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
               <Text strong>{lead.full_name}</Text>
               {lead.disqualified && <Tag color="red">Дисквалифицирован</Tag>}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Должность">
             {lead.title || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Компания">
             {lead.company_name ? (
               <Space>
                 <BankOutlined /> {lead.company_name}
               </Space>
             ) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
             {lead.email ? <a href={`mailto:${lead.email}`}><MailOutlined /> {lead.email}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Телефон">
             {lead.phone ? <a href={`tel:${lead.phone}`}><PhoneOutlined /> {lead.phone}</a> : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Адрес" span={2}>
            {lead.address || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Ответственный">
            {lead.owner || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Источник">
            {lead.lead_source || '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Дата создания">
            {lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY HH:mm') : '-'}
          </Descriptions.Item>

           <Descriptions.Item label="Теги" span={2}>
            {(lead.tags || []).map(tag => <Tag key={tag}>{tag}</Tag>)}
          </Descriptions.Item>

          <Descriptions.Item label="Сделка" span={2}>
            {isConverted ? (
              leadDeal ? (
                <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>
                  {leadDeal.name || `Сделка #${leadDeal.id}`}
                </Button>
              ) : (
                <Text type="secondary">{isLeadDealsLoading ? 'Поиск сделки...' : 'Сделка не найдена'}</Text>
              )
            ) : (
              '-'
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Описание" span={2}>
            {lead.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'activity',
      label: 'История',
      children: (
        <Card variant="borderless" styles={{ body: { padding: 0 } }}>
          {activityEvents.length ? (
            <Timeline
              items={activityEvents.map((event) => ({
                color: event.color,
                dot: event.icon,
                children: (
                  <Space direction="vertical" size={2}>
                    <Text strong>{event.title}</Text>
                    <Text>{event.description}</Text>
                    <Text type="secondary">{dayjs(event.timestamp).format('DD.MM.YYYY HH:mm')}</Text>
                  </Space>
                ),
              }))}
            />
          ) : (
            <Empty description="История взаимодействий пока пуста" />
          )}
        </Card>
      )
    }
  ];

  return (
    <div>
      {isConverted && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            leadDeal ? (
              <Space size={4}>
                Лид конвертирован.
                <Button type="link" onClick={() => navigate(`/deals/${leadDeal.id}`)} style={{ paddingInline: 0 }}>
                  Открыть сделку
                </Button>
              </Space>
            ) : (
              'Лид конвертирован'
            )
          }
        />
      )}

      <EntityDetailShell
        onBack={() => navigate('/leads')}
        title={lead.full_name}
        subtitle={lead.email || lead.phone || lead.title || 'Карточка лида'}
        statusTag={
          lead.disqualified ? <Tag color="red">Потерян</Tag> : (
            isConverted ? <Tag color="success">Конвертирован</Tag> : <Tag color="processing">В работе</Tag>
          )
        }
        primaryActions={
          <Space wrap>
            {canManage && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/leads/${id}/edit`)}
              >
                Редактировать
              </Button>
            )}
            {canManage && (
              <Button
                onClick={handleConvertToDeal}
                loading={isConverting}
                disabled={isConverted}
              >
                {isConverted ? 'Уже конвертирован' : 'Конвертировать в сделку'}
              </Button>
            )}
          </Space>
        }
        secondaryActions={
          leadDeal ? (
            <Button icon={<LinkOutlined />} onClick={() => navigate(`/deals/${leadDeal.id}`)}>
              Открыть сделку
            </Button>
          ) : null
        }
        stats={[
          { key: 'source', label: 'Источник', value: String(lead.lead_source || 'Не указан') },
          { key: 'owner', label: 'Ответственный', value: String(lead.owner || 'Не назначен') },
          {
            key: 'created',
            label: 'Создан',
            value: lead.creation_date ? dayjs(lead.creation_date).format('DD.MM.YYYY') : '-',
          },
        ]}
        tabs={tabItems}
        defaultTabKey="details"
      />
    </div>
  );
};

export default LeadDetailPage;
