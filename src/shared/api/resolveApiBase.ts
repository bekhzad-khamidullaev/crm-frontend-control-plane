const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const DEFAULT_LOCAL_ORIGIN = 'http://localhost:8000';

function sanitizeBase(value?: string) {
  return String(value || '').trim().replace(/\/$/, '');
}

export function resolveApiBase(rawBase?: string) {
  const fallbackBase =
    typeof window !== 'undefined' ? window.location.origin : DEFAULT_LOCAL_ORIGIN;
  const sanitizedBase = sanitizeBase(rawBase);

  if (typeof window === 'undefined') {
    return sanitizedBase || fallbackBase;
  }

  const currentHost = window.location.hostname;
  const isLocalDev = LOCAL_DEV_HOSTS.has(currentHost);

  if (!isLocalDev) {
    return sanitizedBase || fallbackBase;
  }

  if (!sanitizedBase) {
    return fallbackBase;
  }

  try {
    const configuredUrl = new URL(sanitizedBase, window.location.origin);
    const configuredIsLocal = LOCAL_DEV_HOSTS.has(configuredUrl.hostname);

    if (!configuredIsLocal && configuredUrl.origin !== window.location.origin) {
      return fallbackBase;
    }

    return configuredUrl.origin;
  } catch {
    return fallbackBase;
  }
}

export default resolveApiBase;
