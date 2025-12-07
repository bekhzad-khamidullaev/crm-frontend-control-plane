import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseHash, navigate, onRouteChange } from '../../src/router.js';

describe('Router', () => {
  let originalHash;
  let cleanup;

  beforeEach(() => {
    originalHash = location.hash;
    cleanup?.();
  });

  afterEach(() => {
    location.hash = originalHash;
    cleanup?.();
  });

  describe('parseHash', () => {
    it('parses empty hash to leads-list', () => {
      location.hash = '';
      expect(parseHash()).toEqual({ name: 'leads-list', params: {} });
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