import { describe, it, expect, vi } from 'vitest';
import { api } from '../../src/lib/api/client';
import * as contactsAPI from '../../src/lib/api/contacts';

vi.mock('../../src/lib/api/client');

describe('Contacts API', () => {
  it('getContacts calls the correct endpoint', () => {
    contactsAPI.getContacts();
    expect(api.get).toHaveBeenCalledWith('/contacts/', { params: undefined });
  });
});
