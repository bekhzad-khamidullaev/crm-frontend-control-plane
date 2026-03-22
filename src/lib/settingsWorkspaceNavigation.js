export const SETTINGS_WORKSPACE_NAV_KEY = 'settings-workspace';

export function canAccessSettingsWorkspace(canAccessRoute) {
  if (typeof canAccessRoute !== 'function') return false;
  return Boolean(canAccessRoute('settings') || canAccessRoute('integrations'));
}

export function getSettingsWorkspacePath(canAccessRoute) {
  if (typeof canAccessRoute !== 'function') return '/settings';
  if (canAccessRoute('settings')) return '/settings';
  if (canAccessRoute('integrations')) return '/integrations';
  return '/settings';
}

export function normalizeSettingsWorkspaceSelectedKey(routeName) {
  if (routeName === 'settings' || routeName === 'integrations') {
    return SETTINGS_WORKSPACE_NAV_KEY;
  }
  return routeName;
}
