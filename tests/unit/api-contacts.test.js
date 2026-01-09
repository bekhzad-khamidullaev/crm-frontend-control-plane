import { describe, it, expect, vi } from 'vitest';
import client from '../../src/lib/api/client';
import contactsAPI from '../../src/lib/api/contacts';

vi.mock('../../src/lib/api/client');

describe('Contacts API', () => {
  it('getContacts calls the correct endpoint', () => {
    contactsAPI.getContacts();
    expect(client.get).toHaveBeenCalledWith('/contacts/', { params: undefined });
  });
});
