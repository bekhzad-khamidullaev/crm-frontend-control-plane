import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as auth from '../../src/lib/api/auth.js';
import { getRouteMeta, navigate, onRouteChange, parseHash } from '../../src/router.js';

vi.mock('../../src/lib/api/auth.js', () => ({
  isAuthenticated: vi.fn(),
}));

describe('Router', () => {
  let originalHash;
  let cleanup;

  beforeEach(() => {
    originalHash = location.hash;
    cleanup?.();
    auth.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    location.hash = originalHash;
    cleanup?.();
  });

  describe('parseHash', () => {
    it('parses empty hash to login when not authenticated', () => {
      location.hash = '';
      expect(parseHash()).toEqual({ name: 'login', params: {} });
    });

    it('parses empty hash to dashboard when authenticated', () => {
      location.hash = '';
      auth.isAuthenticated.mockReturnValue(true);
      expect(parseHash()).toEqual({ name: 'dashboard', params: {} });
    });

    it('parses #/login', () => {
      location.hash = '#/login';
      expect(parseHash()).toEqual({ name: 'login', params: {} });
    });

    it('parses #/dashboard', () => {
      location.hash = '#/dashboard';
      expect(parseHash()).toEqual({ name: 'dashboard', params: {} });
    });

    it('parses #/onboarding', () => {
      location.hash = '#/onboarding';
      expect(parseHash()).toEqual({ name: 'onboarding', params: {} });
    });

    it('parses #/licensing', () => {
      location.hash = '#/licensing';
      expect(parseHash()).toEqual({ name: 'control-plane', params: {} });
    });

    it('parses #/leads', () => {
      location.hash = '#/leads';
      expect(parseHash()).toEqual({ name: 'leads-list', params: {} });
    });

    it('parses #/leads/new', () => {
      location.hash = '#/leads/new';
      expect(parseHash()).toEqual({ name: 'leads-new', params: {} });
    });

    it('parses #/leads/123', () => {
      location.hash = '#/leads/123';
      expect(parseHash()).toEqual({ name: 'leads-detail', params: { id: '123' } });
    });

    it('parses #/leads/123/edit', () => {
      location.hash = '#/leads/123/edit';
      expect(parseHash()).toEqual({ name: 'leads-edit', params: { id: '123' } });
    });
  });

  it('exposes unified inbox route features for chat workspace', () => {
    expect(getRouteMeta('chat').features).toEqual(
      expect.arrayContaining(['communications.chat', 'integrations.core', 'inbox.unified']),
    );
  });

  it('uses memo and reminder-specific license features for their routes', () => {
    expect(getRouteMeta('memos-list').feature).toBe('tasks.memos');
    expect(getRouteMeta('reminders-list').feature).toBe('tasks.reminders');
  });

  describe('navigation', () => {
    it('updates hash and triggers route change', (done) => {
      cleanup = onRouteChange((route) => {
        if (route.name === 'dashboard') {
          expect(location.hash).toBe('#/dashboard');
          done();
        }
      });
      navigate('/dashboard');
    });
  });
});
