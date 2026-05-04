import { describe, it, expect, vi } from 'vitest';
import { leadsApi } from '../../src/lib/api/client';
import { getLeads } from '../../src/lib/api/leads';

vi.mock('../../src/lib/api/client', () => {
  return {
    leadsApi: {
      list: vi.fn(),
    },
  };
});

describe('Leads API', () => {
  it('getLeads calls the correct endpoint', () => {
    getLeads();
    expect(leadsApi.list).toHaveBeenCalledWith(undefined);
  });
});
