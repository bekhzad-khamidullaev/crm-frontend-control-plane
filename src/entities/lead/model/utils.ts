import type { Lead } from './types';

export type LeadStatus = 'new' | 'converted' | 'lost';

export const deriveLeadStatus = (lead: Pick<Lead, 'disqualified' | 'contact' | 'company'>): LeadStatus => {
  if (lead.disqualified) return 'lost';
  if (lead.contact || lead.company) return 'converted';
  return 'new';
};
