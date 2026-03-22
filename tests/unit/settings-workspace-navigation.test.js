import { describe, expect, it } from 'vitest';
import {
  canAccessSettingsWorkspace,
  getSettingsWorkspacePath,
  normalizeSettingsWorkspaceSelectedKey,
  SETTINGS_WORKSPACE_NAV_KEY,
} from '../../src/lib/settingsWorkspaceNavigation.js';

describe('settings workspace navigation', () => {
  it('treats integrations-only access as access to the unified workspace', () => {
    const canAccessRoute = (routeName) => routeName === 'integrations';

    expect(canAccessSettingsWorkspace(canAccessRoute)).toBe(true);
    expect(getSettingsWorkspacePath(canAccessRoute)).toBe('/integrations');
  });

  it('normalizes both legacy routes to the unified nav key', () => {
    expect(normalizeSettingsWorkspaceSelectedKey('settings')).toBe(SETTINGS_WORKSPACE_NAV_KEY);
    expect(normalizeSettingsWorkspaceSelectedKey('integrations')).toBe(SETTINGS_WORKSPACE_NAV_KEY);
    expect(normalizeSettingsWorkspaceSelectedKey('dashboard')).toBe('dashboard');
  });

  it('prefers the system route when both routes are available', () => {
    const canAccessRoute = (routeName) => routeName === 'settings' || routeName === 'integrations';

    expect(getSettingsWorkspacePath(canAccessRoute)).toBe('/settings');
  });
});
