export const TELEPHONY_PROVIDERS = Object.freeze([
  'Asterisk',
  'OnlinePBX',
  'Zadarma',
  'FreeSWITCH',
]);

export const TELEPHONY_PROVIDER_OPTIONS = Object.freeze(
  TELEPHONY_PROVIDERS.map((provider) => ({ label: provider, value: provider }))
);

export const TELEPHONY_PROVIDER_TAG_COLORS = Object.freeze({
  Asterisk: 'geekblue',
  OnlinePBX: 'blue',
  Zadarma: 'green',
  FreeSWITCH: 'purple',
});

export const CONNECTION_TYPE_OPTIONS = Object.freeze([
  { label: 'PBX', value: 'pbx' },
  { label: 'SIP', value: 'sip' },
  { label: 'VoIP', value: 'voip' },
]);

export const TELEPHONY_ROUTE_MODE_OPTIONS = Object.freeze([
  { value: 'auto', label: 'Auto (SIP + fallback)' },
  { value: 'internal', label: 'Внутренние номера' },
  { value: 'external', label: 'Внешние номера' },
  { value: 'provider', label: 'Через API провайдера' },
  { value: 'asterisk', label: 'Через Asterisk сервер' },
]);

export const DEFAULT_TELEPHONY_ROUTE_MODE = 'auto';
export const DEFAULT_TELEPHONY_PROVIDER = 'Asterisk';
export const DEFAULT_STUN_SERVERS = 'stun:stun.l.google.com:19302';
