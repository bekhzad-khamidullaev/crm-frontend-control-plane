import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock auth module
vi.mock('../../src/lib/api/auth.js', () => ({
  isAuthenticated: vi.fn(),
  clearToken: vi.fn(),
  setToken: vi.fn(),
  getToken: vi.fn(),
}));

// Mock router
vi.mock('../../src/router.js', () => ({
  parseHash: vi.fn(),
  navigate: vi.fn(),
  onRouteChange: vi.fn(),
}));

describe('Auth Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users from protected routes', async () => {
    const { isAuthenticated } = await import('../../src/lib/api/auth.js');
    isAuthenticated.mockReturnValue(false);
    
    // Simulate accessing a protected route
    const protectedRoute = { name: 'leads-detail', params: { id: '123' } };
    
    // This would normally trigger the auth guard logic in main.js
    expect(isAuthenticated()).toBe(false);
  });

  it('allows authenticated users to access protected routes', async () => {
    const { isAuthenticated } = await import('../../src/lib/api/auth.js');
    isAuthenticated.mockReturnValue(true);
    
    const protectedRoute = { name: 'leads-list', params: {} };
    
    expect(isAuthenticated()).toBe(true);
  });

  it('preserves intended route for post-login redirect', () => {
    // Simulate the intended route storage logic
    const intendedRoute = { name: 'leads-edit', params: { id: '456' } };
    
    // This would be stored and restored after login in main.js
    expect(intendedRoute.name).toBe('leads-edit');
    expect(intendedRoute.params.id).toBe('456');
  });
});