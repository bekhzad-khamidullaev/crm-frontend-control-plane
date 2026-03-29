import { describe, expect, it } from 'vitest';

import { getRejectedReason, isDealRejected, toNumberSafe } from '../../src/widgets/deals-rejections/model/rejectionHelpers';

describe('deals rejections helpers', () => {
  it('marks deal rejected by explicit closing reason', () => {
    const deal = { id: 1, stage_name: 'Переговоры', status: 'open', closing_reason: 3 } as any;
    expect(isDealRejected(deal)).toBe(true);
    expect(getRejectedReason(deal)).toBe('Причина #3');
  });

  it('marks deal rejected by lost status/stage patterns', () => {
    const byStage = { id: 2, stage_name: 'Closed Lost', status: 'in_progress' } as any;
    const byStatus = { id: 3, stage_name: 'Согласование', status: 'rejected' } as any;

    expect(isDealRejected(byStage)).toBe(true);
    expect(isDealRejected(byStatus)).toBe(true);
    expect(getRejectedReason(byStage)).toBe('Closed Lost');
    expect(getRejectedReason(byStatus)).toBe('rejected');
  });

  it('falls back to inactive closed deals and safe numeric conversion', () => {
    const inactive = {
      id: 4,
      stage_name: 'Активная',
      status: 'open',
      active: false,
      closing_date: '2026-03-10',
      amount: '100.25',
    } as any;

    expect(isDealRejected(inactive)).toBe(true);
    expect(toNumberSafe(inactive.amount)).toBe(100.25);
    expect(toNumberSafe('not-a-number')).toBe(0);
  });
});
