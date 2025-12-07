import { describe, it, expect } from 'vitest';
import store, { getState, setAuth, clearAuth, setLocale, select } from '../../src/lib/store/index.js';

describe('store', () => {
  it('sets and clears auth', () => {
    setAuth({ user: { id: 1 }, token: 't', roles: ['admin'] });
    expect(getState().auth.token).toBe('t');
    clearAuth();
    expect(getState().auth.token).toBe(null);
  });

  it('sets locale', () => {
    setLocale('ru');
    expect(getState().ui.locale).toBe('ru');
  });

  it('select works', () => {
    const token = select(s => s.auth.token);
    expect(token).toBe(null);
  });
});
