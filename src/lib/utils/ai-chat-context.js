const normalizeAiContextEntityName = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^#?\d+$/.test(text)) return '';
  return text;
};

export { normalizeAiContextEntityName };

export function buildAiChatUrl({ entityType, entityId, entityName }) {
  const params = new URLSearchParams();
  const type = String(entityType || '').trim().toLowerCase();
  const normalizedName = normalizeAiContextEntityName(entityName);
  const parsedId = Number(entityId);

  if (type) params.set('entity_type', type);
  if (Number.isFinite(parsedId) && parsedId > 0) params.set('entity_id', String(parsedId));
  if (normalizedName) params.set('entity_name', normalizedName);

  const query = params.toString();
  return query ? `/ai-chat?${query}` : '/ai-chat';
}
