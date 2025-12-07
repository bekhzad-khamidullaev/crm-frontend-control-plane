import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactsList } from '../../src/modules/contacts/ContactsList.js';

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
}));

vi.mock('../../src/lib/api/client.js', () => ({
  contactsApi: {
    list: vi.fn(),
    remove: vi.fn(),
    patch: vi.fn(),
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
  const list = ContactsList();
  host.appendChild(list);
  return { host, list };
}

async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ContactsList', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    const { contactsApi, usersApi, crmTagsApi } = await import('../../src/lib/api/client.js');
    contactsApi.list.mockResolvedValue({ results: [], count: 0 });
    usersApi.list.mockResolvedValue({ results: [] });
    crmTagsApi.list.mockResolvedValue({ results: [] });
  });

  it('renders layout and spinner initially', async () => {
    const { list } = render();
    await flush();
    expect(list.querySelector('.mdc-card')).toBeTruthy();
    expect(list.textContent).toContain('Contacts');
  });

  it('renders contacts data when loaded', async () => {
    const { contactsApi } = await import('../../src/lib/api/client.js');
    contactsApi.list.mockResolvedValue({
      results: [{ id: 2, first_name: 'Grace', last_name: 'Hopper', email: 'grace@test.com' }],
      count: 1,
    });
    const { list } = render();
    await flush();
    const table = list.querySelector('table');
    expect(table).toBeTruthy();
    expect(table.textContent).toContain('Grace Hopper');
    expect(table.textContent).toContain('grace@test.com');
  });

  it('debounces search input', async () => {
    const { contactsApi } = await import('../../src/lib/api/client.js');
    contactsApi.list.mockResolvedValue({ results: [], count: 0 });
    const { list } = render();
    const search = list.querySelector('input[type=\"search\"]');
    search.value = 'hopper';
    search.dispatchEvent(new Event('input'));
    expect(contactsApi.list).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'hopper' }));
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(contactsApi.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'hopper' }));
  });
});
