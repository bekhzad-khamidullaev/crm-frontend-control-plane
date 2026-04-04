import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as auth from '../../src/lib/api/auth.js';
import { navigate, onRouteChange, parseHash } from '../../src/router.js';

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

    it('parses #/chat to chat list screen', () => {
      location.hash = '#/chat';
      expect(parseHash()).toEqual({
        name: 'chat-list',
        params: {},
      });
    });

    it('parses #/chat/123 to chat thread screen', () => {
      location.hash = '#/chat/123';
      expect(parseHash()).toEqual({
        name: 'chat-thread',
        params: { id: '123' },
      });
    });

    it('parses frozen onboarding route to legacy freeze screen', () => {
      location.hash = '#/onboarding';
      expect(parseHash()).toEqual({
        name: 'legacy-freeze',
        params: { freezeType: 'onboarding', sourcePath: '/onboarding' },
      });
    });

    it('parses #/ai-chat to ai-chat screen', () => {
      location.hash = '#/ai-chat';
      expect(parseHash()).toEqual({
        name: 'ai-chat',
        params: {},
      });
    });

    it('parses legacy #/calls-dashboard alias to calls dashboard screen', () => {
      location.hash = '#/calls-dashboard';
      expect(parseHash()).toEqual({
        name: 'calls-dashboard',
        params: {},
      });
    });

    it('parses #/calls/dashboard to calls dashboard screen', () => {
      location.hash = '#/calls/dashboard';
      expect(parseHash()).toEqual({
        name: 'calls-dashboard',
        params: {},
      });
    });

    it('parses legacy technical license route to license workspace', () => {
      location.hash = '#/tech/license';
      expect(parseHash()).toEqual({
        name: 'license-workspace',
        params: {},
      });
    });

    it('parses #/license to license workspace', () => {
      location.hash = '#/license';
      expect(parseHash()).toEqual({
        name: 'license-workspace',
        params: {},
      });
    });
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
