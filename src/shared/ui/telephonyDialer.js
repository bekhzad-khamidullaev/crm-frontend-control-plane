export const TELEPHONY_DIALER_OPEN_EVENT = 'enterprise_crm:open-dialer';

export function normalizeDialerNumber(raw) {
  return String(raw || '').replace(/[^\d+*#()\-\s.]/g, '').trim();
}

export function requestDialerOpen({ number = '', autoCall = false } = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TELEPHONY_DIALER_OPEN_EVENT, {
      detail: {
        number: normalizeDialerNumber(number),
        autoCall: Boolean(autoCall),
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
    }),
  );
}
