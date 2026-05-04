const TASK_CARD_ID_PREFIX = 'task-';
const STAGE_DROPPABLE_PREFIX = 'stage-';
const NO_STAGE_DROPPABLE_ID = 'stage-none';

export const TASKS_KANBAN_IDS = {
  TASK_CARD_ID_PREFIX,
  STAGE_DROPPABLE_PREFIX,
  NO_STAGE_DROPPABLE_ID,
};

export const toTaskCardId = (taskId) => `${TASK_CARD_ID_PREFIX}${taskId}`;

export const parseTaskCardId = (value) => {
  const raw = String(value);
  if (!raw.startsWith(TASK_CARD_ID_PREFIX)) return null;

  const parsed = Number(raw.slice(TASK_CARD_ID_PREFIX.length));
  return Number.isFinite(parsed) ? parsed : null;
};

export const toTaskStageDroppableId = (stageId) =>
  stageId === null || stageId === undefined ? NO_STAGE_DROPPABLE_ID : `${STAGE_DROPPABLE_PREFIX}${stageId}`;

export const parseTaskStageFromDroppable = (value) => {
  const raw = String(value);
  if (raw === NO_STAGE_DROPPABLE_ID) return null;
  if (!raw.startsWith(STAGE_DROPPABLE_PREFIX)) return undefined;

  const parsed = Number(raw.slice(STAGE_DROPPABLE_PREFIX.length));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildTaskKanbanColumns = (stages = [], noStageLabel = 'Без стадии') => {
  const seenStageIds = new Set();
  const stageColumns = (Array.isArray(stages) ? stages : [])
    .filter((stage) => stage && Number.isFinite(stage.id) && !seenStageIds.has(stage.id))
    .map((stage) => {
      seenStageIds.add(stage.id);
      return stage;
    })
    .sort((left, right) => {
      const leftOrder = left.index_number ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.index_number ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder === rightOrder) return String(left.name || '').localeCompare(String(right.name || ''), 'ru');
      return leftOrder - rightOrder;
    })
    .map((stage, index) => ({
      stageId: stage.id,
      title: stage.name,
      droppableId: toTaskStageDroppableId(stage.id),
      order: stage.index_number ?? index + 1,
      done: Boolean(stage.done),
    }));

  return [
    ...stageColumns,
    {
      stageId: null,
      title: noStageLabel,
      droppableId: NO_STAGE_DROPPABLE_ID,
      order: Number.MAX_SAFE_INTEGER,
      done: false,
    },
  ];
};
