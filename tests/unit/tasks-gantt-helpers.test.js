import { describe, expect, it } from 'vitest';

import {
  buildTaskGanttRows,
  getTaskGanttBar,
  getTaskGanttBounds,
  resolveTaskEndDay,
  resolveTaskStartDay,
  toDayDistance,
} from '../../src/modules/tasks/model/ganttHelpers.js';

describe('tasks gantt helpers', () => {
  it('resolves start and end dates with fallback priority', () => {
    const task = {
      due_date: '2026-03-20T09:00:00Z',
      next_step_date: '2026-03-18T12:00:00Z',
      creation_date: '2026-03-10T10:00:00Z',
    };

    expect(resolveTaskStartDay(task)?.format('YYYY-MM-DD')).toBe('2026-03-18');
    expect(resolveTaskEndDay(task)?.format('YYYY-MM-DD')).toBe('2026-03-20');
  });

  it('builds deterministic gantt rows and normalizes reversed ranges', () => {
    const rows = buildTaskGanttRows({
      tasks: [
        {
          id: 1,
          name: 'Просроченная задача',
          stage: 2,
          due_date: '2026-03-10',
          creation_date: '2026-03-15',
          responsible: [7],
        },
        {
          id: 2,
          name: 'Обычная задача',
          stage: 1,
          due_date: '2026-03-18',
          creation_date: '2026-03-12',
          responsible: [8],
        },
      ],
      stagesById: {
        1: { name: 'Новая' },
        2: { name: 'В работе' },
      },
      userNameById: {
        7: 'Менеджер 7',
        8: 'Менеджер 8',
      },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe(1);
    expect(rows[0].startDate).toBe('2026-03-10');
    expect(rows[0].endDate).toBe('2026-03-15');
    expect(rows[0].stageLabel).toBe('В работе');
    expect(rows[0].responsibleLabel).toBe('Менеджер 7');
  });

  it('computes bounds and bar geometry for gantt row', () => {
    const rows = buildTaskGanttRows({
      tasks: [
        { id: 1, due_date: '2026-03-10', creation_date: '2026-03-10' },
        { id: 2, due_date: '2026-03-20', creation_date: '2026-03-15' },
      ],
    });

    const bounds = getTaskGanttBounds(rows);
    expect(bounds.totalDays).toBeGreaterThanOrEqual(11);

    const bar = getTaskGanttBar(rows[1], bounds);
    expect(bar.leftPercent).toBeGreaterThan(0);
    expect(bar.widthPercent).toBeGreaterThan(0);
    expect(bar.leftPercent + bar.widthPercent).toBeLessThanOrEqual(100);
  });

  it('returns sane defaults for empty rows and missing dates', () => {
    const bounds = getTaskGanttBounds([]);
    expect(bounds.totalDays).toBe(1);
    expect(toDayDistance(null, null)).toBe(0);
  });
});
