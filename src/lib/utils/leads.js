import { normalizePayload } from './payload.js';

const leadPayloadKeys = [
  'first_name',
  'middle_name',
  'last_name',
  'title',
  'sex',
  'birth_date',
  'email',
  'secondary_email',
  'phone',
  'other_phone',
  'mobile',
  'city_name',
  'city',
  'country',
  'address',
  'region',
  'district',
  'description',
  'disqualified',
  'lead_source',
  'massmail',
  'tags',
  'token',
  'was_in_touch',
  'owner',
  'department',
  'company_name',
  'website',
  'company_phone',
  'company_address',
  'company_email',
  'type',
  'industry',
  'contact',
  'company',
];

export function buildLeadPayload(values = {}) {
  const payload = {};
  leadPayloadKeys.forEach((key) => {
    if (values[key] !== undefined) {
      payload[key] = values[key];
    }
  });

  return normalizePayload(payload, {
    preserveEmptyArrays: ['tags', 'industry'],
  });
}

export function deriveLeadStatus(lead) {
  if (!lead) return 'new';
  if (lead.status) return lead.status;
  if (lead.disqualified) return 'lost';
  if (lead.contact || lead.company) return 'converted';
  return 'new';
}

export function getLeadSourceLabel(lead, leadSourceMap) {
  if (!lead) return '-';
  if (lead.lead_source_name) return lead.lead_source_name;
  const sourceId = lead.lead_source;
  if (sourceId && leadSourceMap && leadSourceMap[sourceId]) {
    return leadSourceMap[sourceId];
  }
  if (sourceId !== undefined && sourceId !== null) {
    return `#${sourceId}`;
  }
  return '-';
}
