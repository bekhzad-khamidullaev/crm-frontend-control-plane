function readRuntimeConfig() {
  if (typeof window === 'undefined') return {};
  return window.__APP_CONFIG__ || {};
}

function normalizePath(path) {
  const value = String(path || '').trim();
  if (!value) return '/chat';
  return value.startsWith('/') ? value : `/${value}`;
}

function getConfiguredBaseUrl() {
  const runtimeConfig = readRuntimeConfig();
  return (
    runtimeConfig.controlPlaneBaseUrl ||
    runtimeConfig.controlPlaneUrl ||
    runtimeConfig.CONTROL_PLANE_BASE_URL ||
    runtimeConfig.CONTROL_PLANE_URL ||
    import.meta.env.VITE_CONTROL_PLANE_BASE_URL ||
    import.meta.env.VITE_CONTROL_PLANE_URL ||
    ''
  );
}

export function getControlPlaneTargetUrl(targetPath) {
  const normalizedTarget = normalizePath(targetPath);
  const configuredBase = String(getConfiguredBaseUrl() || '').trim();

  if (typeof window === 'undefined') {
    return null;
  }

  if (configuredBase) {
    if (configuredBase.startsWith('/')) {
      const basePath = configuredBase.replace(/\/$/, '');
      return `${window.location.origin}${basePath}/#${normalizedTarget}`;
    }

    try {
      const url = new URL(configuredBase, window.location.origin);
      url.hash = `#${normalizedTarget}`;
      return url.toString();
    } catch {
      return null;
    }
  }

  return null;
}

export function getLegacyFreezeCopy(freezeType = 'chat') {
  const normalized = String(freezeType || 'chat').trim().toLowerCase();

  if (normalized === 'onboarding') {
    return {
      title: 'Onboarding moved to control-plane',
      description:
        'The legacy onboarding wizard is frozen in crm-frontend. Open crm-frontend-control-plane to continue setup.',
      targetPath: '/onboarding',
      ctaLabel: 'Open onboarding in control-plane',
    };
  }

  if (normalized === 'license') {
    return {
      title: 'License tools moved to control-plane',
      description:
        'Legacy license pages are frozen here. Use crm-frontend-control-plane for license and deployment management.',
      targetPath: '/control-plane',
      ctaLabel: 'Open control-plane admin',
      localTargetPath: '/license-workspace',
      bannerMessage: 'Local license workspace fallback',
    };
  }

  if (normalized === 'ai-chat') {
    return {
      title: 'AI Chat is available',
      description:
        'AI Chat is active in this frontend. Open the current AI Chat route to continue.',
      targetPath: '/ai-chat',
      ctaLabel: 'Open AI chat',
      localTargetPath: '/ai-chat',
      bannerMessage: 'Legacy redirect alias',
    };
  }

  if (normalized === 'chat-thread') {
    return {
      title: 'Chat threads are available',
      description:
        'Chat thread access is available from the unified inbox in this frontend.',
      targetPath: '/chat',
      ctaLabel: 'Open unified inbox',
      localTargetPath: '/chat',
      bannerMessage: 'Legacy redirect alias',
    };
  }

  return {
    title: 'Chat is available',
    description:
      'Chat is active in this frontend. Open the unified inbox route to continue.',
    targetPath: '/chat',
    ctaLabel: 'Open unified inbox',
    localTargetPath: '/chat',
    bannerMessage: 'Legacy redirect alias',
  };
}
