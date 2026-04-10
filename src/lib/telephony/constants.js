export const TELEPHONY_PROVIDERS = Object.freeze([
  'Asterisk',
]);

export const TELEPHONY_PROVIDER_OPTIONS = Object.freeze(
  TELEPHONY_PROVIDERS.map((provider) => ({ label: provider, value: provider }))
);

export const TELEPHONY_PROVIDER_TAG_COLORS = Object.freeze({
  Asterisk: 'geekblue',
});

export const CONNECTION_TYPE_OPTIONS = Object.freeze([
  { label: 'External Asterisk (PBX Bridge)', value: 'sip' },
]);

export const TELEPHONY_ROUTE_MODE_OPTIONS = Object.freeze([
  { value: 'bridge', label: 'External Asterisk via PBX Bridge' },
]);

export const TELEPHONY_EVENT_MODE_OPTIONS = Object.freeze([
  { value: 'bridge', label: 'Go Bridge webhook ingest' },
  { value: 'ami', label: 'Direct AMI listener ingest' },
]);

export const DEFAULT_TELEPHONY_ROUTE_MODE = 'bridge';
export const DEFAULT_TELEPHONY_EVENT_MODE = 'bridge';
export const DEFAULT_TELEPHONY_PROVIDER = 'Asterisk';
export const DEFAULT_STUN_SERVERS = 'stun:stun.l.google.com:19302';
