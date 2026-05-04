import type { Lead } from './types';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const KANBAN_CONTACTED_MARKER = '[KANBAN:CONTACTED]';
const KANBAN_QUALIFIED_MARKER = '[KANBAN:QUALIFIED]';

const parseManualKanbanStatus = (description?: string | null): 'contacted' | 'qualified' | null => {
  if (!description) return null;
  if (description.includes(KANBAN_QUALIFIED_MARKER)) return 'qualified';
  if (description.includes(KANBAN_CONTACTED_MARKER)) return 'contacted';
  return null;
};

export const deriveLeadStatus = (
  lead: Pick<Lead, 'status' | 'disqualified' | 'contact' | 'company' | 'was_in_touch' | 'description'>
): LeadStatus => {
  if (lead.status) return lead.status;
  if (lead.disqualified) return 'lost';
  if (lead.contact || lead.company || lead.was_in_touch) return 'converted';
  const manualStatus = parseManualKanbanStatus(lead.description);
  if (manualStatus) return manualStatus;
  return 'new';
};
