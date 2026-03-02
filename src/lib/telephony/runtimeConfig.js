import { getSIPConfig } from '../api/telephony.js';
import { getProfile } from '../api/user.js';

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

function parseIceServers(profile) {
  const stunServers = String(profile?.webrtc_stun_servers || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const iceServers = stunServers.map((url) => ({ urls: url }));

  if (profile?.webrtc_turn_enabled && profile?.webrtc_turn_server) {
    const turnServer = {
      urls: String(profile.webrtc_turn_server).trim(),
    };

    if (profile?.webrtc_turn_username) {
      turnServer.username = String(profile.webrtc_turn_username).trim();
    }
    if (profile?.webrtc_turn_password) {
      turnServer.credential = String(profile.webrtc_turn_password).trim();
    }

    iceServers.push(turnServer);
  }

  if (!iceServers.length) {
    iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
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

function buildSipConfigFromBackend(profile, activeConnection) {
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
    iceServers: parseIceServers(profile),
    phoneNumber:
      String(activeConnection?.number || '').trim() ||
      String(activeConnection?.callerid || '').trim() ||
      String(profile?.pbx_number || '').trim(),
    routeMode: String(profile?.telephony_route_mode || 'auto').toLowerCase(),
    provider: String(profile?.telephony_provider || activeConnection?.provider || '').trim(),
    profile,
    activeConnection,
  };
}

export function hasValidSipConfig(config) {
  return Boolean(config?.username && config?.realm && config?.password && config?.websocketProxyUrl);
}

export async function loadTelephonyRuntimeConfig() {
  const [profile, sipConnectionsResponse] = await Promise.all([
    getProfile(),
    getSIPConfig().catch(() => ({ results: [] })),
  ]);

  const activeConnection = getActiveConnection(sipConnectionsResponse);
  const sipConfig = buildSipConfigFromBackend(profile || {}, activeConnection);

  return {
    profile,
    connections: Array.isArray(sipConnectionsResponse?.results) ? sipConnectionsResponse.results : [],
    activeConnection,
    sipConfig,
    sipReady: hasValidSipConfig(sipConfig),
  };
}
