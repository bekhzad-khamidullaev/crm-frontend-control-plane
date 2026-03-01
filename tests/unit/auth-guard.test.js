import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAuth, authGuardMiddleware, getAuthStatus, useAuthGuard } from '../../src/lib/auth-guard';
import * as auth from '../../src/lib/api/auth';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/auth');
vi.mock('../../src/router');

describe('Auth Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('checkAuth', () => {
    it('allows access for authenticated users', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('valid-token');
      auth.isTokenExpired.mockReturnValue(false);

      const result = checkAuth({ name: 'dashboard' }, true);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirects to login for unauthenticated users', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = checkAuth({ name: 'dashboard' }, true);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/login');
    });

    it('allows access to public routes without auth', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = checkAuth({ name: 'login' }, false);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirects to login when token is expired', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('expired-token');
      auth.isTokenExpired.mockReturnValue(true);

      const result = checkAuth({ name: 'dashboard' }, true);

      expect(result).toBe(false);
      expect(auth.clearToken).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith('/login');
    });

    it('redirects to forbidden when required role is missing', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('valid-token');
      auth.isTokenExpired.mockReturnValue(false);
      auth.parseJWT.mockReturnValue({ roles: ['sales'] });

      const result = checkAuth({ name: 'leads-edit' }, true, ['manager']);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/forbidden');
    });

    it('denies access when protected route has no resolvable roles', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('valid-token');
      auth.isTokenExpired.mockReturnValue(false);
      auth.parseJWT.mockReturnValue({});

      const result = checkAuth({ name: 'leads-edit' }, true, ['admin']);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/forbidden');
    });
  });

  describe('authGuardMiddleware', () => {
    it('allows authenticated users to protected routes', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('valid-token');
      auth.isTokenExpired.mockReturnValue(false);

      const result = authGuardMiddleware(
        { name: 'dashboard' },
        { auth: true }
      );

      expect(result).toBe(true);
    });

    it('blocks unauthenticated users from protected routes', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = authGuardMiddleware(
        { name: 'dashboard' },
        { auth: true }
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/login');
    });

    it('allows unauthenticated users to public routes', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = authGuardMiddleware(
        { name: 'login' },
        { auth: false }
      );

      expect(result).toBe(true);
    });

    it('redirects authenticated users from login to dashboard', () => {
      auth.isAuthenticated.mockReturnValue(true);

      const result = authGuardMiddleware(
        { name: 'login' },
        { auth: false }
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('getAuthStatus', () => {
    it('returns correct status for authenticated user', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('valid-token');
      auth.isTokenExpired.mockReturnValue(false);

      const status = getAuthStatus();

      expect(status).toEqual({
        authenticated: true,
        tokenValid: true,
        user: expect.any(Object),
      });
    });

    it('returns correct status for unauthenticated user', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const status = getAuthStatus();

      expect(status).toEqual({
        authenticated: false,
        tokenValid: false,
        user: null,
      });
    });

    it('returns invalid token status when token is expired', () => {
      auth.isAuthenticated.mockReturnValue(true);
      auth.getToken.mockReturnValue('expired-token');
      auth.isTokenExpired.mockReturnValue(true);

      const status = getAuthStatus();

      expect(status.authenticated).toBe(true);
      expect(status.tokenValid).toBe(false);
    });
  });

  describe('useAuthGuard', () => {
    it('returns true for authenticated users', () => {
      auth.isAuthenticated.mockReturnValue(true);

      const result = useAuthGuard();

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('returns false and redirects for unauthenticated users', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = useAuthGuard(true);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith('/login');
    });

    it('returns false without redirect when redirect is disabled', () => {
      auth.isAuthenticated.mockReturnValue(false);

      const result = useAuthGuard(false);

      expect(result).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
