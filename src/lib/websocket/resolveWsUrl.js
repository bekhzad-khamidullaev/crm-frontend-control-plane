import { apiConfig } from '../api/client.js';

function toWsProtocol(protocol) {
  if (protocol === 'https:') return 'wss:';
  if (protocol === 'http:') return 'ws:';
  return protocol;
}

function buildOrigin(baseUrl) {
  if (!baseUrl) return '';
  try {
    const parsed = new URL(baseUrl);
    const wsProtocol = toWsProtocol(parsed.protocol);
    return `${wsProtocol}//${parsed.host}`;
  } catch {
    return '';
  }
}

function joinPath(origin, path) {
  if (!origin) return '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function resolveWebSocketUrl(explicitUrl, path, fallbackOrigin) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (explicitUrl) {
    if (explicitUrl.startsWith('/')) {
      const origin = fallbackOrigin || buildOrigin(apiConfig.baseUrl);
      return origin ? joinPath(origin, explicitUrl) : '';
    }

    try {
      const parsed = new URL(explicitUrl);
      if (parsed.protocol === 'ws:' || parsed.protocol === 'wss:') {
        return parsed.toString();
      }
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const wsProtocol = toWsProtocol(parsed.protocol);
        const pathToUse = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : normalizedPath;
        return `${wsProtocol}//${parsed.host}${pathToUse}${parsed.search}`;
      }
    } catch {
      const origin = fallbackOrigin || buildOrigin(apiConfig.baseUrl);
      return origin ? joinPath(origin, normalizedPath) : '';
    }
  }

  const origin =
    fallbackOrigin ||
    buildOrigin(apiConfig.baseUrl) ||
    (typeof window !== 'undefined' ? buildOrigin(window.location.origin) : '');
  return origin ? joinPath(origin, normalizedPath) : '';
}

export function stripSensitiveParams(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('token')) {
      parsed.searchParams.set('token', '***');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
