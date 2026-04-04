import { useDeal } from '@/entities/deal/api/queries';
import { navigate } from '@/router.js';
import { BellOutlined, EditOutlined, PlayCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Descriptions, Result, Space, Spin, Tag, Tabs, Typography } from 'antd';
import React from 'react';
// @ts-ignore
import { formatCurrencyForRecord } from '@/lib/utils/format.js';
import { buildAiChatUrl } from '@/lib/utils/ai-chat-context.js';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
// @ts-ignore
import { canWrite, hasAnyFeature } from '@/lib/rbac.js';
import QuickReminderModal from '@/components/reminders/QuickReminderModal.jsx';
import { t } from '@/lib/i18n';
import { formatDateByLocale, translateDealStageName } from '@/widgets/deals-table/model/i18n';

const { Text, Title } = Typography;

interface DealDetailPageProps {
  id?: number | string;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ id }) => {
  const dealId = Number(id);
  const { data: deal, isLoading } = useDeal(dealId);
  const canManage = canWrite();
  const canUseAiAssist = hasAnyFeature('ai.assist');
  const canUseBusinessProcesses = hasAnyFeature(['business_processes', 'business_processes.base']);
  const [quickReminderOpen, setQuickReminderOpen] = React.useState(false);
  const openAiChat = () =>
    navigate(
      buildAiChatUrl({
        entityType: 'deal',
        entityId: dealId,
        entityName: deal?.name,
      }),
    );
  const openBusinessProcesses = () => navigate(`/business-processes?context_type=deal&context_id=${dealId}`);

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (!deal) {
    return (
      <Result
        status="404"
        title={t('dealDetailPage.notFound.title')}
        extra={<Button onClick={() => navigate('/deals')}>{t('dealDetailPage.notFound.back')}</Button>}
      />
    );
  }

  const d = deal as any;
  const companyName = getCompanyDisplayName(d);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/deals')}>{t('dealDetailPage.breadcrumb.deals')}</Button>
          <Tag color={deal.active ? 'green' : 'red'}>
            {deal.active ? t('dealDetailPage.status.active') : t('dealDetailPage.status.inactive')}
          </Tag>
        </Space>
        <Space wrap>
          <Button icon={<BellOutlined />} onClick={() => setQuickReminderOpen(true)}>
            {t('dealDetailPage.actions.remind')}
          </Button>
          {canUseAiAssist ? (
            <Button icon={<RobotOutlined />} onClick={openAiChat}>
              {t('dealDetailPage.actions.askAi')}
            </Button>
          ) : null}
          {canUseBusinessProcesses ? (
            <Button icon={<PlayCircleOutlined />} onClick={openBusinessProcesses}>
              Запустить процесс
            </Button>
          ) : null}
          {canManage ? (
            <Button icon={<EditOutlined />} type="primary" onClick={() => navigate(`/deals/${dealId}/edit`)}>
              {t('dealDetailPage.actions.edit')}
            </Button>
          ) : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{deal.name}</Title>
        <Text type="secondary">
          {t('dealDetailPage.createdAt')}: {formatDateByLocale(deal.creation_date)}
        </Text>
      </Card>

      <Space wrap>
        <Card size="small" title={t('dealDetailPage.cards.amount')}>{formatCurrencyForRecord(d.amount, d)}</Card>
        <Card size="small" title={t('dealDetailPage.cards.probability')}>{`${d.probability || 0}%`}</Card>
        <Card size="small" title={t('dealDetailPage.cards.nextStep')}>
          {deal.next_step_date ? formatDateByLocale(deal.next_step_date) : t('dealDetailPage.cards.notAssigned')}
        </Card>
      </Space>

      <Card>
        <Tabs
          defaultActiveKey="details"
          items={[
            {
              key: 'details',
              label: t('dealDetailPage.tabs.details'),
              children: (
                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                  <Descriptions.Item label={t('dealDetailPage.fields.name')}>{d.name}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.amount')}>{formatCurrencyForRecord(d.amount, d)}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.stage')}>
                    <Badge color="blue" text={translateDealStageName(d.stage_name)} />
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.probability')}>{d.probability}%</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.company')}>
                    {d.company ? <a onClick={() => navigate(`/companies/${d.company}`)}>{companyName || t('dealDetailPage.defaults.company')}</a> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.contact')}>
                    {d.contact_name ? <a onClick={() => navigate(`/contacts/${d.contact}`)}>{d.contact_name}</a> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.owner')}>{d.owner_name}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.department')}>{d.department_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.nextStep')} span={2}>
                    <Space direction="vertical">
                      <Text strong>{deal.next_step}</Text>
                      <Text type="secondary">
                        {t('dealDetailPage.fields.date')}: {deal.next_step_date ? formatDateByLocale(deal.next_step_date) : '-'}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.closingDate')}>
                    {deal.closing_date ? formatDateByLocale(deal.closing_date) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.closingReason')}>{d.closing_reason_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.tags')} span={2}>{(deal.tags || []).map((tag: any) => <Tag key={tag}>{tag}</Tag>)}</Descriptions.Item>
                  <Descriptions.Item label={t('dealDetailPage.fields.description')} span={2}>{deal.description || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            { key: 'activity', label: t('dealDetailPage.tabs.activity'), children: <div>{t('dealDetailPage.placeholders.activity')}</div> },
            { key: 'calls', label: t('dealDetailPage.tabs.calls'), children: <div>{t('dealDetailPage.placeholders.calls')}</div> },
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
