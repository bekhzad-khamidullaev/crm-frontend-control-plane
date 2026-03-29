import { describe, expect, it } from 'vitest';
import {
  buildDealKanbanColumns,
  parseDealCardId,
  parseStageFromDroppable,
  toDealCardId,
  toStageDroppableId,
} from '../../src/widgets/deals-kanban/model/helpers';

describe('deals kanban helpers', () => {
  it('builds stage columns ordered by index_number and appends "Без стадии"', () => {
    const columns = buildDealKanbanColumns([
      { id: 3, name: 'Договор', index_number: 3 },
      { id: 1, name: 'Квалификация', index_number: 1 },
      { id: 2, name: 'Коммерческое', index_number: 2 },
    ]);

    expect(columns.map((column) => column.stageId)).toEqual([1, 2, 3, null]);
    expect(columns.at(-1)?.title).toBe('Без стадии');
  });

  it('creates and parses draggable deal ids', () => {
    expect(toDealCardId(42)).toBe('deal-42');
    expect(parseDealCardId('deal-42')).toBe(42);
    expect(parseDealCardId('lead-42')).toBeNull();
    expect(parseDealCardId('deal-abc')).toBeNull();
  });

  it('creates and parses stage droppable ids', () => {
    expect(toStageDroppableId(9)).toBe('stage-9');
    expect(toStageDroppableId(null)).toBe('stage-none');
    expect(parseStageFromDroppable('stage-9')).toBe(9);
    expect(parseStageFromDroppable('stage-none')).toBeNull();
    expect(parseStageFromDroppable('unknown')).toBeUndefined();
  });
});
