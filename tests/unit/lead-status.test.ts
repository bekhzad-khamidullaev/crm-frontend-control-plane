import { describe, expect, it } from 'vitest';
import { deriveLeadStatus } from '../../src/entities/lead/model/utils';

describe('deriveLeadStatus', () => {
  it('returns lost for disqualified leads', () => {
    expect(deriveLeadStatus({ disqualified: true, contact: null, company: null })).toBe('lost');
  });

  it('returns converted when lead has contact or company', () => {
    expect(deriveLeadStatus({ disqualified: false, contact: 12, company: null })).toBe('converted');
    expect(deriveLeadStatus({ disqualified: false, contact: null, company: 5 })).toBe('converted');
  });

  it('returns new for fresh leads', () => {
    expect(deriveLeadStatus({ disqualified: false, contact: null, company: null })).toBe('new');
  });
});
