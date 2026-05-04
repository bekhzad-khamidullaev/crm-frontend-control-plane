import { getSIPConfig, getVoipClientSettings } from '../api/telephony.js';
import { getProfile, getSoftphoneSettings, getTelephonyCredentials } from '../api/user.js';
import {
  DEFAULT_STUN_SERVERS,
  DEFAULT_TELEPHONY_EVENT_MODE,
  DEFAULT_TELEPHONY_PROVIDER,
  DEFAULT_TELEPHONY_ROUTE_MODE,
} from './constants.js';
const appConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
const ENV_SIP_WS_URL = String(appConfig.SIP_SERVER || import.meta.env.VITE_SIP_SERVER || '').trim();

function normalizeRouteMode(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (['ami', 'external', 'provider'].includes(value)) return 'ami';
  return DEFAULT_TELEPHONY_ROUTE_MODE;
}

function normalizeProvider(_rawValue) {
  return 'Asterisk';
}

function normalizeEventMode(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (['ami', 'go-ami', 'go_ami', 'connector', 'external'].includes(value)) return 'ami';
  if (['ami', 'asterisk-ami', 'asterisk_ami', 'direct-ami', 'direct_ami'].includes(value)) return 'ami';
  return DEFAULT_TELEPHONY_EVENT_MODE;
}

function parseSipIdentity(sipUriRaw) {
  const sipUri = String(sipUriRaw || '').trim();
  if (!sipUri) {
    return { username: '', realm: '' };
  }

  const withoutPrefix = sipUri.startsWith('sip:') ? sipUri.slice(4) : sipUri;
  const [username = '', realm = ''] = withoutPrefix.split('@');
  return {
    username: String(username || '').trim(),
    realm: String(realm || '').trim(),
  };
}

function parseIceServers(clientSettings) {
  const stunServers = String(
    clientSettings?.webrtc_stun_servers || DEFAULT_STUN_SERVERS
  )
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const iceServers = stunServers.map((url) => ({ urls: url }));

  const turnEnabled = Boolean(clientSettings?.webrtc_turn_enabled);
  const turnServerRaw = clientSettings?.webrtc_turn_server;
  if (turnEnabled && turnServerRaw) {
    const turnServer = {
      urls: String(turnServerRaw).trim(),
    };

    const turnUsername = clientSettings?.webrtc_turn_username;
    if (turnUsername) {
      turnServer.username = String(turnUsername).trim();
    }
    const turnPassword = clientSettings?.webrtc_turn_password;
    if (turnPassword) {
      turnServer.credential = String(turnPassword).trim();
    }

    iceServers.push(turnServer);
  }

  if (!iceServers.length) {
    iceServers.push({ urls: DEFAULT_STUN_SERVERS });
  }

  return iceServers;
}

function normalizeSipWebSocketUrl(rawValue, fallbackValue = '') {
  const normalizeCandidate = (value) => {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:') parsed.protocol = 'ws:';
      if (parsed.protocol === 'https:') parsed.protocol = 'wss:';
      if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') return '';
      return parsed.toString();
    } catch {
      return '';
    }
  };

  const primary = normalizeCandidate(rawValue);
  const fallback = normalizeCandidate(fallbackValue);
  if (!primary) return fallback;
  if (!fallback) return primary;

  try {
    const primaryUrl = new URL(primary);
    const fallbackUrl = new URL(fallback);
    const primaryRootPath = !primaryUrl.pathname || primaryUrl.pathname === '/';
    const fallbackHasPath = Boolean(fallbackUrl.pathname && fallbackUrl.pathname !== '/');
    if (primaryRootPath && fallbackHasPath) return fallback;
  } catch {
    return primary;
  }

  return primary;
}

function getActiveConnection(connectionsResponse) {
  const list = Array.isArray(connectionsResponse?.results)
    ? connectionsResponse.results
    : Array.isArray(connectionsResponse)
      ? connectionsResponse
      : [];

  if (!list.length) return null;
  return list.find((item) => item?.active) || list[0] || null;
}

function buildSipConfigFromBackend(profile, softphoneSettings, activeConnection, clientSettings, telephonyCredentials = {}) {
  const { username: sipUsernameFromUri, realm: sipRealmFromUri } = parseSipIdentity(softphoneSettings?.sip_uri);
  const credentials = telephonyCredentials && typeof telephonyCredentials === 'object' ? telephonyCredentials : {};
  const credentialsExtension = String(credentials?.extension || '').trim();
  const credentialsLogin = String(credentials?.login || '').trim();

  const username =
    sipUsernameFromUri ||
    String(softphoneSettings?.sip_username || '').trim() ||
    credentialsLogin ||
    credentialsExtension;
  const realm = sipRealmFromUri || String(softphoneSettings?.sip_realm || '').trim();
  const password = String(credentials?.password || '').trim();
  const websocketProxyUrl = normalizeSipWebSocketUrl(softphoneSettings?.sip_ws_uri, ENV_SIP_WS_URL);
  const displayName =
    String(softphoneSettings?.display_name || '').trim() ||
    String(profile?.full_name || '').trim() ||
    String(profile?.username || '').trim() ||
    'CRM User';

  return {
    username,
    realm,
    password,
    websocketProxyUrl,
    displayName,
    impu: username && realm ? `sip:${username}@${realm}` : '',
    iceServers: parseIceServers(clientSettings || {}),
    phoneNumber:
      String(activeConnection?.number || '').trim() ||
      String(activeConnection?.callerid || '').trim() ||
      credentialsExtension ||
      String(softphoneSettings?.extension || '').trim(),
    extension: credentialsExtension || String(softphoneSettings?.extension || '').trim(),
    login: credentialsLogin || username,
    routeMode: normalizeRouteMode(clientSettings?.telephony_route_mode),
    eventMode: normalizeEventMode(clientSettings?.telephony_event_mode),
    provider: normalizeProvider(clientSettings?.telephony_provider || activeConnection?.provider || DEFAULT_TELEPHONY_PROVIDER),
    profile,
    softphoneSettings,
    clientSettings,
    activeConnection,
    telephonyCredentials: credentials,
  };
}

export function hasValidSipConfig(config) {
  return Boolean(config?.username && config?.realm && config?.password && config?.websocketProxyUrl);
}

export async function loadTelephonyRuntimeConfig(options = {}) {
  const { includeSystemSettings = true } = options;
  const [profile, softphoneSettings, sipConnectionsResponse, clientSettings, telephonyCredentials] = await Promise.all([
    getProfile(),
    getSoftphoneSettings().catch(() => ({})),
    getSIPConfig().catch(() => ({ results: [] })),
    includeSystemSettings ? getVoipClientSettings().catch(() => ({})) : Promise.resolve({}),
    getTelephonyCredentials().catch(() => null),
  ]);

  const activeConnection = getActiveConnection(sipConnectionsResponse);
  const sipConfig = buildSipConfigFromBackend(
    profile || {},
    softphoneSettings || {},
    activeConnection,
    clientSettings || {},
    telephonyCredentials || {},
  );

  return {
    profile,
    softphoneSettings: softphoneSettings || {},
    clientSettings: clientSettings || {},
    systemSettings: clientSettings || {},
    connections: Array.isArray(sipConnectionsResponse?.results) ? sipConnectionsResponse.results : [],
    activeConnection,
    telephonyCredentials,
    sipConfig,
    sipReady: hasValidSipConfig(sipConfig),
  };
}
