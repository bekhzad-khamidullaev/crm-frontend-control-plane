export function trackCrmEvent(eventType: string, meta?: Record<string, unknown>): Promise<void>;
export function getBufferedCrmEvents(): Array<{
  eventType: string;
  meta: Record<string, unknown>;
  at: string;
}>;
