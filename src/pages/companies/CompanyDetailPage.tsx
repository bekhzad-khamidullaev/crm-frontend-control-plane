import React, { useMemo } from 'react';
import { Space, Button, Typography, Descriptions, Tag, Avatar, List, Table, Card, Tabs } from 'antd';
import { EditOutlined, PlayCircleOutlined, RobotOutlined, ShopOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '@/router.js';
import { BusinessScreenState } from '@/components/business/BusinessScreenState';
import { usePatchDeal } from '@/entities/deal/api/mutations';
import { useCompany, useCompanyContacts, useCompanyDeals } from '@/entities/company/api/queries';
import { useClientTypes, useIndustries, useStages } from '@/features/reference';
import { getClientTypeLabel } from '@/features/reference/lib/clientTypeLabel';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
import { buildAiChatUrl } from '@/lib/utils/ai-chat-context.js';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
// @ts-ignore
import { canWrite, hasAnyFeature } from '@/lib/rbac.js';
// @ts-ignore
import { getLocale } from '@/lib/i18n';
// @ts-ignore
import {
  countDistinctCurrencies,
  formatCurrencyBreakdownFromItems,
  formatCurrencyForRecord,
  formatDate,
} from '@/lib/utils/format.js';

const { Text, Title } = Typography;
const idsEqual = (left: unknown, right: unknown) => String(left) === String(right);

export interface CompanyDetailPageProps {
  id?: number;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ id }) => {
  const canManage = canWrite();
  const canUseAiAssist = hasAnyFeature('ai.assist');
  const canUseBusinessProcesses = hasAnyFeature(['business_processes', 'business_processes.base']);

  const { data: company, isLoading: isLoadingCompany } = useCompany(id!);
  const { data: contactsData, isLoading: isLoadingContacts } = useCompanyContacts(id!);
  const { data: dealsData, isLoading: isLoadingDeals } = useCompanyDeals(id!);
  const { data: clientTypes } = useClientTypes();
  const { data: industries } = useIndustries();
  const { data: stagesData } = useStages();
  const patchDeal = usePatchDeal();

  const contacts = contactsData?.results || [];
  const deals = dealsData?.results || [];
  const contactsTotal = contactsData?.count ?? contacts.length;
  const dealsTotal = dealsData?.count ?? deals.length;
  const locale = getLocale();

  const companyName = getCompanyDisplayName(company) || 'Компания';

  const clientTypeName = useMemo(
    () => getClientTypeLabel(clientTypes?.results?.find((t) => idsEqual(t.id, company?.type))?.name, locale),
    [clientTypes, company, locale],
  );

  const industryNames = useMemo(
    () => company?.industry?.map((indId: number) => industries?.results?.find((i) => idsEqual(i.id, indId))?.name).filter(Boolean) || [],
    [industries, company],
  );

  const dealsAmountLabel = useMemo(() => formatCurrencyBreakdownFromItems(deals), [deals]);
  const dealCurrenciesCount = useMemo(() => countDistinctCurrencies(deals), [deals]);
  const openAiChat = () =>
    navigate(buildAiChatUrl({ entityType: 'company', entityId: id, entityName: companyName }));
  const openBusinessProcesses = () => navigate(`/business-processes?context_type=company&context_id=${id}`);

  const stageOptions = useMemo(
    () =>
      (stagesData?.results || []).map((stage) => ({
        value: stage.id,
        label: stage.name_ru || stage.name || 'Стадия',
      })),
    [stagesData],
  );

  const handleDealInlineSave = async (record: any, dataIndex: string, value: any) => {
    if (!canManage) return;
    const normalizeForeignKeyValue = (raw: unknown): number | null => {
      if (raw === null || raw === undefined || raw === '') return null;
      if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
      const asNumber = Number(raw);
      return Number.isFinite(asNumber) ? asNumber : null;
    };

    let normalizedValue = value;
    if (dataIndex === 'stage') {
      normalizedValue = normalizeForeignKeyValue(value);
    }
    if (dataIndex === 'closing_date' && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }
    await patchDeal.mutateAsync({
      id: record.id,
      data: { [dataIndex]: normalizedValue } as any,
    });
  };

  if (isLoadingCompany) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка компании"
        description="Подготавливаем карточку компании, контакты и сделки."
      />
    );
  }

  if (!company) {
    return (
      <BusinessScreenState
        variant="notFound"
        title="Компания не найдена"
        actionLabel="К компаниям"
        onAction={() => navigate('/companies')}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button onClick={() => navigate('/companies')}>Назад</Button>
          {company.active ? <Tag color="success">Активна</Tag> : <Tag>Неактивна</Tag>}
        </Space>
        <Space wrap>
          {canUseAiAssist ? (
            <Button icon={<RobotOutlined />} onClick={openAiChat}>
              Спросить AI
            </Button>
          ) : null}
          {canUseBusinessProcesses ? (
            <Button icon={<PlayCircleOutlined />} onClick={openBusinessProcesses}>
              Запустить процесс
            </Button>
          ) : null}
          {canManage ? (
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/companies/${id}/edit`)}>
              Редактировать
            </Button>
          ) : null}
        </Space>
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>{companyName}</Title>
        <Text type="secondary">{company.email || company.phone || company.website || 'Карточка компании'}</Text>
      </Card>

      <Space wrap>
        <Card size="small" title="Контакты">{contactsTotal}</Card>
        <Card size="small" title="Сделки">{dealsTotal}</Card>
        <Card size="small" title="Сумма сделок">
          <Space direction="vertical" size={0}>
            <span>{dealsAmountLabel}</span>
            {dealCurrenciesCount > 1 ? <Text type="secondary">Мультивалютно</Text> : null}
          </Space>
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
                  <Descriptions.Item label="Название" span={2}>
                    <Space><Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} /><Text strong>{companyName}</Text></Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Тип">{clientTypeName ? <Tag color="blue">{clientTypeName}</Tag> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Отрасли">{industryNames.length > 0 ? (industryNames as string[]).join(', ') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Телефон">{company.phone ? <a href={`tel:${company.phone}`}>{company.phone}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Веб-сайт" span={2}>{company.website ? <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Адрес" span={2}>{company.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Последний контакт">{company.was_in_touch ? dayjs(company.was_in_touch).format('DD.MM.YYYY') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="Дата создания">{formatDate(company.creation_date, 'datetime')}</Descriptions.Item>
                  <Descriptions.Item label="ФИО подписанта">{company.legal_signer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Должность подписанта">{company.legal_signer_position || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Основание подписания" span={2}>{company.legal_signing_basis || '-'}</Descriptions.Item>
                  <Descriptions.Item label="СТИР / ИНН">{company.legal_stir || '-'}</Descriptions.Item>
                  <Descriptions.Item label="МФО">{company.legal_mfo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Расчетный счет" span={2}>{company.legal_account || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Банк" span={2}>{company.legal_bank_name || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'contacts',
              label: `Контакты (${contactsTotal})`,
              children: (
                <List
                  loading={isLoadingContacts}
                  dataSource={contacts}
                  renderItem={(contact: any) => (
                    <List.Item actions={[<Button type="link" onClick={() => navigate(`/contacts/${contact.id}`)}>Просмотр</Button>]}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<TeamOutlined />} />}
                        title={contact.full_name || contact.name}
                        description={<Space direction="vertical" size="small"><Text type="secondary">{contact.position || '-'}</Text><Text type="secondary"><PhoneOutlined /> {contact.phone || '-'}</Text></Space>}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'deals',
              label: `Сделки (${dealsTotal})`,
              children: (
                <Table
                  dataSource={deals}
                  loading={isLoadingDeals}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'Название', dataIndex: 'name', key: 'name', render: (val: string, rec: any) => <a onClick={() => navigate(`/deals/${rec.id}`)}>{val}</a> },
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (val: number, record: any) => formatCurrencyForRecord(val, record),
                    },
                    {
                      title: 'Стадия',
                      dataIndex: 'stage',
                      key: 'stage',
                      render: (stageId: number | null | undefined, record: any) => (
                        <EditableCell
                          value={stageId}
                          record={record}
                          dataIndex="stage"
                          editable={canManage}
                          type="select"
                          options={stageOptions}
                          onSave={handleDealInlineSave}
                          saveOnBlur={false}
                          renderView={(val: number | null | undefined) => {
                            const option = stageOptions.find((item) => String(item.value) === String(val));
                            return option?.label || record.stage_name || '-';
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Дата закрытия',
                      dataIndex: 'closing_date',
                      key: 'closing_date',
                      render: (val: string, record: any) => (
                        <EditableCell
                          value={val}
                          record={record}
                          dataIndex="closing_date"
                          editable={canManage}
                          type="date"
                          onSave={handleDealInlineSave}
                          renderView={(viewDate: string | null | undefined) => {
                            if (!viewDate) return '-';
                            const d = new Date(viewDate);
                            return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ru-RU');
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
};

export default CompanyDetailPage;
