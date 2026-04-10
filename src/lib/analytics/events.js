import { api } from '../api/client.js';

const INTERNAL_LANDING_SLUG = 'crm-internal';
const QUEUE_KEY = 'crm:analytics:event-queue';

const SUPPORTED_PUBLIC_EVENTS = new Set([
  'lead_created',
  'deal_created',
  'deal_stage_changed',
  'sla_breached',
  'lead_assigned',
  'dedup_hit',
]);

function readQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-200)));
}

export async function trackCrmEvent(eventType, meta = {}) {
  const payload = {
    eventType: String(eventType || '').trim(),
    meta: meta && typeof meta === 'object' ? meta : {},
    at: new Date().toISOString(),
  };
  if (!payload.eventType) return;

  if (!SUPPORTED_PUBLIC_EVENTS.has(payload.eventType)) {
    writeQueue([...readQueue(), payload]);
    return;
  }

  try {
    await api.post('/api/public/funnel-events/', {
      skipAuth: true,
      body: {
        landing_slug: INTERNAL_LANDING_SLUG,
        event_type: payload.eventType,
        meta: payload.meta,
      },
    });
  } catch {
    writeQueue([...readQueue(), payload]);
  }
}

export function getBufferedCrmEvents() {
  return readQueue();
}
