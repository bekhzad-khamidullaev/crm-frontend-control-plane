import { type Deal, type DealListParams } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
import { useCreateDeal, usePatchDeal } from '@/entities/deal/api/mutations';
import { useStages, CompanySelect, StageSelect } from '@/features/reference';
// @ts-ignore
import { navigate } from '@/router.js';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { useServerTable } from '@/shared/hooks';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Skeleton,
  Space,
  Typography,
  theme,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';
import { DealsTableFilters } from '@/widgets/deals-table/ui/DealsTableFilters';
import {
  buildDealKanbanColumns,
  parseDealCardId,
  parseStageFromDroppable,
  toDealCardId,
  toStageDroppableId,
  type DealKanbanColumn,
  type DealStageLike,
} from './model/helpers';

const { Text } = Typography;

interface DealQuickCreateValues {
  name: string;
  next_step: string;
  stage?: number;
  amount?: number;
  company?: number;
  closing_date?: any;
}

const DealCard: React.FC<{ deal: Deal; readOnly?: boolean }> = ({ deal, readOnly = false }) => {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: toDealCardId(deal.id),
    disabled: readOnly,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.65 : 1,
    cursor: readOnly ? 'pointer' : 'grab',
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${isDragging ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
    boxShadow: isDragging ? token.boxShadowSecondary : undefined,
  };

  const displayAmount =
    deal.amount && deal.amount !== '0'
      ? formatCurrency(deal.amount, (deal as any).currency_code || (deal as any).currency_name)
      : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      bodyStyle={{ padding: 12 }}
      hoverable
      onClick={() => navigate(`/deals/${deal.id}`)}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Text strong>{deal.name}</Text>

        {displayAmount ? <Text>{displayAmount}</Text> : null}
        {deal.company_name ? (
          <Text type="secondary" ellipsis>
            {deal.company_name}
          </Text>
        ) : null}
        {deal.owner_name ? (
          <Space size={6}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text type="secondary" ellipsis>
              {deal.owner_name}
            </Text>
          </Space>
        ) : null}
      </Space>
    </Card>
  );
};

