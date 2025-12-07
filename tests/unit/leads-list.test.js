import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeadsList } from '../../src/modules/leads/LeadsList.js';

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
}));

vi.mock('../../src/lib/api/client.js', () => ({
  leadsApi: {
    list: vi.fn(),
    remove: vi.fn(),
    assign: vi.fn(),
    disqualify: vi.fn(),
    patch: vi.fn(),
    convert: vi.fn(),
  },
  usersApi: {
    list: vi.fn(),
  },
  crmTagsApi: {
    list: vi.fn(),
  },
}));

vi.mock('../../src/router.js', () => ({
  navigate: vi.fn(),
}));

function render() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const list = LeadsList();
  host.appendChild(list);
  return { host, list };
}

async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('LeadsList', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    const { leadsApi, usersApi, crmTagsApi } = await import('../../src/lib/api/client.js');
    usersApi.list.mockResolvedValue({ results: [] });
    crmTagsApi.list.mockResolvedValue({ results: [] });
    leadsApi.list.mockResolvedValue({ results: [], count: 0 });
  });

  it('renders layout and spinner initially', async () => {
    const { list } = render();
    await flush();
    expect(list.querySelector('.mdc-card')).toBeTruthy();
    expect(list.textContent).toContain('Leads');
  });

  it('renders leads data when loaded', async () => {
    const { leadsApi, usersApi } = await import('../../src/lib/api/client.js');
    usersApi.list.mockResolvedValue({ results: [] });
    leadsApi.list.mockResolvedValue({
      results: [{ id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@test.com' }],
      count: 1,
    });

    const { list } = render();
    await flush();

    const table = list.querySelector('table');
    expect(table).toBeTruthy();
    expect(table.textContent).toContain('Ada Lovelace');
    expect(table.textContent).toContain('ada@test.com');
  });

  it('handles search input with debounce', async () => {
    const { leadsApi } = await import('../../src/lib/api/client.js');
    leadsApi.list.mockResolvedValue({ results: [], count: 0 });

    const { list } = render();
    const search = list.querySelector('input[type="search"]');

    search.value = 'prospect';
    search.dispatchEvent(new Event('input'));

    expect(leadsApi.list).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'prospect' }));

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(leadsApi.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'prospect' }));
  });

  it('saves inline edits on blur', async () => {
    const { leadsApi } = await import('../../src/lib/api/client.js');
    leadsApi.list.mockResolvedValue({
      results: [{ id: 3, first_name: 'Alan', last_name: 'Turing', email: 'old@test.com', phone: '123' }],
      count: 1,
    });
    leadsApi.patch.mockResolvedValue({});

    const { list } = render();
    await flush();

    const emailInput = list.querySelector('input[type="email"]');
    emailInput.value = 'new@test.com';
    emailInput.dispatchEvent(new Event('blur'));

    await flush();
    expect(leadsApi.patch).toHaveBeenCalledWith(3, expect.objectContaining({ email: 'new@test.com' }));
  });
});
