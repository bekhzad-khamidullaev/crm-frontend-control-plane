const DEAL_CARD_ID_PREFIX = 'deal-';
const STAGE_DROPPABLE_PREFIX = 'stage-';
const NO_STAGE_DROPPABLE_ID = 'stage-none';

export interface DealStageLike {
  id: number;
  name: string;
  index_number?: number | null;
}

export interface DealKanbanColumn {
  stageId: number | null;
  title: string;
  droppableId: string;
  order: number;
}

export const DEALS_KANBAN_IDS = {
  DEAL_CARD_ID_PREFIX,
  STAGE_DROPPABLE_PREFIX,
  NO_STAGE_DROPPABLE_ID,
} as const;

export const toDealCardId = (dealId: number): string => `${DEAL_CARD_ID_PREFIX}${dealId}`;

export const parseDealCardId = (value: string | number): number | null => {
  const raw = String(value);
  if (!raw.startsWith(DEAL_CARD_ID_PREFIX)) return null;

  const parsed = Number(raw.slice(DEAL_CARD_ID_PREFIX.length));
  return Number.isFinite(parsed) ? parsed : null;
};

export const toStageDroppableId = (stageId: number | null): string =>
  stageId === null ? NO_STAGE_DROPPABLE_ID : `${STAGE_DROPPABLE_PREFIX}${stageId}`;

export const parseStageFromDroppable = (value: string | number): number | null | undefined => {
  const raw = String(value);
  if (raw === NO_STAGE_DROPPABLE_ID) return null;
  if (!raw.startsWith(STAGE_DROPPABLE_PREFIX)) return undefined;

  const parsed = Number(raw.slice(STAGE_DROPPABLE_PREFIX.length));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildDealKanbanColumns = (
  stages: DealStageLike[] = [],
  noStageLabel = ''
): DealKanbanColumn[] => {
  const seenStageIds = new Set<number>();
  const stageColumns = stages
    .filter((stage) => stage && Number.isFinite(stage.id) && !seenStageIds.has(stage.id))
    .map((stage) => {
      seenStageIds.add(stage.id);
      return stage;
    })
    .sort((left, right) => {
      const leftOrder = left.index_number ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.index_number ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder === rightOrder) return left.name.localeCompare(right.name);
      return leftOrder - rightOrder;
    })
    .map((stage, index) => ({
      stageId: stage.id,
      title: stage.name,
      droppableId: toStageDroppableId(stage.id),
      order: stage.index_number ?? index + 1,
    }));

  return [
    ...stageColumns,
    {
      stageId: null,
      title: noStageLabel,
      droppableId: NO_STAGE_DROPPABLE_ID,
      order: Number.MAX_SAFE_INTEGER,
    },
  ];
};
