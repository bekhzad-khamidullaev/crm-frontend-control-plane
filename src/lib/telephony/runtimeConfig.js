import { getSIPConfig, getVoipSystemSettings } from '../api/telephony.js';
import { getProfile } from '../api/user.js';
import {
  DEFAULT_STUN_SERVERS,
  DEFAULT_TELEPHONY_PROVIDER,
  DEFAULT_TELEPHONY_ROUTE_MODE,
} from './constants.js';

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

function parseIceServers(runtimeSettings, profile) {
  const stunServers = String(
    runtimeSettings?.webrtc_stun_servers || profile?.webrtc_stun_servers || DEFAULT_STUN_SERVERS
  )
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const iceServers = stunServers.map((url) => ({ urls: url }));

  const turnEnabled = Boolean(runtimeSettings?.webrtc_turn_enabled ?? profile?.webrtc_turn_enabled);
  const turnServerRaw = runtimeSettings?.webrtc_turn_server || profile?.webrtc_turn_server;
  if (turnEnabled && turnServerRaw) {
    const turnServer = {
      urls: String(turnServerRaw).trim(),
    };

    const turnUsername = runtimeSettings?.webrtc_turn_username || profile?.webrtc_turn_username;
    if (turnUsername) {
      turnServer.username = String(turnUsername).trim();
    }
    const turnPassword = runtimeSettings?.webrtc_turn_password || profile?.webrtc_turn_password;
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

function getActiveConnection(connectionsResponse) {
  const list = Array.isArray(connectionsResponse?.results)
    ? connectionsResponse.results
    : Array.isArray(connectionsResponse)
      ? connectionsResponse
      : [];

  if (!list.length) return null;
  return list.find((item) => item?.active) || list[0] || null;
}

function buildSipConfigFromBackend(profile, activeConnection, runtimeSettings) {
  const { username: sipUsernameFromUri, realm: sipRealmFromUri } = parseSipIdentity(profile?.jssip_sip_uri);

  const username = sipUsernameFromUri || String(profile?.pbx_number || '').trim();
  const realm = sipRealmFromUri;
  const password = String(profile?.jssip_sip_password || '').trim();
  const websocketProxyUrl = String(profile?.jssip_ws_uri || '').trim();
  const displayName =
    String(profile?.jssip_display_name || '').trim() ||
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
    iceServers: parseIceServers(runtimeSettings || {}, profile || {}),
    phoneNumber:
      String(activeConnection?.number || '').trim() ||
      String(activeConnection?.callerid || '').trim() ||
      String(profile?.pbx_number || '').trim(),
    routeMode: String(runtimeSettings?.telephony_route_mode || DEFAULT_TELEPHONY_ROUTE_MODE).toLowerCase(),
    provider: String(runtimeSettings?.telephony_provider || activeConnection?.provider || DEFAULT_TELEPHONY_PROVIDER).trim(),
    profile,
    activeConnection,
  };
}

export function hasValidSipConfig(config) {
  return Boolean(config?.username && config?.realm && config?.password && config?.websocketProxyUrl);
}

export async function loadTelephonyRuntimeConfig() {
  const [profile, sipConnectionsResponse, systemSettings] = await Promise.all([
    getProfile(),
    getSIPConfig().catch(() => ({ results: [] })),
    getVoipSystemSettings().catch(() => ({})),
  ]);

  const activeConnection = getActiveConnection(sipConnectionsResponse);
  const sipConfig = buildSipConfigFromBackend(profile || {}, activeConnection, systemSettings || {});

  return {
    profile,
    systemSettings: systemSettings || {},
    connections: Array.isArray(sipConnectionsResponse?.results) ? sipConnectionsResponse.results : [],
    activeConnection,
    sipConfig,
    sipReady: hasValidSipConfig(sipConfig),
  };
}
