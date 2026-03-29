import dayjs from 'dayjs';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDay = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.startOf('day');
};

const toAmount = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const resolveTaskStartDay = (task) => {
  const due = toDay(task?.due_date);
  const nextStep = toDay(task?.next_step_date);
  const created = toDay(task?.creation_date);

  if (nextStep) return nextStep;
  if (created) return created;
  if (due) return due.subtract(2, 'day');
  return null;
};

export const resolveTaskEndDay = (task, startDay = null) => {
  const due = toDay(task?.due_date);
  const nextStep = toDay(task?.next_step_date);
  const created = toDay(task?.creation_date);

  if (due) return due;
  if (nextStep) return nextStep;
  if (created) return created;
  return startDay;
};

export const buildTaskGanttRows = ({
  tasks = [],
  stagesById = {},
  userNameById = {},
  noStageLabel = 'Без стадии',
}) => {
  return (Array.isArray(tasks) ? tasks : [])
    .map((task) => {
      const startDay = resolveTaskStartDay(task);
      const endDay = resolveTaskEndDay(task, startDay);
      if (!startDay || !endDay) return null;

      const normalizedStart = startDay.isAfter(endDay) ? endDay : startDay;
      const normalizedEnd = startDay.isAfter(endDay) ? startDay : endDay;
      const responsibleIds = Array.isArray(task?.responsible) ? task.responsible : [];
      const responsibleLabel = responsibleIds
        .map((userId) => userNameById[userId])
        .filter(Boolean)
        .join(', ');

      return {
        id: task.id,
        name: task.name || `Task #${task.id}`,
        stageId: task.stage ?? null,
        stageLabel: stagesById[task.stage]?.name || noStageLabel,
        responsibleLabel: responsibleLabel || '-',
        startDay: normalizedStart,
        endDay: normalizedEnd,
        startDate: normalizedStart.format('YYYY-MM-DD'),
        endDate: normalizedEnd.format('YYYY-MM-DD'),
        durationDays: Math.max(1, normalizedEnd.diff(normalizedStart, 'day') + 1),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.startDay.valueOf() - right.startDay.valueOf());
};

export const getTaskGanttBounds = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    const today = dayjs().startOf('day');
    return {
      minStart: today,
      maxEnd: today,
      totalDays: 1,
    };
  }

  const minStart = rows.reduce(
    (acc, row) => (row.startDay.isBefore(acc) ? row.startDay : acc),
    rows[0].startDay
  );
  const maxEnd = rows.reduce(
    (acc, row) => (row.endDay.isAfter(acc) ? row.endDay : acc),
    rows[0].endDay
  );
  const totalDays = Math.max(1, maxEnd.diff(minStart, 'day') + 1);

  return { minStart, maxEnd, totalDays };
};

export const getTaskGanttBar = (row, bounds) => {
  const minStart = bounds?.minStart;
  const totalDays = toAmount(bounds?.totalDays);
  if (!minStart || totalDays <= 0) return { leftPercent: 0, widthPercent: 100 };

  const startOffsetDays = Math.max(0, row.startDay.diff(minStart, 'day'));
  const durationDays = Math.max(1, toAmount(row.durationDays));
  const leftPercent = Math.min(100, (startOffsetDays / totalDays) * 100);
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, (durationDays / totalDays) * 100));

  return { leftPercent, widthPercent };
};

export const toDayDistance = (left, right) => {
  if (!left || !right) return 0;
  const leftMs = left.valueOf();
  const rightMs = right.valueOf();
  return Math.round((rightMs - leftMs) / DAY_IN_MS);
};
