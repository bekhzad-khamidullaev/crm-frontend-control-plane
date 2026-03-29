import { describe, expect, it } from 'vitest';

import {
  buildTaskKanbanColumns,
  parseTaskCardId,
  parseTaskStageFromDroppable,
  toTaskCardId,
  toTaskStageDroppableId,
} from '../../src/modules/tasks/model/kanbanHelpers.js';

describe('tasks kanban helpers', () => {
  it('builds deterministic stage columns and no-stage bucket', () => {
    const columns = buildTaskKanbanColumns([
      { id: 3, name: 'Done', index_number: 30 },
      { id: 1, name: 'New', index_number: 10 },
      { id: 2, name: 'In progress', index_number: 20 },
    ]);

    expect(columns.map((item) => item.stageId)).toEqual([1, 2, 3, null]);
    expect(columns[0].droppableId).toBe('stage-1');
    expect(columns[3].droppableId).toBe('stage-none');
  });

  it('parses and serializes card ids', () => {
    expect(toTaskCardId(42)).toBe('task-42');
    expect(parseTaskCardId('task-42')).toBe(42);
    expect(parseTaskCardId('deal-42')).toBeNull();
  });

  it('parses stage droppable ids and no-stage target', () => {
    expect(toTaskStageDroppableId(15)).toBe('stage-15');
    expect(toTaskStageDroppableId(null)).toBe('stage-none');
    expect(parseTaskStageFromDroppable('stage-15')).toBe(15);
    expect(parseTaskStageFromDroppable('stage-none')).toBeNull();
    expect(parseTaskStageFromDroppable('random-id')).toBeUndefined();
  });
});