const KanbanColumn: React.FC<{
  column: DealKanbanColumn;
  deals: Deal[];
  loading?: boolean;
  readOnly?: boolean;
  onCreateDeal?: (stageId: number | null) => void;
}> = ({ column, deals, loading = false, readOnly = false, onCreateDeal }) => {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: column.droppableId });

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 290,
        width: 330,
        background: isOver ? token.colorPrimaryBg : token.colorFillQuaternary,
        border: `1px solid ${isOver ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderRadius: 12,
        padding: 12,
        transition: 'all 0.2s ease',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Space>
          <Badge color={column.stageId === null ? token.colorTextQuaternary : token.colorPrimary} />
          <Text strong>{column.title}</Text>
        </Space>
        <Space size={8}>
          <Text type="secondary">{deals.length}</Text>
          {!readOnly ? (
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => onCreateDeal?.(column.stageId)}
            >
              Добавить
            </Button>
          ) : null}
        </Space>
      </Flex>

      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {loading && deals.length === 0 ? <Skeleton active paragraph={{ rows: 2 }} /> : null}
        {!loading && deals.length === 0 ? <Empty description="Пусто" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} readOnly={readOnly} />
        ))}
      </Space>
    </div>
  );
};

const getErrorStatus = (error: any): number => {
  return Number(error?.status || error?.response?.status || error?.body?.status || error?.details?.status || 0);
};

export const DealsKanbanBoard: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const maxItems = 200;
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateStage, setQuickCreateStage] = useState<number | null>(null);
  const [quickCreateForm] = Form.useForm<DealQuickCreateValues>();
  const [boardDeals, setBoardDeals] = useState<Deal[]>([]);
  const [updatingDealId, setUpdatingDealId] = useState<number | null>(null);

  const { message } = App.useApp();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const {
    data,
    total,
    error,
    isLoading,
    isFetching,
    refetch,
    params,
    applyFilters,
  } = useServerTable<Deal>({
    queryKey: dealKeys.lists() as unknown as unknown[],
    queryFn: (queryParams) => DealsService.dealsList(queryParams as any),
    initialPageSize: maxItems,
  });

  const {
    data: stagesResponse,
    error: stagesError,
    isLoading: isStagesLoading,
    refetch: refetchStages,
  } = useStages();

  const patchDeal = usePatchDeal();
  const createDeal = useCreateDeal();

  useEffect(() => {
    setBoardDeals(data ?? []);
  }, [data]);

  const columns = useMemo(
    () => buildDealKanbanColumns((stagesResponse?.results as DealStageLike[] | undefined) ?? []),
    [stagesResponse?.results]
  );

  const stageTitleById = useMemo(() => {
    return columns.reduce<Record<string, string>>((acc, column) => {
      acc[toStageDroppableId(column.stageId)] = column.title;
      return acc;
    }, {});
  }, [columns]);

  const groupedDeals = useMemo(() => {
    const grouped = columns.reduce<Record<string, Deal[]>>((acc, column) => {
      acc[column.droppableId] = [];
      return acc;
    }, {});

    boardDeals.forEach((deal) => {
      const bucketId = toStageDroppableId(deal.stage ?? null);
      if (!grouped[bucketId]) grouped[bucketId] = [];
      grouped[bucketId].push(deal);
    });

    return grouped;
  }, [boardDeals, columns]);

  const isTruncated = total > boardDeals.length;

  const openQuickCreate = (stageId: number | null) => {
    if (readOnly) return;
    setQuickCreateStage(stageId);
    quickCreateForm.setFieldsValue({
      name: '',
      next_step: '',
      stage: stageId ?? undefined,
      amount: undefined,
      company: undefined,
      closing_date: undefined,
    });
    setQuickCreateOpen(true);
  };

  const closeQuickCreate = () => {
    setQuickCreateOpen(false);
    setQuickCreateStage(null);
    quickCreateForm.resetFields();
  };

  const handleQuickCreate = async (values: DealQuickCreateValues) => {
    try {
      await createDeal.mutateAsync({
        ...(values as any),
        stage: values.stage || null,
        company: values.company || null,
        amount: values.amount !== undefined && values.amount !== null ? String(values.amount) : null,
        closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
        active: true,
        relevant: true,
        is_new: true,
      });
      message.success('Сделка создана');
      closeQuickCreate();
      refetch();
    } catch (createError: any) {
      if (createError?.body?.details) {
        const allowedFields: Array<keyof DealQuickCreateValues> = [
          'name',
          'next_step',
          'stage',
          'amount',
          'company',
          'closing_date',
        ];
        const fields = Object.entries(createError.body.details).map(([name, errors]: [string, any]) => ({
          name: name as keyof DealQuickCreateValues,
          errors: Array.isArray(errors) ? errors : [errors],
        })).filter((field) => allowedFields.includes(field.name as keyof DealQuickCreateValues));
        quickCreateForm.setFields(fields as any);
      }

      const statusCode = getErrorStatus(createError);
      if (statusCode === 403) {
        message.error('Недостаточно прав или лицензии для создания сделки');
        return;
      }
      message.error('Не удалось создать сделку');
    }
  };

  const handleStageChange = async (dealId: number, toStage: number | null) => {
    const currentDeal = boardDeals.find((deal) => deal.id === dealId);
    if (!currentDeal) return;

    const fromStage = currentDeal.stage ?? null;
    if (fromStage === toStage) return;

    const previousDeals = boardDeals;
    setBoardDeals((prev) =>
      prev.map((deal) => (deal.id === dealId ? { ...deal, stage: toStage, stage_name: '' } : deal))
    );
    setUpdatingDealId(dealId);

    try {
      await patchDeal.mutateAsync({ id: dealId, data: { stage: toStage } });
      message.success(`Сделка перемещена: ${stageTitleById[toStageDroppableId(toStage)] || 'Без стадии'}`);
    } catch (patchError: any) {
      setBoardDeals(previousDeals);
      const statusCode = getErrorStatus(patchError);
      if (statusCode === 403) {
        message.error('Недостаточно прав или лицензии для изменения стадии сделки');
        return;
      }
      message.error('Не удалось изменить стадию сделки');
    } finally {
      setUpdatingDealId(null);
      refetch();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (readOnly || updatingDealId || patchDeal.isPending) return;
    if (!event.active || !event.over) return;

    const dealId = parseDealCardId(event.active.id);
    const toStage = parseStageFromDroppable(event.over.id);
    if (dealId === null || toStage === undefined) return;

    await handleStageChange(dealId, toStage);
  };

  const refetchAll = () => {
    refetch();
    refetchStages();
  };

  const quickCreateStageLabel = stageTitleById[toStageDroppableId(quickCreateStage)] || 'Без стадии';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <DealsTableFilters
        filters={params as DealListParams}
        onChange={(nextFilters) => applyFilters(nextFilters as Record<string, unknown>)}
        onRefresh={refetchAll}
        loading={isLoading || isFetching || patchDeal.isPending || createDeal.isPending}
      />

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить сделки"
          action={
            <Button size="small" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        />
      ) : null}

      {stagesError ? (
        <Alert
          type="warning"
          showIcon
          message="Справочник стадий недоступен, показан только столбец «Без стадии»."
          action={
            <Button size="small" onClick={() => refetchStages()}>
              Повторить
            </Button>
          }
        />
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {isTruncated ? (
          <Alert
            type="info"
            showIcon
            message={`Показаны первые ${boardDeals.length} из ${total} сделок. Уточните фильтр для полной выборки.`}
          />
        ) : null}

        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <Space align="start" size={16}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.droppableId}
                column={column}
                deals={groupedDeals[column.droppableId] ?? []}
                loading={isLoading || isStagesLoading}
                readOnly={readOnly}
                onCreateDeal={openQuickCreate}
              />
            ))}
          </Space>
        </div>
      </DndContext>

      <Drawer
        title={`Быстрое создание сделки (${quickCreateStageLabel})`}
        open={quickCreateOpen}
        onClose={closeQuickCreate}
        width={480}
        extra={
          <Space>
            <Button onClick={closeQuickCreate}>Отмена</Button>
            <Button type="primary" onClick={() => quickCreateForm.submit()} loading={createDeal.isPending}>
              Создать
            </Button>
          </Space>
        }
      >
        <Form<DealQuickCreateValues> form={quickCreateForm} layout="vertical" onFinish={handleQuickCreate}>
          <Form.Item
            name="name"
            label="Название сделки"
            rules={[{ required: true, message: 'Введите название сделки' }]}
          >
            <Input placeholder="Например: Годовой контракт на сервис" />
          </Form.Item>

          <Form.Item
            name="next_step"
            label="Следующий шаг"
            rules={[{ required: true, message: 'Укажите следующий шаг' }]}
          >
            <Input placeholder="Например: Согласовать КП с клиентом" />
          </Form.Item>

          <Form.Item name="stage" label="Стадия">
            <StageSelect />
          </Form.Item>

          <Form.Item name="company" label="Компания">
            <CompanySelect />
          </Form.Item>

          <Form.Item name="amount" label="Сумма">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>

          <Form.Item name="closing_date" label="Плановая дата закрытия">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
};
